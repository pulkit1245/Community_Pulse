import pytest
import uuid
from app.services.matching import _compute_match_score, _build_weight_matrix
from app.models.need import Need, UrgencyLevel
from app.models.volunteer import Volunteer


def make_need(**kwargs) -> Need:
    zone_id = uuid.uuid4()
    n = Need()
    n.id = uuid.uuid4()
    n.zone_id = zone_id
    n.urgency = UrgencyLevel.MEDIUM
    n.skills_required = []
    for k, v in kwargs.items():
        setattr(n, k, v)
    return n


def make_vol(**kwargs) -> Volunteer:
    v = Volunteer()
    v.id = uuid.uuid4()
    v.is_available = True
    v.is_active = True
    v.skills = []
    v.total_assignments = 0
    v.completed_assignments = 0
    for k, v2 in kwargs.items():
        setattr(v, k, v2)
    return v


def test_zone_match_bonus():
    zone_id = uuid.uuid4()
    need = make_need(zone_id=zone_id, urgency=UrgencyLevel.LOW, skills_required=[])
    vol = make_vol(zone_id=zone_id)
    score = _compute_match_score(need, vol)
    assert score > 0


def test_unavailable_volunteer():
    zone_id = uuid.uuid4()
    need = make_need(zone_id=zone_id)
    vol = make_vol(zone_id=zone_id, is_available=False)
    score = _compute_match_score(need, vol)
    assert score < 0


def test_skill_overlap_increases_score():
    zone_id = uuid.uuid4()
    need = make_need(zone_id=zone_id, skills_required=["first_aid", "driving"])

    vol_no_skills = make_vol(zone_id=zone_id, skills=[])
    vol_full_skills = make_vol(zone_id=zone_id, skills=["first_aid", "driving"])

    score_no = _compute_match_score(need, vol_no_skills)
    score_full = _compute_match_score(need, vol_full_skills)
    assert score_full > score_no


def test_critical_urgency_scores_higher():
    zone_id = uuid.uuid4()
    need_low = make_need(zone_id=zone_id, urgency=UrgencyLevel.LOW)
    need_crit = make_need(zone_id=zone_id, urgency=UrgencyLevel.CRITICAL)
    vol = make_vol(zone_id=zone_id)

    assert _compute_match_score(need_crit, vol) > _compute_match_score(need_low, vol)


def test_weight_matrix_shape():
    zone_id = uuid.uuid4()
    needs = [make_need(zone_id=zone_id) for _ in range(3)]
    vols = [make_vol(zone_id=zone_id) for _ in range(5)]
    matrix = _build_weight_matrix(needs, vols)
    assert matrix.shape == (3, 5)