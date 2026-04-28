"""
Full seed: wipes and re-seeds all tables to demonstrate the complete data flow.

DATA FLOW demonstrated:
  1. Zones created       (geographic operational sectors)
  2. Volunteers created  (registered with skills, zone, role)
  3. Needs ingested      (from api/whatsapp/sms sources)
  4. Matching run        (bipartite algorithm → assignments created)
  5. Assignments logged  (with match_score, status transitions)
  6. Audit trail written (every action recorded)

Run:
  python -m seed.seed_full
"""
import asyncio
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy import text
from app.core.config import settings
from app.core.security import get_password_hash
from app.core.database import Base
from app.models.zone import Zone
from app.models.volunteer import Volunteer
from app.models.need import Need, UrgencyLevel, NeedStatus
from app.models.assignment import Assignment, AssignmentStatus
from app.models.audit_log import AuditLog
from seed.zones import ZONES

# ──────────────────────────────────────────────────────────────
# Volunteer pool — varied skills to show smart matching
# ──────────────────────────────────────────────────────────────
VOLUNTEERS = [
    # --- Coordinators (2) ---
    {"name": "Priya Sharma",   "phone": "+919810000001", "email": "priya@relief.org",   "skills": ["medical", "first_aid", "communication"], "role": "coordinator", "languages": ["hindi", "english"]},
    {"name": "Rahul Verma",    "phone": "+919810000002", "email": "rahul@relief.org",   "skills": ["logistics", "driving", "search_rescue"],  "role": "coordinator", "languages": ["hindi", "english"]},
    # --- Medical team (3) ---
    {"name": "Dr. Anjali Singh","phone": "+919810000003", "email": "anjali@relief.org", "skills": ["medical", "first_aid"],                   "role": "volunteer",   "languages": ["hindi", "english"]},
    {"name": "Mohammed Ali",   "phone": "+919810000004", "email": "mali@relief.org",    "skills": ["medical", "counseling"],                  "role": "volunteer",   "languages": ["hindi", "urdu"]},
    {"name": "Sunita Patel",   "phone": "+919810000005", "email": "sunita@relief.org",  "skills": ["first_aid", "childcare"],                 "role": "volunteer",   "languages": ["gujarati", "hindi"]},
    # --- Rescue team (3) ---
    {"name": "Amit Gupta",     "phone": "+919810000006", "email": "amit@relief.org",    "skills": ["search_rescue", "construction"],          "role": "volunteer",   "languages": ["hindi"]},
    {"name": "Kavita Joshi",   "phone": "+919810000007", "email": "kavita@relief.org",  "skills": ["search_rescue", "first_aid"],              "role": "volunteer",   "languages": ["hindi", "english"]},
    {"name": "Rajesh Kumar",   "phone": "+919810000008", "email": "rajesh@relief.org",  "skills": ["construction", "engineering"],            "role": "volunteer",   "languages": ["hindi"]},
    # --- Logistics & Food (4) ---
    {"name": "Deepa Nair",     "phone": "+919810000009", "email": "deepa@relief.org",   "skills": ["cooking", "logistics"],                   "role": "volunteer",   "languages": ["malayalam", "english"]},
    {"name": "Arun Mehta",     "phone": "+919810000010", "email": "arun@relief.org",    "skills": ["driving", "logistics"],                   "role": "volunteer",   "languages": ["hindi"]},
    {"name": "Neha Agarwal",   "phone": "+919810000011", "email": "neha@relief.org",    "skills": ["cooking", "childcare"],                   "role": "volunteer",   "languages": ["hindi", "english"]},
    {"name": "Vijay Rao",      "phone": "+919810000012", "email": "vijay@relief.org",   "skills": ["driving", "communication"],               "role": "volunteer",   "languages": ["kannada", "english"]},
    # --- Psychosocial (2) ---
    {"name": "Pooja Mishra",   "phone": "+919810000013", "email": "pooja@relief.org",   "skills": ["counseling", "communication"],            "role": "volunteer",   "languages": ["hindi", "english"]},
    {"name": "Sanjay Tiwari",  "phone": "+919810000014", "email": "sanjay@relief.org",  "skills": ["counseling", "translation"],              "role": "volunteer",   "languages": ["hindi", "english"]},
    # --- Multi-skill (4) ---
    {"name": "Rekha Dubey",    "phone": "+919810000015", "email": "rekha@relief.org",   "skills": ["first_aid", "cooking", "childcare"],     "role": "volunteer",   "languages": ["hindi"]},
    {"name": "Rohit Yadav",    "phone": "+919810000016", "email": "rohit@relief.org",   "skills": ["engineering", "construction", "driving"], "role": "volunteer",   "languages": ["hindi"]},
    {"name": "Meena Chaudhary","phone": "+919810000017", "email": "meena@relief.org",   "skills": ["translation", "communication"],           "role": "volunteer",   "languages": ["hindi", "english", "urdu"]},
    {"name": "Suresh Pandey",  "phone": "+919810000018", "email": "suresh@relief.org",  "skills": ["logistics", "search_rescue"],             "role": "volunteer",   "languages": ["hindi"]},
]

# ──────────────────────────────────────────────────────────────
# Needs — 3 real disaster scenarios (flood + medical + food)
# ──────────────────────────────────────────────────────────────
SCENARIO_NEEDS = [
    # ── Scenario 1: Flood Rescue (North & East sectors) ──
    {"title": "Family of 5 trapped on rooftop — rising floodwater",    "category": "rescue",      "urgency": UrgencyLevel.CRITICAL, "zone_idx": 0, "skills": ["search_rescue"],             "people": 5,   "source": "whatsapp",  "requester": "Ramesh Gupta",  "req_phone": "+919900010001"},
    {"title": "Elderly woman unable to evacuate — first floor flooded", "category": "evacuation",  "urgency": UrgencyLevel.CRITICAL, "zone_idx": 0, "skills": ["driving", "first_aid"],      "people": 1,   "source": "sms",       "requester": "Her daughter",  "req_phone": "+919900010002"},
    {"title": "Collapsed building — 3 survivors heard inside",          "category": "rescue",      "urgency": UrgencyLevel.CRITICAL, "zone_idx": 2, "skills": ["search_rescue", "construction"],"people": 3,"source": "api",       "requester": "Neighbour",     "req_phone": "+919900010003"},
    {"title": "Boat needed to ferry 20 stranded residents",             "category": "evacuation",  "urgency": UrgencyLevel.HIGH,     "zone_idx": 5, "skills": ["driving", "logistics"],      "people": 20,  "source": "whatsapp",  "requester": "Colony RWA",   "req_phone": "+919900010004"},
    {"title": "Power lines down — area unsafe, needs engineer",         "category": "infrastructure","urgency": UrgencyLevel.HIGH,   "zone_idx": 0, "skills": ["engineering", "communication"],"people": 0, "source": "api",       "requester": "DISCOM officer","req_phone": "+919900010005"},

    # ── Scenario 2: Medical Camp (East & Central sectors) ──
    {"title": "Insulin shortage — 8 diabetic patients at relief camp",  "category": "medical",     "urgency": UrgencyLevel.CRITICAL, "zone_idx": 2, "skills": ["medical"],                  "people": 8,   "source": "api",       "requester": "Camp doctor",   "req_phone": "+919900020001"},
    {"title": "Wound dressing required for 12 injured survivors",       "category": "medical",     "urgency": UrgencyLevel.HIGH,     "zone_idx": 2, "skills": ["first_aid"],                "people": 12,  "source": "whatsapp",  "requester": "Camp nurse",    "req_phone": "+919900020002"},
    {"title": "Mental health support — trauma group of 20",             "category": "mental_health","urgency": UrgencyLevel.MEDIUM,  "zone_idx": 4, "skills": ["counseling"],               "people": 20,  "source": "api",       "requester": "NGO worker",    "req_phone": "+919900020003"},
    {"title": "Newborn — mother needs childcare + medical support",     "category": "medical",     "urgency": UrgencyLevel.HIGH,     "zone_idx": 4, "skills": ["medical", "childcare"],     "people": 2,   "source": "sms",       "requester": "Father",        "req_phone": "+919900020004"},
    {"title": "Language barrier — Urdu translator needed at camp",      "category": "medical",     "urgency": UrgencyLevel.MEDIUM,   "zone_idx": 2, "skills": ["translation"],              "people": 10,  "source": "api",       "requester": "Camp admin",    "req_phone": "+919900020005"},

    # ── Scenario 3: Food & Water Distribution (South, West, River Belt) ──
    {"title": "Hot meals for 200 displaced residents at school shelter","category": "food_water",  "urgency": UrgencyLevel.HIGH,     "zone_idx": 1, "skills": ["cooking", "logistics"],     "people": 200, "source": "api",       "requester": "School principal","req_phone": "+919900030001"},
    {"title": "Baby formula and nutrition packs — 15 infants",          "category": "food_water",  "urgency": UrgencyLevel.HIGH,     "zone_idx": 0, "skills": ["logistics", "childcare"],   "people": 15,  "source": "sms",       "requester": "ASHA worker",   "req_phone": "+919900030002"},
    {"title": "Water purification tablets — 500 people, 3 days supply","category": "food_water",  "urgency": UrgencyLevel.MEDIUM,   "zone_idx": 2, "skills": ["logistics"],                "people": 500, "source": "api",       "requester": "Panchayat head","req_phone": "+919900030003"},
    {"title": "Fuel for generator at field hospital — urgent delivery", "category": "logistics",   "urgency": UrgencyLevel.HIGH,     "zone_idx": 5, "skills": ["driving"],                  "people": 0,   "source": "api",       "requester": "Field hospital", "req_phone": "+919900030004"},
    {"title": "Children meal prep — 80 kids at community centre",       "category": "food_water",  "urgency": UrgencyLevel.MEDIUM,   "zone_idx": 3, "skills": ["cooking", "childcare"],     "people": 80,  "source": "whatsapp",  "requester": "Anganwadi",     "req_phone": "+919900030005"},
]


async def wipe_tables(db: AsyncSession):
    """Delete all seeded data in dependency order."""
    # Use TRUNCATE with CASCADE to handle FK constraints cleanly
    # Table names must match __tablename__ in models
    tables = ["audit_log", "assignments", "needs", "volunteers", "zones"]
    for table in tables:
        await db.execute(text(f"DELETE FROM {table}"))
    await db.commit()
    print("  ✓ All tables wiped.")


async def run_full_seed():
    engine = create_async_engine(settings.database_url, echo=False)

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        print("\n════════════════════════════════════════════")
        print("  Community Pulse — Full Data Flow Seed")
        print("════════════════════════════════════════════\n")

        # ── Step 0: Wipe ──────────────────────────────────
        print("Step 0 ▶ Wiping existing data...")
        await wipe_tables(db)

        # ── Step 1: Create Zones ──────────────────────────
        print("Step 1 ▶ Creating 6 geographic zones...")
        zones = []
        for z in ZONES:
            zone = Zone(**z)
            db.add(zone)
            zones.append(zone)
        await db.flush()
        print(f"  ✓ {len(zones)} zones inserted: {[z.name for z in zones]}")

        # ── Step 2: Register Volunteers ───────────────────
        print(f"\nStep 2 ▶ Registering {len(VOLUNTEERS)} volunteers...")
        vols = []
        for i, v in enumerate(VOLUNTEERS):
            vol = Volunteer(
                name=v["name"],
                phone=v["phone"],
                email=v["email"],
                skills=v["skills"],
                zone_id=zones[i % len(zones)].id,
                hashed_password=get_password_hash("password123"),
                role=v["role"],
                languages=v["languages"],
            )
            db.add(vol)
            vols.append(vol)
        await db.flush()
        coordinators = [v for v in vols if v.role == "coordinator"]
        volunteers_only = [v for v in vols if v.role == "volunteer"]
        print(f"  ✓ {len(coordinators)} coordinators, {len(volunteers_only)} volunteers registered")
        for v in vols[:4]:
            print(f"     → {v.name} | skills: {v.skills} | zone: {zones[vols.index(v) % len(zones)].name}")

        # ── Step 3: Ingest Needs ──────────────────────────
        print(f"\nStep 3 ▶ Ingesting {len(SCENARIO_NEEDS)} disaster needs...")
        needs = []
        source_counts = {}
        for n in SCENARIO_NEEDS:
            need = Need(
                title=n["title"],
                description=f"Reported via {n['source'].upper()}. Immediate response required.",
                category=n["category"],
                urgency=n["urgency"],
                zone_id=zones[n["zone_idx"]].id,
                skills_required=n["skills"],
                people_count=n["people"],
                source=n["source"],
                requester_name=n.get("requester"),
                requester_phone=n.get("req_phone"),
                status=NeedStatus.OPEN,
            )
            db.add(need)
            needs.append(need)
            source_counts[n["source"]] = source_counts.get(n["source"], 0) + 1
        await db.flush()
        by_urgency = {}
        for need in needs:
            by_urgency[need.urgency] = by_urgency.get(need.urgency, 0) + 1
        print(f"  ✓ {len(needs)} needs ingested from sources: {source_counts}")
        print(f"  ✓ Urgency breakdown: {dict(by_urgency)}")

        # ── Step 4: Run Matching Algorithm ────────────────
        print(f"\nStep 4 ▶ Running bipartite matching algorithm...")
        import numpy as np
        from scipy.optimize import linear_sum_assignment

        URGENCY_WEIGHTS = {"critical": 4.0, "high": 3.0, "medium": 2.0, "low": 1.0}
        SKILL_MATCH_BONUS = 2.0
        ZONE_MATCH_BONUS = 3.0

        def compute_score(need, vol):
            if not vol.is_available or not vol.is_active:
                return -999.0
            score = 0.0
            if str(need.zone_id) == str(vol.zone_id):
                score += ZONE_MATCH_BONUS
            req = set(s.lower() for s in (need.skills_required or []))
            has = set(s.lower() for s in (vol.skills or []))
            if req:
                overlap = len(req & has) / len(req)
                score += overlap * SKILL_MATCH_BONUS
            score += URGENCY_WEIGHTS.get(need.urgency, 1.0)
            score -= (vol.total_assignments - vol.completed_assignments) * 0.1
            return score

        n_needs, n_vols = len(needs), len(vols)
        matrix = np.zeros((n_needs, n_vols))
        for i, need in enumerate(needs):
            for j, vol in enumerate(vols):
                matrix[i][j] = -compute_score(need, vol)

        row_ind, col_ind = linear_sum_assignment(matrix)

        # ── Step 5: Create Assignments ────────────────────
        print(f"\nStep 5 ▶ Persisting assignments...")
        assignments = []
        matched_need_ids = set()

        for r, c in zip(row_ind, col_ind):
            score = -matrix[r][c]
            if score <= 0:
                continue
            need = needs[r]
            vol = vols[c]
            matched_need_ids.add(r)

            assignment = Assignment(
                need_id=need.id,
                volunteer_id=vol.id,
                status=AssignmentStatus.PENDING,
                match_score=round(score, 4),
                notes=f"Auto-matched by bipartite algorithm. Score: {round(score,4)}",
            )
            db.add(assignment)
            assignments.append((assignment, need, vol))

            # Update volunteer load
            vol.total_assignments += 1
            need.status = NeedStatus.ASSIGNED

        await db.flush()

        print(f"  ✓ {len(assignments)} assignments created")
        print(f"  ✓ {len(needs) - len(matched_need_ids)} needs unmatched (open)")
        print()
        for asgn, need, vol in assignments[:6]:
            zone_match = "✓ same-zone" if str(need.zone_id) == str(vol.zone_id) else "✗ cross-zone"
            print(f"     [{need.urgency.upper():8}] {need.title[:45]:<45}")
            print(f"              → {vol.name:<22} score={asgn.match_score}  {zone_match}")
        if len(assignments) > 6:
            print(f"     ... and {len(assignments) - 6} more assignments")

        # ── Step 6: Simulate status transitions ───────────
        print(f"\nStep 6 ▶ Simulating assignment lifecycle transitions...")
        now = datetime.now(timezone.utc)

        # First 4 assignments: accepted + in_progress
        for i, (asgn, need, vol) in enumerate(assignments[:4]):
            asgn.status = AssignmentStatus.ACCEPTED
            asgn.accepted_at = now
            need.status = NeedStatus.IN_PROGRESS

        # Next 3: completed
        for i, (asgn, need, vol) in enumerate(assignments[4:7]):
            asgn.status = AssignmentStatus.COMPLETED
            asgn.accepted_at = now
            asgn.completed_at = now
            need.status = NeedStatus.COMPLETED
            vol.completed_assignments += 1

        # One assignment: declined (triggers rematch)
        if len(assignments) >= 8:
            declined_asgn, declined_need, declined_vol = assignments[7]
            declined_asgn.status = AssignmentStatus.DECLINED
            declined_asgn.decline_reason = "Volunteer already at another critical site"
            declined_need.status = NeedStatus.OPEN  # back to open for rematch

        await db.flush()
        accepted_count = sum(1 for a, _, _ in assignments if a.status == AssignmentStatus.ACCEPTED)
        completed_count = sum(1 for a, _, _ in assignments if a.status == AssignmentStatus.COMPLETED)
        declined_count = sum(1 for a, _, _ in assignments if a.status == AssignmentStatus.DECLINED)
        pending_count = sum(1 for a, _, _ in assignments if a.status == AssignmentStatus.PENDING)
        print(f"  ✓ Status breakdown: {pending_count} pending | {accepted_count} accepted | {completed_count} completed | {declined_count} declined")

        # ── Step 7: Write audit trail ─────────────────────
        print(f"\nStep 7 ▶ Writing audit trail...")
        audit_events = [
            {"action": "zone.created",         "entity_type": "zone",       "details": {"count": len(zones)}},
            {"action": "volunteer.registered", "entity_type": "volunteer",  "details": {"count": len(vols)}},
            {"action": "need.ingested",        "entity_type": "need",       "details": {"count": len(needs), "sources": source_counts}},
            {"action": "matching.run",         "entity_type": "assignment", "details": {"matched": len(assignments), "unmatched": len(needs) - len(matched_need_ids)}},
            {"action": "assignment.dispatched","entity_type": "assignment", "details": {"notified": len(assignments), "channel": "sms/whatsapp"}},
            {"action": "assignment.accepted",  "entity_type": "assignment", "details": {"count": accepted_count}},
            {"action": "assignment.completed", "entity_type": "assignment", "details": {"count": completed_count}},
        ]
        for event in audit_events:
            log = AuditLog(
                action=event["action"],
                entity_type=event["entity_type"],
                details=event["details"],
                user_id="seed-script",
            )
            db.add(log)

        await db.commit()

        # ── Summary ───────────────────────────────────────
        print(f"\n════════════════════════════════════════════")
        print(f"  ✅ Full Seed Complete — Database State:")
        print(f"════════════════════════════════════════════")
        print(f"  Zones:       {len(zones)}")
        print(f"  Volunteers:  {len(vols)}  (2 coordinators, {len(vols)-2} volunteers)")
        print(f"  Needs:       {len(needs)}  (3 scenarios: flood, medical, food)")
        print(f"  Assignments: {len(assignments)}")
        print(f"  Audit logs:  {len(audit_events)}")
        print(f"\n  DATA FLOW TRACE:")
        print(f"  [Source: API/SMS/WhatsApp] → Need ingested (status=OPEN)")
        print(f"  [Matching engine]          → Bipartite algorithm scores volunteers")
        print(f"  [Assignment created]       → status=PENDING  (match_score computed)")
        print(f"  [Dispatch service]         → SMS/WhatsApp sent → status=NOTIFIED")
        print(f"  [Volunteer accepts]        → status=ACCEPTED → Need: IN_PROGRESS")
        print(f"  [Work done]                → status=COMPLETED → Need: COMPLETED")
        print(f"  [If declined]              → Rematch triggered → new Assignment")
        print(f"  [Audit log]                → Every action persisted")
        print(f"════════════════════════════════════════════\n")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_full_seed())
