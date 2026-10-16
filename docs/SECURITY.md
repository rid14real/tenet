# Security model

## Tenant isolation

Each organisation is a tenant, whether it is an in-house team running its own programme or an advisory firm running clients' programmes. Entities, records and audit entries carry `org_id`, and PostgreSQL row-level security policies (forced, so the table owner is also bound) only show rows whose `org_id` matches `app.org_id`. The API sets `app.org_id` inside each request's transaction from the authenticated session. A bug in a query cannot leak another organisation's data, because the database refuses the rows.

The app must connect as a role created with `NOSUPERUSER NOBYPASSRLS`. If it is started in production with a role that bypasses row-level security, it refuses to start.

## Authentication

- Passwords are hashed with scrypt (N=16384, r=8, p=1) and a per-user salt.
- Session tokens are 32 random bytes, sent in an httpOnly, SameSite=Lax cookie (marked Secure in production). Only the SHA-256 of a token is stored. Sessions last 7 days.
- Failed logins are limited to 8 per 15 minutes for each IP and email pair.
- There are three roles. Admins manage users, change the organisation's mode and can delete entities. Editors can change records. Viewers can only read.
- Signing out clears every entity and record from the browser's memory before anyone else signs in.

## Audit trail

`audit_log` is append-only. A trigger rejects any update or delete, except when a whole organisation is removed with an explicit setting. Every write through the API records who made it, when, and what changed.

## Data minimisation

Tenet stores records about processing, not the personal data itself: activity descriptions, vendor names, incident facts and requester names. Do not paste customer datasets into free-text fields.

## Headers

Every response sets a Content Security Policy, `X-Frame-Options: DENY`, `nosniff` and `Referrer-Policy`. Logs redact cookies and authorization headers.

## Still to do before handling real client data

- An external penetration test.
- Backups and restore drills.
- Encryption at rest, using managed database encryption or disk encryption.
- Key rotation.
- SSO (SAML or OIDC) and multi-factor authentication.
- Data retention for the audit log.
- Incident response runbook for the platform itself.
