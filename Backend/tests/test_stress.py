"""
Stress test: simulate 50 concurrent needs + 100 volunteers.
Uses locust for load testing or asyncio for unit-level stress.
Run with: locust -f tests/test_stress.py --headless -u 50 -r 10 --run-time 60s
"""
import asyncio
import uuid
import time
import pytest
from app.services.matching import _build_weight_matrix, run_matching
from app.models.need import Need, UrgencyLevel
from app.models.volunteer import Volunteer


def make_need(zone_id) -> Need:
    n = Need()
    n.id = uuid.uuid4()
    n.zone_id = zone_id
    n.urgency = UrgencyLevel.HIGH
    n.skills_required = ["first_aid"]
    n.status = "open"
    return n


def make_vol(zone_id) -> Volunteer:
    v = Volunteer()
    v.id = uuid.uuid4()
    v.zone_id = zone_id
    v.is_available = True
    v.is_active = True
    v.skills = ["first_aid", "driving"]
    v.total_assignments = 0
    v.completed_assignments = 0
    return v


def test_matrix_build_50x100_under_1s():
    """Weight matrix for 50 needs × 100 volunteers must build in under 1 second."""
    zone_id = uuid.uuid4()
    needs = [make_need(zone_id) for _ in range(50)]
    vols = [make_vol(zone_id) for _ in range(100)]

    start = time.perf_counter()
    matrix = _build_weight_matrix(needs, vols)
    elapsed = time.perf_counter() - start

    assert matrix.shape == (50, 100)
    assert elapsed < 1.0, f"Matrix build took {elapsed:.3f}s — too slow"


def test_scipy_assignment_50x100_under_1s():
    """scipy linear_sum_assignment on 50×100 matrix must complete in under 1 second."""
    from scipy.optimize import linear_sum_assignment
    import numpy as np

    zone_id = uuid.uuid4()
    needs = [make_need(zone_id) for _ in range(50)]
    vols = [make_vol(zone_id) for _ in range(100)]
    matrix = _build_weight_matrix(needs, vols)

    start = time.perf_counter()
    row_ind, col_ind = linear_sum_assignment(matrix)
    elapsed = time.perf_counter() - start

    assert len(row_ind) == 50
    assert elapsed < 1.0, f"Assignment took {elapsed:.3f}s — too slow"


try:
    from locust import HttpUser, task, between

    class DisasterReliefUser(HttpUser):
        wait_time = between(0.5, 2)
        token = None

        def on_start(self):
            resp = self.client.post("/api/v1/auth/login", json={
                "phone": "+919810000000", "password": "password123"
            })
            if resp.status_code == 200:
                self.token = resp.json()["access_token"]

        @property
        def headers(self):
            return {"Authorization": f"Bearer {self.token}"} if self.token else {}

        @task(3)
        def list_needs(self):
            self.client.get("/api/v1/needs?page=1&page_size=20", headers=self.headers)

        @task(3)
        def list_volunteers(self):
            self.client.get("/api/v1/volunteers?available_only=true", headers=self.headers)

        @task(1)
        def run_match(self):
            self.client.post("/api/v1/match", json={"dry_run": True}, headers=self.headers)

except ImportError:
    pass