import { describe, expect, it } from 'vitest';
import {
  COLLECTION_META, PACKS, WORKSPACE_FIELDS, actionPlan, activityFacts, assessmentMarkdown, auditReturnDue, breachDuties, classifyAI,
  complianceReportMarkdown, evaluateJurisdiction, formatDuration, harmAssessment, isVisible, keRegistrationRequired, migrateDataset,
  ngTier, requestStatus, reviewAssessment, ropaCsv, sampleDataset, suggestedRisks, upcoming, validateRecord, vendorRisk,
  type Dataset, type JurisdictionCode,
} from '../src/index.js';

const NOW = new Date('2026-10-16T12:00:00Z');
let n = 0;
const ids = () => `id-${++n}`;
const sample = (): Dataset => sampleDataset(NOW, ids);
const req = (ds: Dataset, code: JurisdictionCode, key: string) => evaluateJurisdiction(code, ds, NOW).requirements.find((r) => r.key === key);

describe('jurisdiction gating', () => {
  it('only evaluates selected jurisdictions', () => {
    const ds = sample();
    ds.workspace.jurisdictions = ['ZA'];
    const keys = evaluateJurisdiction('ZA', ds, NOW).requirements.map((r) => r.key);
    expect(keys).not.toContain('ng-registration');
    expect(keys).not.toContain('ng-return');
    expect(keys).toContain('za-io');
    expect(keys).toContain('za-paia');
    expect(actionPlan(ds, NOW).every((a) => a.jurisdictions.every((j) => j === 'ZA'))).toBe(true);
  });
  it('keeps hidden jurisdiction values but ignores them', () => {
    const ds = sample();
    ds.workspace.jurisdictions = ['ZA'];
    expect(ds.workspace.jx.NG?.registrationNumber).toBe('SAMPLE-NG-0001');
    expect(upcoming(ds, NOW, 365).some((d) => d.code === 'NG')).toBe(false);
  });
  it('limits jurisdiction choices on records to the entity’s jurisdictions', () => {
    const ws = sample().workspace; ws.jurisdictions = ['KE'];
    const r = validateRecord(COLLECTION_META.requests.fields, { requester: 'x', type: 'access', jurisdiction: 'NG', receivedAt: NOW.toISOString() }, [], { workspace: ws });
    expect(r.ok).toBe(false);
    expect(r.errors.jurisdiction).toBeDefined();
  });
  it('offers lawful bases with each law’s citation and flags gaps', () => {
    const f = COLLECTION_META.activities.fields.find((x) => x.key === 'lawfulBasis')!;
    const ws = sample().workspace; ws.jurisdictions = ['NG', 'EG'];
    const li = f.optionsFn!({ workspace: ws }).find((o) => o.value === 'legitimate-interests')!;
    expect(li.label).toContain('NDPA s.25(1)(b)');
    expect(li.label).toContain('not in PDPL');
  });
});

describe('sensitive data differs by law', () => {
  it('treats marital and family data as sensitive in Kenya only', () => {
    const ds = sample();
    const credit = ds.activities.find((a) => a.name === 'Loan credit scoring')!;
    const f = activityFacts(credit, ds);
    expect(f.perJx.find((p) => p.code === 'KE')!.sensitive).toEqual(['marital-family']);
    expect(f.perJx.find((p) => p.code === 'NG')!.sensitive).toEqual([]);
    expect(req(ds, 'KE', 'special-condition')!.status).toBe('missing');
    expect(req(ds, 'NG', 'special-condition')!.detail).not.toContain('Loan credit scoring');
  });
  it('shows the special-condition field only when needed', () => {
    const f = COLLECTION_META.activities.fields.find((x) => x.key === 'specialCondition')!;
    const ws = sample().workspace;
    expect(isVisible(f, { dataCategoryIds: ['name'], jurisdictions: ['NG'] }, { workspace: ws })).toBe(false);
    expect(isVisible(f, { dataCategoryIds: ['marital-family'], jurisdictions: ['NG'] }, { workspace: ws })).toBe(false);
    expect(isVisible(f, { dataCategoryIds: ['marital-family'], jurisdictions: ['KE'] }, { workspace: ws })).toBe(true);
    expect(isVisible(f, { dataCategoryIds: ['criminal'], jurisdictions: ['ZA'] }, { workspace: ws })).toBe(true);
  });
});

describe('registration and officers', () => {
  it('applies the Kenyan exemption only outside listed sectors', () => {
    const ws = sample().workspace;
    expect(keRegistrationRequired(ws).required).toBe(true);
    ws.sector = 'saas'; ws.employees = 5; ws.jx.KE = { turnoverBand: 'under-5m' };
    expect(keRegistrationRequired(ws).required).toBe(false);
  });
  it('flags a Kenyan certificate close to expiry', () => {
    expect(req(sample(), 'KE', 'ke-registration')!.status).toBe('partial');
  });
  it('requires an EU representative for an entity established in Nigeria', () => {
    const ds = sample();
    expect(req(ds, 'EU', 'eu-representative')!.status).toBe('missing');
    ds.workspace.establishment = 'IE';
    expect(req(ds, 'EU', 'eu-representative')!.status).toBe('na');
  });
  it('uses the right officer title', () => {
    expect(req(sample(), 'ZA', 'za-io')!.title).toContain('Information Officer');
    expect(req(sample(), 'NG', 'officer')!.title).toContain('Data Protection Officer');
  });
});

describe('Nigeria tier and return', () => {
  it('takes the higher of sector and volume', () => {
    expect(ngTier('mfb', 12400).tier).toBe('UHL');
    expect(ngTier('mfb', 800).tier).toBe('EHL');
    expect(ngTier('other', 999).tier).toBe('OHL');
    expect(ngTier('other', 5001).tier).toBe('UHL');
  });
  it('dates the return for cycle N in March of N+1', () => {
    expect(auditReturnDue(2026).toISOString().slice(0, 10)).toBe('2027-03-31');
  });
});

describe('transfers and vendors', () => {
  it('evaluates transfers from each jurisdiction’s point of view', () => {
    const ds = sample();
    const ng = req(ds, 'NG', 'transfers')!;
    expect(ng.status).toBe('missing'); // support assistant in the US, no basis
    expect(ng.detail).toContain('Support assistant (US)');
    const eu = req(ds, 'EU', 'transfers')!;
    expect(eu.detail).not.toContain('Core banking'); // the core vendor carries SCCs
    expect(eu.detail).not.toContain('Sentra'); // Ireland is inside the EEA
    expect(eu.status).toBe('missing');
    ds.vendors.find((v) => v.name === 'Generic LLM API')!.transferMechanism = 'approved-instrument';
    expect(req(ds, 'NG', 'transfers')!.status).toBe('partial'); // Sentra still awaiting NDPC approval
    expect(req(ds, 'EU', 'transfers')!.status).toBe('met');
  });
  it('scores vendor risk', () => {
    const ds = sample();
    expect(vendorRisk(ds.vendors.find((v) => v.name === 'BulkReach Messaging')!, ds, NOW).tier).toBe('high');
    expect(vendorRisk(ds.vendors.find((v) => v.name === 'Cloud hosting (Cape Town region)')!, ds, NOW).tier).not.toBe('high');
  });
});

describe('breaches', () => {
  it('applies each law’s notification test', () => {
    const ds = sample();
    const inc = { ...ds.incidents[0], jurisdictions: ['NG', 'ZA'] as JurisdictionCode[], dataUnintelligible: true };
    const d = breachDuties(inc, ds, NOW);
    expect(harmAssessment(inc, ds).level).toBe('none');
    expect(d.find((x) => x.code === 'NG')!.regulatorRequired).toBe(false);
    expect(d.find((x) => x.code === 'ZA')!.regulatorRequired).toBe(true); // POPIA s.22 has no risk threshold
  });
  it('runs the 72-hour clocks', () => {
    const ds = sample();
    const d = breachDuties(ds.incidents[0], ds, NOW);
    expect(d.map((x) => x.code)).toEqual(['NG', 'KE']);
    expect(d[0].state).toBe('running');
    expect(formatDuration(d[0].msRemaining!)).toMatch(/^40h/);
  });
});

describe('requests', () => {
  it('warns when a right does not exist under the law', () => {
    const ds = sample();
    const s = requestStatus(ds.requests.find((r) => r.jurisdiction === 'ZA')!, ds, NOW);
    expect(s.available).toBe(false);
    expect(s.note).toContain('POPIA');
  });
  it('lists the systems to search', () => {
    const ds = sample();
    const s = requestStatus(ds.requests[0], ds, NOW);
    expect(s.systems.map((x) => x.name)).toEqual(expect.arrayContaining(['Core banking', 'Mobile app backend']));
  });
});

describe('assessments', () => {
  it('suggests risks from the data map', () => {
    const ds = sample();
    const a = ds.assessments.find((x) => x.kind === 'aia')!;
    const ids = suggestedRisks(a, ds).map((r) => r.libraryId ?? r.id);
    expect(ids).toEqual(expect.arrayContaining(['r-auto-contest', 'r-ai-bias']));
  });
  it('requires prior consultation only where the law provides for it', () => {
    const ds = sample();
    const a = ds.assessments.find((x) => x.kind === 'aia')!;
    const r = reviewAssessment(a, ds);
    expect(r.residualLevel).toBe('high');
    expect(r.consult.map((c) => c.code)).toEqual(['KE']);
    expect(r.suggestedOutcome).toBe('consult-regulator');
  });
  it('exports a report', () => {
    const ds = sample();
    expect(assessmentMarkdown(ds.assessments[0], ds)).toContain('Risks and measures');
  });
});

describe('action plan', () => {
  it('merges one fix across several laws', () => {
    const plan = actionPlan(sample(), NOW);
    const mk = plan.find((a) => a.key === 'marketing')!;
    expect(mk.jurisdictions.sort()).toEqual(['KE', 'NG', 'ZA']);
    expect(plan[0].severity).toBe('high');
  });
});

describe('AI', () => {
  it('only applies regimes the entity has selected', () => {
    const ds = sample();
    const sys = ds.aiSystems[0];
    const all = classifyAI(sys, { sector: 'fintech', jurisdictions: ['NG', 'KE'], vendors: ds.vendors, assessments: ds.assessments });
    expect(all.obligations.map((o) => o.ref)).toEqual(expect.arrayContaining(['NDPA s.37', 'Kenya DPA s.35']));
    const keOnly = classifyAI(sys, { sector: 'fintech', jurisdictions: ['KE'], vendors: ds.vendors, assessments: ds.assessments });
    expect(keOnly.obligations.some((o) => o.ref === 'NDPA s.37')).toBe(false);
  });
});

describe('exports and migration', () => {
  it('builds the NDPC pack and per-law reports', () => {
    const ds = sample();
    expect(complianceReportMarkdown(ds, 'NG', { now: NOW })).toContain('not an NDPC form');
    const za = complianceReportMarkdown(ds, 'ZA', { now: NOW });
    expect(za).toContain('POPIA compliance report');
    expect(za).not.toContain('NDPC');
    expect(ropaCsv(ds).split('\n')[0]).toContain('Kenya DPA sensitive personal data');
  });
  it('upgrades version 0.1 records', () => {
    const old = {
      workspace: { id: 'w', name: 'Old', sector: 'mfb', dataSubjects6m: 12400, jurisdictions: ['NG', 'KE'], registrationNumber: 'R1', cycleYear: 2026, dpoName: 'D', attestations: { dpoReports: { value: true } } },
      activities: [{ id: 'a', name: 'KYC', purpose: 'p', lawfulBasis: 'public-interest', dataCategories: ['name', 'BVN'], volume: 1, status: 'active' }],
      vendors: [{ id: 'v', name: 'V', service: 's', role: 'processor', country: 'NG', dpaSigned: true, transferMechanism: 'not-needed' }],
    };
    const ds = migrateDataset(old);
    expect(ds.workspace.jx.NG?.registrationNumber).toBe('R1');
    expect(ds.workspace.jx.NG?.dpoReportsFiled).toBe(true);
    expect(ds.activities[0].dataCategoryIds).toEqual(expect.arrayContaining(['name', 'gov-id']));
    expect(ds.activities[0].lawfulBasis).toBe('public-task');
    expect(ds.vendors[0].transferMechanism).toBe('none');
    expect(evaluateJurisdiction('NG', ds, NOW).requirements.length).toBeGreaterThan(5);
  });
  it('validates the entity profile', () => {
    expect(validateRecord(WORKSPACE_FIELDS, { name: 'A', sector: 'bank', establishment: 'NG', jurisdictions: [] }).errors.jurisdictions).toBeDefined();
    expect(Object.keys(PACKS)).toHaveLength(8);
  });
});
