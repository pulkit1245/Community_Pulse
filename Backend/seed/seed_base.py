"""
Seed the database with base fixtures:
  - 6 zones
  - 30 volunteers
  - 50 needs
Run: python -m seed.seed_base
"""
import asyncio
import uuid
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.zone import Zone
from app.models.volunteer import Volunteer
from app.models.need import Need, UrgencyLevel, NeedStatus
from app.core.database import Base
from seed.zones import ZONES

SKILLS_POOL = [
    "first_aid", "medical", "search_rescue", "construction",
    "cooking", "driving", "communication", "counseling",
    "logistics", "translation", "engineering", "childcare",
]

NEEDS_TEMPLATES = [
    {"title": "Urgent food supplies needed", "category": "food_water", "urgency": UrgencyLevel.CRITICAL, "skills_required": ["logistics", "driving"]},
    {"title": "Medical assistance required", "category": "medical",    "urgency": UrgencyLevel.CRITICAL, "skills_required": ["medical", "first_aid"]},
    {"title": "Rescue operation — trapped family", "category": "rescue", "urgency": UrgencyLevel.CRITICAL, "skills_required": ["search_rescue"]},
    {"title": "Temporary shelter construction",    "category": "shelter", "urgency": UrgencyLevel.HIGH,    "skills_required": ["construction"]},
    {"title": "Clean water distribution",          "category": "food_water", "urgency": UrgencyLevel.HIGH, "skills_required": ["logistics"]},
    {"title": "Elderly evacuation support",        "category": "evacuation", "urgency": UrgencyLevel.HIGH, "skills_required": ["driving", "childcare"]},
    {"title": "Psychological support needed",      "category": "mental_health", "urgency": UrgencyLevel.MEDIUM, "skills_required": ["counseling"]},
    {"title": "Generator fuel delivery",           "category": "logistics", "urgency": UrgencyLevel.MEDIUM, "skills_required": ["driving"]},
    {"title": "Communication tower repair",        "category": "infrastructure", "urgency": UrgencyLevel.MEDIUM, "skills_required": ["engineering", "communication"]},
    {"title": "Children's meal preparation",       "category": "food_water", "urgency": UrgencyLevel.LOW,  "skills_required": ["cooking", "childcare"]},
]

VOLUNTEER_NAMES = [
    "Priya Sharma", "Rahul Verma", "Anjali Singh", "Mohammed Ali", "Sunita Patel",
    "Amit Gupta", "Kavita Joshi", "Rajesh Kumar", "Deepa Nair", "Arun Mehta",
    "Neha Agarwal", "Vijay Rao", "Pooja Mishra", "Sanjay Tiwari", "Rekha Dubey",
    "Rohit Yadav", "Meena Chaudhary", "Suresh Pandey", "Lata Tripathi", "Manoj Sinha",
    "Anita Bajpai", "Pankaj Shukla", "Ritu Srivastava", "Ashok Chauhan", "Nisha Pathak",
    "Tarun Saxena", "Geeta Maurya", "Dinesh Rawat", "Seema Bhatia", "Harish Kapoor",
]


async def run_seed():
    engine = create_async_engine(settings.async_database_url, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        # Create zones
        zones = []
        for z in ZONES:
            zone = Zone(**z)
            db.add(zone)
            zones.append(zone)
        await db.flush()

        # Create 30 volunteers
        for i, name in enumerate(VOLUNTEER_NAMES):
            skills = [SKILLS_POOL[i % len(SKILLS_POOL)], SKILLS_POOL[(i + 3) % len(SKILLS_POOL)]]
            vol = Volunteer(
                name=name,
                phone=f"+9198{10000000 + i}",
                email=f"volunteer{i}@relief.org",
                skills=skills,
                zone_id=zones[i % len(zones)].id,
                hashed_password=get_password_hash("password123"),
                role="coordinator" if i < 2 else "volunteer",
                languages=["hindi", "english"] if i % 2 == 0 else ["hindi"],
            )
            db.add(vol)

        await db.flush()

        # Create 50 needs
        for i in range(50):
            template = NEEDS_TEMPLATES[i % len(NEEDS_TEMPLATES)]
            need = Need(
                title=f"{template['title']} ({i+1})",
                description=f"Detailed description for need {i+1}. Immediate attention required.",
                category=template["category"],
                urgency=template["urgency"],
                zone_id=zones[i % len(zones)].id,
                skills_required=template["skills_required"],
                requester_phone=f"+9199{10000000 + i}",
                requester_name=f"Resident {i+1}",
                source="seed",
                people_count=(i % 5) + 1,
            )
            db.add(need)

        await db.commit()
        print("Base seed complete: 6 zones, 30 volunteers, 50 needs.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_seed())