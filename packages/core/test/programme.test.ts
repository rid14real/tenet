import { describe, expect, it } from 'vitest';
import {
  CONTROLS, DOMAINS, JURISDICTION_CODES, PHASES, buildPlan, capacityForTarget, frameworkJson, frameworkMarkdown, includeControl, planCsv, planMarkdown,
  profileRank, recommendProfile, resolveTriggers, sampleDataset, suggestAnswers,
  type ControlRecord, type Dataset, type ProgrammeScope, type Trigger, type Workspace,
} from '../src/index.js';

const NOW = new Date('2026-11-01T09:00:00Z');
let n = 0;
const id = () => `00000000-0000-4000-8000-${String(++n).padStart(12, '0')}`;
const iso = NOW.toISOString();

function blank(w: Partial<Workspace>, scope?: Partial<ProgrammeScope>): Dataset {
  return {
    workspace: {
      id: id(), name: 'Test Ltd', sector: 'saas', establishment: 'NG', jurisdictions: ['NG'], role: 'controller', employees: 20, jx: {},
      createdAt: iso, updatedAt: iso,
      programme: scope ? { volumeBand: 'lt1k', answers: {}, capacityDaysPerWeek: 2, startDate: '2026-11-02', ...scope } : undefined,
      ...w,
    },
    activities: [], systems: [], vendors: [], assessments: [], incidents: [], requests: [], aiSystems: [], policies: [], trainings: [], tasks: [], controls: [],
  };
}
const rec = (controlId: string, r: Partial<ControlRecord>): ControlRecord => ({ id: id(), controlId, status: 'not-started', createdAt: iso, updatedAt: iso, ...r });

describe('framework catalogue integrity', () => {
  const ids = new Set(CONTROLS.map((c) => c.id));

  it('has unique ids prefixed by their domain', () => {
    expect(ids.size).toBe(CONTROLS.length);
    for (const c of CONTROLS) expect(c.id.startsWith(c.domain + '-'), c.id).toBe(true);
    for (const c of CONTROLS) expect(DOMAINS.some((d) => d.id === c.domain), c.id).toBe(true);
  });

  it('every domain has controls and every control is complete', () => {
    for (const d of DOMAINS) expect(CONTROLS.some((c) => c.domain === d.id), d.id).toBe(true);
    for (const c of CONTROLS) {
      expect(c.objective.length, c.id).toBeGreaterThan(30);
      expect(c.steps.length, c.id).toBeGreaterThanOrEqual(2);
      expect(c.deliverables.length, c.id).toBeGreaterThan(0);
      expect(c.evidence.length, c.id).toBeGreaterThan(0);
      expect(Object.keys(c.laws).length + Object.keys(c.standards).length, `${c.id} maps to nothing`).toBeGreaterThan(0);
    }
  });

  it('references only real jurisdictions, with a confidence tag on every legal reference', () => {
    for (const c of CONTROLS) {
      for (const [code, refs] of Object.entries(c.laws)) {
        expect(JURISDICTION_CODES, `${c.id} ${code}`).toContain(code);
        for (const r of refs!) {
          expect(['primary', 'secondary', 'unverified'], c.id).toContain(r.conf);
          expect(['requires', 'supports'], c.id).toContain(r.kind);
          expect(r.ref.trim().length, c.id).toBeGreaterThan(3);
        }
      }
      for (const j of c.onlyFor ?? []) expect(JURISDICTION_CODES).toContain(j);
    }
  });

  it('has dependencies that exist, never point to a later phase, and contain no cycle', () => {
    for (const c of CONTROLS) for (const d of c.dependsOn) {
      expect(ids.has(d), `${c.id} -> ${d}`).toBe(true);
      expect(CONTROLS.find((x) => x.id === d)!.phase, `${c.id} depends on later ${d}`).toBeLessThanOrEqual(c.phase);
    }
    const state = new Map<string, number>();
    const dfs = (id: string): void => {
      if (state.get(id) === 2) return;
      expect(state.get(id), `cycle through ${id}`).not.toBe(1);
      state.set(id, 1);
      CONTROLS.find((c) => c.id === id)!.dependsOn.forEach(dfs);
      state.set(id, 2);
    };
    CONTROLS.forEach((c) => dfs(c.id));
  });

  it('does not cite NIST Privacy Framework categories that exist only in the 1.1 draft', () => {
    const v10 = ['ID.IM-P', 'ID.BE-P', 'ID.RA-P', 'ID.DE-P', 'GV.PO-P', 'GV.RM-P', 'GV.AT-P', 'GV.MT-P', 'CT.PO-P', 'CT.DM-P', 'CT.DP-P', 'CM.PO-P', 'CM.AW-P', 'PR.PO-P', 'PR.AC-P', 'PR.DS-P', 'PR.MA-P', 'PR.PT-P'];
    for (const c of CONTROLS) for (const cat of c.standards.NISTPF ?? []) expect(v10, `${c.id} ${cat}`).toContain(cat);
  });

  it('gives every phase controls at the essential profile', () => {
    for (const p of PHASES.slice(0, 3)) expect(CONTROLS.some((c) => c.phase === p.id && c.profile === 'essential'), p.name).toBe(true);
  });
});

describe('scoping', () => {
  it('recommends essential for a small, low-risk entity and explains why', () => {
    const r = recommendProfile(blank({}).workspace, { volumeBand: 'lt1k', answers: {}, capacityDaysPerWeek: 2, startDate: '2026-11-02' });
    expect(r.profile).toBe('essential');
    expect(r.reasons.length).toBeGreaterThan(0);
  });

  it('recommends advanced for a high-risk sector at volume, and honours an override', () => {
    const w = blank({ sector: 'bank', employees: 600 }).workspace;
    expect(recommendProfile(w, { volumeBand: '100k-1m', answers: {}, capacityDaysPerWeek: 2, startDate: '2026-11-02' }).profile).toBe('advanced');
    const o = recommendProfile(w, { volumeBand: '100k-1m', answers: {}, capacityDaysPerWeek: 2, startDate: '2026-11-02', profileOverride: 'standard' });
    expect(o.profile).toBe('standard');
    expect(o.overridden).toBe(true);
  });

  it('works out processor and representative triggers from the entity', () => {
    const t = resolveTriggers(blank({ role: 'both', jurisdictions: ['NG', 'EU', 'UK'], establishment: 'NG' }).workspace, { volumeBand: 'lt1k', answers: {}, capacityDaysPerWeek: 2, startDate: '2026-11-02' });
    expect(t.processor).toBe(true);
    expect(t.representative).toBe(true);
    const de = resolveTriggers(blank({ jurisdictions: ['EU'], establishment: 'DE' }).workspace, { volumeBand: 'lt1k', answers: {}, capacityDaysPerWeek: 2, startDate: '2026-11-02' });
    expect(de.representative).toBe(false);
  });

  it('suggests answers from records already held', () => {
    const s = suggestAnswers(sampleDataset(NOW));
    expect(s.ai?.value).toBe(true);
    expect(s.sensitive?.value).toBe(true);
    expect(s.marketing?.value).toBe(true);
  });
});

describe('tailored plan', () => {
  it('builds the sample plan with the advanced profile and law-specific controls', () => {
    const plan = buildPlan(sampleDataset(NOW), NOW);
    expect(plan.profile.profile).toBe('advanced');
    const ids = plan.items.map((i) => i.control.id);
    expect(ids).toContain('INV-02');
    expect(ids).toContain('TRN-04'); // South Africa is in scope
    expect(ids).toContain('REG-04'); // Nigerian entity subject to the GDPR
    expect(ids).not.toContain('LAW-05'); // no children's data
    expect(plan.excluded.find((e) => e.control.id === 'LAW-05')!.why).toMatch(/children/);
    expect(plan.progress).toBeGreaterThan(0);
    expect(plan.maturity).toBeGreaterThan(0);
  });

  it('pulls a control in below its profile when a law in scope requires it', () => {
    const plan = buildPlan(blank({ jurisdictions: ['NG', 'EU'] }, {}), NOW);
    expect(plan.profile.profile).toBe('essential');
    const pbd = plan.items.find((i) => i.control.id === 'RSK-04')!;
    expect(pbd.inclusion).toBe('law');
    expect(pbd.requiredBy).toContain('EU');
    expect(plan.items.find((i) => i.control.id === 'RSK-06')).toBeUndefined();
  });

  it('shows nothing from a law that is not in scope', () => {
    const plan = buildPlan(blank({ jurisdictions: ['NG'] }, {}), NOW);
    for (const i of plan.items) for (const r of i.refs) expect(r.code).toBe('NG');
    expect(plan.items.find((i) => i.control.id === 'TRN-04')).toBeUndefined();
    expect(plan.items.find((i) => i.control.id === 'REG-04')).toBeUndefined();
  });

  it('switches trigger-gated controls on and off', () => {
    const off = buildPlan(blank({}, { answers: {} }), NOW).items.map((i) => i.control.id);
    const on = buildPlan(blank({}, { answers: { ai: true, transfers: true } }), NOW).items.map((i) => i.control.id);
    expect(off).not.toContain('AIG-01');
    expect(on).toContain('AIG-01');
    expect(on).toContain('TPR-04');
  });

  it('schedules every control after its dependencies and within capacity', () => {
    for (const capacity of [1, 2, 5]) {
      const plan = buildPlan(blank({ sector: 'bank', employees: 900, jurisdictions: ['NG', 'KE', 'EU'] }, { volumeBand: 'gt1m', capacityDaysPerWeek: capacity, answers: { ai: true, transfers: true, sensitive: true } }), NOW);
      const end = new Map(plan.items.map((i) => [i.control.id, i.endWeek]));
      for (const i of plan.items) for (const d of i.control.dependsOn) if (end.has(d)) expect(i.startWeek, `${i.control.id} before ${d}`).toBeGreaterThanOrEqual(end.get(d)!);
      const effort = plan.items.reduce((s, i) => s + i.effortDays, 0);
      expect(plan.weeks).toBeGreaterThanOrEqual(Math.floor(effort / capacity));
    }
  });

  it('more capacity finishes sooner', () => {
    const at = (c: number) => buildPlan(blank({ sector: 'bank', employees: 900 }, { volumeBand: 'gt1m', capacityDaysPerWeek: c }), NOW).weeks;
    expect(at(6)).toBeLessThan(at(1));
  });

  it('scores maturity from status, evidence, reviews and optimisation', () => {
    const ds = blank({}, {});
    ds.controls = [
      rec('GOV-01', { status: 'implemented', implementedOn: '2026-10-01', evidence: 'Minute 4/2026' }),
      rec('GOV-04', { status: 'implemented', implementedOn: '2024-01-01' }),
      rec('REG-01', { status: 'operating', implementedOn: '2026-06-01', optimised: true }),
      rec('PPL-02', { status: 'not-applicable', naReason: 'No staff' }),
    ];
    const plan = buildPlan(ds, NOW);
    const m = (cid: string) => plan.items.find((i) => i.control.id === cid)!;
    expect(m('GOV-01').maturity).toBe(3);
    expect(m('GOV-04').reviewOverdue).toBe(true);
    expect(m('GOV-04').maturity).toBe(2);
    expect(m('REG-01').maturity).toBe(5);
    expect(m('PPL-02').maturity).toBeNull();
    expect(m('GOV-02').waitingOn).toEqual([]);
    expect(m('INV-02').waitingOn).toContain('INV-01');
  });

  it('reads signals from records without changing status', () => {
    const plan = buildPlan(sampleDataset(NOW), NOW);
    const ropa = plan.items.find((i) => i.control.id === 'INV-02')!;
    expect(ropa.signal?.source).toBe('Compliance');
    expect(ropa.status).toBe('in-progress');
    expect(plan.items.find((i) => i.control.id === 'AIG-01')!.signal?.state).toBe('met');
  });

  it('every trigger switches on at least one control', () => {
    const all: Trigger[] = ['processor', 'website', 'children', 'sensitive', 'ai', 'transfers', 'marketing', 'monitoring', 'representative', 'certification', 'consent'];
    for (const t of all) expect(CONTROLS.some((c) => c.triggers?.includes(t)), t).toBe(true);
  });

  it('includes every untriggered essential control for a small entity', () => {
    const ids = buildPlan(blank({}, {}), NOW).items.map((i) => i.control.id);
    const ess = CONTROLS.filter((c) => profileRank(c.profile) === 1 && !c.triggers?.length && !c.onlyFor?.length);
    for (const c of ess) expect(ids, c.id).toContain(c.id);
    expect(includeControl(CONTROLS.find((c) => c.id === 'INV-06')!, ['NG'], 'essential', resolveTriggers(blank({}).workspace, { volumeBand: 'lt1k', answers: {}, capacityDaysPerWeek: 2, startDate: '2026-11-02' })).include).toBe(false);
  });
});

describe('exports', () => {
  it('publishes the whole framework as JSON and Markdown', () => {
    const j = frameworkJson();
    expect(j.licence).toBe('CC BY 4.0');
    expect(j.controls.length).toBe(CONTROLS.length);
    expect(JSON.parse(JSON.stringify(j)).controls[0].id).toBe(CONTROLS[0].id);
    const md = frameworkMarkdown();
    for (const c of CONTROLS) expect(md).toContain(`### ${c.id} `);
  });

  it('exports a plan as CSV and Markdown', () => {
    const ds = sampleDataset(NOW);
    const plan = buildPlan(ds, NOW);
    expect(planCsv(plan).split('\n').length).toBe(plan.items.length + 1);
    expect(planMarkdown(plan, ds)).toContain('Maturity by domain');
  });
});

describe('capacity planning', () => {
  it('finds the capacity needed to finish by a target, or says the target is too short', () => {
    const ds = blank({ sector: 'bank', employees: 900 }, { volumeBand: 'gt1m', capacityDaysPerWeek: 2 });
    const a = capacityForTarget(ds, 52, NOW);
    expect(a.daysPerWeek).not.toBeNull();
    const check = buildPlan({ ...ds, workspace: { ...ds.workspace, programme: { ...ds.workspace.programme!, capacityDaysPerWeek: a.daysPerWeek! } } }, NOW);
    expect(check.weeks).toBeLessThanOrEqual(52);
    const tooShort = capacityForTarget(ds, 2, NOW);
    expect(tooShort.daysPerWeek).toBeNull();
    expect(tooShort.criticalPathWeeks).toBeGreaterThan(2);
  });
});
