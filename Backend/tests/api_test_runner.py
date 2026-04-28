"""
Community Pulse — Comprehensive API Test Runner
================================================
Tests EVERY endpoint, captures request + response, saves to api_test_results.json
Run: python tests/api_test_runner.py
"""

import json
import time
import sys
import requests
from datetime import datetime
from typing import Any, Optional

# ─── Config ──────────────────────────────────────────────────────────────────
BASE_URL = "http://localhost:8000"
API_BASE = f"{BASE_URL}/api/v1"
OUTPUT_FILE = "tests/api_test_results.json"

# Seeded data from DB
ZONE_ID = "8aa31a74-d2c0-41e0-9003-42b6ece6a12b"      # North Sector
ZONE_ID_2 = "ac73ccbf-c996-4c2a-aef9-2dd965115727"    # South Sector
COORDINATOR_PHONE = "+919810000001"
COORDINATOR_PASSWORD = "password123"

# ─── Helpers ─────────────────────────────────────────────────────────────────
results = []
token: Optional[str] = None
created_need_id: Optional[str] = None
created_volunteer_id: Optional[str] = None
created_assignment_id: Optional[str] = None

PASS = "✅ PASS"
FAIL = "❌ FAIL"
WARN = "⚠️  WARN"

def color(text, code): return f"\033[{code}m{text}\033[0m"
GREEN  = lambda t: color(t, "32")
RED    = lambda t: color(t, "31")
YELLOW = lambda t: color(t, "33")
CYAN   = lambda t: color(t, "36")
BOLD   = lambda t: color(t, "1")


def call(
    method: str,
    path: str,
    *,
    body: Any = None,
    headers: dict = None,
    params: dict = None,
    description: str = "",
    expected_status: int = 200,
    auth: bool = False,
) -> requests.Response:
    global token
    url = path if path.startswith("http") else f"{API_BASE}{path}"
    hdrs = {"Content-Type": "application/json"}
    if headers:
        hdrs.update(headers)
    if auth and token:
        hdrs["Authorization"] = f"Bearer {token}"

    t0 = time.perf_counter()
    try:
        resp = requests.request(
            method.upper(), url,
            json=body, headers=hdrs, params=params,
            timeout=15,
        )
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
    except Exception as exc:
        elapsed_ms = round((time.perf_counter() - t0) * 1000, 1)
        record = {
            "description": description,
            "method": method.upper(),
            "url": url,
            "request": {"headers": hdrs, "body": body, "params": params},
            "response": {"status_code": "ERROR", "body": str(exc)},
            "expected_status": expected_status,
            "elapsed_ms": elapsed_ms,
            "result": "ERROR",
        }
        results.append(record)
        print(f"  {RED(FAIL)}  [{method.upper()}] {path}  →  ERROR: {exc}")
        return None

    # parse response body
    try:
        resp_body = resp.json()
    except Exception:
        resp_body = resp.text

    passed = resp.status_code == expected_status
    status_tag = PASS if passed else FAIL
    color_fn = GREEN if passed else RED

    record = {
        "description": description,
        "method": method.upper(),
        "url": url,
        "request": {
            "headers": {k: ("Bearer ***" if k == "Authorization" else v) for k, v in hdrs.items()},
            "body": body,
            "params": params,
        },
        "response": {
            "status_code": resp.status_code,
            "body": resp_body,
        },
        "expected_status": expected_status,
        "elapsed_ms": elapsed_ms,
        "result": "PASS" if passed else "FAIL",
    }
    results.append(record)

    tag_display = color_fn(status_tag)
    print(f"  {tag_display}  [{method.upper()}] {path}  →  {resp.status_code}  ({elapsed_ms}ms)")
    return resp


def section(title: str):
    print(f"\n{BOLD(CYAN(f'── {title} ' + '─' * max(0, 60 - len(title))))}")


# ═══════════════════════════════════════════════════════════════════════════
# TEST SUITES
# ═══════════════════════════════════════════════════════════════════════════

def test_health():
    section("HEALTH CHECKS")
    call("GET", f"{BASE_URL}/health",
         description="Application health check", expected_status=200)
    call("GET", f"{BASE_URL}/ready",
         description="Readiness / DB connectivity check", expected_status=200)


def test_auth():
    global token
    section("AUTHENTICATION")

    # Valid login
    r = call("POST", "/auth/login",
             body={"phone": COORDINATOR_PHONE, "password": COORDINATOR_PASSWORD},
             description="Login with valid coordinator credentials", expected_status=200)
    if r and r.status_code == 200:
        token = r.json().get("access_token")
        print(f"       Token acquired: {token[:30]}...")
    else:
        print(f"       {RED('⚠ Login failed — subsequent auth tests will fail')}")

    # Wrong password
    call("POST", "/auth/login",
         body={"phone": COORDINATOR_PHONE, "password": "wrong_password_xyz"},
         description="Login with wrong password — expect 401", expected_status=401)

    # Non-existent user
    call("POST", "/auth/login",
         body={"phone": "+910000000000", "password": "password123"},
         description="Login with non-existent phone — expect 401", expected_status=401)

    # Missing fields
    call("POST", "/auth/login",
         body={"phone": COORDINATOR_PHONE},
         description="Login with missing password field — expect 422", expected_status=422)


def test_needs():
    global created_need_id
    section("NEEDS MANAGEMENT")

    # List needs (no auth — should work if public or fail gracefully)
    call("GET", "/needs",
         description="List needs — no auth", expected_status=403, auth=False)

    # List with filters
    call("GET", "/needs",
         params={"zone_id": ZONE_ID, "urgency": "critical", "page": 1, "page_size": 5},
         description="List needs filtered by zone + urgency", expected_status=200, auth=True)

    call("GET", "/needs",
         params={"status": "open", "category": "medical", "page_size": 10},
         description="List needs filtered by status + category", expected_status=200, auth=True)

    # Create need
    r = call("POST", "/needs",
             body={
                 "title": "TEST: Emergency food supplies needed",
                 "description": "50 families displaced by flooding need food and clean water",
                 "category": "food_water",
                 "urgency": "high",
                 "zone_id": ZONE_ID,
                 "requester_name": "Test Village Head",
                 "requester_phone": "+919876543210",
                 "skills_required": ["logistics", "driving"],
                 "people_count": 250,
                 "source": "api",
             },
             description="Create a new need", expected_status=201, auth=True)
    if r and r.status_code == 201:
        created_need_id = r.json().get("id")
        print(f"       Created Need ID: {created_need_id}")

    # Duplicate create — should 409
    call("POST", "/needs",
         body={
             "title": "TEST: Emergency food supplies needed",
             "description": "50 families displaced by flooding need food and clean water",
             "category": "food_water",
             "urgency": "high",
             "zone_id": ZONE_ID,
             "requester_name": "Test Village Head",
             "requester_phone": "+919876543210",
             "skills_required": ["logistics", "driving"],
             "people_count": 250,
             "source": "api",
         },
         description="Create duplicate need — expect 409", expected_status=409, auth=True)

    # Get specific need
    if created_need_id:
        call("GET", f"/needs/{created_need_id}",
             description="Get need by ID", expected_status=200, auth=True)

        # Update need
        call("PATCH", f"/needs/{created_need_id}",
             body={"status": "in_progress", "urgency": "critical"},
             description="Update need status + urgency", expected_status=200, auth=True)

    # Non-existent need
    call("GET", "/needs/00000000-0000-0000-0000-000000000000",
         description="Get non-existent need — expect 404", expected_status=404, auth=True)

    # Unauthorized create
    call("POST", "/needs",
         body={"title": "Unauth test", "description": "test", "category": "rescue",
               "urgency": "low", "zone_id": ZONE_ID, "requester_phone": "+919000000000"},
         description="Create need without auth — expect 403", expected_status=403, auth=False)


def test_volunteers():
    global created_volunteer_id
    section("VOLUNTEER MANAGEMENT")

    # List all volunteers
    call("GET", "/volunteers",
         description="List all volunteers", expected_status=200, auth=True)

    # With filters
    call("GET", "/volunteers",
         params={"zone_id": ZONE_ID, "available_only": "true", "page_size": 10},
         description="List volunteers filtered by zone + available", expected_status=200, auth=True)

    call("GET", "/volunteers",
         params={"skill": "medical", "page": 1, "page_size": 5},
         description="List volunteers filtered by skill=medical", expected_status=200, auth=True)

    # Create volunteer
    import random
    rand_suffix = random.randint(10000, 99999)
    r = call("POST", "/volunteers",
             body={
                 "name": "TEST Volunteer Sam",
                 "phone": f"+9170000{rand_suffix}",
                 "email": f"sam{rand_suffix}@test.org",
                 "skills": ["first_aid", "communication"],
                 "zone_id": ZONE_ID,
                 "bio": "API test volunteer — safe to delete",
                 "languages": ["english", "hindi"],
                 "password": "testpassword123",
             },
             description="Create a new volunteer", expected_status=201, auth=True)
    if r and r.status_code == 201:
        created_volunteer_id = r.json().get("id")
        print(f"       Created Volunteer ID: {created_volunteer_id}")

    # Get volunteer
    if created_volunteer_id:
        call("GET", f"/volunteers/{created_volunteer_id}",
             description="Get volunteer by ID", expected_status=200, auth=True)

        # Update volunteer
        call("PATCH", f"/volunteers/{created_volunteer_id}",
             body={"skills": ["first_aid", "medical", "communication"], "is_available": True,
                   "bio": "Updated bio via API test"},
             description="Update volunteer profile", expected_status=200, auth=True)

    # Non-existent volunteer
    call("GET", "/volunteers/00000000-0000-0000-0000-000000000000",
         description="Get non-existent volunteer — expect 404", expected_status=404, auth=True)


def test_matching():
    global created_assignment_id
    section("MATCHING & ASSIGNMENT")

    # Dry run match — whole DB
    call("POST", "/match",
         body={"dry_run": True},
         description="Run matching algorithm (dry run, all zones)", expected_status=200, auth=True)

    # Dry run match — specific zone
    r = call("POST", "/match",
             body={"zone_id": ZONE_ID, "dry_run": True},
             description="Run matching for specific zone (dry run)", expected_status=200, auth=True)

    # Real match — specific zone
    r = call("POST", "/match",
             body={"zone_id": ZONE_ID, "dry_run": False},
             description="Run matching algorithm (real, creates assignments)", expected_status=200, auth=True)
    if r and r.status_code == 200:
        assignments = r.json().get("assignments", [])
        if assignments:
            created_assignment_id = assignments[0].get("assignment_id")
            print(f"       Got assignment ID for dispatch: {created_assignment_id}")

    # Match only specific needs
    if created_need_id:
        call("POST", "/match",
             body={"need_ids": [created_need_id], "dry_run": True},
             description="Match specific need IDs (dry run)", expected_status=200, auth=True)

    # Unauthorized match
    call("POST", "/match",
         body={"dry_run": True},
         description="Match without auth — expect 403", expected_status=403, auth=False)


def test_tasks():
    section("TASK / ASSIGNMENT MANAGEMENT")

    # List assignments
    call("GET", "/tasks",
         description="List all assignments", expected_status=200, auth=True)

    if created_assignment_id:
        # Get specific assignment
        call("GET", f"/tasks/{created_assignment_id}",
             description="Get assignment by ID", expected_status=200, auth=True)

        # Update status → accepted
        call("PATCH", f"/tasks/{created_assignment_id}/status",
             body={"status": "accepted", "notes": "Volunteer confirmed via API test"},
             description="Update assignment status to accepted", expected_status=200, auth=True)

        # Update status → in_progress
        call("PATCH", f"/tasks/{created_assignment_id}/status",
             body={"status": "in_progress"},
             description="Update assignment status to in_progress", expected_status=200, auth=True)

        # Dispatch (send notification)
        call("POST", f"/tasks/{created_assignment_id}/dispatch",
             description="Dispatch assignment (trigger SMS/WA notification)", expected_status=200, auth=True)

        # Update status → completed
        call("PATCH", f"/tasks/{created_assignment_id}/status",
             body={"status": "completed", "notes": "Task completed successfully"},
             description="Mark assignment as completed", expected_status=200, auth=True)

    # Non-existent assignment
    call("GET", "/tasks/00000000-0000-0000-0000-000000000000",
         description="Get non-existent assignment — expect 404", expected_status=404, auth=True)

    # Decline + rematch
    if created_assignment_id:
        call("POST", f"/match/decline/{created_assignment_id}",
             params={"decline_reason": "Too far from location"},
             description="Decline assignment and trigger rematch", expected_status=200, auth=True)


def test_ingest():
    section("INGESTION (PUBLIC WEBHOOKS)")

    # REST ingestion (public, no auth)
    call("POST", "/ingest",
         body={
             "title": "INGEST TEST: Stranded family needs rescue",
             "description": "Family of 4 stranded on rooftop due to flooding",
             "category": "rescue",
             "urgency": "critical",
             "zone_id": ZONE_ID_2,
             "requester_name": "Ingest Test Person",
             "requester_phone": "+919555000123",
             "skills_required": ["search_rescue", "first_aid"],
             "people_count": 4,
             "source": "api",
         },
         description="Ingest a need via REST API (no auth required)", expected_status=201, auth=False)

    # WhatsApp verification challenge
    call("GET", "/ingest/whatsapp",
         params={
             "hub.mode": "subscribe",
             "hub.verify_token": "your_whatsapp_verify_token",
             "hub.challenge": "CHALLENGE_CODE_12345",
         },
         description="WhatsApp verification challenge", expected_status=200, auth=False)

    # WhatsApp webhook (fake payload)
    call("POST", "/ingest/whatsapp",
         body={
             "object": "whatsapp_business_account",
             "entry": [{
                 "id": "WHATSAPP_BUSINESS_ACCOUNT_ID",
                 "changes": [{
                     "value": {
                         "messaging_product": "whatsapp",
                         "metadata": {"display_phone_number": "1234567890", "phone_number_id": "PH_ID"},
                         "messages": [{
                             "from": "+919876500001",
                             "id": "wamid.test123",
                             "timestamp": str(int(time.time())),
                             "text": {"body": "Need urgent help, 3 people trapped in flood water near north bank"},
                             "type": "text",
                         }],
                     },
                     "field": "messages",
                 }],
             }],
         },
         description="WhatsApp webhook — incoming message", expected_status=200, auth=False)


def test_delete():
    section("CLEANUP / DELETE OPERATIONS")
    # Delete the test need
    if created_need_id:
        call("DELETE", f"/needs/{created_need_id}",
             description="Delete (cancel) the test need (Expected 403 for coordinator)", expected_status=403, auth=True)

        call("GET", f"/needs/{created_need_id}",
             description="Verify need still exists (Soft delete/Coordinator limit)", expected_status=200, auth=True)

    # Delete the test volunteer
    if created_volunteer_id:
        call("DELETE", f"/volunteers/{created_volunteer_id}",
             description="Deactivate (delete) the test volunteer", expected_status=204, auth=True)

        call("GET", f"/volunteers/{created_volunteer_id}",
             description="Verify deactivated volunteer still returns 200 (Soft delete)", expected_status=200, auth=True)


def test_edge_cases():
    section("EDGE CASES & ERROR HANDLING")

    # Invalid UUID format
    call("GET", "/needs/not-a-uuid",
         description="Need with invalid UUID format — expect 422 or 404", expected_status=422, auth=True)

    # Invalid pagination
    call("GET", "/needs",
         params={"page": -1, "page_size": 999},
         description="Invalid pagination params — expect 422", expected_status=422, auth=True)

    # Wrong content type — body as string
    call("POST", "/needs",
         body="this is not json",
         description="Create need with string body — expect 422", expected_status=422, auth=True)

    # Non-existent endpoint
    call("GET", f"{BASE_URL}/api/v1/nonexistent_route",
         description="Non-existent route — expect 404", expected_status=404, auth=False)


# ═══════════════════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════════════════

def main():
    print(BOLD(f"\n{'═'*65}"))
    print(BOLD(f"  Community Pulse — Full API Test Suite"))
    print(BOLD(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"))
    print(BOLD(f"{'═'*65}"))
    print(f"  Backend:  {BASE_URL}")
    print(f"  Output:   {OUTPUT_FILE}")

    test_health()
    test_auth()
    test_needs()
    test_volunteers()
    test_matching()
    test_tasks()
    test_ingest()
    test_delete()
    test_edge_cases()

    # ── Summary ──────────────────────────────────────────────────────────
    total  = len(results)
    passed = sum(1 for r in results if r["result"] == "PASS")
    failed = sum(1 for r in results if r["result"] == "FAIL")
    errors = sum(1 for r in results if r["result"] == "ERROR")

    print(f"\n{BOLD('─'*65)}")
    print(BOLD("  SUMMARY"))
    print(f"  Total tests : {total}")
    print(GREEN(f"  Passed      : {passed}"))
    if failed: print(RED(f"  Failed      : {failed}"))
    if errors:  print(YELLOW(f"  Errors      : {errors}"))
    print(f"{'─'*65}")

    # ── Save to JSON ─────────────────────────────────────────────────────
    output = {
        "run_at": datetime.now().isoformat(),
        "base_url": BASE_URL,
        "summary": {
            "total": total,
            "passed": passed,
            "failed": failed,
            "errors": errors,
        },
        "tests": results,
    }
    with open(OUTPUT_FILE, "w") as f:
        json.dump(output, f, indent=2, default=str)

    print(f"\n{GREEN('✓')} Results saved to {BOLD(OUTPUT_FILE)}\n")
    sys.exit(0 if failed == 0 and errors == 0 else 1)


if __name__ == "__main__":
    main()
