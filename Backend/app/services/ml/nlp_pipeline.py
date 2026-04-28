# nlp_pipeline.py
# ─────────────────────────────────────────────
# Shreyasvi's file — NLP Pipeline
# CommunityPulse Smart Resource Allocation
# ─────────────────────────────────────────────
#
# What this file does:
#   Takes ANY text input (from WhatsApp, SMS, form)
#   Extracts 4 things: Need Type, Location, Quantity, Urgency
#   Returns a clean Need Card dictionary
#   This Need Card goes to Pulkit's Matching Engine
#
# Functions:
#   extract_need_type(text)  → what kind of help
#   extract_quantity(text)   → how many people
#   extract_location(text)   → where
#   assign_urgency(need)     → how critical
#   create_need_card(text)   → master function
#   process_batch(texts)     → process many at once

import re
import spacy
from datetime import datetime

# ── Load English language model ───────────────────────────────────────────────
# spaCy reads sentences and understands meaning
# en_core_web_sm = small English model (fast, good enough for us)
print("Loading NLP model...")
nlp = spacy.load("en_core_web_sm")
print("NLP model loaded successfully!")

# ── Need type keywords dictionary ─────────────────────────────────────────────
# Maps every possible word to a need category
# Add more words here if field workers use different language
NEED_KEYWORDS = {
    "food": [
        "food", "ration", "meal", "hungry", "hunger",
        "eat", "eating", "rice", "dal", "roti", "grain",
        "vegetables", "cooking", "distribute", "distribution",
        "khana", "bhojan", "anaj"
    ],
    "medical": [
        "medicine", "medical", "doctor", "hospital", "sick",
        "illness", "ill", "injury", "injured", "hurt", "pain",
        "treatment", "clinic", "nurse", "ambulance", "emergency",
        "dawa", "dawai", "bemar", "chot"
    ],
    "water": [
        "water", "drinking", "thirst", "thirsty", "supply",
        "pipeline", "tap", "well", "bore", "paani", "jal"
    ],
    "education": [
        "books", "school", "stationery", "education", "study",
        "pencil", "notebook", "uniform", "teacher", "class",
        "children", "students", "kitab", "vidya"
    ],
    "elderly": [
        "elderly", "old", "senior", "aged", "grandparent",
        "grandfather", "grandmother", "helpless", "alone",
        "budhapa", "bujurg"
    ],
    "livelihood": [
        "job", "work", "livelihood", "income", "employment",
        "skill", "training", "earn", "earning", "rozgaar"
    ],
    "shelter": [
        "shelter", "house", "home", "roof", "tent", "flood",
        "homeless", "displaced", "ghar", "aawas"
    ]
}

# ── Urgency level for each need type ─────────────────────────────────────────
# Critical = life threatening, respond immediately
# High     = urgent but not immediately life threatening
# Moderate = important but can wait a few hours
# Low      = can be addressed within days
URGENCY_MAP = {
    "medical"   : "critical",
    "water"     : "critical",
    "food"      : "high",
    "shelter"   : "high",
    "elderly"   : "high",
    "education" : "moderate",
    "livelihood": "moderate",
    "general"   : "low"
}

# Urgency score as a number (used for sorting)
URGENCY_SCORE = {
    "critical": 100,
    "high"    : 75,
    "moderate": 50,
    "low"     : 25
}

# ── Words that increase urgency ───────────────────────────────────────────────
URGENT_WORDS = [
    "urgent", "emergency", "immediately", "critical",
    "dying", "serious", "severe", "please help",
    "jaldi", "turant", "bahut", "sos"
]


# ─────────────────────────────────────────────────────────────────────────────
# FUNCTION 1 — Extract Need Type
# ─────────────────────────────────────────────────────────────────────────────
def extract_need_type(text):
    """
    Reads the text and figures out WHAT kind of help is needed.

    How it works:
      Converts text to lowercase
      Checks each word against our NEED_KEYWORDS dictionary
      Returns the matching category

    Input:  "15 families need food in Ward 3"
    Output: "food"
    """
    text_lower = text.lower()

    for need_type, keywords in NEED_KEYWORDS.items():
        for keyword in keywords:
            if keyword in text_lower:
                return need_type

    return "general"


# ─────────────────────────────────────────────────────────────────────────────
# FUNCTION 2 — Extract Quantity
# ─────────────────────────────────────────────────────────────────────────────
def extract_quantity(text):
    """
    Finds HOW MANY people or units are mentioned.

    How it works:
      Method 1: spaCy finds number tokens automatically
      Method 2: Regex finds patterns like '15 families', '30 people'
      Method 3: Word-to-number for written numbers (ten, twenty)

    Input:  "30 elderly people need water"
    Output: 30
    """
    # Method 1 — spaCy number detection
    doc = nlp(text)
    for token in doc:
        if token.like_num:
            try:
                return int(token.text)
            except ValueError:
                pass

    # Method 2 — Regex patterns for common phrases
    patterns = [
        r'(\d+)\s*(?:families|family)',
        r'(\d+)\s*(?:people|persons|individuals)',
        r'(\d+)\s*(?:children|kids|students)',
        r'(\d+)\s*(?:elderly|old|senior)',
        r'(\d+)\s*(?:households|houses|homes)',
        r'(\d+)\s*(?:members|volunteers)',
    ]
    for pattern in patterns:
        match = re.search(pattern, text.lower())
        if match:
            return int(match.group(1))

    # Method 3 — Written numbers
    word_numbers = {
        "one": 1, "two": 2, "three": 3, "four": 4,
        "five": 5, "six": 6, "seven": 7, "eight": 8,
        "nine": 9, "ten": 10, "twenty": 20, "thirty": 30,
        "forty": 40, "fifty": 50, "hundred": 100
    }
    text_lower = text.lower()
    for word, number in word_numbers.items():
        if word in text_lower:
            return number

    return 1  # default if no number found


# ─────────────────────────────────────────────────────────────────────────────
# FUNCTION 3 — Extract Location
# ─────────────────────────────────────────────────────────────────────────────
def extract_location(text):
    """
    Finds WHERE the help is needed.

    How it works:
      Method 1: spaCy Named Entity Recognition (GPE, LOC)
      Method 2: Regex for common Indian patterns (Ward X, Block X, Zone X)
      Method 3: Any capitalised word after 'in' or 'at'

    Input:  "15 families need food in Ward 3"
    Output: "Ward 3"
    """
    locations = []

    # Method 1 — spaCy named entities
    doc = nlp(text)
    for ent in doc.ents:
        if ent.label_ in ["GPE", "LOC", "FAC"]:
            locations.append(ent.text)

    # Method 2 — Indian administrative location patterns
    indian_patterns = [
        r'ward\s*\d+',
        r'block\s*[a-zA-Z0-9]+',
        r'zone\s*[a-zA-Z0-9]+',
        r'sector\s*\d+',
        r'area\s*\d+',
        r'colony\s+\w+',
        r'village\s+\w+',
        r'mohalla\s+\w+',
        r'gram\s+\w+',
        r'panchayat\s+\w+',
    ]
    for pattern in indian_patterns:
        matches = re.findall(pattern, text.lower())
        locations.extend(matches)

    # Method 3 — Word after 'in' or 'at'
    in_at_match = re.search(
        r'\b(?:in|at|near|from)\s+([A-Z][a-zA-Z\s]+?)(?:\.|,|$)',
        text
    )
    if in_at_match:
        locations.append(in_at_match.group(1).strip())

    # Return the most specific location found
    if locations:
        # Prefer Indian patterns (ward, block, zone) over generic
        for loc in locations:
            if any(x in loc.lower() for x in ["ward", "block", "zone", "sector"]):
                return loc.title()
        return locations[0].title()

    return "Location not specified"


# ─────────────────────────────────────────────────────────────────────────────
# FUNCTION 4 — Assign Urgency
# ─────────────────────────────────────────────────────────────────────────────
def assign_urgency(need_type, text):
    """
    Decides HOW URGENT the need is.

    How it works:
      Base urgency comes from need type (medical = critical)
      If urgent words are found in text, increase by one level
      Returns both label and numeric score

    Input:  need_type="food", text="urgent! families starving"
    Output: "critical" (upgraded from "high" due to urgent words)
    """
    base_urgency = URGENCY_MAP.get(need_type, "low")

    # Check if urgent words exist in text — upgrade if yes
    text_lower = text.lower()
    has_urgent_word = any(word in text_lower for word in URGENT_WORDS)

    if has_urgent_word:
        # Upgrade urgency by one level
        if base_urgency == "moderate":
            base_urgency = "high"
        elif base_urgency == "high":
            base_urgency = "critical"
        elif base_urgency == "low":
            base_urgency = "moderate"

    # Also upgrade if quantity is very large
    quantity = extract_quantity(text)
    if quantity >= 50 and base_urgency in ["moderate", "low"]:
        base_urgency = "high"
    if quantity >= 100:
        base_urgency = "critical"

    return base_urgency


# ─────────────────────────────────────────────────────────────────────────────
# MASTER FUNCTION — Create Need Card
# ─────────────────────────────────────────────────────────────────────────────
def create_need_card(text, source="text", field_worker_id=None):
    """
    THE MAIN FUNCTION — called by Pulkit's matching engine.

    Takes any raw text input.
    Runs all 4 extraction functions.
    Returns a complete Need Card dictionary.

    Input:  "15 families need food in Ward 3"
    Output: {
        "need_type" : "food",
        "location"  : "Ward 3",
        "quantity"  : 15,
        "urgency"   : "high",
        "urgency_score": 75,
        "source"    : "text",
        "timestamp" : "2024-01-15 14:32:05",
        "raw_input" : "15 families need food in Ward 3",
        "status"    : "pending"
    }
    """
    # Run all 4 extractions
    need_type = extract_need_type(text)
    quantity  = extract_quantity(text)
    location  = extract_location(text)
    urgency   = assign_urgency(need_type, text)

    # Build the Need Card
    need_card = {
        "need_type"     : need_type,
        "location"      : location,
        "quantity"      : quantity,
        "urgency"       : urgency,
        "urgency_score" : URGENCY_SCORE.get(urgency, 25),
        "source"        : source,           # whatsapp / sms / form / voice / image
        "field_worker"  : field_worker_id,
        "timestamp"     : datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "raw_input"     : text,
        "status"        : "pending"         # pending → assigned → completed
    }

    return need_card


# ─────────────────────────────────────────────────────────────────────────────
# BATCH FUNCTION — Process Many Inputs At Once
# ─────────────────────────────────────────────────────────────────────────────
def process_batch(text_list, source="batch"):
    """
    Processes a LIST of text inputs at once.
    Returns a list of Need Cards sorted by urgency (critical first).

    Input:  ["15 families need food", "medicine needed urgently", ...]
    Output: [sorted list of Need Cards, most urgent first]
    """
    need_cards = []

    for text in text_list:
        card = create_need_card(text, source=source)
        need_cards.append(card)

    # Sort by urgency score — highest (critical=100) first
    need_cards.sort(key=lambda x: x["urgency_score"], reverse=True)

    return need_cards


# ─────────────────────────────────────────────────────────────────────────────
# TEST — Run this file directly to verify everything works
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":

    print("\n" + "=" * 55)
    print("   CommunityPulse — NLP Pipeline Test")
    print("=" * 55)

    # Test inputs — different kinds of real-world messages
    test_inputs = [
        "15 families need food in Ward 3",
        "Urgent! Elderly person needs medicine in Block C",
        "30 children need school books in Zone 4",
        "Drinking water supply needed for 50 people in Ward 7",
        "Family needs shelter after flood near Rampur village",
        "bahut bure haal mein hain, khana chahiye, Ward 5 mein",
        "100 homeless people need food and water in Sector 12 emergency"
    ]

    # Process all inputs
    cards = process_batch(test_inputs)

    # Print results
    for i, card in enumerate(cards, 1):
        print(f"\n[{i}] Input    : {card['raw_input'][:55]}...")
        print(f"    Need Type : {card['need_type'].upper()}")
        print(f"    Location  : {card['location']}")
        print(f"    Quantity  : {card['quantity']} people")
        print(f"    Urgency   : {card['urgency'].upper()} (score: {card['urgency_score']})")
        print(f"    Time      : {card['timestamp']}")

    print("\n" + "=" * 55)
    print(f"  Processed {len(cards)} need cards")
    print(f"  Critical needs: {sum(1 for c in cards if c['urgency']=='critical')}")
    print(f"  High needs    : {sum(1 for c in cards if c['urgency']=='high')}")
    print(f"  Moderate needs: {sum(1 for c in cards if c['urgency']=='moderate')}")
    print("=" * 55)