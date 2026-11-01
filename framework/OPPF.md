# Open Privacy Programme Framework (OPPF)

Version 1.0.0-draft.1 · draft · as at 2026-11-01 · published by FR Data Protection under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/)

A sequenced, scalable implementation framework for data protection programmes. One control catalogue, three scaling profiles, four phases and a maturity model, mapped to eight data protection laws, ISO/IEC 27701 and the NIST Privacy Framework, with ISO/IEC 42001 and the EU AI Act for AI controls.

## How the framework works

Laws say what is owed. Standards list what controls to have. Neither says in what order to build a programme, or how much is enough for an organisation of a given size. OPPF does that, in four parts:

1. **One control catalogue.** 93 controls in 14 domains. Each states its objective, steps, deliverables, the evidence an auditor would ask for, an owner, an effort estimate and how often it recurs.
2. **Three scaling profiles.** Essential: Small organisations with low-risk processing: the legal floor plus the habits that keep it true. Standard: Mid-sized organisations, or any organisation with sensitive data or a regulator that audits: a managed, evidenced programme. Advanced: Regulated sectors, very large volumes, groups and certification candidates: an assured, measured programme.
3. **Four phases with dependencies.** Foundation: Mandate, ownership, knowing your data, and the legal must-haves that carry penalties on their own. Operate: Repeatable processes for assessments, rights, vendors, transfers, retention and incidents. Assure: Monitoring, testing, training in depth and internal audit, so the programme can prove it works. Optimise: Measurement, automation, certification and continual improvement.
4. **A maturity model** from 0 (not started) to 5 (optimised), scored per control and averaged per domain.

A control enters a plan when the organisation’s profile reaches it, or when a law in scope imposes it, whichever comes first. Triggers (sensitive data, AI, transfers and so on) switch on controls that only some organisations need.

## Confidence tags

Every legal reference carries a tag. **primary**: read against the statute or standard. **secondary**: from regulator guidance summaries or practitioner analysis. **unverified**: a placeholder until counsel checks it. Mapping a control to a provision is the framework’s own judgement and is open to review.

## Standards

- **ISO/IEC 27701 2025.** Second edition, October 2025. Standalone privacy information management system; clauses 4–10 plus Annex A (A.1 controller, A.2 processor, A.3 shared controls). Clause numbers follow the harmonised structure; Annex A control numbers are not reproduced here.
- **NIST Privacy Framework 1.0.** Version 1.0 (January 2020) is the only final version. Version 1.1 was an initial public draft in April 2025. Categories cited are from 1.0.
- **ISO/IEC 42001 2023.** AI management system. Cited by clause or Annex A topic.
- **EU AI Act Regulation (EU) 2024/1689.** Cited for organisations placing or using AI systems in the EU market.

## GOV · Governance and accountability

Leadership commitment, ownership, policy and the ability to demonstrate compliance.

### GOV-01 Executive mandate and programme charter

The board or executive has approved the programme’s scope, objectives, authority and reporting line, and the charter is reviewed each year.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Board or executive · **Effort:** S · **Recurs:** annual
- **Steps:** (1) Brief the executive on the laws in scope, the penalties and the current exposure. (2) Agree scope: entities, jurisdictions, business units and systems. (3) Approve a one-page charter: objectives, authority, reporting line, budget owner. (4) Name an executive sponsor accountable for the programme.
- **Deliverables:** Programme charter; Board or executive minute approving it
- **Evidence:** Signed or minuted charter; Name of the executive sponsor
- **Laws:** NDPA: NDPA s.24(3) (supports) [secondary] · POPIA: POPIA s.8 (supports) [primary] · GDPR: GDPR Arts. 5(2), 24 (supports) [primary] · UK GDPR: UK GDPR Arts. 5(2), 24 (supports) [primary]
- **Standards:** ISO/IEC 27701: 5.1 Leadership and commitment; 4.3 Scope of the PIMS · NIST Privacy Framework: GV.PO-P
- **Notes:** Keep it short. A charter that runs to ten pages is rarely read again; one page signed by the CEO changes behaviour.

### GOV-02 Privacy lead appointed with independence and resources

A competent person is formally appointed as DPO, Information Officer or privacy lead, reports to senior management, is free from conflicts and is registered or notified where the law requires.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Board or executive · **Effort:** S · **Recurs:** annual
- **Depends on:** GOV-01
- **Steps:** (1) Decide whether the law makes the appointment mandatory for each entity. (2) Appoint in writing, with a role description that covers the statutory tasks. (3) Check for conflicts of interest (for example the head of IT or marketing acting as DPO). (4) Publish the contact details and notify or register them with each regulator that requires it.
- **Deliverables:** Appointment letter; Role description; Regulator notification or registration
- **Evidence:** Appointment letter; Published contact details; Regulator acknowledgement where applicable
- **Laws:** NDPA: NDPA s.32 [primary]; GAID 2025 (DPO designation, credentials and reporting) [secondary] · POPIA: POPIA ss.55–56 [primary]; Information Officer registration with the Information Regulator [secondary] · Kenya DPA: Kenya DPA s.24 (supports) [primary] · Act 843: Act 843 s.58 (supports) [secondary] · PDPL: PDPL 151/2020 (DPO appointment and registration with the PDPC) [secondary] · CDPA: CDPA 2021 s.20; SI 155 of 2024 (DPO notified to POTRAZ within 90 days) [secondary] · GDPR: GDPR Arts. 37–39 [primary] · UK GDPR: UK GDPR Arts. 37–39 [primary]
- **Standards:** ISO/IEC 27701: 5.3 Roles, responsibilities and authorities; 7.1 Resources · NIST Privacy Framework: GV.PO-P

### GOV-03 Roles, responsibilities and privacy champions

Every function that touches personal data knows what it owns. A RACI covers the programme and each department has a named champion.

- **Profile:** standard · **Phase:** Foundation · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** annual
- **Depends on:** GOV-02
- **Steps:** (1) List the programme activities in this framework that apply to you. (2) Assign responsible, accountable, consulted and informed roles for each. (3) Nominate a champion in each department that processes personal data. (4) Write the responsibilities into job descriptions where they are material.
- **Deliverables:** Privacy RACI; Champion network list
- **Evidence:** Approved RACI; Champion list with dates
- **Laws:** POPIA: POPIA s.56 (supports) [primary] · GDPR: GDPR Art. 24 (supports) [primary] · UK GDPR: UK GDPR Art. 24 (supports) [primary]
- **Standards:** ISO/IEC 27701: 5.3 Roles, responsibilities and authorities · NIST Privacy Framework: GV.PO-P

### GOV-04 Data protection policy

A board-approved policy sets the organisation’s data protection commitments and points to the procedures that implement them.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Privacy lead (DPO) · **Effort:** M · **Recurs:** annual
- **Depends on:** GOV-01
- **Steps:** (1) Draft the policy around the principles and the laws in scope; keep procedures separate. (2) Cover roles, lawful processing, rights, security, vendors, transfers, retention, breaches and training. (3) Approve at executive level and publish internally. (4) Set an annual review date.
- **Deliverables:** Data protection policy
- **Evidence:** Approved policy with version and date; Proof of staff communication
- **Laws:** NDPA: GAID 2025 (data protection policy, reviewed in the Compliance Audit Return) [secondary] · POPIA: POPIA s.8 (supports) [primary] · Kenya DPA: ODPC guidance note on data protection policies (supports) [secondary] · GDPR: GDPR Art. 24(2) [primary] · UK GDPR: UK GDPR Art. 24(2) [primary]
- **Standards:** ISO/IEC 27701: 5.2 Privacy policy · NIST Privacy Framework: GV.PO-P

### GOV-05 Management reporting and oversight

Management receives regular reports on privacy risk, incidents, requests and programme progress, and acts on them.

- **Profile:** essential · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** semi-annual
- **Depends on:** GOV-02
- **Steps:** (1) Agree the reporting format and the forum (board, risk committee or executive meeting). (2) Report at least twice a year: programme status, open risks, incidents, requests, regulator contact. (3) Record decisions and track the actions they create.
- **Deliverables:** Privacy report to management; Minutes with decisions
- **Evidence:** Last two reports; Minutes showing discussion
- **Laws:** NDPA: GAID 2025 (semi-annual DPO report) [secondary] · GDPR: GDPR Art. 38(3) (supports) [primary] · UK GDPR: UK GDPR Art. 38(3) (supports) [primary]
- **Standards:** ISO/IEC 27701: 9.3 Management review (inputs); 5.1 Leadership and commitment · NIST Privacy Framework: GV.MT-P

### GOV-06 Programme resourcing and budget

The programme has the people, tools and budget its plan needs, agreed each year against the risk profile.

- **Profile:** standard · **Phase:** Foundation · **Owner:** Board or executive · **Effort:** S · **Recurs:** annual
- **Depends on:** GOV-01
- **Steps:** (1) Estimate effort from the tailored plan. (2) Decide what is done in-house and what is bought (DPO service, DPCO, tooling, training). (3) Approve the budget and record it.
- **Deliverables:** Resource and budget plan
- **Evidence:** Approved budget line
- **Laws:** NDPA: GAID 2025 (DPO resources) (supports) [secondary] · GDPR: GDPR Art. 38(2) (supports) [primary] · UK GDPR: UK GDPR Art. 38(2) (supports) [primary]
- **Standards:** ISO/IEC 27701: 7.1 Resources · NIST Privacy Framework: GV.PO-P

### GOV-07 Accountability evidence index

For every control in the plan, you can produce the evidence within a day.

- **Profile:** standard · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** continuous
- **Depends on:** GOV-04
- **Steps:** (1) Decide where evidence lives and how it is versioned. (2) Link each implemented control to its evidence. (3) Check the index before each audit or filing.
- **Deliverables:** Evidence index (this plan, with evidence links)
- **Evidence:** Index with current links
- **Laws:** NDPA: NDPA s.24(3) (supports) [secondary] · POPIA: POPIA s.8 (supports) [primary] · GDPR: GDPR Art. 5(2) [primary] · UK GDPR: UK GDPR Art. 5(2) [primary]
- **Standards:** ISO/IEC 27701: 7.5 Documented information · NIST Privacy Framework: GV.PO-P
- **Notes:** Tenet links records to controls automatically where it can. The index is this plan.

### GOV-08 Privacy objectives and key indicators

The programme has measurable objectives and a small set of indicators reviewed by management.

- **Profile:** standard · **Phase:** Assure · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** annual
- **Depends on:** GOV-05
- **Steps:** (1) Set three to five objectives for the year. (2) Choose indicators: request timeliness, DPIA coverage, vendor DPA coverage, training completion, incident notification timeliness. (3) Report them in the management report.
- **Deliverables:** Objectives and indicators
- **Evidence:** Indicator report over at least two periods
- **Standards:** ISO/IEC 27701: 6.2 Privacy objectives and planning to achieve them; 9.1 Monitoring, measurement, analysis and evaluation · NIST Privacy Framework: GV.MT-P

## REG · Regulatory obligations

Knowing which laws apply and meeting registration, filing, representative and regulator duties.

### REG-01 Applicable law and role analysis

For each entity you know which laws apply, whether you act as controller, processor or both, and which size or sector tiers you fall into.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Legal · **Effort:** S · **Recurs:** annual
- **Steps:** (1) List where each entity is established and where its data subjects are. (2) Apply each law’s territorial test, including targeting tests for foreign entities. (3) Decide controller or processor role per main activity. (4) Work out size and sector tiers (for example the NDPA major-importance tiers).
- **Deliverables:** Applicable law register
- **Evidence:** Register with reasons for each conclusion
- **Laws:** NDPA: NDPA s.2; GAID 2025 Art. 8(2) (operating in Nigeria) [secondary] · POPIA: POPIA s.3 (supports) [primary] · Kenya DPA: Kenya DPA s.4 (supports) [primary] · GDPR: GDPR Art. 3 (supports) [primary] · UK GDPR: UK GDPR Art. 3 (supports) [primary]
- **Standards:** ISO/IEC 27701: 4.1 Understanding the organisation and its context; 4.2 Needs and expectations of interested parties · NIST Privacy Framework: ID.BE-P; GV.PO-P

### REG-02 Regulator registration, licences and fees

Every entity that must register, hold a licence or pay a fee has done so, and renewals are diarised.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** annual
- **Depends on:** REG-01
- **Steps:** (1) Check each law’s registration test and exemptions. (2) File registrations or licence applications with the required details. (3) Record numbers, expiry dates and renewal rules. (4) Set reminders well before expiry.
- **Deliverables:** Registration and licence register
- **Evidence:** Certificates, receipts and renewal dates
- **Laws:** NDPA: NDPA s.44; GAID 2025 (registration of data controllers and processors of major importance) [secondary] · POPIA: POPIA s.55; Information Officer registration [secondary] · Kenya DPA: Kenya DPA s.18; Data Protection (Registration of Data Controllers and Data Processors) Regulations 2021 [secondary] · Act 843: Act 843 (registration with the Data Protection Commission, renewable every two years) [secondary] · PDPL: PDPL 151/2020 and Executive Regulations 2025 (licences and permits from the PDPC) [secondary] · CDPA: CDPA 2021; SI 155 of 2024 (data controller licence from POTRAZ) [secondary] · UK GDPR: Data Protection (Charges and Information) Regulations 2018 [primary]
- **Standards:** NIST Privacy Framework: GV.PO-P

### REG-03 Statutory filings and returns calendar

Every recurring filing (audit returns, renewals, annual reports) is in one calendar with owners and lead times, and none is missed.

- **Profile:** essential · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** annual
- **Depends on:** REG-02
- **Steps:** (1) List each filing, its trigger, deadline and who files it. (2) Work back from each deadline to the evidence needed. (3) Engage any licensed third party (such as a DPCO) early. (4) Record the filing and the regulator’s acknowledgement.
- **Deliverables:** Filings calendar; Filed returns
- **Evidence:** Acknowledgements of each filing
- **Laws:** NDPA: NDPA s.44; GAID 2025 (Compliance Audit Return through a licensed DPCO by 31 March) [secondary] · Kenya DPA: Registration renewal every 24 months [secondary] · Act 843: Registration renewal every two years [secondary] · UK GDPR: Annual data protection fee [primary]
- **Standards:** NIST Privacy Framework: GV.PO-P

### REG-04 Local representative

Where a law requires a representative because you are not established there, one is appointed in writing and named in your notices.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Legal · **Effort:** S · **Recurs:** annual
- **Applies if:** Needs a local representative (subject to GDPR or UK GDPR without an establishment there)
- **Only for:** European Union, United Kingdom
- **Depends on:** REG-01
- **Steps:** (1) Confirm the representative test applies and no exemption fits. (2) Appoint a representative by written mandate. (3) Name the representative in privacy notices and the record of processing.
- **Deliverables:** Representative mandate
- **Evidence:** Signed mandate; Notice naming the representative
- **Laws:** GDPR: GDPR Art. 27 [primary] · UK GDPR: UK GDPR Art. 27 [primary]

### REG-05 Legal and regulatory change watch

New laws, regulations, guidance and enforcement decisions are tracked, assessed for impact and turned into plan changes.

- **Profile:** standard · **Phase:** Operate · **Owner:** Legal · **Effort:** S · **Recurs:** continuous
- **Depends on:** REG-01
- **Steps:** (1) Choose sources for each law in scope (regulator sites, gazettes, trusted alerts). (2) Log each change with an impact rating. (3) Turn material changes into tasks in this plan.
- **Deliverables:** Regulatory change log
- **Evidence:** Change log with impact decisions
- **Standards:** ISO/IEC 27701: 4.1 Understanding the organisation and its context; 6.3 Planning of changes · NIST Privacy Framework: GV.PO-P
- **Notes:** Live items as at November 2026: the EU Digital Omnibus (Council position agreed, not law); Ghana’s Data Protection Bill 2025 (pending); Kenya’s Data Protection (Amendment) Bill (proposed); the NDPC’s DPO continuing professional development framework (June 2026).

### REG-06 Regulator engagement and investigations

Regulator letters, audits and investigations are handled by a defined process, with deadlines met and privilege considered.

- **Profile:** standard · **Phase:** Operate · **Owner:** Legal · **Effort:** S · **Recurs:** per-event
- **Depends on:** GOV-02
- **Steps:** (1) Name who receives and who answers regulator correspondence. (2) Log each contact and its deadline. (3) Prepare an evidence pack from the accountability index. (4) Review the response with legal before sending.
- **Deliverables:** Regulator engagement procedure; Contact log
- **Evidence:** Log of regulator contact and responses
- **Laws:** NDPA: NDPA ss.46–48 (complaints, investigation, compliance orders) (supports) [secondary] · GDPR: GDPR Art. 31 [primary] · UK GDPR: UK GDPR Art. 31 [primary]
- **Standards:** NIST Privacy Framework: GV.PO-P

### REG-07 Prior authorisation and prior consultation

Processing that needs the regulator’s prior authorisation or consultation is identified before it starts and does not begin without it.

- **Profile:** standard · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** per-event
- **Depends on:** RSK-02
- **Steps:** (1) Build the authorisation and consultation tests into DPIA screening. (2) Prepare submissions with the DPIA attached. (3) Hold the launch until the regulator responds or the statutory period ends.
- **Deliverables:** Submissions and regulator responses
- **Evidence:** Submission records
- **Laws:** POPIA: POPIA ss.57–58 [primary] · Kenya DPA: Kenya DPA s.31 (DPIA submission to the Data Commissioner) (supports) [secondary] · PDPL: PDPL 151/2020 (permits for sensitive data and transfers) [secondary] · GDPR: GDPR Art. 36 [primary] · UK GDPR: UK GDPR Art. 36 [primary]
- **Standards:** ISO/IEC 27701: 8.2 Privacy risk assessment

## INV · Data inventory and records

Knowing what personal data you hold, where, why and who touches it.

### INV-01 System and data asset inventory

Every system, SaaS tool, file store and paper record that holds personal data is listed with its owner, location and hosting country.

- **Profile:** essential · **Phase:** Foundation · **Owner:** IT · **Effort:** M · **Recurs:** semi-annual
- **Depends on:** GOV-02
- **Steps:** (1) Start from finance (software spend), IT asset lists and SSO logs. (2) Interview each department about what it uses, including spreadsheets and paper. (3) Record owner, hosting country, vendor and key security measures.
- **Deliverables:** System inventory
- **Evidence:** Inventory with owners and hosting locations
- **Laws:** GDPR: GDPR Art. 30 (supports) [primary] · UK GDPR: UK GDPR Art. 30 (supports) [primary]
- **Standards:** ISO/IEC 27701: Annex A: inventory of information and assets · NIST Privacy Framework: ID.IM-P

### INV-02 Record of processing activities

Each processing activity is recorded with its purpose, lawful basis, data categories, data subjects, systems, recipients, transfers and retention, and the record is kept current.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Business process owners · **Effort:** L · **Recurs:** semi-annual
- **Depends on:** INV-01, REG-01
- **Steps:** (1) Run short workshops with each department, starting with HR, customers and marketing. (2) Record each activity against the inventory of systems. (3) Have each activity owner confirm their entries. (4) Review twice a year and whenever a DPIA or new vendor touches the activity.
- **Deliverables:** Record of processing activities
- **Evidence:** Record with owner confirmation dates
- **Laws:** NDPA: GAID 2025 (record of processing activities, verified at audit) [secondary] · POPIA: POPIA s.17; PAIA s.51 [primary] · Kenya DPA: Data Protection (General) Regulations 2021 (records of processing) [secondary] · GDPR: GDPR Art. 30(1) [primary] · UK GDPR: UK GDPR Art. 30(1) [primary]
- **Standards:** ISO/IEC 27701: Annex A: records related to processing PII · NIST Privacy Framework: ID.IM-P
- **Notes:** The EU Digital Omnibus proposes lighter record-keeping for smaller organisations; it is not law. Keep the record regardless: the other laws in scope and the annual audit still rely on it.

### INV-03 Records of processing carried out for clients

Where you act as processor, you keep a record of the processing you carry out for each client, with sub-processors and transfers.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Privacy lead (DPO) · **Effort:** M · **Recurs:** semi-annual
- **Applies if:** Processes personal data for clients (acts as processor)
- **Depends on:** INV-01
- **Steps:** (1) List clients for whom you process personal data and the services involved. (2) Record categories of processing, sub-processors, transfers and security measures per client. (3) Keep it aligned with the DPAs you have signed.
- **Deliverables:** Processor record
- **Evidence:** Processor record
- **Laws:** NDPA: NDPA s.29 (supports) [primary] · GDPR: GDPR Art. 30(2) [primary] · UK GDPR: UK GDPR Art. 30(2) [primary]
- **Standards:** ISO/IEC 27701: Annex A.2: records related to processing PII (processor) · NIST Privacy Framework: ID.IM-P

### INV-04 Data flow and transfer map

You can show how personal data moves between systems, vendors and countries for each main activity.

- **Profile:** standard · **Phase:** Operate · **Owner:** IT · **Effort:** M · **Recurs:** annual
- **Depends on:** INV-02
- **Steps:** (1) Link activities to systems and vendors. (2) Record hosting and access countries. (3) Mark flows that cross borders and the basis relied on.
- **Deliverables:** Data flow map
- **Evidence:** Current flow map
- **Standards:** NIST Privacy Framework: ID.IM-P; ID.DE-P

### INV-05 Data classification scheme

Personal data is classified by sensitivity so that handling rules, access and security follow the class.

- **Profile:** standard · **Phase:** Foundation · **Owner:** Information security · **Effort:** S · **Recurs:** annual
- **Depends on:** INV-01
- **Steps:** (1) Define three or four classes, with sensitive data under each law in scope at the top. (2) Set handling rules for each class. (3) Label systems and activities.
- **Deliverables:** Classification scheme and handling rules
- **Evidence:** Scheme; Labelled inventory
- **Standards:** ISO/IEC 27701: Annex A.3: classification of information · NIST Privacy Framework: ID.IM-P

### INV-06 Automated discovery of personal data

Structured and unstructured stores are scanned for personal data so that the inventory reflects reality, including shadow copies.

- **Profile:** advanced · **Phase:** Optimise · **Owner:** Information security · **Effort:** L · **Recurs:** quarterly
- **Depends on:** INV-02, INV-05
- **Steps:** (1) Select discovery tooling that runs inside your environment and returns metadata only. (2) Scan the highest-risk stores first. (3) Reconcile findings against the inventory and record of processing.
- **Deliverables:** Discovery reports; Reconciliation log
- **Evidence:** Latest scan and reconciliation
- **Standards:** NIST Privacy Framework: ID.IM-P

## LAW · Lawful and fair processing

A documented legal basis for every purpose, with the extra conditions sensitive and children’s data need.

### LAW-01 Lawful basis documented for each purpose

Every processing purpose has a lawful basis chosen before processing starts, justified in writing and valid under each law in scope.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Privacy lead (DPO) · **Effort:** M · **Recurs:** per-event
- **Depends on:** INV-02
- **Steps:** (1) For each activity, choose the basis and record why it fits. (2) Check the basis exists under every law in scope; some laws lack legitimate interests or public task. (3) Avoid consent where there is an imbalance of power, such as employment.
- **Deliverables:** Lawful basis per activity in the record
- **Evidence:** Record entries with justification
- **Laws:** NDPA: NDPA s.25 [primary] · POPIA: POPIA s.11 [primary] · Kenya DPA: Kenya DPA s.30 [primary] · Act 843: Act 843 s.20 [secondary] · PDPL: PDPL 151/2020 Art. 6 [secondary] · CDPA: CDPA 2021 s.9 [unverified] · GDPR: GDPR Art. 6(1) [primary] · UK GDPR: UK GDPR Art. 6(1) [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: identify lawful basis · NIST Privacy Framework: CT.PO-P; GV.PO-P

### LAW-02 Legitimate interests assessments

Each reliance on legitimate interests is supported by a purpose, necessity and balancing test that is recorded and reviewed.

- **Profile:** standard · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** M · **Recurs:** per-event
- **Depends on:** LAW-01
- **Steps:** (1) List activities relying on legitimate interests. (2) Complete the three-part test for each. (3) Record any safeguards, including an easy objection route.
- **Deliverables:** Legitimate interests assessments
- **Evidence:** Signed assessments
- **Laws:** NDPA: NDPA s.25(1)(b)(v); GAID 2025 (legitimate interest assessments reviewed at audit) (supports) [secondary] · POPIA: POPIA s.11(1)(f) (supports) [primary] · GDPR: GDPR Art. 6(1)(f) (supports) [primary] · UK GDPR: UK GDPR Art. 6(1)(f) (supports) [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: identify lawful basis

### LAW-03 Consent capture, records and withdrawal

Where consent is relied on, it is specific, informed and unambiguous, is recorded with what the person saw, and is as easy to withdraw as to give.

- **Profile:** essential · **Phase:** Operate · **Owner:** Product and engineering · **Effort:** M · **Recurs:** annual
- **Applies if:** Relies on consent for some processing
- **Depends on:** LAW-01
- **Steps:** (1) Inventory every consent request. (2) Fix wording, granularity and pre-ticked boxes. (3) Store consent records: who, when, what text, which channel. (4) Build withdrawal into each channel and propagate it to downstream systems.
- **Deliverables:** Consent inventory; Consent records
- **Evidence:** Sample consent records; Withdrawal test results
- **Laws:** NDPA: NDPA s.26 [primary] · POPIA: POPIA s.11(2) [primary] · Kenya DPA: Kenya DPA s.32 [primary] · PDPL: PDPL 151/2020 (consent requirements) [secondary] · GDPR: GDPR Arts. 4(11), 7 [primary] · UK GDPR: UK GDPR Arts. 4(11), 7 [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: obtain and record consent · NIST Privacy Framework: CT.PO-P; CM.AW-P

### LAW-04 Conditions for sensitive data

Each use of sensitive or special category data meets a specific condition under each law in scope, with the extra documentation some laws require.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Privacy lead (DPO) · **Effort:** M · **Recurs:** per-event
- **Applies if:** Processes sensitive or special category data
- **Depends on:** LAW-01
- **Steps:** (1) Identify activities using sensitive data under each law’s own list. (2) Record the condition relied on. (3) Write any required policy document (for example the UK appropriate policy document). (4) Apply stronger security and access limits.
- **Deliverables:** Sensitive data conditions in the record; Appropriate policy document where required
- **Evidence:** Record entries; Policy documents
- **Laws:** NDPA: NDPA s.30 [primary] · POPIA: POPIA ss.26–33 [primary] · Kenya DPA: Kenya DPA ss.44–46 [primary] · Act 843: Act 843 s.37 [secondary] · PDPL: PDPL 151/2020 (licence for sensitive data) [secondary] · CDPA: CDPA 2021 s.11 [unverified] · GDPR: GDPR Arts. 9–10 [primary] · UK GDPR: UK GDPR Arts. 9–10; DPA 2018 Sch. 1 (appropriate policy document) [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: identify lawful basis · NIST Privacy Framework: CT.PO-P
- **Notes:** Lists differ: Kenya treats property, marital and family details as sensitive; Egypt includes financial data; POPIA includes criminal behaviour.

### LAW-05 Children’s data

Services likely to be used by children have age assurance proportionate to risk, parental consent where the law requires it, and child-appropriate design.

- **Profile:** essential · **Phase:** Operate · **Owner:** Product and engineering · **Effort:** M · **Recurs:** annual
- **Applies if:** Processes children’s data
- **Depends on:** LAW-01
- **Steps:** (1) Identify services and activities involving children. (2) Apply the age threshold and consent rule of each law in scope. (3) Design defaults for children: high privacy, no profiling for marketing, clear language.
- **Deliverables:** Children’s data assessment; Age assurance and parental consent design
- **Evidence:** Assessment; Screens and flows
- **Laws:** NDPA: NDPA s.31 [primary] · POPIA: POPIA ss.34–35 [primary] · Kenya DPA: Kenya DPA s.33 [primary] · PDPL: PDPL 151/2020 (guardian consent) [secondary] · GDPR: GDPR Art. 8 [primary] · UK GDPR: UK GDPR Art. 8; Age Appropriate Design Code [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: obtain and record consent

### LAW-06 Purpose limitation and compatibility checks

New uses of existing data are checked for compatibility with the original purpose before they start.

- **Profile:** standard · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** per-event
- **Depends on:** LAW-01
- **Steps:** (1) Add a compatibility question to change and project intake. (2) Record the assessment and any new basis or notice needed.
- **Deliverables:** Compatibility assessments
- **Evidence:** Assessments for recent new uses
- **Laws:** NDPA: NDPA s.24(1)(b) [secondary] · POPIA: POPIA ss.13, 15 [primary] · GDPR: GDPR Arts. 5(1)(b), 6(4) [primary] · UK GDPR: UK GDPR Arts. 5(1)(b), 6(4) [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: identify and document purpose · NIST Privacy Framework: CT.PO-P

### LAW-07 Direct marketing rules

Electronic and other direct marketing meets each law’s consent, soft opt-in and opt-out rules, and suppression lists are honoured everywhere.

- **Profile:** essential · **Phase:** Operate · **Owner:** Marketing · **Effort:** S · **Recurs:** annual
- **Applies if:** Sends direct marketing
- **Depends on:** LAW-01
- **Steps:** (1) List marketing channels and the basis for each. (2) Fix consent and opt-out mechanics. (3) Maintain one suppression list used by every tool.
- **Deliverables:** Marketing compliance checklist; Suppression list
- **Evidence:** Campaign sign-offs; Suppression test
- **Laws:** NDPA: NDPA s.36 [secondary] · POPIA: POPIA s.69 [primary] · Kenya DPA: Kenya DPA s.37 [primary] · PDPL: PDPL 151/2020 (electronic marketing licence and consent) [secondary] · GDPR: ePrivacy Directive Art. 13; GDPR Art. 21(2)–(3) [primary] · UK GDPR: PECR regs. 21–22; UK GDPR Art. 21(2)–(3) [primary]
- **Standards:** NIST Privacy Framework: CT.PO-P

## TRN · Transparency

Telling people what happens to their data, at the right moment and in plain language.

### TRN-01 Privacy notices for customers and the public

Clear, layered notices tell people what you collect, why, on what basis, who receives it, where it goes, how long you keep it, their rights and how to complain.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Legal · **Effort:** M · **Recurs:** annual
- **Depends on:** LAW-01
- **Steps:** (1) Draft from the record of processing, not from a template. (2) Include each law’s mandatory items and the regulator’s contact. (3) Publish where data is collected and keep versions.
- **Deliverables:** Privacy notice
- **Evidence:** Published notice with version and date
- **Laws:** NDPA: NDPA s.27 [primary] · POPIA: POPIA s.18 [primary] · Kenya DPA: Kenya DPA s.29 [primary] · Act 843: Act 843 (notice at collection) [secondary] · PDPL: PDPL 151/2020 (information to data subjects) [secondary] · GDPR: GDPR Arts. 12–14 [primary] · UK GDPR: UK GDPR Arts. 12–14 [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: provide information to PII principals · NIST Privacy Framework: CM.AW-P; CM.PO-P

### TRN-02 Employee and candidate privacy notices

Staff, contractors and applicants receive a notice covering HR processing, monitoring and their rights.

- **Profile:** essential · **Phase:** Foundation · **Owner:** HR · **Effort:** S · **Recurs:** annual
- **Depends on:** LAW-01
- **Steps:** (1) Draft from the HR activities in the record. (2) Cover monitoring, background checks and retention. (3) Issue at onboarding and in the recruitment flow.
- **Deliverables:** Employee notice; Candidate notice
- **Evidence:** Notices and acknowledgement records
- **Laws:** NDPA: NDPA s.27 [primary] · POPIA: POPIA s.18 [primary] · Kenya DPA: Kenya DPA s.29 [primary] · GDPR: GDPR Arts. 13–14 [primary] · UK GDPR: UK GDPR Arts. 13–14 [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: provide information to PII principals · NIST Privacy Framework: CM.AW-P

### TRN-03 Cookies and similar technologies

Non-essential cookies and trackers only run with valid consent where required, refusal is as easy as acceptance, and the cookie notice matches what is actually set.

- **Profile:** essential · **Phase:** Operate · **Owner:** Product and engineering · **Effort:** M · **Recurs:** semi-annual
- **Applies if:** Runs public websites or apps that use cookies or similar technologies
- **Depends on:** TRN-01
- **Steps:** (1) Scan sites and apps to list every cookie, SDK and pixel. (2) Classify each as essential, analytics, functional or advertising. (3) Configure consent before non-essential tags fire. (4) Re-scan after each release that changes tags.
- **Deliverables:** Cookie inventory; Consent banner configuration; Cookie notice
- **Evidence:** Scan results; Banner screenshots and test results
- **Laws:** NDPA: GAID 2025 (cookies and similar technologies) [secondary] · POPIA: POPIA s.11 (supports) [secondary] · Kenya DPA: Kenya DPA s.30 (supports) [secondary] · GDPR: ePrivacy Directive Art. 5(3) [primary] · UK GDPR: PECR reg. 6 [primary]
- **Standards:** NIST Privacy Framework: CT.PO-P; CM.AW-P

### TRN-04 Access-to-information manual

The manual describing your records, processing and how to request access is current, published and filed where required.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Legal · **Effort:** S · **Recurs:** annual
- **Only for:** South Africa
- **Depends on:** INV-02
- **Steps:** (1) Update the manual from the record of processing. (2) Include the POPIA processing information. (3) Publish on the website and make it available at the head office.
- **Deliverables:** PAIA manual
- **Evidence:** Published manual with date
- **Laws:** POPIA: PAIA s.51; POPIA s.17 [primary]

### TRN-05 Monitoring and CCTV notices

People are told before they are monitored by CCTV, telematics, workplace monitoring or biometric systems, and monitoring is proportionate.

- **Profile:** essential · **Phase:** Operate · **Owner:** Information security · **Effort:** S · **Recurs:** annual
- **Applies if:** Monitors people (CCTV, employee monitoring, location or biometric tracking)
- **Depends on:** LAW-01
- **Steps:** (1) List monitoring systems and their purposes. (2) Place signage and layered notices. (3) Set access and retention rules for footage and logs.
- **Deliverables:** Monitoring notices; Monitoring policy
- **Evidence:** Signage photos; Policy
- **Laws:** NDPA: NDPA s.27 [primary] · POPIA: POPIA s.18 [primary] · Kenya DPA: Kenya DPA s.29 [primary] · GDPR: GDPR Arts. 13, 35(3)(c) [primary] · UK GDPR: UK GDPR Arts. 13, 35(3)(c) [primary]
- **Standards:** NIST Privacy Framework: CM.AW-P

### TRN-06 Just-in-time notices and privacy dashboards

Products explain data use at the moment it matters and give people self-service controls over their data and preferences.

- **Profile:** advanced · **Phase:** Optimise · **Owner:** Product and engineering · **Effort:** M · **Recurs:** annual
- **Depends on:** TRN-01, RSK-04
- **Steps:** (1) Identify moments where people make data choices. (2) Add contextual explanations and controls. (3) Offer a preference centre that writes to the consent records.
- **Deliverables:** Privacy UX patterns; Preference centre
- **Evidence:** Screens; Usage data
- **Laws:** GDPR: GDPR Art. 12(1) (supports) [primary] · UK GDPR: UK GDPR Art. 12(1) (supports) [primary]
- **Standards:** NIST Privacy Framework: CM.AW-P; CT.DM-P

## RTS · Individual rights and complaints

Receiving, verifying and answering requests and complaints within each law’s deadline.

### RTS-01 Rights request procedure

A written procedure covers every right available under each law in scope, with deadlines, extensions, exemptions and refusal grounds.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Privacy lead (DPO) · **Effort:** M · **Recurs:** annual
- **Depends on:** GOV-02
- **Steps:** (1) List the rights and deadlines for each law in scope. (2) Set the verification standard and the search method. (3) Write templates for each response and refusal.
- **Deliverables:** Rights procedure; Response templates
- **Evidence:** Approved procedure
- **Laws:** NDPA: NDPA ss.34–38 [primary] · POPIA: POPIA ss.23–25; PAIA [primary] · Kenya DPA: Kenya DPA ss.26, 40; General Regulations 2021 [primary] · Act 843: Act 843 (rights of data subjects) [secondary] · PDPL: PDPL 151/2020 Art. 2 [secondary] · CDPA: CDPA 2021 s.14 [unverified] · GDPR: GDPR Arts. 12, 15–22 [primary] · UK GDPR: UK GDPR Arts. 12, 15–22 [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: obligations to PII principals · NIST Privacy Framework: CT.DM-P

### RTS-02 Request intake and identity verification

Requests are recognised on any channel, logged the same day, and identity is verified proportionately without asking for more data than needed.

- **Profile:** essential · **Phase:** Operate · **Owner:** Customer service · **Effort:** S · **Recurs:** continuous
- **Depends on:** RTS-01
- **Steps:** (1) Train front-line staff to recognise requests in any wording. (2) Provide a web form and a monitored mailbox. (3) Apply the verification standard from the procedure.
- **Deliverables:** Intake channels; Verification standard
- **Evidence:** Request log entries with receipt dates
- **Laws:** Kenya DPA: Data Protection (General) Regulations 2021 (supports) [secondary] · GDPR: GDPR Arts. 12(2), 12(6) [primary] · UK GDPR: UK GDPR Arts. 12(2), 12(6) [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: obligations to PII principals · NIST Privacy Framework: CT.DM-P

### RTS-03 Request log and deadline tracking

Every request is logged with its deadline under the requester’s law and is answered on time.

- **Profile:** essential · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** continuous
- **Depends on:** RTS-02
- **Steps:** (1) Log every request with type, law and deadline. (2) Track extensions and their notified reasons. (3) Review overdue items weekly.
- **Deliverables:** Request log
- **Evidence:** Log showing timeliness
- **Laws:** Kenya DPA: Kenya DPA s.26; General Regulations 2021 [secondary] · GDPR: GDPR Art. 12(3) [primary] · UK GDPR: UK GDPR Art. 12(3) [primary]
- **Standards:** NIST Privacy Framework: CT.DM-P

### RTS-04 System search, extraction and erasure playbooks

For each system there is a tested way to find, export, correct and delete one person’s data.

- **Profile:** standard · **Phase:** Operate · **Owner:** IT · **Effort:** M · **Recurs:** annual
- **Depends on:** INV-01, RTS-01
- **Steps:** (1) Write a short playbook per system: search keys, export, correction and deletion steps. (2) Test with a dummy record. (3) Include backups and vendor systems.
- **Deliverables:** System playbooks
- **Evidence:** Test records
- **Laws:** GDPR: GDPR Arts. 15–20 (supports) [primary] · UK GDPR: UK GDPR Arts. 15–20 (supports) [primary]
- **Standards:** NIST Privacy Framework: CT.DM-P

### RTS-05 Complaints handling

People can complain to you about how their data is handled, complaints are acknowledged and investigated, and they are told how to escalate to the regulator.

- **Profile:** essential · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** continuous
- **Depends on:** RTS-01
- **Steps:** (1) Publish how to complain. (2) Acknowledge, investigate proportionately and keep the person informed. (3) Record each complaint, the steps taken and the outcome.
- **Deliverables:** Complaints procedure; Complaints log
- **Evidence:** Log with acknowledgement and outcome dates
- **Laws:** NDPA: NDPA s.46; GAID 2025 (complaints and remediation reviewed at audit) (supports) [secondary] · POPIA: POPIA s.74 (supports) [primary] · GDPR: GDPR Art. 77 (supports) [primary] · UK GDPR: DPA 2018 ss.164A–164B (inserted by the Data (Use and Access) Act 2025) [secondary]
- **Standards:** ISO/IEC 27701: Annex A.1: handling complaints · NIST Privacy Framework: CM.PO-P

### RTS-06 Rights and complaints review

Trends in requests and complaints are reviewed so root causes are fixed rather than handled one case at a time.

- **Profile:** standard · **Phase:** Assure · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** semi-annual
- **Depends on:** RTS-03, RTS-05
- **Steps:** (1) Report volumes, timeliness and outcomes. (2) Identify recurring causes. (3) Feed fixes into the plan.
- **Deliverables:** Rights review
- **Evidence:** Review notes
- **Standards:** ISO/IEC 27701: 9.1 Monitoring, measurement, analysis and evaluation · NIST Privacy Framework: GV.MT-P

## RSK · Risk, assessments and privacy by design

Finding privacy risk early and treating it before processing starts.

### RSK-01 Privacy risk method and register

Privacy risks to individuals and to the organisation are assessed with one method and held in a register with owners and treatments.

- **Profile:** standard · **Phase:** Foundation · **Owner:** Privacy lead (DPO) · **Effort:** M · **Recurs:** annual
- **Depends on:** GOV-02
- **Steps:** (1) Adopt a likelihood and severity scale focused on harm to people. (2) Align it with the enterprise risk method. (3) Populate the register from the record of processing and recent incidents.
- **Deliverables:** Risk method; Privacy risk register
- **Evidence:** Register with owners and treatment dates
- **Laws:** GDPR: GDPR Arts. 24, 32 (supports) [primary] · UK GDPR: UK GDPR Arts. 24, 32 (supports) [primary]
- **Standards:** ISO/IEC 27701: 6.1.2 Privacy risk assessment; 6.1.3 Privacy risk treatment · NIST Privacy Framework: ID.RA-P; GV.RM-P

### RSK-02 DPIA screening at intake

New projects, systems, vendors and changes are screened for DPIA triggers under each law in scope before work starts.

- **Profile:** essential · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** continuous
- **Depends on:** INV-02
- **Steps:** (1) Add a screening question set to project, procurement and change intake. (2) Include each law’s trigger list. (3) Record screening outcomes, including decisions not to do a DPIA.
- **Deliverables:** Screening questionnaire; Screening log
- **Evidence:** Screening records for recent projects
- **Laws:** NDPA: NDPA s.28; GAID 2025 Art. 28 [secondary] · POPIA: POPIA Regulations 2018 reg. 4(1)(b) [secondary] · Kenya DPA: Kenya DPA s.31 [primary] · Act 843: Data Protection Commission renewal requirements (supports) [secondary] · GDPR: GDPR Art. 35(1), (3)–(4) [primary] · UK GDPR: UK GDPR Art. 35(1), (3)–(4) [primary]
- **Standards:** ISO/IEC 27701: 8.2 Privacy risk assessment · NIST Privacy Framework: ID.RA-P

### RSK-03 DPIAs completed, signed off and reviewed

Required DPIAs are completed before processing, with DPO advice, risk treatment and sign-off, and reviewed when processing changes.

- **Profile:** essential · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** L · **Recurs:** per-event
- **Depends on:** RSK-02
- **Steps:** (1) Complete the DPIA with the project team. (2) Record DPO advice and the decision on it. (3) Track mitigations to completion. (4) Set a review date.
- **Deliverables:** Completed DPIAs
- **Evidence:** Signed DPIAs with mitigations tracked
- **Laws:** NDPA: NDPA s.28 [primary] · POPIA: POPIA Regulations 2018 reg. 4(1)(b) [secondary] · Kenya DPA: Kenya DPA s.31 [primary] · GDPR: GDPR Art. 35(7), (9), (11) [primary] · UK GDPR: UK GDPR Art. 35(7), (9), (11) [primary]
- **Standards:** ISO/IEC 27701: 8.2 Privacy risk assessment; 8.3 Privacy risk treatment · NIST Privacy Framework: ID.RA-P

### RSK-04 Privacy by design in change and development

Privacy requirements are built into product, system and process design, with defaults that collect and expose the least data.

- **Profile:** standard · **Phase:** Operate · **Owner:** Product and engineering · **Effort:** M · **Recurs:** continuous
- **Depends on:** RSK-02
- **Steps:** (1) Add privacy requirements to design templates and definitions of done. (2) Give engineers patterns: minimisation, pseudonymisation, retention hooks, access by role. (3) Review high-risk designs with the privacy lead.
- **Deliverables:** Privacy requirements checklist; Design review records
- **Evidence:** Checklists attached to recent releases
- **Laws:** NDPA: NDPA s.24; GAID 2025 (privacy by design) (supports) [secondary] · Kenya DPA: Kenya DPA s.41 [primary] · GDPR: GDPR Art. 25 [primary] · UK GDPR: UK GDPR Art. 25 [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: privacy by design and by default · NIST Privacy Framework: CT.DP-P; CT.DM-P

### RSK-05 Risk treatment and acceptance

Risks above appetite are treated or formally accepted by the right person, and residual risk is tracked.

- **Profile:** standard · **Phase:** Assure · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** quarterly
- **Depends on:** RSK-01
- **Steps:** (1) Set a risk appetite and acceptance authority. (2) Track treatment actions to completion. (3) Record formal acceptance of residual risk.
- **Deliverables:** Risk treatment plan; Acceptance records
- **Evidence:** Treatment status; Signed acceptances
- **Standards:** ISO/IEC 27701: 6.1.3 Privacy risk treatment; 8.3 Privacy risk treatment · NIST Privacy Framework: GV.RM-P

### RSK-06 Privacy threat modelling

High-risk systems are threat-modelled for privacy (linkability, identifiability, disclosure, unawareness, non-compliance) as well as security.

- **Profile:** advanced · **Phase:** Optimise · **Owner:** Information security · **Effort:** M · **Recurs:** per-event
- **Depends on:** RSK-04
- **Steps:** (1) Choose a method such as LINDDUN. (2) Model the highest-risk systems first. (3) Track resulting design changes.
- **Deliverables:** Threat models
- **Evidence:** Threat models with actions
- **Standards:** NIST Privacy Framework: ID.RA-P; CT.DP-P

## TPR · Third parties and transfers

Choosing, contracting, overseeing and exiting vendors, and lawful transfers abroad.

### TPR-01 Vendor and processor register

Every third party that receives or accesses personal data is listed with its role, service, location and contract status.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Procurement · **Effort:** S · **Recurs:** semi-annual
- **Depends on:** INV-01
- **Steps:** (1) Build the list from accounts payable and the system inventory. (2) Classify each as processor, sub-processor, joint or independent controller. (3) Record country and contract status.
- **Deliverables:** Vendor register
- **Evidence:** Register
- **Laws:** GDPR: GDPR Art. 30(1)(d) (supports) [primary] · UK GDPR: UK GDPR Art. 30(1)(d) (supports) [primary]
- **Standards:** ISO/IEC 27701: Annex A.3: information security in supplier relationships · NIST Privacy Framework: ID.DE-P

### TPR-02 Vendor due diligence before engagement

Processors are only engaged after checking they give sufficient guarantees, scaled to the data and risk involved, and the record of that check is kept.

- **Profile:** essential · **Phase:** Operate · **Owner:** Procurement · **Effort:** M · **Recurs:** per-event
- **Depends on:** TPR-01
- **Steps:** (1) Tier vendors by data sensitivity, volume and location. (2) Use a questionnaire proportionate to the tier. (3) Review certifications, breach history and sub-processors. (4) Record the decision and any conditions.
- **Deliverables:** Due diligence questionnaire; Completed assessments
- **Evidence:** Assessment records for current vendors
- **Laws:** NDPA: NDPA s.29 [primary]; GAID 2025 (due diligence on processors; records producible to the Commission) [secondary] · POPIA: POPIA ss.19(2), 21 [primary] · Kenya DPA: Kenya DPA s.42 [primary] · GDPR: GDPR Art. 28(1) [primary] · UK GDPR: UK GDPR Art. 28(1) [primary]
- **Standards:** ISO/IEC 27701: Annex A.3: information security in supplier relationships · NIST Privacy Framework: ID.DE-P

### TPR-03 Data processing agreements

Every processor relationship has a written agreement with the terms each law in scope requires.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Legal · **Effort:** M · **Recurs:** per-event
- **Depends on:** TPR-01
- **Steps:** (1) Prepare a DPA template that covers every law in scope. (2) Prioritise high-risk vendors. (3) Track signature and any negotiated deviations.
- **Deliverables:** DPA template; Signed DPAs
- **Evidence:** Signed DPA per processor
- **Laws:** NDPA: NDPA s.29 [primary] · POPIA: POPIA s.21 [primary] · Kenya DPA: Kenya DPA s.42 [primary] · GDPR: GDPR Art. 28(3)–(4) [primary] · UK GDPR: UK GDPR Art. 28(3)–(4) [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: contracts with PII processors · NIST Privacy Framework: ID.DE-P

### TPR-04 Cross-border transfer mechanisms

Every transfer outside a jurisdiction rests on a valid mechanism under that jurisdiction’s law, recorded against the flow.

- **Profile:** essential · **Phase:** Operate · **Owner:** Legal · **Effort:** M · **Recurs:** annual
- **Applies if:** Transfers personal data across borders, including to cloud services abroad
- **Depends on:** INV-02, TPR-01
- **Steps:** (1) List transfers from the flow map and vendor register. (2) Pick the mechanism per law: adequacy, approved clauses, binding corporate rules, or a derogation. (3) Put the mechanism in place and record it.
- **Deliverables:** Transfer register; Executed transfer instruments
- **Evidence:** Transfer register with mechanisms
- **Laws:** NDPA: NDPA ss.41–43 [primary] · POPIA: POPIA s.72 [primary] · Kenya DPA: Kenya DPA ss.48–50 [primary] · Act 843: Data Protection Bill 2025 (pending): transfer rules and transfer impact assessments (supports) [secondary] · PDPL: PDPL 151/2020 Arts. 14–16 (PDPC licence or permit) [secondary] · CDPA: CDPA 2021 s.28 [unverified] · GDPR: GDPR Arts. 44–49 [primary] · UK GDPR: UK GDPR Arts. 44–49 [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: PII transfer · NIST Privacy Framework: ID.DE-P

### TPR-05 Transfer impact assessments

Transfers relying on contractual safeguards are assessed for the destination’s laws and practices, with supplementary measures where needed.

- **Profile:** standard · **Phase:** Operate · **Owner:** Legal · **Effort:** M · **Recurs:** per-event
- **Applies if:** Transfers personal data across borders, including to cloud services abroad
- **Depends on:** TPR-04
- **Steps:** (1) Prioritise transfers of sensitive data and large volumes. (2) Assess destination access laws and practices. (3) Record supplementary measures and the conclusion.
- **Deliverables:** Transfer impact assessments
- **Evidence:** Signed assessments
- **Laws:** Kenya DPA: ODPC guidance on cross-border transfers (supports) [secondary] · GDPR: GDPR Art. 46 (supports) [primary] · UK GDPR: UK GDPR Art. 46 (supports) [primary]
- **Standards:** NIST Privacy Framework: ID.DE-P

### TPR-06 Sub-processor oversight

You know each processor’s sub-processors, approve changes as your contracts require, and can object.

- **Profile:** standard · **Phase:** Operate · **Owner:** Procurement · **Effort:** S · **Recurs:** continuous
- **Depends on:** TPR-03
- **Steps:** (1) Obtain sub-processor lists. (2) Subscribe to change notices. (3) Assess material changes.
- **Deliverables:** Sub-processor records
- **Evidence:** Current lists and change decisions
- **Laws:** NDPA: NDPA s.29 (supports) [secondary] · GDPR: GDPR Art. 28(2), (4) [primary] · UK GDPR: UK GDPR Art. 28(2), (4) [primary]
- **Standards:** ISO/IEC 27701: Annex A.2: engagement of a subcontractor · NIST Privacy Framework: ID.DE-P

### TPR-07 Periodic vendor review and exit

Vendors are re-reviewed on a cycle set by their risk tier, and data is returned or deleted with proof when a relationship ends.

- **Profile:** standard · **Phase:** Assure · **Owner:** Procurement · **Effort:** M · **Recurs:** annual
- **Depends on:** TPR-02
- **Steps:** (1) Set review cycles by tier. (2) Re-run due diligence at each review. (3) Obtain deletion or return certificates at exit.
- **Deliverables:** Review schedule; Exit certificates
- **Evidence:** Review records; Certificates
- **Laws:** POPIA: POPIA s.21 (supports) [primary] · GDPR: GDPR Art. 28(3)(g)–(h) [primary] · UK GDPR: UK GDPR Art. 28(3)(g)–(h) [primary]
- **Standards:** NIST Privacy Framework: ID.DE-P

### TPR-08 Data sharing and joint controller arrangements

Sharing with other controllers is documented, lawful and governed by an agreement setting each party’s responsibilities.

- **Profile:** standard · **Phase:** Operate · **Owner:** Legal · **Effort:** S · **Recurs:** per-event
- **Depends on:** LAW-01
- **Steps:** (1) List recurring sharing with other controllers. (2) Document the basis and conditions. (3) Sign data sharing or joint controller agreements.
- **Deliverables:** Data sharing agreements
- **Evidence:** Agreements
- **Laws:** GDPR: GDPR Art. 26 [primary] · UK GDPR: UK GDPR Art. 26; ICO data sharing code [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: joint PII controller · NIST Privacy Framework: ID.DE-P

### TPR-09 Processor duties to clients

When you act as processor, you follow client instructions, help them meet their obligations, notify them of breaches without delay, and control your own sub-processors.

- **Profile:** essential · **Phase:** Operate · **Owner:** Legal · **Effort:** M · **Recurs:** continuous
- **Applies if:** Processes personal data for clients (acts as processor)
- **Depends on:** INV-03
- **Steps:** (1) Standardise your own DPA offered to clients. (2) Set up an internal route for client instructions and assistance requests. (3) Set breach notification to clients in hours, not days.
- **Deliverables:** Processor DPA; Client assistance procedure
- **Evidence:** Signed client DPAs; Assistance log
- **Laws:** NDPA: NDPA s.29 [primary]; NDPA s.40(1) [secondary] · POPIA: POPIA ss.20–21 [primary] · Kenya DPA: Kenya DPA ss.42–43 [primary] · GDPR: GDPR Arts. 28, 33(2) [primary] · UK GDPR: UK GDPR Arts. 28, 33(2) [primary]
- **Standards:** ISO/IEC 27701: Annex A.2: PII processor controls · NIST Privacy Framework: ID.DE-P

## SEC · Security of processing

Technical and organisational measures appropriate to the risk.

### SEC-01 Security policy and risk-based measures

An information security policy and baseline set measures appropriate to the risk of the personal data processed.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Information security · **Effort:** M · **Recurs:** annual
- **Depends on:** GOV-01
- **Steps:** (1) Adopt a security policy and a baseline control set. (2) Map the baseline to the classification scheme. (3) Record gaps and treatments in the risk register.
- **Deliverables:** Information security policy; Security baseline
- **Evidence:** Approved policy; Baseline assessment
- **Laws:** NDPA: NDPA s.39 [primary] · POPIA: POPIA s.19 [primary] · Kenya DPA: Kenya DPA s.41 [secondary] · Act 843: Act 843 (security measures) [secondary] · CDPA: CDPA 2021 (security of processing) [unverified] · GDPR: GDPR Art. 32 [primary] · UK GDPR: UK GDPR Art. 32 [primary]
- **Standards:** ISO/IEC 27701: Annex A.3: shared information security controls · NIST Privacy Framework: PR.PO-P
- **Notes:** If you hold or are building towards ISO/IEC 27001, reuse its policy and Statement of Applicability rather than writing a parallel set.

### SEC-02 Access control, least privilege and MFA

Access to personal data is granted by role, reviewed regularly and protected by multi-factor authentication on remote and privileged access.

- **Profile:** essential · **Phase:** Foundation · **Owner:** IT · **Effort:** M · **Recurs:** quarterly
- **Depends on:** INV-01
- **Steps:** (1) Define roles and what each may access. (2) Enforce MFA on email, remote access, admin and systems with sensitive data. (3) Review access quarterly for high-risk systems and at every leaver.
- **Deliverables:** Access control standard; Access reviews
- **Evidence:** MFA coverage report; Access review records
- **Laws:** NDPA: NDPA s.39 (supports) [primary] · POPIA: POPIA s.19 (supports) [primary] · GDPR: GDPR Art. 32(1) (supports) [primary] · UK GDPR: UK GDPR Art. 32(1) (supports) [primary]
- **Standards:** ISO/IEC 27701: Annex A.3: access control · NIST Privacy Framework: PR.AC-P

### SEC-03 Encryption in transit and at rest

Personal data is encrypted in transit everywhere and at rest wherever the classification requires it, with keys managed properly.

- **Profile:** essential · **Phase:** Operate · **Owner:** IT · **Effort:** M · **Recurs:** annual
- **Depends on:** INV-05
- **Steps:** (1) Enforce TLS on all services. (2) Encrypt laptops, mobile devices, databases and backups holding sensitive data. (3) Document key management.
- **Deliverables:** Encryption standard
- **Evidence:** Coverage report
- **Laws:** NDPA: NDPA s.39 (supports) [primary] · GDPR: GDPR Art. 32(1)(a) (supports) [primary] · UK GDPR: UK GDPR Art. 32(1)(a) (supports) [primary]
- **Standards:** ISO/IEC 27701: Annex A.3: use of cryptography · NIST Privacy Framework: PR.DS-P
- **Notes:** Encryption also matters for breach duties: several laws relax notification to individuals when data was unintelligible.

### SEC-04 Logging and monitoring of access to personal data

Access to systems holding personal data is logged, logs are protected, and unusual access is detected and investigated.

- **Profile:** standard · **Phase:** Operate · **Owner:** Information security · **Effort:** M · **Recurs:** continuous
- **Depends on:** SEC-02
- **Steps:** (1) Turn on access logging for high-risk systems. (2) Centralise and protect logs. (3) Set alerts for bulk export and out-of-hours access.
- **Deliverables:** Logging standard; Alert rules
- **Evidence:** Log coverage; Alert investigations
- **Laws:** GDPR: GDPR Art. 32 (supports) [primary] · UK GDPR: UK GDPR Art. 32 (supports) [primary]
- **Standards:** ISO/IEC 27701: Annex A.3: logging and monitoring · NIST Privacy Framework: PR.PT-P

### SEC-05 Backup, resilience and restoration

Personal data can be restored in time after an incident, and restores are tested.

- **Profile:** standard · **Phase:** Operate · **Owner:** IT · **Effort:** M · **Recurs:** semi-annual
- **Depends on:** INV-01
- **Steps:** (1) Back up systems according to their criticality. (2) Protect backups from ransomware. (3) Test restores twice a year.
- **Deliverables:** Backup standard; Restore test results
- **Evidence:** Latest restore test
- **Laws:** GDPR: GDPR Art. 32(1)(b)–(c) [primary] · UK GDPR: UK GDPR Art. 32(1)(b)–(c) [primary]
- **Standards:** ISO/IEC 27701: Annex A.3: information backup · NIST Privacy Framework: PR.PT-P

### SEC-06 Security testing and vulnerability management

Systems holding personal data are patched, scanned and tested, and the effectiveness of measures is evaluated regularly.

- **Profile:** standard · **Phase:** Assure · **Owner:** Information security · **Effort:** M · **Recurs:** annual
- **Depends on:** SEC-01
- **Steps:** (1) Patch within defined timelines. (2) Scan for vulnerabilities monthly. (3) Commission a penetration test of internet-facing systems each year.
- **Deliverables:** Vulnerability reports; Penetration test report
- **Evidence:** Latest reports and remediation status
- **Laws:** POPIA: POPIA s.19(2) (supports) [primary] · GDPR: GDPR Art. 32(1)(d) [primary] · UK GDPR: UK GDPR Art. 32(1)(d) [primary]
- **Standards:** ISO/IEC 27701: Annex A.3: management of technical vulnerabilities · NIST Privacy Framework: PR.PO-P

### SEC-07 Endpoint, device and physical security

Laptops, phones, removable media, paper files and premises are protected in line with the data they hold.

- **Profile:** standard · **Phase:** Operate · **Owner:** IT · **Effort:** M · **Recurs:** annual
- **Depends on:** SEC-01
- **Steps:** (1) Manage devices centrally with encryption and remote wipe. (2) Set clear-desk and secure-print rules. (3) Control access to records rooms and data centres.
- **Deliverables:** Device and physical security standard
- **Evidence:** Device management report; Site checks
- **Laws:** POPIA: POPIA s.19 (supports) [primary] · GDPR: GDPR Art. 32 (supports) [primary] · UK GDPR: UK GDPR Art. 32 (supports) [primary]
- **Standards:** ISO/IEC 27701: Annex A.3: physical and endpoint controls · NIST Privacy Framework: PR.PT-P; PR.MA-P

### SEC-08 Pseudonymisation and privacy-enhancing technologies

Analytics, testing and AI work use pseudonymised, synthetic or aggregated data wherever the purpose allows.

- **Profile:** advanced · **Phase:** Optimise · **Owner:** Data science · **Effort:** L · **Recurs:** annual
- **Depends on:** RSK-04
- **Steps:** (1) Identify uses that do not need direct identifiers. (2) Provide pseudonymisation and masking tools. (3) Ban production personal data in test environments without approval.
- **Deliverables:** PET standard; Masked test datasets
- **Evidence:** Approvals and tool coverage
- **Laws:** Kenya DPA: ODPC guidance on privacy-enhancing technologies (consultation) (supports) [secondary] · GDPR: GDPR Arts. 25, 32(1)(a) (supports) [primary] · UK GDPR: UK GDPR Arts. 25, 32(1)(a) (supports) [primary]
- **Standards:** NIST Privacy Framework: CT.DP-P

## LIF · Data lifecycle

Collecting only what is needed, keeping it accurate, and disposing of it on time.

### LIF-01 Retention schedule

Each category of records has a retention period with its reason, trigger and disposal method, and systems are set to follow it.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Legal · **Effort:** M · **Recurs:** annual
- **Depends on:** INV-02
- **Steps:** (1) Collect statutory retention periods (tax, employment, sector rules). (2) Set periods for each activity in the record. (3) Approve the schedule and assign owners for disposal.
- **Deliverables:** Retention schedule
- **Evidence:** Approved schedule; Retention entries in the record
- **Laws:** NDPA: NDPA s.24(1)(d) [secondary]; GAID 2025 (retention) (supports) [secondary] · POPIA: POPIA s.14 [primary] · Kenya DPA: Kenya DPA s.39 [primary] · GDPR: GDPR Art. 5(1)(e) [primary] · UK GDPR: UK GDPR Art. 5(1)(e) [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: PII retention · NIST Privacy Framework: CT.DM-P

### LIF-02 Secure deletion and disposal

Data past its retention period is deleted, anonymised or securely destroyed, including in backups and with vendors, and disposal is recorded.

- **Profile:** essential · **Phase:** Operate · **Owner:** IT · **Effort:** M · **Recurs:** quarterly
- **Depends on:** LIF-01
- **Steps:** (1) Automate deletion where systems allow. (2) Run scheduled purges where they do not. (3) Use certified destruction for paper and devices. (4) Record what was disposed of.
- **Deliverables:** Disposal procedure; Disposal log
- **Evidence:** Purge records; Destruction certificates
- **Laws:** POPIA: POPIA s.14(4)–(5) [primary] · Kenya DPA: Kenya DPA s.39 [primary] · GDPR: GDPR Arts. 5(1)(e), 17 (supports) [primary] · UK GDPR: UK GDPR Arts. 5(1)(e), 17 (supports) [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: PII disposal · NIST Privacy Framework: CT.DM-P

### LIF-03 Data minimisation reviews

Forms, systems and datasets collect and keep only what each purpose needs, checked periodically.

- **Profile:** standard · **Phase:** Assure · **Owner:** Business process owners · **Effort:** S · **Recurs:** annual
- **Depends on:** INV-02
- **Steps:** (1) Review collection forms against purposes. (2) Remove fields that are not needed. (3) Record the review.
- **Deliverables:** Minimisation reviews
- **Evidence:** Review records
- **Laws:** NDPA: NDPA s.24(1)(c) (supports) [secondary] · POPIA: POPIA s.10 (supports) [primary] · GDPR: GDPR Art. 5(1)(c) (supports) [primary] · UK GDPR: UK GDPR Art. 5(1)(c) (supports) [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: limit collection · NIST Privacy Framework: CT.DP-P

### LIF-04 Data quality and accuracy

Personal data used for decisions is accurate and up to date, and people can correct it easily.

- **Profile:** standard · **Phase:** Assure · **Owner:** Business process owners · **Effort:** S · **Recurs:** annual
- **Depends on:** INV-02
- **Steps:** (1) Identify data used for decisions about people. (2) Add validation and refresh routines. (3) Link correction requests to source systems.
- **Deliverables:** Data quality checks
- **Evidence:** Quality reports
- **Laws:** NDPA: NDPA s.24(1)(e) (supports) [secondary] · POPIA: POPIA s.16 (supports) [primary] · GDPR: GDPR Art. 5(1)(d) (supports) [primary] · UK GDPR: UK GDPR Art. 5(1)(d) (supports) [primary]
- **Standards:** ISO/IEC 27701: Annex A.1: accuracy and quality · NIST Privacy Framework: CT.DM-P

### LIF-05 Archiving, legal holds and research use

Archived data, legal holds and research or statistical uses are governed so they do not become indefinite retention.

- **Profile:** advanced · **Phase:** Optimise · **Owner:** Legal · **Effort:** S · **Recurs:** annual
- **Depends on:** LIF-01
- **Steps:** (1) Define when data moves to archive and who can access it. (2) Issue and release legal holds formally. (3) Apply research safeguards such as pseudonymisation.
- **Deliverables:** Archive and legal hold procedure
- **Evidence:** Hold register
- **Laws:** GDPR: GDPR Art. 89 (supports) [primary] · UK GDPR: UK GDPR Art. 89 (supports) [primary]
- **Standards:** NIST Privacy Framework: CT.DM-P

## INC · Incidents and breaches

Detecting, assessing, notifying and learning from personal data breaches.

### INC-01 Breach response plan and team

A tested plan names the response team, decision-makers, external advisers and each law’s notification test and clock.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Privacy lead (DPO) · **Effort:** M · **Recurs:** annual
- **Depends on:** GOV-02
- **Steps:** (1) Set roles: incident lead, privacy lead, legal, communications, IT. (2) Write each law’s notification test, clock and form into the plan. (3) Pre-arrange forensic and legal support.
- **Deliverables:** Breach response plan
- **Evidence:** Approved plan with contact list
- **Laws:** NDPA: NDPA s.40 [primary] · POPIA: POPIA s.22 [primary] · Kenya DPA: Kenya DPA s.43 [primary] · Act 843: Act 843 (notification of security compromises) [secondary] · PDPL: PDPL 151/2020 and Executive Regulations [secondary] · CDPA: CDPA 2021; SI 155 of 2024 [secondary] · GDPR: GDPR Arts. 33–34 [primary] · UK GDPR: UK GDPR Arts. 33–34 [primary]
- **Standards:** ISO/IEC 27701: Annex A.3: information security incident management · NIST Privacy Framework: PR.PO-P; CM.AW-P

### INC-02 Detection and internal reporting

Staff and vendors report suspected breaches immediately through a known channel, and the clock is started correctly.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Information security · **Effort:** S · **Recurs:** continuous
- **Depends on:** INC-01
- **Steps:** (1) Publish one reporting channel. (2) Tell staff what to report and how fast. (3) Require vendors to report within hours.
- **Deliverables:** Reporting channel; Staff guidance
- **Evidence:** Incident records with discovery and awareness times
- **Laws:** GDPR: GDPR Art. 33(1)–(2) [primary] · UK GDPR: UK GDPR Art. 33(1)–(2) [primary]
- **Standards:** ISO/IEC 27701: Annex A.3: information security event reporting · NIST Privacy Framework: CM.AW-P

### INC-03 Breach assessment and regulator notification

Each incident is assessed against each affected law’s test, and regulators are notified on time with the required content, or the decision not to notify is recorded.

- **Profile:** essential · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** M · **Recurs:** per-event
- **Depends on:** INC-02
- **Steps:** (1) Assess likelihood and severity of harm. (2) Apply each law’s test and start each clock. (3) Notify with the required content, then update as facts emerge.
- **Deliverables:** Breach assessments; Regulator notifications
- **Evidence:** Assessments and notification receipts
- **Laws:** NDPA: NDPA s.40 [primary] · POPIA: POPIA s.22 [primary] · Kenya DPA: Kenya DPA s.43 [primary] · PDPL: PDPL 151/2020 [secondary] · CDPA: CDPA 2021 [secondary] · GDPR: GDPR Art. 33 [primary] · UK GDPR: UK GDPR Art. 33 [primary]
- **Standards:** ISO/IEC 27701: Annex A.3: response to information security incidents · NIST Privacy Framework: CM.AW-P

### INC-04 Notifying affected people

Where the law requires it, affected people are told promptly in plain language what happened and what they can do.

- **Profile:** essential · **Phase:** Operate · **Owner:** Legal · **Effort:** S · **Recurs:** per-event
- **Depends on:** INC-03
- **Steps:** (1) Prepare notice templates. (2) Decide channel and timing. (3) Set up a support line for larger incidents.
- **Deliverables:** Notice templates
- **Evidence:** Notices sent
- **Laws:** NDPA: NDPA s.40 [primary] · POPIA: POPIA s.22 [primary] · Kenya DPA: Kenya DPA s.43 [primary] · PDPL: PDPL 151/2020 [secondary] · GDPR: GDPR Art. 34 [primary] · UK GDPR: UK GDPR Art. 34 [primary]
- **Standards:** NIST Privacy Framework: CM.AW-P

### INC-05 Breach register

Every personal data breach is recorded, notifiable or not, with facts, effects, decisions and remedial action.

- **Profile:** essential · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** continuous
- **Depends on:** INC-02
- **Steps:** (1) Log every incident. (2) Record the notification decision and its reasons. (3) Close with root cause and lessons.
- **Deliverables:** Breach register
- **Evidence:** Register
- **Laws:** NDPA: GAID 2025 (breach records reviewed at audit) (supports) [secondary] · GDPR: GDPR Art. 33(5) [primary] · UK GDPR: UK GDPR Art. 33(5) [primary]
- **Standards:** NIST Privacy Framework: PR.PO-P

### INC-06 Breach exercises and lessons learned

The plan is rehearsed at least once a year and improved after every significant incident or exercise.

- **Profile:** standard · **Phase:** Assure · **Owner:** Information security · **Effort:** S · **Recurs:** annual
- **Depends on:** INC-01
- **Steps:** (1) Run a tabletop exercise with a realistic scenario across several laws. (2) Record gaps and fix them.
- **Deliverables:** Exercise report
- **Evidence:** Exercise report with actions
- **Standards:** ISO/IEC 27701: Annex A.3: learning from incidents · NIST Privacy Framework: PR.PO-P

## PPL · People and culture

Training, competence and the behaviours that make controls work.

### PPL-01 Privacy training for all staff

Everyone with access to personal data completes induction and annual refresher training, and completion is tracked.

- **Profile:** essential · **Phase:** Foundation · **Owner:** HR · **Effort:** M · **Recurs:** annual
- **Depends on:** GOV-04
- **Steps:** (1) Build a short course on the policy, recognising requests and reporting breaches. (2) Make it part of onboarding. (3) Track completion; chase below 90 percent.
- **Deliverables:** Training course; Completion records
- **Evidence:** Completion report
- **Laws:** NDPA: GAID 2025 (training) (supports) [secondary] · POPIA: POPIA Regulations 2018 reg. 4(1)(e) (supports) [secondary] · GDPR: GDPR Art. 39(1)(b) (supports) [primary] · UK GDPR: UK GDPR Art. 39(1)(b) (supports) [primary]
- **Standards:** ISO/IEC 27701: 7.2 Competence; 7.3 Awareness · NIST Privacy Framework: GV.AT-P

### PPL-02 Confidentiality and the employee lifecycle

Staff and contractors are bound to confidentiality, and joiner, mover and leaver steps protect personal data.

- **Profile:** essential · **Phase:** Foundation · **Owner:** HR · **Effort:** S · **Recurs:** continuous
- **Steps:** (1) Add confidentiality terms to contracts. (2) Link HR events to access changes. (3) Recover devices and data at exit.
- **Deliverables:** Confidentiality clauses; Joiner-mover-leaver procedure
- **Evidence:** Signed contracts; Leaver checklists
- **Laws:** POPIA: POPIA s.20 (supports) [primary] · GDPR: GDPR Arts. 29, 32(4) [primary] · UK GDPR: UK GDPR Arts. 29, 32(4) [primary]
- **Standards:** ISO/IEC 27701: Annex A.3: people controls · NIST Privacy Framework: GV.AT-P

### PPL-03 Role-based training for high-risk roles

Roles with elevated risk (HR, customer service, marketing, engineering, data science) get training specific to their work.

- **Profile:** standard · **Phase:** Assure · **Owner:** Privacy lead (DPO) · **Effort:** M · **Recurs:** annual
- **Depends on:** PPL-01
- **Steps:** (1) Identify high-risk roles. (2) Build short role modules. (3) Track completion separately.
- **Deliverables:** Role modules
- **Evidence:** Completion by role
- **Standards:** ISO/IEC 27701: 7.2 Competence · NIST Privacy Framework: GV.AT-P

### PPL-04 Privacy lead competence and professional development

The privacy lead and team hold the credentials the law or regulator expects and keep them current.

- **Profile:** standard · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** annual
- **Depends on:** GOV-02
- **Steps:** (1) Check credential requirements in each jurisdiction. (2) Plan certification and continuing education. (3) Keep evidence on file.
- **Deliverables:** Competence record
- **Evidence:** Certificates; CPD log
- **Laws:** NDPA: GAID 2025 (DPO credentials); NDPC CPD framework for certified DPOs (June 2026) [secondary] · CDPA: SI 155 of 2024 (DPO certification course approved by the authority) [secondary] · GDPR: GDPR Art. 37(5) [primary] · UK GDPR: UK GDPR Art. 37(5) [primary]
- **Standards:** ISO/IEC 27701: 7.2 Competence · NIST Privacy Framework: GV.AT-P

### PPL-05 Awareness and culture

Privacy is visible beyond annual training through campaigns, champion activity and leadership messages, and culture is measured.

- **Profile:** standard · **Phase:** Optimise · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** quarterly
- **Depends on:** GOV-03, PPL-01
- **Steps:** (1) Plan a quarterly awareness calendar. (2) Use incidents and requests as teaching material. (3) Survey awareness once a year.
- **Deliverables:** Awareness plan
- **Evidence:** Campaign records; Survey results
- **Standards:** ISO/IEC 27701: 7.3 Awareness; 7.4 Communication · NIST Privacy Framework: GV.AT-P

## AIG · AI and automated decisions

Governing AI systems and automated decisions that use personal data or affect people.

### AIG-01 AI system inventory

Every AI system and generative AI tool in use or development is listed with its purpose, owner, data, vendor and decision role.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** quarterly
- **Applies if:** Uses AI or makes automated decisions about people
- **Depends on:** INV-01
- **Steps:** (1) Survey teams and procurement for AI use, including free generative tools. (2) Record each system with its data and decision role. (3) Link systems to processing activities.
- **Deliverables:** AI inventory
- **Evidence:** Inventory
- **Laws:** NDPA: NDPA s.37 (supports) [secondary] · GDPR: EU AI Act Art. 26 (deployer obligations) [primary]
- **Standards:** ISO/IEC 42001: 6.1 Actions to address risks and opportunities; Annex A: AI system inventory and resources · NIST Privacy Framework: ID.IM-P

### AIG-02 AI acceptable use policy

Staff know which AI tools they may use, with what data, and what needs approval.

- **Profile:** essential · **Phase:** Foundation · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** annual
- **Applies if:** Uses AI or makes automated decisions about people
- **Depends on:** GOV-04
- **Steps:** (1) List approved tools and prohibited data types. (2) Set an approval route for new tools. (3) Train staff on it.
- **Deliverables:** AI use policy
- **Evidence:** Approved policy; Training records
- **Laws:** GDPR: EU AI Act Art. 4 (AI literacy) (supports) [primary]
- **Standards:** ISO/IEC 42001: 5.2 AI policy

### AIG-03 AI risk classification and impact assessment

Each AI system is classified against the laws in scope and assessed for impact on people before deployment.

- **Profile:** standard · **Phase:** Operate · **Owner:** Privacy lead (DPO) · **Effort:** M · **Recurs:** per-event
- **Applies if:** Uses AI or makes automated decisions about people
- **Depends on:** AIG-01, RSK-02
- **Steps:** (1) Classify each system (prohibited, high risk, limited, minimal; and data protection risk). (2) Extend the DPIA with model purpose, affected groups, bias and oversight. (3) Sign off before production.
- **Deliverables:** AI classifications; AI impact assessments
- **Evidence:** Assessments
- **Laws:** NDPA: NDPA ss.28, 37 (supports) [secondary] · Kenya DPA: Kenya DPA ss.31, 35 (supports) [secondary] · GDPR: EU AI Act Arts. 6, 27; GDPR Art. 35 [primary]
- **Standards:** ISO/IEC 42001: 6.1.4 AI system impact assessment; 8.4 AI system impact assessment

### AIG-04 Automated decisions: safeguards and human review

Decisions with legal or similarly significant effects made solely by automated means have a lawful basis, are explained, and can be contested before a human.

- **Profile:** essential · **Phase:** Operate · **Owner:** Product and engineering · **Effort:** M · **Recurs:** annual
- **Applies if:** Uses AI or makes automated decisions about people
- **Depends on:** AIG-01
- **Steps:** (1) Identify solely automated decisions with significant effects. (2) Confirm the basis and safeguards each law requires. (3) Provide explanation, a contest route and human review.
- **Deliverables:** Automated decision register; Contest and review procedure
- **Evidence:** Review records
- **Laws:** NDPA: NDPA s.37 [primary] · POPIA: POPIA s.71 [primary] · Kenya DPA: Kenya DPA s.35 [primary] · CDPA: CDPA 2021 s.25 [unverified] · GDPR: GDPR Art. 22 [primary] · UK GDPR: UK GDPR Arts. 22A–22D [secondary]
- **Standards:** ISO/IEC 42001: Annex A: use of AI systems; information for interested parties · NIST Privacy Framework: CT.DM-P

### AIG-05 Training and input data governance

Personal data used to train, fine-tune or prompt AI systems has a lawful basis, is minimised and is recorded.

- **Profile:** standard · **Phase:** Operate · **Owner:** Data science · **Effort:** M · **Recurs:** per-event
- **Applies if:** Uses AI or makes automated decisions about people
- **Depends on:** AIG-01, LAW-01
- **Steps:** (1) Record data sources for each model. (2) Confirm basis and notice coverage for training use. (3) Minimise and pseudonymise before training.
- **Deliverables:** Dataset records
- **Evidence:** Dataset documentation
- **Laws:** GDPR: GDPR Arts. 5, 6; EU AI Act Art. 10 (supports) [primary] · UK GDPR: UK GDPR Arts. 5, 6 (supports) [primary]
- **Standards:** ISO/IEC 42001: Annex A: data for AI systems

### AIG-06 AI vendor and model provider due diligence

AI vendors are assessed for training on customer data, retention, location, security and model documentation before use.

- **Profile:** standard · **Phase:** Operate · **Owner:** Procurement · **Effort:** S · **Recurs:** per-event
- **Applies if:** Uses AI or makes automated decisions about people
- **Depends on:** TPR-02, AIG-01
- **Steps:** (1) Add AI questions to vendor due diligence. (2) Contract against training on your data where needed. (3) Record model cards or equivalent documentation.
- **Deliverables:** AI vendor assessments
- **Evidence:** Assessments and contract terms
- **Laws:** NDPA: NDPA s.29 (supports) [secondary] · GDPR: EU AI Act Art. 25 (value chain) (supports) [primary]
- **Standards:** ISO/IEC 42001: Annex A: third-party and customer relationships

### AIG-07 AI monitoring, validation and bias testing

AI systems affecting people are validated before release and monitored for accuracy, drift and unfair outcomes.

- **Profile:** advanced · **Phase:** Assure · **Owner:** Data science · **Effort:** L · **Recurs:** quarterly
- **Applies if:** Uses AI or makes automated decisions about people
- **Depends on:** AIG-03
- **Steps:** (1) Define validation metrics including fairness across groups. (2) Monitor in production. (3) Re-validate after material changes.
- **Deliverables:** Validation reports; Monitoring dashboards
- **Evidence:** Latest validation and monitoring results
- **Laws:** GDPR: EU AI Act Arts. 9, 15, 26(5) (supports) [primary]
- **Standards:** ISO/IEC 42001: 9.1 Monitoring, measurement, analysis and evaluation; Annex A: AI system life cycle

## ASR · Assurance and improvement

Monitoring, audit, management review and continual improvement.

### ASR-01 Control self-assessment

Control owners confirm twice a year that their controls operate, with evidence, and gaps feed the plan.

- **Profile:** standard · **Phase:** Assure · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** semi-annual
- **Depends on:** GOV-07
- **Steps:** (1) Send owners their controls and evidence requirements. (2) Review responses and sample evidence. (3) Raise gaps as tasks.
- **Deliverables:** Self-assessment results
- **Evidence:** Completed self-assessments
- **Laws:** NDPA: GAID 2025 (annual audit preparation) (supports) [secondary]
- **Standards:** ISO/IEC 27701: 9.1 Monitoring, measurement, analysis and evaluation · NIST Privacy Framework: GV.MT-P

### ASR-02 Internal audit of the programme

An independent internal audit tests the programme against this framework and the laws in scope on a planned cycle.

- **Profile:** standard · **Phase:** Assure · **Owner:** Internal audit · **Effort:** M · **Recurs:** annual
- **Depends on:** ASR-01
- **Steps:** (1) Plan audits by risk. (2) Audit with someone independent of the controls. (3) Report findings to management and track them.
- **Deliverables:** Audit plan; Audit reports
- **Evidence:** Reports and finding status
- **Laws:** GDPR: GDPR Art. 39(1)(b) (supports) [primary] · UK GDPR: UK GDPR Art. 39(1)(b) (supports) [primary]
- **Standards:** ISO/IEC 27701: 9.2 Internal audit · NIST Privacy Framework: GV.MT-P

### ASR-03 Management review

Top management reviews the programme at planned intervals and decides on changes, resources and improvement.

- **Profile:** standard · **Phase:** Assure · **Owner:** Board or executive · **Effort:** S · **Recurs:** annual
- **Depends on:** GOV-05, ASR-02
- **Steps:** (1) Prepare inputs: audit results, indicators, incidents, regulatory changes. (2) Hold the review. (3) Record decisions and actions.
- **Deliverables:** Management review minutes
- **Evidence:** Minutes
- **Standards:** ISO/IEC 27701: 9.3 Management review · NIST Privacy Framework: GV.MT-P

### ASR-04 Nonconformity and corrective action

Findings from audits, incidents, complaints and regulators are corrected at the root cause and checked for effectiveness.

- **Profile:** standard · **Phase:** Assure · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** continuous
- **Depends on:** ASR-01
- **Steps:** (1) Log each finding. (2) Analyse root cause. (3) Track corrective action to verified closure.
- **Deliverables:** Corrective action log
- **Evidence:** Closed actions with verification
- **Standards:** ISO/IEC 27701: 10.2 Nonconformity and corrective action · NIST Privacy Framework: GV.MT-P

### ASR-05 External audit readiness

The organisation can pass an external audit or regulator inspection without a scramble, with evidence current for every control.

- **Profile:** essential · **Phase:** Assure · **Owner:** Privacy lead (DPO) · **Effort:** M · **Recurs:** annual
- **Depends on:** GOV-07
- **Steps:** (1) Run a mock audit against the regulator’s checklist. (2) Close gaps before the audit window. (3) Brief the people who will be interviewed.
- **Deliverables:** Mock audit report
- **Evidence:** Mock audit and remediation
- **Laws:** NDPA: GAID 2025 (annual audit by a licensed DPCO for upper-tier controllers) [secondary] · Kenya DPA: ODPC compliance audits (draft Conduct of Compliance Audit regulations) (supports) [secondary]
- **Standards:** ISO/IEC 27701: 9.2 Internal audit

### ASR-06 Continual improvement and benchmarking

The programme measures its maturity each year, benchmarks itself, and sets the next year’s plan from the results.

- **Profile:** advanced · **Phase:** Optimise · **Owner:** Privacy lead (DPO) · **Effort:** S · **Recurs:** annual
- **Depends on:** ASR-03
- **Steps:** (1) Score maturity by domain. (2) Compare with peers where data allows. (3) Set targets and update the plan.
- **Deliverables:** Maturity assessment; Next-year plan
- **Evidence:** Year-on-year maturity scores
- **Standards:** ISO/IEC 27701: 10.1 Continual improvement · NIST Privacy Framework: GV.MT-P

### ASR-07 Certification

The privacy information management system is certified by an accredited body and the certificate is maintained.

- **Profile:** standard · **Phase:** Optimise · **Owner:** Privacy lead (DPO) · **Effort:** L · **Recurs:** annual
- **Applies if:** Aims to certify the programme (ISO/IEC 27701)
- **Depends on:** ASR-02, ASR-03, ASR-04
- **Steps:** (1) Define the certification scope. (2) Produce the Statement of Applicability against Annex A. (3) Complete stage 1 and stage 2 audits. (4) Plan surveillance audits.
- **Deliverables:** Statement of Applicability; Certificate
- **Evidence:** Certificate and audit reports
- **Standards:** ISO/IEC 27701: Clauses 4–10; Annex A
- **Notes:** ISO/IEC 27701:2025 can be certified on its own. Holders of 2019 certificates must transition by October 2028.

