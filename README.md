# Tenet

Privacy and AI governance platform built for Nigeria first, then the rest of Africa and global regimes. Tenet is a working name.

## Two ways to run a programme

When an organisation signs up it chooses one of two modes, which an admin can change later:

- **In-house.** A company runs its own programme for itself and, if it has them, its group entities. With a single entity, Tenet opens straight into it.
- **Advisory.** A DPCO, DPO service or law firm runs programmes for its clients and sees them all on one page.

The data model is the same in both modes. Only the wording and the home screen change. Each organisation is a separate tenant, isolated in the database by row-level security.

## Laws in scope drive everything

Each entity selects the laws that apply to it: Nigeria (NDPA 2023 and GAID 2025), South Africa (POPIA), Kenya (DPA 2019), Ghana (DPA 2012), Egypt (PDPL), Zimbabwe (CDPA), the EU GDPR and the UK GDPR. Each law is a **jurisdiction pack** in `packages/core/src/jurisdictions.ts`. A pack defines:

- the regulator, the officer title (DPO, Information Officer, Data Protection Supervisor) and the registration fields;
- which data categories count as sensitive;
- which lawful bases exist, with their citations;
- which rights exist and their deadlines;
- the breach test and notification windows;
- when a DPIA is required and whether prior consultation applies;
- the transfer rule.

Nothing from a law that is not selected appears anywhere. If you deselect Nigeria, the NDPC registration number, tier, audit return and NDPA citations disappear from settings, forms, compliance, the action plan and the deadlines list. The values you entered are kept, and they come back if you select Nigeria again. Forms also adapt to the record itself. For example, the condition for sensitive data appears only when a selected category is sensitive under a selected law (marital status is sensitive in Kenya but not in Nigeria). Transfer fields appear only when a system or vendor sits outside a selected jurisdiction.

## Modules

| Module | What makes it more than a register |
|---|---|
| Compliance | Each requirement is evaluated per law and derived from the records, not from checkboxes. Each one shows its section, its status and which module fixes it. Reports export per law; the Nigerian report is a Compliance Audit Return preparation pack. |
| Action plan | One fix that clears gaps under several laws appears once, with every law it satisfies. Any action can become a task with an owner and a due date. |
| Data map (ROPA) | Processing activities linked to systems, vendors and data categories. Each activity page shows, per law, the lawful basis and citation, any sensitive-data condition needed, whether a DPIA is required and why, and transfer status. The flows view and the ROPA CSV have one column set per law. |
| Vendors | Risk tier from data sensitivity, location, certifications and breach history, which sets the review cycle (12, 24 or 36 months). |
| Assessments | DPIA, legitimate-interest assessment, transfer impact assessment and AI impact assessment. The processing description is pulled from the data map. Risks are suggested from a library based on the activity's facts and scored on a likelihood × severity matrix. Sign-off suggests an outcome from the residual risk and names the regulators that need prior consultation. |
| AI systems | Each system is classified against the selected laws (NDPA s.37, Kenya DPA s.35, POPIA s.71, GDPR Art. 22), GAID Arts. 43–44, the CBN AML circular and the EU AI Act, with ISO/IEC 42001 and the NIST AI RMF as references. |
| Incidents | A harm assessment drives each regulator's test (any compromise, risk, real risk or high risk). Each regulator gets its own clock, and each notification or decision not to notify is recorded. Draft notices are generated per regulator, and the incident has a timeline. |
| Requests | Shows whether the right exists under the requester's law (POPIA has no portability right, for example), the deadline and any extension, identity verification, and a checklist of systems to search. |
| Governance | Policies (including the PAIA manual for South Africa), training, and officers per law. |
| Rules and sources | Every pack, rule by rule, with provenance. |
| Activity log | Who changed what and when. The server keeps it append-only. |

### Every rule shows where it comes from

Rules carry a provenance tag, and the app displays it beside the rule:

- **primary**: read from the statute or standard itself.
- **secondary**: taken from practitioner or press summaries. The GAID tier thresholds are in this category.
- **unverified**: a placeholder until counsel checks it.

Before any client relies on a secondary or unverified rule, check it against the primary text and update the pack.

## Architecture

```
packages/core   Domain model, jurisdiction packs, field definitions with visibility rules,
                compliance engine, assessments, breach and request logic, AI classification,
                exports and migrations. Pure TypeScript, no I/O. Unit-tested.
apps/web        React app. One UI with three storage modes:
                  api       talks to apps/api (production)
                  artifact  claude.ai artifact database (the hosted browser version)
                  local     browser storage only (quick demos, offline development)
apps/api        Fastify + PostgreSQL. Sessions, roles, tenant isolation by row-level
                security, append-only audit log, the same validation and rules as the web app.
```

The web app and the API both import their rules, field definitions and validation from `@tenet/core`, so the two cannot drift apart. Records saved by v0.1 are migrated when they are loaded.

## Run it

### With Docker (recommended)

```bash
cp .env.example .env        # set real passwords
docker compose up --build
```

Open http://localhost:4000 and create your organisation. Sign-up closes once the first organisation exists (`ALLOW_SIGNUP=first-run`). Set `ALLOW_SIGNUP=true` to let further organisations sign up, which is what a hosted multi-tenant service needs. Admins add colleagues from the Team screen, with the role admin, editor or viewer.

### For development

Requires Node 20 or later and PostgreSQL 14 or later.

```bash
npm install
npm run build -w @tenet/core

# Database: the app must connect as a role that cannot bypass row-level security.
psql -U postgres -c "CREATE ROLE tenet LOGIN PASSWORD 'tenet' NOSUPERUSER NOBYPASSRLS"
psql -U postgres -c "CREATE DATABASE tenet_dev OWNER tenet"

export DATABASE_URL=postgres://tenet:tenet@localhost:5432/tenet_dev
npm run seed                      # demo@tenet.local / demo-password-123, advisory, with a sample client
npm run dev -w @tenet/api         # API on :4000
npm run dev -w @tenet/web         # web on :5173, proxies /api
```

To run the web app with no server, put `VITE_STORE=local` in `apps/web/.env.local`.

### Tests

```bash
npm run test -w @tenet/core
TEST_DATABASE_URL=postgres://tenet:tenet@localhost:5432/tenet_test npm run test -w @tenet/api
```

The core tests cover jurisdiction gating, sensitivity per law, registration, transfers, breach duties, request rights, assessments, the merged action plan, AI classification, exports and migration. The API tests run against a real PostgreSQL. They prove that one organisation cannot read, overwrite or delete another's entities, even knowing their ids. They also prove that records are validated against the entity's selected laws, that values for a deselected law are kept but not reported, that the audit log cannot be edited, that viewers cannot write, and that failed logins are rate-limited.

### Rebuild the browser version

```bash
npm run build:artifact            # writes dist-artifact.html
```

Republish `dist-artifact.html` to the same artifact. Its saved data is kept across republishes.

## API

All routes are under `/api` and need a session cookie, apart from health and the auth routes.

| Method | Path | Notes |
|---|---|---|
| POST | `/auth/signup`, `/auth/login`, `/auth/logout` | sign-up takes `mode`: `in-house` or `advisory`. scrypt password hashes; session tokens are stored hashed; login is rate-limited |
| GET | `/me` | user and organisation, including its mode |
| PATCH | `/org` | change the organisation's name or mode; admin only |
| GET · POST | `/users` | creating users is admin only |
| GET | `/workspaces` · PUT/DELETE `/workspaces/:id` | deleting is admin only; pack fields are validated only for selected laws |
| GET | `/workspaces/:id/dataset` | everything for one entity |
| PUT/DELETE | `/workspaces/:id/:collection/:recordId` | activities, systems, vendors, assessments, incidents, requests, aiSystems, policies, trainings, tasks |
| GET | `/workspaces/:id/compliance` | requirement status per selected law, as JSON |
| GET | `/workspaces/:id/report/:code` | Markdown report for one selected law; writes an audit entry |
| GET | `/workspaces/:id/audit` | activity log |
| POST | `/workspaces/import` | import a dataset (used for the sample entity) |

## Status

Version 0.2. Not built yet:

- Evidence attachments (file uploads)
- Data discovery connectors
- Consent and cookie management
- A web or WhatsApp intake form for data subjects
- Email reminders
- PDF or Word export of reports
- SSO and multi-factor authentication

`docs/ROADMAP.md` lists the order these come in.

Tenet produces preparation material for qualified review. It does not file with any regulator and does not give legal advice.

Copyright © 2026. All rights reserved.
