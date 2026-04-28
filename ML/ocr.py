# ocr.py
# ─────────────────────────────────────────────
# Shreyasvi's file — OCR and Speech-to-Text
# CommunityPulse Smart Resource Allocation
# ─────────────────────────────────────────────
#
# What this file does:
#   extract_text_from_image(path) → reads text from photo
#   transcribe_voice(path)        → converts voice to text
#   read_any_input(path)          → smart auto-detect
#
# After this file runs, the text goes to nlp_pipeline.py

import os
import pytesseract
from PIL import Image
from datetime import datetime


# ─────────────────────────────────────────────────────────────────────────────
# FUNCTION 1 — Extract Text From Image
# ─────────────────────────────────────────────────────────────────────────────
def extract_text_from_image(image_path):
    """
    Reads text from a photo or scanned paper.

    How it works:
      Opens the image file
      Preprocesses it (makes it clearer)
      Tesseract OCR reads the text letter by letter
      Returns the extracted text as a string

    Input:  path to an image file (jpg, png, pdf)
    Output: text string
    """
    try:
        # Open the image
        image = Image.open(image_path)

        # Convert to RGB if needed (handles PNG with transparency)
        if image.mode != "RGB":
            image = image.convert("RGB")

        # Extract text using Tesseract
        # lang='eng' = English, can add '+hin' for Hindi
        extracted_text = pytesseract.image_to_string(
            image,
            lang='eng',
            config='--psm 6'  # psm 6 = assume uniform block of text
        )

        # Clean up the text
        cleaned_text = extracted_text.strip()
        cleaned_text = " ".join(cleaned_text.split())  # remove extra spaces

        return {
            "success"  : True,
            "text"     : cleaned_text,
            "source"   : "image",
            "file"     : os.path.basename(image_path),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    except FileNotFoundError:
        return {
            "success": False,
            "text"   : "",
            "error"  : f"Image file not found: {image_path}"
        }
    except Exception as e:
        return {
            "success": False,
            "text"   : "",
            "error"  : str(e)
        }


# ─────────────────────────────────────────────────────────────────────────────
# FUNCTION 2 — Transcribe Voice Note
# ─────────────────────────────────────────────────────────────────────────────
def transcribe_voice(audio_path):
    """
    Converts a voice note or audio recording to text.

    How it works:
      Loads OpenAI Whisper (runs locally, no internet needed)
      Whisper listens to the audio and converts to text
      Works in English and many Indian languages

    Input:  path to audio file (mp3, wav, m4a, ogg)
    Output: text string
    """
    try:
        import whisper

        # Load Whisper model
        # 'base' = small and fast, good for short field messages
        # 'small' = more accurate but slower
        print(f"Transcribing audio: {audio_path}")
        model = whisper.load_model("base")

        # Transcribe
        result = model.transcribe(audio_path)
        transcribed_text = result["text"].strip()

        return {
            "success"  : True,
            "text"     : transcribed_text,
            "source"   : "voice",
            "language" : result.get("language", "unknown"),
            "file"     : os.path.basename(audio_path),
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    except FileNotFoundError:
        return {
            "success": False,
            "text"   : "",
            "error"  : f"Audio file not found: {audio_path}"
        }
    except ImportError:
        return {
            "success": False,
            "text"   : "",
            "error"  : "Whisper not installed. Run: pip install openai-whisper"
        }
    except Exception as e:
        return {
            "success": False,
            "text"   : "",
            "error"  : str(e)
        }


# ─────────────────────────────────────────────────────────────────────────────
# FUNCTION 3 — Smart Auto Detect Input Type
# ─────────────────────────────────────────────────────────────────────────────
def read_any_input(file_path=None, raw_text=None):
    """
    Master function — figures out what kind of input it received
    and routes it to the right extraction function.

    Input types handled:
      Image files  → extract_text_from_image()
      Audio files  → transcribe_voice()
      Plain text   → returned directly

    Output: always returns a text string ready for nlp_pipeline.py
    """

    # If plain text is given directly — return it as is
    if raw_text:
        return {
            "success"  : True,
            "text"     : raw_text.strip(),
            "source"   : "text",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }

    if not file_path:
        return {
            "success": False,
            "text"   : "",
            "error"  : "No input provided"
        }

    # Detect file type from extension
    ext = os.path.splitext(file_path)[1].lower()

    # Image file extensions
    image_extensions = [".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".pdf"]

    # Audio file extensions
    audio_extensions = [".mp3", ".wav", ".m4a", ".ogg", ".flac", ".aac"]

    if ext in image_extensions:
        return extract_text_from_image(file_path)

    elif ext in audio_extensions:
        return transcribe_voice(file_path)

    else:
        return {
            "success": False,
            "text"   : "",
            "error"  : f"Unsupported file type: {ext}"
        }


# ─────────────────────────────────────────────────────────────────────────────
# FULL PIPELINE — OCR → NLP in one call
# ─────────────────────────────────────────────────────────────────────────────
def process_file_to_need_card(file_path=None, raw_text=None):
    """
    One-stop function:
    Takes a file OR raw text → extracts text → runs NLP → returns Need Card

    This is the function the team's main app will call.
    """
    from nlp_pipeline import create_need_card

    # Step 1: Extract text
    result = read_any_input(file_path=file_path, raw_text=raw_text)

    if not result["success"] or not result["text"]:
        return {
            "error"    : result.get("error", "Could not extract text"),
            "need_card": None
        }

    extracted_text = result["text"]
    source         = result["source"]

    # Step 2: Create Need Card from extracted text
    need_card = create_need_card(extracted_text, source=source)

    return {
        "extracted_text": extracted_text,
        "need_card"     : need_card,
        "source"        : source
    }


# ─────────────────────────────────────────────────────────────────────────────
# TEST
# ─────────────────────────────────────────────────────────────────────────────
if __name__ == "__main__":

    print("\n" + "=" * 55)
    print("   CommunityPulse — OCR Module Test")
    print("=" * 55)

    # Test 1 — plain text input
    print("\n[TEST 1] Plain text input")
    result = process_file_to_need_card(
        raw_text="20 families urgently need food in Ward 5"
    )
    if result.get("need_card"):
        card = result["need_card"]
        print(f"  Text     : {result['extracted_text']}")
        print(f"  Need     : {card['need_type']}")
        print(f"  Location : {card['location']}")
        print(f"  Quantity : {card['quantity']}")
        print(f"  Urgency  : {card['urgency']}")

    # Test 2 — image file (if you have one)
    print("\n[TEST 2] Image file test")
    print("  To test with an image:")
    print("  1. Save any image with text as 'test_image.jpg' in this folder")
    print("  2. Run: result = extract_text_from_image('test_image.jpg')")
    print("  3. The extracted text will be printed here")

    # Test 3 — check Tesseract is installed
    print("\n[TEST 3] Checking Tesseract installation")
    try:
        version = pytesseract.get_tesseract_version()
        print(f"  Tesseract version: {version} ✓")
    except Exception as e:
        print(f"  Tesseract issue: {e}")
        print("  Fix: brew install tesseract")

    print("\n" + "=" * 55)
    print("  OCR module ready!")
    print("=" * 55)