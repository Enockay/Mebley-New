# Admin moderation — implementation reference

Internal moderation dashboard and audit trail. **Production behavior is defined below** (role-based admin; no email allowlist env).

---

## What we stand behind

### Auth model

- **Database:** `user_roles` with `role = 'admin'` for authorized operators (`src/lib/admin-auth.ts`).
- **APIs:** Handlers call `getAdminUserFromRequest()` → authenticated session + `isAdminUser(user.id)` before returning data or applying writes.
- **Edge:** Next proxy (`src/proxy.ts`) enforces the **same rule** before route handlers run:
  - **`/api/admin/*`** — session required; non-admin → **403** `{ code: 'FORBIDDEN' }`.
  - **`/admin/*` pages** — session required; non-admin → redirect **`/browse`**.
- **UI:** `GET /api/auth/me` exposes **`isAdmin`** (same `isAdminUser` check). **`AuthContext`** stores it; **`TopHeader`** shows the Admin control only when **`isAdmin`** is true.

### Flow

1. **List cases** — `GET /api/admin/moderation?status=<open|in_review|resolved|dismissed>` → UI `/admin`.
2. **Decide** — `POST /api/admin/moderation` with `caseId`, `decision` (`ban` | `dismiss`), optional `notes`.
3. **Audit row** — On success, **`INSERT INTO admin_actions`** (same transaction as case updates when applicable). Metadata includes `caseId`, `reportId`, `decision`, `notes`.
4. **Review audit** — `GET /api/admin/actions` (pagination + optional `action` filter) → UI **`/admin/audit`**.

### Discoverability

- Logged-in admins see **Admin** in the main **`TopHeader`** (Shield + label); navigates to **`/admin`**.

### Schema / migrations

- **`admin_actions`** — `migrations/20260429_012_admin_actions.sql`.
- **Apply on every environment:** `npm run migrate:sql -- --all`  
  Wired as **`predev`** and **`prestart`** in `package.json` so local **`npm run dev`** / prod **`npm start`** apply pending migrations when `DATABASE_URL` is set.

---

## Backend contracts

### `GET /api/admin/moderation?status=open`

Returns `cases[]`: `case_id`, `status`, `reason`, `details`, `report_id`, `reported_id`, `reporter_id`, `created_at`.

### `POST /api/admin/moderation`

Body: `caseId`, `decision` (`ban` | `dismiss`), optional `notes`. Response: `{ ok: true }` on success.

### `GET /api/admin/actions`

Query: `limit`, `offset`, optional `action` (`moderation_ban` | `moderation_dismiss`).  
Returns: `{ items, total, limit, offset }` with actor email, target profile join, `metadata`, `created_at`.

---

## Key files

| Area | Location |
|------|-----------|
| Admin role checks | `src/lib/admin-auth.ts` |
| Proxy (403 /admin API, redirect /admin pages) | `src/proxy.ts` |
| Moderation API | `src/app/api/admin/moderation/route.ts` |
| Audit API | `src/app/api/admin/actions/route.ts` |
| Session `isAdmin` | `src/app/api/auth/me/route.ts`, `src/contexts/AuthContext.tsx` |
| Moderation UI | `src/app/admin/page.tsx`, `src/components/Admin/*` |
| Audit UI | `src/app/admin/audit/page.tsx`, `src/components/Admin/AdminAuditLog.tsx` |
| Shell / nav between moderation & audit | `src/components/Admin/AdminControlShell.tsx` |
| Clients | `src/lib/admin-moderation.ts`, `src/lib/admin-audit.ts` |

---

## Grant admin access

No `ADMIN_EMAILS` env is consulted at runtime. Grant the role in Postgres:

```bash
npm run grant:admin -- --email you@example.com
```

---

## Rollout checklist

- [ ] **`DATABASE_URL`** points at the correct database for each environment.
- [ ] Run migrations (`npm run migrate:sql -- --all`) — **required** so `admin_actions` exists (audit API and inserts).
- [ ] Grant **`admin`** role for operator accounts (`grant:admin`).
- [ ] Smoke: sign in as admin → `/admin` loads cases; **`/admin/audit`** loads (may be empty).
- [ ] Smoke: non-admin → `/admin` redirects to **`/browse`**; **`/api/admin/*`** returns **403**.

---

## Optional follow-ups

- Automated tests for admin-only proxy + moderation POST side effects.
- Ban confirmation modal / stronger UX hardening (partially present in components).
- CSV export or richer audit filters.
