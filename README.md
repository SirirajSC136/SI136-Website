# SI136 Website

Next.js 16 App Router project for SI136 academic content, events, and admin-managed materials.

## Stack
- Next.js 16 + React 19 + TypeScript
- Firebase Auth (client + admin SDK)
- Firestore (primary runtime storage)
- Canvas + Google Calendar integrations
- Tailwind CSS

## Run Locally
1. Install dependencies:
```bash
npm install
```
2. Copy environment:
```bash
cp .env.example .env.local
```
3. Fill `.env.local` values.
4. Run dev:
```bash
npm run dev
```

## Key Scripts
- `npm run dev`
- `npm run lint`
- `npm run build`
- `npm run start`
- `npm run firebase:seed-initial-admin`
- `npm run firebase:set-admin` (legacy custom-claim helper; no longer used for app authorization)
- `npm run migrate:mongo:firestore`

## Environment Variables
See `.env.example`.

Core:
- Canvas: `CANVAS_URL`, `CANVAS_API`
- Calendar: `GOOGLE_API_KEY`, `GOOGLE_CALENDAR_ID`
- Firebase client: `NEXT_PUBLIC_FIREBASE_*`
- Firebase admin: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`

Feature/cost flags:
- `USE_SUBJECT_PROJECTIONS`
- `USE_SUBJECT_CACHE`
- `USE_CONTEXT_MUTATION_PATHS`
- `FIRESTORE_COST_LOGGING`

## Authentication and Authorization

### Login
1. Client signs in with Google.
2. Client posts ID token to `POST /api/auth/session`.
3. Server verifies ID token and enforces student-domain allowlist:
   - `@student.mahidol.edu`
   - `@student.mahidol.ac.th`
4. Server creates `si_session` httpOnly session cookie.

### Admin Authorization (Firestore-backed)
Admin authority comes from Firestore collection `admin_users`, not Firebase custom claims.

Document:
- Collection: `admin_users`
- Doc ID: normalized email (lowercase, trimmed)
- Fields: `email`, `emailNormalized`, `name?`, `active`, timestamps, optional metadata

Auth resolution:
- Session cookie is verified.
- User email is looked up in `admin_users`.
- `session.isAdmin = true` only when record exists and `active === true`.

### Seed initial admin
Run:
```bash
npm run firebase:seed-initial-admin
```
This idempotently upserts:
- `purin.den@student.mahidol.edu` as active admin.

## Admin Area
- `/admin` -> admin console landing
- `/admin/customize` -> existing content customize flow
- `/admin/admins` -> add/remove admins
- `/admin/logs` -> audit log viewer for admin write attempts

All `/admin/*` pages are guarded by `app/admin/layout.tsx`.  
All `/api/admin/*` routes enforce server-side admin authorization.

## Admin Audit Logs

Admin write attempts are stored in Firestore collection `admin_audit_logs`.

Coverage:
- All `POST`, `PUT`, `DELETE` handlers under `/api/admin/*`
- Includes both success and failure (validation/auth/business/server errors)

Stored fields include:
- actor info (uid/email/name when available)
- action/resource metadata
- method/path/http status/duration
- sanitized request payload and query snapshot
- `createdAt` and `expiresAt` for retention

Retention default:
- `expiresAt = createdAt + 180 days` (configure Firestore TTL policy on `expiresAt`)

## Project Structure
- `app/` pages + API transport layer
- `components/` shared UI
- `lib/server/domains/*` backend domain modules
- `lib/server/domains/admins/*` Firestore admin management
- `scripts/` operational scripts (seed/migration/helpers)
