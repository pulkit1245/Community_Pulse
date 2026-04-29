"""
Seed 3 demo scenarios for presentation:
  1. Flood rescue — critical multi-zone response
  2. Medical camp — skill-matched volunteers
  3. Food distribution — high-volume low-urgency
Run: python -m seed.seed_demo
"""
import asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.zone import Zone
from app.models.volunteer import Volunteer
from app.models.need import Need, UrgencyLevel
from app.core.database import Base
from sqlalchemy import select


async def run_demo_seed():
    engine = create_async_engine(settings.async_database_url, echo=False)
    print("ASYNC DB URL:", settings.async_database_url)
    Session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        zones_result = await db.execute(select(Zone).order_by(Zone.created_at))
        zones = list(zones_result.scalars().all())
        if not zones:
            print("Run seed_base.py first.")
            return

        z1, z2, z3 = zones[0], zones[2], zones[4]

        # --- Scenario 1: Flood Rescue ---
        flood_needs = [
            Need(title="[DEMO] Family of 5 trapped on rooftop",    category="rescue",    urgency=UrgencyLevel.CRITICAL, zone_id=z1.id, skills_required=["search_rescue"], people_count=5, source="whatsapp", requester_phone="+919800000001"),
            Need(title="[DEMO] Elderly woman needs evacuation",    category="evacuation", urgency=UrgencyLevel.CRITICAL, zone_id=z1.id, skills_required=["driving","first_aid"], people_count=1, source="sms"),
            Need(title="[DEMO] Collapsed building — 3 survivors",  category="rescue",    urgency=UrgencyLevel.CRITICAL, zone_id=z2.id, skills_required=["search_rescue","construction"], people_count=3, source="api"),
        ]

        # --- Scenario 2: Medical Camp ---
        medical_needs = [
            Need(title="[DEMO] Insulin shortage — diabetic patients", category="medical", urgency=UrgencyLevel.HIGH, zone_id=z2.id, skills_required=["medical"], people_count=8, source="api"),
            Need(title="[DEMO] Wound dressing for 12 people",         category="medical", urgency=UrgencyLevel.HIGH, zone_id=z2.id, skills_required=["first_aid"], people_count=12, source="whatsapp"),
            Need(title="[DEMO] Mental health support — trauma group",  category="mental_health", urgency=UrgencyLevel.MEDIUM, zone_id=z3.id, skills_required=["counseling"], people_count=20, source="api"),
        ]

        # --- Scenario 3: Food Distribution ---
        food_needs = [
            Need(title="[DEMO] Hot meals for 200 displaced residents", category="food_water", urgency=UrgencyLevel.HIGH,   zone_id=z3.id, skills_required=["cooking","logistics"], people_count=200, source="api"),
            Need(title="[DEMO] Baby formula and nutrition packs",      category="food_water", urgency=UrgencyLevel.HIGH,   zone_id=z1.id, skills_required=["logistics","childcare"], people_count=15, source="sms"),
            Need(title="[DEMO] Water purification tablets delivery",   category="food_water", urgency=UrgencyLevel.MEDIUM, zone_id=z2.id, skills_required=["logistics"], people_count=500, source="api"),
        ]

        # Demo volunteers with matching skills
        demo_volunteers = [
            Volunteer(name="[DEMO] Dr. Arjun Rescue",   phone="+919900000001", skills=["search_rescue","first_aid"],   zone_id=z1.id, hashed_password=get_password_hash("demo123"), role="coordinator"),
            Volunteer(name="[DEMO] Nurse Priti Medical", phone="+919900000002", skills=["medical","first_aid"],        zone_id=z2.id, hashed_password=get_password_hash("demo123"), role="volunteer"),
            Volunteer(name="[DEMO] Chef Ramesh Food",   phone="+919900000003", skills=["cooking","logistics"],        zone_id=z3.id, hashed_password=get_password_hash("demo123"), role="volunteer"),
            Volunteer(name="[DEMO] Driver Kamla",       phone="+919900000004", skills=["driving","logistics"],        zone_id=z1.id, hashed_password=get_password_hash("demo123"), role="volunteer"),
            Volunteer(name="[DEMO] Counselor Meera",    phone="+919900000005", skills=["counseling","communication"], zone_id=z3.id, hashed_password=get_password_hash("demo123"), role="volunteer"),
        ]

        for n in flood_needs + medical_needs + food_needs:
            db.add(n)
        for v in demo_volunteers:
            db.add(v)

        await db.commit()
        print("Demo seed complete: 3 scenarios (flood, medical, food), 5 demo volunteers.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(run_demo_seed())