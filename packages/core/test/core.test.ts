import { describe, expect, it } from 'vitest';
import {
  WORKSPACE_FIELDS, COLLECTION_META, auditReturnDue, breachClocks, carReadiness, classifyAI, classifyTier,
  dpiaInherentRisk, dpiaTriggers, filingPackMarkdown, formatDuration, requestClock, sampleDataset, validateRecord,
} from '../src/index.js';

const NOW = new Date('2026-10-15T12:00:00Z');
let n = 0;
const ids = () => `id-${++n}`;

describe('tier classification', () => {
  it('takes the higher of sector and volume', () => {
    expect(classifyTier('mfb', 12400).tier).toBe('UHL');
    expect(classifyTier('mfb', 800).tier).toBe('EHL');
    expect(classifyTier('bank', 10).tier).toBe('UHL');
    expect(classifyTier('other', 999).tier).toBe('OHL');
    expect(classifyTier('other', 1000).tier).toBe('EHL');
    expect(classifyTier('other', 5000).tier).toBe('EHL');
    expect(classifyTier('other', 5001).tier).toBe('UHL');
  });
  it('only UHL and EHL file an audit return', () => {
    expect(classifyTier('other', 10).filesAuditReturn).toBe(false);
    expect(classifyTier('hospital', 10).filesAuditReturn).toBe(true);
  });
  it('carries provenance', () => {
    expect(classifyTier('bank', 1).provenance.confidence).toBe('secondary');
  });
  it('dates the return for cycle N in March of N+1', () => {
    expect(auditReturnDue(2026).toISOString().slice(0, 10)).toBe('2027-03-31');
  });
});

describe('DPIA', () => {
  it('triggers on sensitive data and automated decisions', () => {
    const t = dpiaTriggers({ sensitive: true, children: false, automatedDecisions: true, largeScaleMonitoring: false, newTechnology: false, volume: 10, crossBorder: false });
    expect(t.map((x) => x.id)).toEqual(['sensitive', 'automated']);
  });
  it('does not trigger for ordinary small processing', () => {
    expect(dpiaTriggers({ sensitive: false, children: false, automatedDecisions: false, largeScaleMonitoring: false, newTechnology: false, volume: 100, crossBorder: true })).toHaveLength(0);
  });
  it('scores inherent risk', () => {
    expect(dpiaInherentRisk({}).level).toBe('low');
    expect(dpiaInherentRisk({ 'q-sensitive': true, 'q-scale': true }).level).toBe('medium');
    expect(dpiaInherentRisk({ 'q-sensitive': true, 'q-children': true, 'q-automated': true }).level).toBe('high');
  });
});

describe('clocks', () => {
  it('runs the NDPC 72-hour clock from awareness', () => {
    const inc = { id: 'i', title: 't', awareAt: '2026-10-14T12:00:00Z', affectedCount: 1, dataCategories: [], jurisdictions: ['NG', 'ZA'] as const, highRiskToSubjects: false, status: 'open' as const, createdAt: '', updatedAt: '' };
    const [ng, za] = breachClocks({ ...inc, jurisdictions: [...inc.jurisdictions] }, NOW);
    expect(ng.state).toBe('running');
    expect(ng.msRemaining).toBe(48 * 3_600_000);
    expect(za.state).toBe('no-fixed-window');
  });
  it('marks overdue and notified', () => {
    const base = { id: 'i', title: 't', awareAt: '2026-10-10T00:00:00Z', affectedCount: 1, dataCategories: [], jurisdictions: ['NG' as const], highRiskToSubjects: false, status: 'open' as const, createdAt: '', updatedAt: '' };
    expect(breachClocks(base, NOW)[0].state).toBe('overdue');
    expect(breachClocks({ ...base, notified: { NG: '2026-10-11T00:00:00Z' } }, NOW)[0].state).toBe('notified');
  });
  it('formats durations', () => {
    expect(formatDuration(40 * 3_600_000 + 45 * 60_000 + 12_000)).toBe('40h 45m 12s');
    expect(formatDuration(120 * 3_600_000)).toBe('5d 0h 00m');
    expect(formatDuration(5 * 3_600_000 + 61_000)).toBe('5h 01m 01s');
    expect(formatDuration(-3_600_000)).toBe('1h 00m 00s overdue');
  });
  it('computes request deadlines per jurisdiction', () => {
    const r = { id: 'r', type: 'access' as const, requester: 'x', receivedAt: '2026-10-01T00:00:00Z', channel: 'email' as const, jurisdiction: 'KE' as const, identityVerified: true, status: 'in-progress' as const, createdAt: '', updatedAt: '' };
    expect(requestClock(r, NOW).state).toBe('overdue');
    expect(requestClock({ ...r, jurisdiction: 'NG' }, NOW).state).toBe('on-track');
    expect(requestClock({ ...r, jurisdiction: 'ZA' }, NOW).state).toBe('no-fixed-window');
  });
});

describe('AI classification', () => {
  const ds = sampleDataset(NOW, ids);
  const ctx = { sector: ds.workspace.sector, vendors: ds.vendors, assessments: ds.assessments };
  it('flags solely automated credit scoring as high risk under NDPA s.37', () => {
    const c = classifyAI(ds.aiSystems[0], ctx);
    expect(c.risk).toBe('high');
    expect(c.obligations.find((o) => o.id === 'ndpa-37')?.status).toBe('open');
  });
  it('applies the CBN AML circular to a microfinance bank', () => {
    const c = classifyAI(ds.aiSystems[1], ctx);
    expect(c.obligations.some((o) => o.id === 'cbn-aml')).toBe(true);
    expect(c.risk).toBe('high');
  });
  it('requires a transfer basis for an offshore LLM', () => {
    const c = classifyAI(ds.aiSystems[2], ctx);
    expect(c.obligations.find((o) => o.id === 'ndpa-41')?.status).toBe('open');
    expect(c.risk).toBe('limited');
  });
  it('marks discovered shadow AI as unassessed', () => {
    expect(classifyAI(ds.aiSystems[3], ctx).risk).toBe('unassessed');
  });
  it('adds EU AI Act duties only when used in the EU', () => {
    const sys = { ...ds.aiSystems[0], markets: ['NG', 'EU'] as ('NG' | 'EU')[] };
    expect(classifyAI(sys, ctx).obligations.some((o) => o.id === 'eu-high')).toBe(true);
    expect(classifyAI(ds.aiSystems[0], ctx).obligations.some((o) => o.framework === 'EU AI Act')).toBe(false);
  });
});

describe('audit return readiness', () => {
  it('is computed from the records', () => {
    const ds = sampleDataset(NOW, ids);
    const car = carReadiness(ds, NOW);
    const by = Object.fromEntries(car.requirements.map((r) => [r.id, r.status]));
    expect(by.registration).toBe('met');
    expect(by.dpo).toBe('met');
    expect(by.ropa).toBe('partial'); // marketing has no lawful basis
    expect(by.retention).toBe('partial');
    expect(by.dpia).toBe('missing'); // scoring in review; CCTV, payroll none
    expect(by['processor-agreements']).toBe('partial'); // SMS vendor unsigned
    expect(by.transfers).toBe('missing'); // LLM vendor has none
    expect(by['breach-register']).toBe('partial'); // NDPC clock running
    expect(by.security).toBe('missing');
    expect(car.score).toBeGreaterThan(0);
    expect(car.score).toBeLessThan(100);
  });
  it('improves as gaps are fixed', () => {
    const ds = sampleDataset(NOW, ids);
    const before = carReadiness(ds, NOW).score;
    ds.workspace.attestations = { ...ds.workspace.attestations, securityMeasures: { value: true }, training: { value: true } };
    ds.vendors = ds.vendors.map((v) => ({ ...v, dpaSigned: true, transferMechanism: v.country === 'NG' ? 'not-needed' : 'approved-instrument' }));
    expect(carReadiness(ds, NOW).score).toBeGreaterThan(before);
  });
  it('treats an empty workspace as missing records, not ready', () => {
    const ds = sampleDataset(NOW, ids);
    const empty = { ...ds, activities: [], vendors: [], assessments: [], incidents: [], requests: [], aiSystems: [], workspace: { ...ds.workspace, attestations: {}, registrationNumber: undefined, dpoName: undefined } };
    const car = carReadiness(empty, NOW);
    expect(car.requirements.find((r) => r.id === 'ropa')?.status).toBe('missing');
    expect(car.score).toBeLessThan(30);
  });
});

describe('filing pack', () => {
  it('includes summary, gaps and registers', () => {
    const md = filingPackMarkdown(sampleDataset(NOW, ids), { now: NOW, preparedBy: 'Meridian Compliance' });
    expect(md).toContain('# Compliance Audit Return: preparation pack');
    expect(md).toContain('Gaps for DPCO review');
    expect(md).toContain('Customer onboarding and KYC');
    expect(md).toContain('GAID Arts. 43–44');
    expect(md).toContain('not an NDPC form');
  });
});

describe('validation', () => {
  it('coerces and rejects', () => {
    const r = validateRecord(COLLECTION_META.vendors.fields, { name: 'X', service: 'Y', country: 'US', dpaSigned: 'true' });
    expect(r.ok).toBe(true);
    expect(r.value.dpaSigned).toBe(true);
    expect(r.value.role).toBe('processor');
    const bad = validateRecord(COLLECTION_META.vendors.fields, { name: '', service: 'Y', country: 'ZZ' });
    expect(bad.ok).toBe(false);
    expect(Object.keys(bad.errors)).toEqual(expect.arrayContaining(['name', 'country']));
  });
  it('validates the workspace profile', () => {
    const r = validateRecord(WORKSPACE_FIELDS, { name: 'A', sector: 'bank', dataSubjects6m: '-4', cycleYear: 2026 });
    expect(r.errors.dataSubjects6m).toBeDefined();
  });
});
