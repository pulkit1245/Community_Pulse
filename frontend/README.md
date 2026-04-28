# AI Social OS — Frontend
> Google Solution Challenge 2026 · AI-powered resource allocation & volunteer coordination

## Quick Start
```bash
npm install
cp .env.example .env.local   # set NEXTAUTH_SECRET + NEXT_PUBLIC_API_URL
npm run dev                  # http://localhost:3000
```

## Module Map
| Route | Components |
|---|---|
| `/login` | LoginPage, NextAuth Credentials |
| `/dashboard` | StatsBar, ZoneHeatmap, NeedsQueue, MatchButton, GapAlertFeed |
| `/needs` | NeedsTable, NeedDetailDrawer, IngestModal, NeedFiltersBar |
| `/volunteers` | VolunteersTable, VolunteerFormModal, VolunteerDetailDrawer |
| `/match` | MatchEnginePanel, AssignmentCard, MatchScoreBreakdown |
| `/tasks` | KanbanBoard × 4 columns, KanbanCard, TaskDetailDrawer |
| `/analytics` | LineChart, BarChart, AreaChart, PieChart (Recharts) |

## Data Flow
```
Login → POST /auth/login → JWT in NextAuth session
→ SessionSync hydrates authStore
→ Axios client attaches Bearer on every request
→ 401 → signOut() + redirect /login

Dashboard: polls stats/zones/needs every 10s
WebSocket: ws://host/ws/alerts → uiStore.alertFeed → TopBar bell + GapAlertFeed
Tasks: optimistic status updates with automatic rollback on failure
Match: POST /match → MatchResult → assignmentCards + unmatched section
```

## Env Variables
| Var | Description |
|---|---|
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` |
| `NEXT_PUBLIC_API_URL` | `http://localhost:8000` |