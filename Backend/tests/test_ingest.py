import pytest
from app.services.ingestion import _compute_embedding_hash, parse_whatsapp_message
import uuid


def test_dedup_hash_is_deterministic():
    zone_id = str(uuid.uuid4())
    h1 = _compute_embedding_hash("Food needed", "hungry family", zone_id)
    h2 = _compute_embedding_hash("Food needed", "hungry family", zone_id)
    assert h1 == h2


def test_dedup_hash_differs_on_different_input():
    zone_id = str(uuid.uuid4())
    h1 = _compute_embedding_hash("Food needed", "hungry family", zone_id)
    h2 = _compute_embedding_hash("Medical help", "injured person", zone_id)
    assert h1 != h2


def test_dedup_hash_case_insensitive():
    zone_id = str(uuid.uuid4())
    h1 = _compute_embedding_hash("FOOD needed", "Hungry Family", zone_id)
    h2 = _compute_embedding_hash("food needed", "hungry family", zone_id)
    assert h1 == h2


@pytest.mark.asyncio
async def test_parse_whatsapp_critical_urgency():
    result = await parse_whatsapp_message("URGENT help needed! people trapped", "+919800000001")
    assert result["urgency"] == "critical"


@pytest.mark.asyncio
async def test_parse_whatsapp_medical_category():
    result = await parse_whatsapp_message("need doctor for injured person", "+919800000002")
    assert result["category"] == "medical"


@pytest.mark.asyncio
async def test_parse_whatsapp_food_category():
    result = await parse_whatsapp_message("no food and water for 2 days", "+919800000003")
    assert result["category"] == "food_water"