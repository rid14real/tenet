// Field definitions drive the forms in the web app and validation in the API.
// Fields can be conditional, so a form only asks what applies.

import type { CollectionName, JurisdictionCode, Workspace } from './types.js';

export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'select' | 'multiselect' | 'tags' | 'date' | 'datetime' | 'ref';

export interface FieldCtx { workspace?: Workspace; jurisdictions?: JurisdictionCode[] }

export interface FieldDef {
  key: string;
  label: string;
  type: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  /** Options computed from context (e.g. only the entity's selected jurisdictions). */
  optionsFn?: (ctx: FieldCtx) => { value: string; label: string }[];
  ref?: CollectionName;
  multiple?: boolean;
  help?: string;
  default?: unknown;
  listHidden?: boolean;
  /** Group heading in long forms. */
  section?: string;
  /** Show the field only when this returns true. Hidden fields are neither required nor validated. */
  visible?: (values: Record<string, unknown>, ctx: FieldCtx) => boolean;
}

export interface ValidationResult { ok: boolean; errors: Record<string, string>; value: Record<string, unknown> }

export const fieldOptions = (f: FieldDef, ctx: FieldCtx) => (f.optionsFn ? f.optionsFn(ctx) : f.options ?? []);
export const isVisible = (f: FieldDef, values: Record<string, unknown>, ctx: FieldCtx) => (f.visible ? f.visible(values, ctx) : true);

/** Coerce and check a record. Keys of hidden fields are kept as they are (not validated); unknown keys survive only via `passthrough`. */
export function validateRecord(fields: FieldDef[], input: Record<string, unknown>, passthrough: string[] = [], ctx: FieldCtx = {}): ValidationResult {
  const errors: Record<string, string> = {};
  const value: Record<string, unknown> = {};
  for (const f of fields) {
    let v = input[f.key];
    if (!isVisible(f, input, ctx)) { if (v !== undefined) value[f.key] = v; continue; }
    if (v === undefined || v === null || v === '') v = f.default ?? (f.type === 'boolean' ? false : undefined);
    if (v === undefined) { if (f.required) errors[f.key] = `${f.label} is required.`; continue; }
    const opts = fieldOptions(f, ctx);
    switch (f.type) {
      case 'number': {
        const n = typeof v === 'number' ? v : Number(v);
        if (!Number.isFinite(n) || n < 0) errors[f.key] = `${f.label} must be a number of zero or more.`; else value[f.key] = n;
        break;
      }
      case 'boolean': value[f.key] = v === true || v === 'true' || v === 'on'; break;
      case 'multiselect': case 'tags': {
        const arr = Array.isArray(v) ? v : String(v).split(',');
        const clean = [...new Set(arr.map((x) => String(x).trim()).filter(Boolean))];
        if (f.type === 'multiselect' && opts.length) {
          const bad = clean.filter((x) => !opts.some((o) => o.value === x));
          if (bad.length) { errors[f.key] = `${f.label} has values that do not apply here: ${bad.join(', ')}.`; break; }
        }
        if (f.required && clean.length === 0) errors[f.key] = `${f.label} needs at least one choice.`;
        value[f.key] = clean;
        break;
      }
      case 'select': {
        const s = String(v);
        if (opts.length && !opts.some((o) => o.value === s)) errors[f.key] = `${f.label} must be one of the listed options.`; else value[f.key] = s;
        break;
      }
      case 'ref': value[f.key] = f.multiple ? (Array.isArray(v) ? v : [v]).map(String).filter(Boolean) : String(v); break;
      case 'date': case 'datetime': {
        const s = String(v);
        if (Number.isNaN(Date.parse(s))) errors[f.key] = `${f.label} must be a valid date.`;
        else value[f.key] = f.type === 'date' ? s.slice(0, 10) : new Date(s).toISOString();
        break;
      }
      default: {
        const s = String(v).trim();
        if (s.length > 8000) errors[f.key] = `${f.label} is too long.`;
        else if (f.required && !s) errors[f.key] = `${f.label} is required.`;
        else if (s) value[f.key] = s;
      }
    }
  }
  for (const k of passthrough) if (input[k] !== undefined) value[k] = input[k];
  return { ok: Object.keys(errors).length === 0, errors, value };
}
