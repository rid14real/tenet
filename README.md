# Tenet

Privacy and AI governance platform built for Nigeria first, then the rest of Africa and global regimes. Tenet is a working name.

Licensed DPCOs and in-house DPOs use it to run each client's NDPA/GAID cycle: records of processing, vendors and transfers, DPIAs, AI systems, incidents and data subject requests. Tenet works out the client's tier and its audit-return readiness from those records and produces a filing pack for the DPCO to review.

## What it does

| Area | What you get |
|---|---|
| Clients | One workspace per client. A DPCO sees every client's tier, return readiness, next obligation and open incidents on one page. |
| Classification | GAID tier (UHL / EHL / OHL) from sector and six-month data-subject volume. The higher of the two applies. |
| Audit return | 14 requirements checked against the records rather than ticked by hand: registration, DPO, records of processing, retention, DPIAs, AI parameters (GAID Arts. 43–44), processor agreements, transfers, security, breach register, requests and training. |
| Filing pack | Markdown preparation pack with a readiness summary, gaps and registers, for the DPCO to review and file through the NDPC portal. |
| Processing | Record of processing with lawful basis (NDPA s.25). Shows live whether an activity triggers a DPIA. |
| Vendors | Processor agreements (NDPA s.29, GAID Art. 34) and the transfer basis for any data leaving Nigeria (NDPA ss.41–43). |
| Assessments | DPIA screening questions with inherent-risk scoring, linked to the activity or AI system they cover. |
| AI systems | Register of AI systems, including tools found by discovery. Each system is classified against NDPA s.37, GAID Arts. 28 and 43–44, the CBN AML circular, Kenya DPA s.35, POPIA s.71, the EU AI Act, ISO/IEC 42001 and the NIST AI RMF. |
| Incidents | Breach register with a live clock for each regulator (NDPC 72h, ODPC 72h, Information Regulator, and others). Records each notification or each decision that notification is not required. |
| Requests | Access, erasure, objection, automated-decision review and complaints, with deadlines set by the requester's jurisdiction. |
| Control map | One evidence record traced across NDPA/GAID, POPIA, Kenya DPA, ISO 27701, ISO 42001 and the EU AI Act. |
| Rules and sources | Every threshold, window and fee, with its source and how far it has been checked. |
| Activity log | Who changed what and when. The server keeps it append-only. |

### Every rule shows where it comes from

Every rule in `packages/core/src/rules.ts` and `ai.ts` carries a provenance tag, and the app displays it beside the rule:

- **primary**: read from the statute or standard itself.
- **secondary**: taken from practitioner or press summaries. The GAID tier thresholds are in this category.
- **unverified**: a placeholder until counsel checks it. Some request-response periods are in this category.

Before any client relies on a secondary or unverified rule, check it against the primary text and update the rule pack.

## Architecture

```
packages/core   Domain model, rule packs, tier engine, readiness, AI classification, clocks,
                control map, filing pack, validation. Pure TypeScript, no I/O. Unit-tested.
apps/web        React app. One UI with three storage modes:
                  api       talks to apps/api (production)
                  artifact  claude.ai artifact database (the hosted browser version)
                  local     browser storage only (quick demos, offline development)
apps/api        Fastify + PostgreSQL. Sessions, roles, tenant isolation by row-level
                security, append-only audit log, the same validation and rules as the web app.
```

The web app and the API both import their rules and validation from `@tenet/core`, so the two cannot drift apart.

## Run it

### With Docker (recommended)

```bash
cp .env.example .env        # set real passwords
docker compose up --build
```

Open http://localhost:4000 and create your organisation. Sign-up closes once the first organisation exists (`ALLOW_SIGNUP=first-run`). After that, admins add colleagues through `POST /api/users`, with the role admin, editor or viewer.

### For development

Requires Node 20 or later and PostgreSQL 14 or later.

```bash
npm install
npm run build -w @tenet/core

# Database: the app must connect as a role that cannot bypass row-level security.
psql -U postgres -c "CREATE ROLE tenet LOGIN PASSWORD 'tenet' NOSUPERUSER NOBYPASSRLS"
psql -U postgres -c "CREATE DATABASE tenet_dev OWNER tenet"

export DATABASE_URL=postgres://tenet:tenet@localhost:5432/tenet_dev
npm run seed -w @tenet/api        # demo@tenet.local / demo-password-123 with a sample client
npm run dev -w @tenet/api         # API on :4000
npm run dev -w @tenet/web         # web on :5173, proxies /api
```

To run the web app with no server, put `VITE_STORE=local` in `apps/web/.env.local`.

### Tests

```bash
npm run test -w @tenet/core
TEST_DATABASE_URL=postgres://tenet:tenet@localhost:5432/tenet_test npm run test -w @tenet/api
```

The API tests run against a real PostgreSQL. They prove that one organisation cannot read, overwrite or delete another's clients, even knowing their ids. They also prove that the audit log cannot be edited, viewers cannot write, and failed logins are rate-limited.

### Rebuild the browser version

```bash
npm run build:artifact -w @tenet/web
node scripts/artifact-page.mjs apps/web/dist-artifact/index.html tenet-app.html
```

Republish `tenet-app.html` to the same artifact. Its saved data is kept across republishes.

## API

All routes are under `/api` and need a session cookie, apart from health and the auth routes.

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/signup`, `/auth/login`, `/auth/logout` | scrypt password hashes; session tokens are stored hashed; login is rate-limited |
| GET | `/me`, `/users` · POST `/users` | creating users is admin only |
| GET | `/workspaces` · PUT/DELETE `/workspaces/:id` | deleting is admin only |
| GET | `/workspaces/:id/dataset` | everything for one client |
| PUT/DELETE | `/workspaces/:id/:collection/:recordId` | collections: activities, vendors, assessments, incidents, requests, aiSystems |
| GET | `/workspaces/:id/readiness` | audit-return readiness as JSON, for integrations |
| GET | `/workspaces/:id/filing-pack` | Markdown; writes an audit entry |
| GET | `/workspaces/:id/audit` | activity log |
| POST | `/workspaces/import` | import a dataset (used for the sample client) |

## Status

Version 0.1. The core workflow works end to end, but the following are not built yet:

- Data discovery connectors
- Consent management
- A WhatsApp or web intake form for data subjects
- An admin screen for users (there is an API for it)
- Email notifications
- PDF or Word export of the filing pack
- POPIA and Kenya content beyond the rules listed
- SSO

`docs/ROADMAP.md` lists the order these come in.

Tenet produces preparation material for qualified review. It does not file with the NDPC and does not give legal advice.

Copyright © 2026. All rights reserved.
