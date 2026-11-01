// Records the programme engine stores: the scoping answers (on the entity) and one record per control.

import type { Profile, Trigger } from './model.js';

export type VolumeBand = 'lt1k' | '1k-100k' | '100k-1m' | 'gt1m';
export const VOLUME_BANDS: { id: VolumeBand; label: string }[] = [
  { id: 'lt1k', label: 'Fewer than 1,000 people' },
  { id: '1k-100k', label: '1,000 to 100,000 people' },
  { id: '100k-1m', label: '100,000 to 1 million people' },
  { id: 'gt1m', label: 'More than 1 million people' },
];

/** Triggers the organisation answers. `processor` and `representative` are worked out from the entity settings. */
export type AnsweredTrigger = Exclude<Trigger, 'processor' | 'representative'>;
export const ANSWERED_TRIGGERS: AnsweredTrigger[] = ['sensitive', 'children', 'ai', 'transfers', 'marketing', 'consent', 'website', 'monitoring', 'certification'];

export interface ProgrammeScope {
  volumeBand: VolumeBand;
  answers: Partial<Record<AnsweredTrigger, boolean>>;
  /** Person-days a week the privacy team can give the programme, excluding business owners’ time. */
  capacityDaysPerWeek: number;
  startDate: string;
  profileOverride?: Profile;
  answeredAt?: string;
}

export type ControlStatus = 'not-started' | 'in-progress' | 'implemented' | 'operating' | 'not-applicable';
export const CONTROL_STATUSES: { id: ControlStatus; label: string; help: string }[] = [
  { id: 'not-started', label: 'Not started', help: 'Nothing in place yet.' },
  { id: 'in-progress', label: 'In progress', help: 'Work under way; not yet in use.' },
  { id: 'implemented', label: 'Implemented', help: 'In place and in use.' },
  { id: 'operating', label: 'Operating', help: 'Implemented and has run through at least one full cycle with evidence.' },
  { id: 'not-applicable', label: 'Not applicable', help: 'Does not apply; record why.' },
];

export interface ControlRecord {
  id: string;
  controlId: string;
  status: ControlStatus;
  owner?: string;
  due?: string;
  implementedOn?: string;
  lastReviewed?: string;
  /** Where the evidence is: links, document references or record names. */
  evidence?: string;
  notes?: string;
  naReason?: string;
  /** Set when the control is measured and improved routinely (maturity level 5). */
  optimised?: boolean;
  createdAt: string;
  updatedAt: string;
}
