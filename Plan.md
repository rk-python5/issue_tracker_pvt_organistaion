# Issue Tracker MVP — Implementation Plan

## TL;DR
Build a role-based issue tracker (Employee/Supervisor/Admin) with a Node.js + TypeScript + Express backend, PostgreSQL database, JWT auth, and integrate with the Loveable AI-generated React frontend (already cloned into `frontend/`). This is a freelance project to be deployed and handed off to a client.

### Frontend Repo
- **Source**: https://github.com/rk-python5/bug-bloom-board.git → cloned to `frontend/`
- **Stack**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + Framer Motion
- **Current state**: 100% mock data via React Context (`src/lib/store.tsx` + `src/lib/mock-data.ts`). No login page, no API calls, no JWT handling — just a role-switcher dropdown in the header.

---

## Phase 1: Project Setup & Database

### Step 1 — Initialize project structure
- Create a monorepo-style layout: `backend/` and `frontend/` directories
- Init `backend/` with `npm init`, install core deps: `express`, `pg`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`
- Dev deps: `typescript`, `ts-node`, `nodemon`, `@types/*`
- Configure `tsconfig.json` for strict mode, ES2020 target

### Step 2 — Database setup with Docker Compose *(parallel with Step 1)*
- Create `docker-compose.yml` at project root with:
  - PostgreSQL 16 service (port 5432)
  - Volume for data persistence
  - Environment variables for user/password/db name
- Create `.env` and `.env.example` files with DB connection string, JWT secret, port

### Step 3 — Database schema & migrations *(depends on Step 2)*
- Create SQL migration file(s) in `backend/src/db/migrations/`
- Tables to create (in order due to FK dependencies):
  1. `users` — id (SERIAL PK), username (UNIQUE), password_hash, role (ENUM: employee/supervisor/admin), created_at
  2. `branches` — id (SERIAL PK), name, is_active (DEFAULT TRUE), created_at
  3. `issue_types` — id (SERIAL PK), name, is_active (DEFAULT TRUE), created_at
  4. `tickets` — id (SERIAL PK), employee_id (FK→users), branch_id (FK→branches), issue_type_id (FK→issue_types), description (TEXT), status (ENUM: open/closed), created_at
  5. `resolutions` — id (SERIAL PK), ticket_id (FK→tickets, UNIQUE), supervisor_id (FK→users), remarks (TEXT NOT NULL), resolved_at (TIMESTAMP)
- Create DB connection pool module (`backend/src/db/pool.ts`)
- Create migration runner script

### Step 4 — Seed script *(depends on Step 3)*
- Create `backend/src/db/seed.ts`
- Seed data (Indian names & context for client demo):
  - **Users** (5):
    - `admin` / admin123 (role: admin)
    - `rahul.sharma` / super123 (role: supervisor)
    - `priya.verma` / super123 (role: supervisor)
    - `ankit.patel` / emp123 (role: employee)
    - `neha.gupta` / emp123 (role: employee)
  - **Branches** (6): Mumbai HQ, Delhi Office, Bangalore Branch, Hyderabad Center (inactive), Pune Plaza, Chennai Hub
  - **Issue Types** (7): Hardware Malfunction, Software Bug, Network Issue, Access & Permissions, Facilities & Maintenance, HR & Payroll (inactive), Security Incident
  - **Tickets** (10): Mix of open/closed across employees and branches, with Indian employee names and realistic descriptions

---

## Phase 2: Backend API

### Step 5 — Express app scaffolding *(depends on Step 1)*
- `backend/src/index.ts` — Express app with CORS, JSON parsing, error handler
- `backend/src/routes/` — Route modules
- `backend/src/middleware/` — Auth middleware
- `backend/src/controllers/` — Route handlers
- `backend/src/types/` — Shared TypeScript types/interfaces

### Step 6 — Authentication module *(depends on Step 5)*
- `POST /api/auth/login` — Validate credentials, return JWT with {id, role, username}
- Middleware: `authenticateToken` — verify JWT, attach user to req
- Middleware: `authorizeRoles(...roles)` — check req.user.role against allowed roles
- Password hashing with bcryptjs (salt rounds: 10)
- JWT expiry: 8h (configurable via env)

### Step 7 — Tickets API *(depends on Step 6)*
- `POST /api/tickets` — Employee only. Creates ticket with employee_id from JWT
- `GET /api/tickets` — Employee sees own tickets only (filtered by JWT user id); Supervisor sees all (with optional `?branch_id=` query param filter)
- `POST /api/tickets/:id/resolve` — Supervisor only. Sets status=closed, creates resolution record with supervisor_id and mandatory remarks
- Input validation on all endpoints (non-empty description, valid branch_id/issue_type_id, non-empty remarks)

### Step 8 — Branches & Issue Types API *(parallel with Step 7)*
- `GET /api/branches` — All authenticated users. Returns active branches (or all for admin)
- `POST /api/branches` — Admin only. Creates new branch
- `PATCH /api/branches/:id` — Admin only. Toggles is_active status
- `GET /api/issue-types` — All authenticated users. Returns active issue types (or all for admin)
- `POST /api/issue-types` — Admin only. Creates new issue type
- `PATCH /api/issue-types/:id` — Admin only. Toggles is_active status

---

## Phase 3: Frontend Integration

### Frontend Audit — Files to Modify

| File | Current | Target |
|------|---------|--------|
| `src/lib/store.tsx` | In-memory state from mock data | Remove — replaced by API service + react-query |
| `src/lib/mock-data.ts` | Hardcoded branches, issues, tickets | Remove — replaced by API responses |
| `src/components/AppHeader.tsx` | Role switcher dropdown (any role, no auth) | Show logged-in user info from JWT, logout button |
| `src/App.tsx` | No auth, all routes open | Add login page, route guards based on JWT role |
| All page components | Call `useStore()` for mock data | Call react-query hooks that hit real API endpoints |

### Frontend Pages → API Endpoint Mapping

| Page | Role | Backend Endpoint |
|------|------|------------------|
| **Login (NEW)** | Public | `POST /api/auth/login` |
| `NewTicket.tsx` | Employee | `POST /api/tickets` |
| `MyOpenTickets.tsx` | Employee | `GET /api/tickets?status=open` |
| `MyClosedTickets.tsx` | Employee | `GET /api/tickets?status=closed` |
| `ActiveQueue.tsx` | Supervisor | `GET /api/tickets?status=open` + `POST /api/tickets/:id/resolve` |
| `ResolvedTickets.tsx` | Supervisor | `GET /api/tickets?status=closed` |
| `ManageBranches.tsx` | Admin | `GET/POST/PATCH /api/branches` |
| `ManageIssueTypes.tsx` | Admin | `GET/POST/PATCH /api/issue-types` |

### Step 9 — Create API service layer & auth context
- Create `frontend/src/lib/api.ts` — fetch wrapper with base URL config + auto-attach `Authorization: Bearer <token>` header
- Create `frontend/src/lib/auth.tsx` — AuthContext providing: `user` (decoded JWT payload), `login()`, `logout()`, `isAuthenticated`
- JWT stored in `localStorage`, decoded to get `{id, role, username}`
- On app load: check for existing token, validate expiry, auto-redirect

### Step 10 — Create Login page & route protection
- Create `frontend/src/pages/Login.tsx` — username/password form calling `POST /api/auth/login`
- On success: store JWT, decode role, redirect to role-specific dashboard:
  - Employee → `/new-ticket`
  - Supervisor → `/active-queue`
  - Admin → `/manage-branches`
- Create `ProtectedRoute` wrapper component — checks auth + allowed roles, redirects to `/login` or correct dashboard
- Update `App.tsx` routes to wrap pages in `ProtectedRoute`

### Step 11 — Replace mock store with API calls
- Replace `useStore()` calls in each page with react-query hooks:
  - `useQuery(['tickets', filters])` → `GET /api/tickets`
  - `useMutation` → `POST /api/tickets`, `POST /api/tickets/:id/resolve`
  - `useQuery(['branches'])` → `GET /api/branches`
  - `useQuery(['issueTypes'])` → `GET /api/issue-types`
  - `useMutation` → `POST /api/branches`, `PATCH /api/branches/:id`, etc.
- Remove `src/lib/store.tsx` and `src/lib/mock-data.ts`
- Update `AppHeader.tsx`: remove role switcher, show username from auth context, add logout button
- Configure CORS on backend to allow frontend origin (`http://localhost:5173`)

---

## Phase 4: Polish & Deployment

### Step 12 — Error handling & edge cases
- Global error handler middleware with consistent JSON error responses
- Handle: duplicate usernames, inactive branch/issue_type selection, resolving already-closed tickets
- SQL injection prevention via parameterized queries (pg library does this by default)
- Frontend: toast notifications for API errors, loading states on all data fetches

### Step 13 — Deployment preparation
- Add `Dockerfile` for backend
- Update `docker-compose.yml` to include backend service + frontend build
- Add production build script for frontend
- Create `README.md` with setup instructions for client
- Include `.env.example` with all required variables documented
- Add npm scripts: `dev`, `build`, `start`, `migrate`, `seed`

---

## Project Structure

```
Issue tracker/
├── docker-compose.yml
├── .env.example
├── README.md
├── Plan.md
├── overview.txt
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── src/
│       ├── index.ts                    — Express app entry point
│       ├── db/
│       │   ├── pool.ts                 — PG connection pool
│       │   ├── migrations/
│       │   │   └── 001_init.sql        — Full schema creation
│       │   └── seed.ts                 — Seed data script
│       ├── middleware/
│       │   ├── auth.ts                 — authenticateToken + authorizeRoles
│       │   └── errorHandler.ts         — Global error handler
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── ticket.routes.ts
│       │   ├── branch.routes.ts
│       │   └── issueType.routes.ts
│       ├── controllers/
│       │   ├── auth.controller.ts
│       │   ├── ticket.controller.ts
│       │   ├── branch.controller.ts
│       │   └── issueType.controller.ts
│       └── types/
│           └── index.ts                — Shared interfaces & types
└── frontend/                           — Loveable AI (React + Vite + shadcn/ui)
    ├── package.json
    ├── vite.config.ts
    └── src/
        ├── App.tsx                     — Routes + ProtectedRoute guards
        ├── lib/
        │   ├── api.ts                  — NEW: fetch wrapper + auth headers
        │   └── auth.tsx                — NEW: AuthContext (login/logout/user)
        ├── pages/
        │   ├── Login.tsx               — NEW: login form
        │   ├── NewTicket.tsx            — Employee: create ticket
        │   ├── MyOpenTickets.tsx        — Employee: open tickets list
        │   ├── MyClosedTickets.tsx      — Employee: closed tickets list
        │   ├── ActiveQueue.tsx          — Supervisor: open ticket queue
        │   ├── ResolvedTickets.tsx      — Supervisor: resolved tickets
        │   ├── ManageBranches.tsx       — Admin: branch CRUD
        │   └── ManageIssueTypes.tsx     — Admin: issue type CRUD
        └── components/
            ├── AppHeader.tsx            — User info + logout (was role switcher)
            ├── AppSidebar.tsx           — Role-based nav
            ├── DashboardLayout.tsx
            └── ui/                     — shadcn/ui components
```

---

## Verification Checklist

1. `docker-compose up` → PostgreSQL starts, backend connects
2. Run migration → all 5 tables created (verify with `\dt` in psql)
3. Run seed → users, branches, issue types, sample tickets inserted
4. **Auth**: `POST /api/auth/login` with each role → returns valid JWT
5. **RBAC**: Employee hits `/api/tickets` → sees only own; Supervisor → sees all; cross-role → 403
6. **Ticket lifecycle**: Employee creates ticket → Supervisor resolves with remarks → status=closed, resolution exists
7. **Admin toggle**: deactivate branch → no longer in employee dropdown
8. **Frontend login**: correct dashboard per role, logout works
9. **Full E2E**: login → create ticket → view in supervisor queue → resolve → appears in closed list

---

## Key Decisions

- **No ORM** — Raw `pg` with parameterized queries (simple, secure, no extra layer for MVP)
- **Database** — Docker Compose for dev. For client production: recommend managed PostgreSQL (Railway, Render, Supabase, or client's own server)
- **JWT in localStorage** — Simple for MVP, upgradeable to httpOnly cookies later
- **react-query** — Already a dependency in the Loveable frontend, perfect for API state management
- **No soft-delete on users** — Not in spec, excluded
- **Seed data matches frontend mocks** — Ensures seamless transition from mock to live data
