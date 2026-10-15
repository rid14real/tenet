import { useEffect, useState, type ReactNode } from 'react';
import type { Provenance } from '@tenet/core';

export type Tone = 'ok' | 'warn' | 'bad' | 'info' | 'none';

export function Pill({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`pill ${tone}`}>{children}</span>;
}

export function TierTag({ tier }: { tier: string }) {
  return <span className={`tier ${tier}`}>{tier}</span>;
}

const CONF_LABEL = { primary: 'primary', secondary: 'secondary', unverified: 'unverified' } as const;

export function Prov({ p }: { p: Provenance }) {
  return (
    <span className="prov" title={p.note ?? ''}>
      <i className={p.confidence}>{CONF_LABEL[p.confidence]}</i>
      <span>{p.source}</span>
    </span>
  );
}

export function Bar({ pct, large }: { pct: number; large?: boolean }) {
  const tone = pct >= 80 ? '' : pct >= 50 ? 'warn' : 'bad';
  return <div className={`bar${large ? ' lg' : ''}`} role="img" aria-label={`${pct}%`}><div className={tone} style={{ width: `${Math.max(2, pct)}%` }} /></div>;
}

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

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), intervalMs); return () => clearInterval(t); }, [intervalMs]);
  return now;
}

export function Toast({ text, onDone }: { text: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 2800); return () => clearTimeout(t); }, [text, onDone]);
  return <div className="toast" role="status">{text}</div>;
}

export const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtDateTime = (iso?: string | Date) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const fmtNum = (n: number) => n.toLocaleString('en-GB');

/** Lower-case a label for running text without breaking acronyms like AI. */
export const lower = (s: string) => s.split(' ').map((w) => (/^[A-Z]{2,}$/.test(w) ? w : w.toLowerCase())).join(' ');
