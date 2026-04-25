# API Endpoints Reference

## Authentication

### Login
```
POST /api/v1/auth/login
Content-Type: application/json

Request:
{
  "phone": "+919800000001",
  "password": "password123"
}

Response (200):
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 3600,
  "role": "coordinator"
}
```

## Needs Management

### List Needs (Paginated & Filtered)
```
GET /api/v1/needs?zone_id=UUID&status=open&urgency=critical&category=medical&page=1&page_size=20

Headers:
Authorization: Bearer TOKEN

Response (200):
{
  "items": [
    {
      "id": "uuid",
      "title": "Medical help needed",
      "description": "...",
      "category": "medical",
      "urgency": "critical",
      "status": "open",
      "zone_id": "uuid",
      "requester_name": "John Doe",
      "requester_phone": "+919876543210",
      "skills_required": ["medical", "first_aid"],
      "people_count": 5,
      "source": "whatsapp",
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "page_size": 20
}
```

### Create Need
```
POST /api/v1/needs
Content-Type: application/json
Authorization: Bearer TOKEN

Request:
{
  "title": "Food supplies needed",
  "description": "50 families need food",
  "category": "food_water",
  "urgency": "high",
  "zone_id": "uuid",
  "requester_name": "Village Head",
  "requester_phone": "+919876543210",
  "skills_required": ["logistics", "driving"],
  "people_count": 250,
  "source": "api"
}

Response (201):
{
  "id": "uuid",
  "title": "Food supplies needed",
  "description": "50 families need food",
  "category": "food_water",
  "urgency": "high",
  "status": "open",
  "zone_id": "uuid",
  "requester_name": "Village Head",
  "requester_phone": "+919876543210",
  "skills_required": ["logistics", "driving"],
  "people_count": 250,
  "source": "api",
  "created_at": "2024-01-01T10:00:00Z",
  "updated_at": "2024-01-01T10:00:00Z"
}

Response (409): Duplicate need detected
```

### Get Need Details
```
GET /api/v1/needs/{need_id}
Authorization: Bearer TOKEN

Response (200): [Need object]
Response (404): Need not found
```

### Update Need
```
PATCH /api/v1/needs/{need_id}
Content-Type: application/json
Authorization: Bearer TOKEN

Request:
{
  "status": "in_progress",
  "urgency": "critical"
}

Response (200): [Updated need object]
Response (404): Need not found
```

### Delete Need (Cancel)
```
DELETE /api/v1/needs/{need_id}
Authorization: Bearer TOKEN

Response (204): No content
Response (404): Need not found
```

## Volunteer Management

### List Volunteers (with filters)
```
GET /api/v1/volunteers?zone_id=UUID&available_only=true&skill=medical&page=1&page_size=20
Authorization: Bearer TOKEN

Response (200):
{
  "items": [
    {
      "id": "uuid",
      "name": "Dr. Arjun",
      "phone": "+919800000001",
      "email": "arjun@relief.org",
      "skills": ["medical", "first_aid"],
      "zone_id": "uuid",
      "is_available": true,
      "is_active": true,
      "bio": "Senior doctor with 10 years experience",
      "languages": ["hindi", "english"],
      "role": "coordinator",
      "total_assignments": 5,
      "completed_assignments": 4,
      "created_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 30,
  "page": 1,
  "page_size": 20
}
```

### Create Volunteer
```
POST /api/v1/volunteers
Content-Type: application/json
Authorization: Bearer TOKEN

Request:
{
  "name": "John Volunteer",
  "phone": "+919876543210",
  "email": "john@relief.org",
  "skills": ["first_aid", "communication"],
  "zone_id": "uuid",
  "bio": "Experienced volunteer",
  "languages": ["english", "hindi"],
  "password": "secure_password"
}

Response (201): [Volunteer object]
```

### Get Volunteer
```
GET /api/v1/volunteers/{volunteer_id}
Authorization: Bearer TOKEN

Response (200): [Volunteer object]
Response (404): Volunteer not found
```

### Update Volunteer Profile
```
PATCH /api/v1/volunteers/{volunteer_id}
Content-Type: application/json
Authorization: Bearer TOKEN

Request:
{
  "skills": ["first_aid", "medical"],
  "is_available": false,
  "bio": "Updated bio"
}

Response (200): [Updated volunteer object]
Response (403): Cannot update other volunteer's profile (if VOLUNTEER role)
Response (404): Volunteer not found
```

### Delete Volunteer (Deactivate)
```
DELETE /api/v1/volunteers/{volunteer_id}
Authorization: Bearer TOKEN (ADMIN/COORDINATOR only)

Response (204): No content
Response (404): Volunteer not found
```

## Matching & Assignment

### Run Matching Algorithm
```
POST /api/v1/match
Content-Type: application/json
Authorization: Bearer TOKEN (COORDINATOR+ only)

Request:
{
  "zone_id": "uuid",           // Optional - filter to zone
  "need_ids": ["uuid", "uuid"], // Optional - match specific needs
  "dry_run": false              // Optional - preview without saving
}

Response (200):
{
  "assignments": [
    {
      "need_id": "uuid",
      "volunteer_id": "uuid",
      "match_score": 87.5,
      "assignment_id": "uuid"
    }
  ],
  "total_matched": 15,
  "unmatched_needs": ["uuid", "uuid"],
  "dry_run": false
}
```

### Decline Assignment & Rematch
```
POST /api/v1/match/decline/{assignment_id}?decline_reason=Too%20far
Authorization: Bearer TOKEN (WRITE permission)

Response (200):
{
  "status": "declined_and_rematched",
  "rematch": {
    "assignments": [...],
    "total_matched": 1,
    "unmatched_needs": [],
    "dry_run": false
  }
}

Response (404): Assignment not found
```

## Task Management

### List Assignments
```
GET /api/v1/tasks
Authorization: Bearer TOKEN

Response (200):
[
  {
    "id": "uuid",
    "need_id": "uuid",
    "volunteer_id": "uuid",
    "status": "notified",
    "match_score": 87.5,
    "notes": null,
    "decline_reason": null,
    "notification_sent_at": "2024-01-01T10:05:00Z",
    "accepted_at": null,
    "completed_at": null,
    "created_at": "2024-01-01T10:00:00Z",
    "updated_at": "2024-01-01T10:05:00Z"
  }
]
```

### Get Assignment Details
```
GET /api/v1/tasks/{assignment_id}
Authorization: Bearer TOKEN

Response (200): [Assignment object]
Response (404): Assignment not found
```

### Update Assignment Status
```
PATCH /api/v1/tasks/{assignment_id}/status
Content-Type: application/json
Authorization: Bearer TOKEN

Request:
{
  "status": "accepted",
  "notes": "Volunteer is on the way",
  "decline_reason": null
}

Response (200): [Updated assignment object]
Response (404): Assignment not found

Status values: pending | notified | accepted | declined | in_progress | completed | rematched
```

### Dispatch Assignment (Send Notification)
```
POST /api/v1/tasks/{assignment_id}/dispatch
Authorization: Bearer TOKEN (DISPATCH permission)

Response (200):
{
  "status": "dispatched",
  "assignment_id": "uuid"
}

Response (404): Assignment not found or notification failed
```

## Ingestion (Webhooks)

### REST API Ingestion
```
POST /api/v1/ingest
Content-Type: application/json

Request:
{
  "title": "Help needed",
  "description": "Family stranded",
  "category": "rescue",
  "urgency": "critical",
  "zone_id": "uuid",
  "requester_name": "Person A",
  "requester_phone": "+919876543210",
  "skills_required": ["rescue"],
  "people_count": 5,
  "source": "api"
}

Response (201): [Need object]
Response (409): Duplicate need detected
```

### WhatsApp Webhook (Incoming)
```
POST /api/v1/ingest/whatsapp
Content-Type: application/json
X-Hub-Signature-256: sha256=SIGNATURE

[WhatsApp Business API payload]

Response (200):
{
  "status": "ok",
  "ingested": 1
}
```

### WhatsApp Verification Challenge
```
GET /api/v1/ingest/whatsapp?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE

Response (200): CHALLENGE value
Response (403): Verification failed
```

### SMS Webhook (Twilio)
```
POST /api/v1/ingest/sms
Content-Type: application/x-www-form-urlencoded
X-Twilio-Signature: SIGNATURE

From=+919876543210&Body=Need%20help%20with%20medical&...

Response (200):
{
  "status": "ok",
  "duplicate": false,
  "need_id": "uuid"
}
```

## Health Checks

### Application Health
```
GET /health

Response (200):
{
  "status": "healthy",
  "app": "Disaster Relief Backend",
  "environment": "development",
  "version": "1.0.0"
}
```

### Readiness Check
```
GET /ready

Response (200):
{
  "ready": true,
  "database": "connected"
}
```

## Error Responses

### 401 Unauthorized
```
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```
{
  "detail": "Permission 'match' denied for role 'volunteer'"
}
```

### 404 Not Found
```
{
  "detail": "Need not found"
}
```

### 409 Conflict
```
{
  "detail": "Duplicate need detected"
}
```

### 429 Rate Limit Exceeded
```
{
  "detail": "Rate limit exceeded: 30 per 1 minute. Please slow down.",
  "retry_after": "60s"
}
```

### 500 Internal Server Error
```
{
  "detail": "Internal server error"
}
```

## Authentication

All protected endpoints require:
```
Authorization: Bearer <JWT_TOKEN>
```

Obtain token from `/api/v1/auth/login`

## Rate Limits

- **General**: 60 requests/minute
- **Ingestion**: 30 requests/minute
- **Matching**: 10 requests/minute

## Pagination

Default: page=1, page_size=20
Max page_size: 100

## Filtering

Supported query parameters:
- `zone_id`: UUID - Filter by zone
- `status`: string - Filter by status
- `urgency`: string - Filter by urgency
- `category`: string - Filter by category
- `available_only`: boolean - Only available volunteers
- `skill`: string - Filter volunteers by skill
- `page`: int (≥1) - Page number
- `page_size`: int (1-100) - Items per page

---

**API Version**: 1.0.0
**Base URL**: http://localhost:8000/api/v1
**API Documentation**: http://localhost:8000/api/docs
