import pytest
import uuid
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.dispatch import _build_volunteer_message, _build_requester_message
from app.models.need import Need, UrgencyLevel
from app.models.assignment import Assignment, AssignmentStatus
from app.models.volunteer import Volunteer


def make_need(**kwargs) -> Need:
    n = Need()
    n.id = uuid.uuid4()
    n.title = "Test Need"
    n.category = "medical"
    n.urgency = UrgencyLevel.HIGH
    n.requester_phone = "+919800000001"
    for k, v in kwargs.items():
        setattr(n, k, v)
    return n


def make_assignment(**kwargs) -> Assignment:
    a = Assignment()
    a.id = uuid.uuid4()
    a.status = AssignmentStatus.PENDING
    for k, v in kwargs.items():
        setattr(a, k, v)
    return a


def make_volunteer(**kwargs) -> Volunteer:
    v = Volunteer()
    v.id = uuid.uuid4()
    v.name = "Test Volunteer"
    v.phone = "+919900000001"
    for k, v2 in kwargs.items():
        setattr(v, k, v2)
    return v


def test_volunteer_message_contains_need_title():
    need = make_need(title="Urgent food supplies")
    assignment = make_assignment()
    msg = _build_volunteer_message(need, assignment)
    assert "Urgent food supplies" in msg
    assert "ACCEPT" in msg or "accept" in msg.lower()


def test_volunteer_message_contains_assignment_id():
    need = make_need()
    assignment = make_assignment()
    msg = _build_volunteer_message(need, assignment)
    assert str(assignment.id) in msg


def test_requester_message_contains_volunteer_name():
    volunteer = make_volunteer(name="Dr. Arjun")
    need = make_need()
    msg = _build_requester_message(volunteer, need)
    assert "Dr. Arjun" in msg


def test_requester_message_contains_need_id():
    volunteer = make_volunteer()
    need = make_need()
    msg = _build_requester_message(volunteer, need)
    assert str(need.id) in msg
