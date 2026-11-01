# Open Privacy Programme Framework (OPPF)

OPPF is an open framework for implementing a data protection programme. It is published by FR Data Protection under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/): anyone may use, adapt and redistribute it, including commercially, with attribution.

Laws say what is owed. Standards such as ISO/IEC 27701 and the NIST Privacy Framework list what controls to have. Neither tells an organisation what to do first, how the pieces depend on each other, or how much is enough for its size and risk. Programmes stall in that gap. OPPF fills it.

## What is in it

| Part | What it gives you |
|---|---|
| Control catalogue | 93 controls in 14 domains. Each has an objective, ordered steps, deliverables, the evidence an auditor would ask for, an owner role, an effort estimate (S, M, L) and a recurrence. |
| Scaling profiles | Essential, Standard and Advanced. A 20-person company does not need what a bank needs. A control enters a plan when the organisation’s profile reaches it, **or** when a law in scope imposes it, whichever is first. |
| Triggers | Facts that switch on controls only some organisations need: sensitive data, children, AI, transfers, marketing, consent, cookies, monitoring, acting as a processor, needing an EU or UK representative, and certification. |
| Phases and dependencies | Foundation, Operate, Assure, Optimise. Dependencies between controls give a build order that a scheduler can turn into dates against real capacity. |
| Maturity model | 0 Not started, 1 Initial, 2 Defined, 3 Implemented (with evidence), 4 Managed (operating through a full cycle), 5 Optimised. A missed review caps a control at 2. |
| Mappings | Nigeria (NDPA 2023, GAID 2025), South Africa (POPIA, PAIA), Kenya (DPA 2019), Ghana (Act 843), Egypt (PDPL 151/2020), Zimbabwe (CDPA 2021), the EU GDPR and the UK GDPR; ISO/IEC 27701:2025 and NIST Privacy Framework 1.0; ISO/IEC 42001 and the EU AI Act for AI controls. |

## Files

- `oppf.json`: the machine-readable release. Build tools on this.
- `OPPF.md`: the same content for reading.

Both are generated from `packages/core/src/programme/catalogue.ts` by `npm run framework`. CI fails if they drift from the catalogue.

## How much to trust each mapping

Every legal reference has a confidence tag:

- **primary**: checked against the text of the statute or standard.
- **secondary**: taken from regulator guidance summaries or practitioner analysis. Most GAID 2025 article references, the Egypt Executive Regulations and Zimbabwe’s SI 155 of 2024 are in this group.
- **unverified**: a placeholder until counsel checks it.

Each reference is also marked `requires` (the law itself imposes the control) or `supports` (the control helps meet the provision). Which control serves which provision is the framework’s own judgement. That is what this release asks practitioners to review.

ISO/IEC 27701:2025 is cited by clause (the harmonised structure, clauses 4–10) and by Annex A topic. Annex A control numbers are not reproduced. NIST Privacy Framework categories are cited from version 1.0, because 1.1 remains a draft.

## Position as at 1 November 2026

These developments are reflected in the notes, but none of them changes a control while it is still pending:

- **EU Digital Omnibus.** The Commission proposed it on 19 November 2025, and the Council agreed its position on 21 October 2026. Parliament has no position yet, so it is not law. Its main proposals are a 96-hour deadline for high-risk breaches, one EU DPIA list, and changes to cookie rules.
- **UK Data (Use and Access) Act 2025.** Most data protection changes came into force on 5 February 2026: recognised legitimate interests, new automated decision-making articles, the transfer test, and cookie exemptions. The complaints duty has applied since 19 June 2026.
- **Nigeria.** GAID 2025 took effect on 19 September 2025. Compliance Audit Return fees apply from the 2026 cycle. The NDPC added a CPD framework for certified DPOs in June 2026.
- **Egypt.** The PDPL Executive Regulations were issued on 1 November 2025, with a one-year transition.
- **Ghana.** The Data Protection Bill 2025, which would replace Act 843, is pending.
- **Kenya.** A Data Protection (Amendment) Bill has been proposed.
- **ISO/IEC 27701:2025** was published in October 2025 as a standalone certifiable standard. Certificates under the 2019 edition must transition by October 2028.

## Versioning

Semantic versioning. A major version changes the structure, a minor version adds or retires controls or mappings, and a patch corrects wording or a reference. Control IDs are never reused.

## Using it without Tenet

The JSON needs nothing else. To build a plan:

1. Choose the profile.
2. Resolve the triggers.
3. Keep every control whose profile is at or below the chosen one, or that has a `requires` reference for a law in scope.
4. Drop controls whose triggers do not hold, or whose `onlyFor` laws are not in scope.
5. Order the remaining controls by dependencies, then phase, then legal requirements first.

Tenet does this, schedules the plan against capacity, and links each control to the records that evidence it.

## Sources consulted for this release

- [ISO/IEC 27701:2025 structure and transition (ISMS.online)](https://www.isms.online/iso-27701/whats-new-in-iso-27701-2025/)
- [NIST Privacy Framework 1.1 initial public draft (NIST)](https://www.nist.gov/news-events/news/2025/04/nist-updates-privacy-framework-tying-it-recent-cybersecurity-guidelines) and [1.1 vs 1.0 status (GovernanceDocs)](https://governancedocs.com/nist-privacy-framework-1-1-vs-1-0/)
- [EU Digital Omnibus: Council mandate, 21 October 2026](https://dpoas.co.il/blog/digital-omnibus-council-mandate-gdpr/)
- [DUAA complaints regime from 19 June 2026 (CMS)](https://cms.law/en/gbr/legal-updates/data-use-and-access-act-2025-new-statutory-rules-on-handling-data-protection-complaints-from-19th-june-2026) and [DUAA provisions in force (DPO Centre)](https://www.dpocentre.com/news/duaa-provisions-now-in-force/)
- [NDPC audit returns and enforcement (O3 Legal)](https://o3legal.com/briefing-data-protection-audit-returns); [GAID 2025 text (NDPC)](https://ndpc.gov.ng/wp-content/uploads/2025/07/NDP-ACT-GAID-2025-MARCH-20TH.pdf)
- [Egypt PDPL Executive Regulations (Kennedys)](https://www.kennedyslaw.com/en/thought-leadership/article/2026/egypt-s-personal-data-protection-law-the-compliance-countdown-has-begun/)
- [Zimbabwe SI 155 of 2024 (Afriwise)](https://www.afriwise.com/blog/understanding-si-155-of-2024-new-regulations-on-data-protection-licensing-and-data-protection-officers-in-zimbabwe)
- [Ghana Data Protection Bill 2025 compared with Act 843 (Sustineri Attorneys)](https://sustineriattorneys.com/2026/04/01/comparative-analysis-of-ghanas-data-protection-bill-2025-and-the-data-protection-act-2012-act-843-changes-and-additions/)
- [Kenya 2026 enforcement and audits (Global Law Experts)](https://globallawexperts.com/kenyas-dataprotection-enforcement-turn-2026-audits/)
- [POPIA regulation amendments and e-portal reporting (Acts Online)](https://acts.co.za/news/blog/2025/05/popia-regulation-amendments-2025)
- [ICO Accountability Framework categories (Hunton)](https://www.hunton.com/privacy-and-cybersecurity-law-blog/ico-publishes-its-accountability-framework), used to check domain coverage

## Attribution

> Open Privacy Programme Framework (OPPF), FR Data Protection, licensed under CC BY 4.0.
