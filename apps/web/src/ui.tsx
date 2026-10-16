import { useEffect, useState, type ReactNode } from 'react';
import { PACKS, type JurisdictionCode, type Provenance, type ReqStatus } from '@tenet/core';

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'none';

export function Pill({ tone, children, title }: { tone: Tone; children: ReactNode; title?: string }) {
  return <span className={`pill ${tone}`} title={title}>{children}</span>;
}

export function TierTag({ tier }: { tier: string }) {
  return <span className={`tier ${tier}`}>{tier}</span>;
}

export function Prov({ p }: { p: Provenance }) {
  return (
    <span className="prov" title={p.note ?? ''}>
      <i className={p.confidence}>{p.confidence}</i>
      <span>{p.source}{p.note ? ` — ${p.note}` : ''}</span>
    </span>
  );
}

export function Bar({ pct, large }: { pct: number; large?: boolean }) {
  const tone = pct >= 80 ? '' : pct >= 50 ? 'warn' : 'bad';
  return <div className={`bar${large ? ' lg' : ''}`} role="img" aria-label={`${pct}%`}><div className={tone} style={{ width: `${Math.max(2, pct)}%` }} /></div>;
}

export function Jx({ codes, onlyShort }: { codes: JurisdictionCode[]; onlyShort?: boolean }) {
  return <span className="jx">{codes.map((c) => <span key={c} className="jxchip" title={PACKS[c].name}>{onlyShort ? c : PACKS[c].shortLaw}</span>)}</span>;
}

export const STATUS_TONE: Record<ReqStatus, Tone> = { met: 'ok', partial: 'warn', missing: 'bad', na: 'none' };
export const STATUS_TEXT: Record<ReqStatus, string> = { met: 'Met', partial: 'Partly met', missing: 'Missing', na: 'Not applicable' };
export const Status = ({ s }: { s: ReqStatus }) => <Pill tone={STATUS_TONE[s]}>{STATUS_TEXT[s]}</Pill>;

export function Drawer({ title, onClose, children, footer }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="drawer" role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined}>
        <div className="drawer-head"><h2>{title}</h2><button className="btn ghost" onClick={onClose}>Close</button></div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function SubTabs<T extends string>({ tabs, value, onChange, label }: { tabs: { id: T; label: string; count?: number }[]; value: T; onChange: (t: T) => void; label: string }) {
  return (
    <div className="subtabs" role="tablist" aria-label={label}>
      {tabs.map((t) => <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}>{t.label}{t.count !== undefined && <span className="count">{t.count}</span>}</button>)}
    </div>
  );
}

export function Empty({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty"><h2>{title}</h2><p className="muted">{children}</p>{action}</div>;
}

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), intervalMs); return () => clearInterval(t); }, [intervalMs]);
  return now;
}

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [text, onDone]);
  return <div className="toast" role="status">{text}</div>;
}

export function RiskMatrix({ points }: { points: { l: number; s: number; label: string; residual?: boolean }[] }) {
  const cell = (l: number, s: number) => { const v = l * s; return v <= 4 ? 'm-low' : v <= 9 ? 'm-med' : v <= 16 ? 'm-high' : 'm-crit'; };
  return (
    <div className="matrix" role="img" aria-label="Risk matrix: likelihood against severity">
      <div className="matrix-y">Severity</div>
      <div className="matrix-grid">
        {[5, 4, 3, 2, 1].map((s) => [1, 2, 3, 4, 5].map((l) => {
          const here = points.filter((p) => p.l === l && p.s === s);
          return <div key={`${l}${s}`} className={`mcell ${cell(l, s)}`}>{here.map((p, i) => <span key={i} className={`mdot${p.residual ? ' res' : ''}`} title={p.label}>{p.residual ? 'R' : 'I'}</span>)}</div>;
        }))}
      </div>
      <div className="matrix-x">Likelihood</div>
    </div>
  );
}

export const fmtDate = (iso?: string | Date) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtDateTime = (iso?: string | Date) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const fmtNum = (n: number) => (n ?? 0).toLocaleString('en-GB');
export const lower = (s: string) => s.split(' ').map((w) => (/^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase())).join(' ');
export const slug = (s: string) => s.replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');
