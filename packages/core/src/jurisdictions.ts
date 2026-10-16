// Jurisdiction packs. Everything that differs by law lives here as data with its source:
// terms, officers, lawful bases, sensitive data, rights, breach tests, DPIA rules, transfers, profile fields.
// Select a jurisdiction and its pack switches on everywhere; deselect it and it disappears.

import { EEA } from './taxonomy.js';
import type { FieldDef } from './fields.js';
import type { CanonicalBasis, JurisdictionCode, Provenance, RightType } from './types.js';

const P = (source: string, confidence: Provenance['confidence'], note?: string): Provenance => ({ source, confidence, note });

/** How the regulator / data subject notification test is framed in the law. */
export type BreachTest = 'any' | 'risk' | 'real-risk' | 'high-risk';

export interface JurisdictionPack {
  code: JurisdictionCode;
  name: string;
  law: string;
  shortLaw: string;
  regulator: string;
  regulatorShort: string;
  officer: { title: string; ref: string; prov: Provenance };
  sensitive: { term: string; ref: string; categories: string[]; prov: Provenance };
  children: { ref: string };
  bases: { ref: string; available: Partial<Record<CanonicalBasis, string>>; prov: Provenance };
  special: { ref: string; prov: Provenance };
  rights: { available: Partial<Record<RightType, { ref: string; days?: number | null }>>; defaultDays: number | null; extension?: { days: number; ref: string }; prov: Provenance };
  breach: {
    regulatorHours: number | null; window: string; regulatorTest: BreachTest; subjectsTest: BreachTest;
    ref: string; subjectsRef: string; contents: string[]; prov: Provenance;
  };
  dpia: { name: string; ref: string; binding: boolean; priorConsultation?: string; prov: Provenance };
  transfers: { ref: string; summary: string; isDomestic: (country: string) => boolean; prov: Provenance } | null;
  profileFields: FieldDef[];
  /** Short line shown when the jurisdiction is selected. */
  blurb: string;
}

const ALL_BASES = (refs: Partial<Record<CanonicalBasis, string>>) => refs;

export const PACKS: Record<JurisdictionCode, JurisdictionPack> = {
  NG: {
    code: 'NG', name: 'Nigeria', law: 'Nigeria Data Protection Act 2023 and General Application and Implementation Directive 2025', shortLaw: 'NDPA',
    regulator: 'Nigeria Data Protection Commission', regulatorShort: 'NDPC',
    blurb: 'Registration as a data controller or processor of major importance, annual audit return for UHL and EHL, DPO duties, 72-hour breach notice.',
    officer: { title: 'Data Protection Officer', ref: 'NDPA s.32; GAID Arts. 13–14', prov: P('NDPA 2023 s.32; GAID 2025', 'secondary') },
    sensitive: { term: 'sensitive personal data', ref: 'NDPA s.30', categories: ['genetic', 'biometric', 'racial-ethnic', 'religious', 'health', 'sex-life', 'political', 'trade-union'], prov: P('NDPA 2023 ss.30, 65', 'primary') },
    children: { ref: 'NDPA s.31' },
    bases: { ref: 'NDPA s.25', available: ALL_BASES({ consent: 's.25(1)(a)', contract: 's.25(1)(b)', 'legal-obligation': 's.25(1)(b)', 'vital-interests': 's.25(1)(b)', 'public-task': 's.25(1)(b)', 'legitimate-interests': 's.25(1)(b)' }), prov: P('NDPA 2023 s.25', 'primary') },
    special: { ref: 'NDPA s.30', prov: P('NDPA 2023 s.30', 'primary') },
    rights: {
      available: { access: { ref: 's.34' }, rectification: { ref: 's.34' }, erasure: { ref: 's.34' }, restriction: { ref: 's.34' }, portability: { ref: 's.38' }, objection: { ref: 's.36' }, 'withdraw-consent': { ref: 's.35' }, 'automated-decision': { ref: 's.37' }, complaint: { ref: 's.46; GAID Art. 40' } },
      defaultDays: 30, prov: P('NDPA 2023 ss.34–38', 'unverified', 'Response period set at 30 days pending confirmation against the GAID.'),
    },
    breach: {
      regulatorHours: 72, window: '72 hours from awareness', regulatorTest: 'risk', subjectsTest: 'high-risk', ref: 'NDPA s.40', subjectsRef: 'NDPA s.40',
      contents: ['Nature of the breach, including categories and approximate numbers of people and records', 'Name and contact of the DPO', 'Likely consequences', 'Measures taken or proposed, including to mitigate effects'],
      prov: P('NDPA 2023 s.40', 'primary'),
    },
    dpia: { name: 'Data protection impact assessment', ref: 'NDPA s.28; GAID Art. 28', binding: true, prov: P('NDPA 2023 s.28; GAID 2025 Art. 28 (trigger list from practitioner summaries)', 'secondary') },
    transfers: { ref: 'NDPA ss.41–43', summary: 'Transfers need adequacy, an NDPC-approved instrument or a basis in s.43.', isDomestic: (c) => c === 'NG', prov: P('NDPA 2023 ss.41–43', 'primary') },
    profileFields: [
      { key: 'registrationNumber', label: 'NDPC registration number', type: 'text', help: 'NDPA s.44: data controllers and processors of major importance register with the NDPC.' },
      { key: 'dataSubjects6m', label: 'Data subjects processed in the last six months', type: 'number', default: 0, help: 'Sets the UHL, EHL or OHL tier with the sector.' },
      { key: 'cycleYear', label: 'Audit cycle year', type: 'number', default: new Date().getUTCFullYear() },
      { key: 'dpcoName', label: 'Licensed DPCO filing the audit return', type: 'text', help: 'UHL and EHL entities file through a licensed DPCO.' },
      { key: 'dpoCredentialOnFile', label: 'DPO credential evidence on file', type: 'boolean', default: false, help: 'GAID Art. 14' },
      { key: 'dpoReportsFiled', label: 'DPO semi-annual reports filed', type: 'boolean', default: false, help: 'GAID Art. 13' },
      { key: 'lastReturnFiledOn', label: 'Last audit return filed on', type: 'date' },
    ],
  },
  ZA: {
    code: 'ZA', name: 'South Africa', law: 'Protection of Personal Information Act 2013 (POPIA) and PAIA', shortLaw: 'POPIA',
    regulator: 'Information Regulator', regulatorShort: 'Information Regulator',
    blurb: 'Eight conditions for lawful processing, a registered Information Officer, a PAIA manual, notice of security compromises as soon as reasonably possible.',
    officer: { title: 'Information Officer', ref: 'POPIA ss.55–56; POPIA Regulations 2018 reg. 4', prov: P('POPIA ss.55–56; Information Regulator Guidance Note on Information Officers (2021)', 'secondary') },
    sensitive: { term: 'special personal information', ref: 'POPIA s.26', categories: ['religious', 'racial-ethnic', 'trade-union', 'political', 'health', 'sex-life', 'biometric', 'criminal'], prov: P('POPIA s.26', 'primary') },
    children: { ref: 'POPIA ss.34–35' },
    bases: { ref: 'POPIA s.11', available: ALL_BASES({ consent: 's.11(1)(a)', contract: 's.11(1)(b)', 'legal-obligation': 's.11(1)(c)', 'vital-interests': 's.11(1)(d)', 'public-task': 's.11(1)(e)', 'legitimate-interests': 's.11(1)(f)' }), prov: P('POPIA s.11', 'primary') },
    special: { ref: 'POPIA ss.27–33', prov: P('POPIA ss.27–33', 'primary') },
    rights: {
      available: { access: { ref: 's.23', days: 30 }, rectification: { ref: 's.24' }, erasure: { ref: 's.24' }, objection: { ref: 's.11(3)' }, 'withdraw-consent': { ref: 's.11(2)(b)' }, 'automated-decision': { ref: 's.71' }, complaint: { ref: 's.74' } },
      defaultDays: null, prov: P('POPIA ss.23–25; PAIA s.56 for access requests to private bodies', 'secondary', 'POPIA requires a reasonable time; formal access requests follow PAIA timelines.'),
    },
    breach: {
      regulatorHours: null, window: 'As soon as reasonably possible', regulatorTest: 'any', subjectsTest: 'any', ref: 'POPIA s.22', subjectsRef: 'POPIA s.22',
      contents: ['Description of possible consequences', 'Measures taken or intended', 'Recommendations for the person to mitigate effects', 'Identity of the unauthorised person, if known'],
      prov: P('POPIA s.22', 'primary'),
    },
    dpia: { name: 'Personal information impact assessment', ref: 'POPIA Regulations 2018 reg. 4(1)(b)', binding: true, prov: P('POPIA Regulations 2018 reg. 4(1)(b)', 'secondary') },
    transfers: { ref: 'POPIA s.72', summary: 'Transfers need an adequate law, binding rules or agreement, consent, or a contract basis.', isDomestic: (c) => c === 'ZA', prov: P('POPIA s.72', 'primary') },
    profileFields: [
      { key: 'ioName', label: 'Information Officer', type: 'text', help: 'By default the head of the body (CEO or equivalent).' },
      { key: 'ioRegistrationNumber', label: 'Information Regulator registration number', type: 'text', help: 'Information Officers must be registered before they take up their duties.' },
      { key: 'deputyIoNames', label: 'Deputy Information Officers', type: 'text' },
    ],
  },
  KE: {
    code: 'KE', name: 'Kenya', law: 'Data Protection Act 2019 and Regulations 2021', shortLaw: 'Kenya DPA',
    regulator: 'Office of the Data Protection Commissioner', regulatorShort: 'ODPC',
    blurb: 'Registration with the ODPC (certificate valid 24 months), DPIA for high-risk processing, 72-hour breach notice where there is a real risk of harm.',
    officer: { title: 'Data Protection Officer', ref: 'Kenya DPA s.24', prov: P('Kenya DPA 2019 s.24', 'primary') },
    sensitive: { term: 'sensitive personal data', ref: 'Kenya DPA ss.2, 44', categories: ['racial-ethnic', 'health', 'religious', 'genetic', 'biometric', 'property', 'marital-family', 'sex-life'], prov: P('Kenya DPA 2019 s.2 (definition)', 'primary', 'Includes property details, marital status and family details, which most other laws do not treat as sensitive.') },
    children: { ref: 'Kenya DPA s.33' },
    bases: { ref: 'Kenya DPA s.30', available: ALL_BASES({ consent: 's.30(1)(a)', contract: 's.30(1)(b)', 'legal-obligation': 's.30(1)(b)', 'vital-interests': 's.30(1)(b)', 'public-task': 's.30(1)(b)', 'legitimate-interests': 's.30(1)(b)' }), prov: P('Kenya DPA 2019 s.30', 'primary') },
    special: { ref: 'Kenya DPA ss.44–46', prov: P('Kenya DPA 2019 ss.44–46', 'primary') },
    rights: {
      available: { access: { ref: 's.26', days: 7 }, rectification: { ref: 's.40', days: 14 }, erasure: { ref: 's.40', days: 14 }, restriction: { ref: 's.34' }, portability: { ref: 's.38', days: 30 }, objection: { ref: 's.26' }, 'withdraw-consent': { ref: 's.32' }, 'automated-decision': { ref: 's.35' }, complaint: { ref: 's.56' } },
      defaultDays: 14, prov: P('Kenya DPA 2019; Data Protection (General) Regulations 2021', 'unverified', 'Day counts taken from summaries of the General Regulations; confirm before relying on them.'),
    },
    breach: {
      regulatorHours: 72, window: '72 hours from awareness', regulatorTest: 'real-risk', subjectsTest: 'real-risk', ref: 'Kenya DPA s.43', subjectsRef: 'Kenya DPA s.43',
      contents: ['Description of the nature of the breach', 'Measures taken or proposed', 'Recommendations for the person to mitigate effects', 'Identity of the unauthorised person, if known'],
      prov: P('Kenya DPA 2019 s.43', 'primary'),
    },
    dpia: { name: 'Data protection impact assessment', ref: 'Kenya DPA s.31', binding: true, priorConsultation: 'Kenya DPA s.31; Data Protection (General) Regulations 2021', prov: P('Kenya DPA 2019 s.31', 'primary') },
    transfers: { ref: 'Kenya DPA ss.48–50', summary: 'Transfers need proof of appropriate safeguards, adequacy or necessity; sensitive data needs consent and safeguards.', isDomestic: (c) => c === 'KE', prov: P('Kenya DPA 2019 ss.48–50', 'primary') },
    profileFields: [
      { key: 'turnoverBand', label: 'Annual turnover or revenue', type: 'select', default: 'over-5m', options: [{ value: 'under-5m', label: 'Under KES 5 million' }, { value: 'over-5m', label: 'KES 5 million or more' }], help: 'With fewer than 10 employees and no listed purpose, registration is not required.' },
      { key: 'certificateNumber', label: 'ODPC registration certificate number', type: 'text' },
      { key: 'certificateExpiry', label: 'Certificate expiry', type: 'date', help: 'Certificates are valid for 24 months.' },
    ],
  },
  GH: {
    code: 'GH', name: 'Ghana', law: 'Data Protection Act 2012 (Act 843)', shortLaw: 'Act 843',
    regulator: 'Data Protection Commission', regulatorShort: 'DPC',
    blurb: 'Registration with the Data Protection Commission (renew every two years), notice of breaches as soon as reasonably practicable.',
    officer: { title: 'Data Protection Supervisor', ref: 'Act 843 s.58', prov: P('Act 843 s.58', 'secondary', 'Optional in the Act; the Commission expects large controllers to have a certified supervisor.') },
    sensitive: { term: 'special personal data', ref: 'Act 843 s.37', categories: ['racial-ethnic', 'political', 'religious', 'health', 'genetic', 'sex-life', 'criminal'], prov: P('Act 843 (definition of special personal data)', 'secondary') },
    children: { ref: 'Act 843 s.37' },
    bases: { ref: 'Act 843 s.20', available: ALL_BASES({ consent: 's.20', contract: 's.20', 'legal-obligation': 's.20', 'vital-interests': 's.20', 'public-task': 's.20', 'legitimate-interests': 's.20' }), prov: P('Act 843 s.20', 'unverified') },
    special: { ref: 'Act 843 s.37', prov: P('Act 843 s.37', 'unverified') },
    rights: {
      available: { access: { ref: 'Act 843' }, rectification: { ref: 'Act 843' }, erasure: { ref: 'Act 843' }, objection: { ref: 'Act 843' }, 'withdraw-consent': { ref: 'Act 843' }, complaint: { ref: 'Act 843' } },
      defaultDays: null, prov: P('Act 843', 'unverified', 'No fixed response period found in secondary sources.'),
    },
    breach: {
      regulatorHours: null, window: 'As soon as reasonably practicable', regulatorTest: 'any', subjectsTest: 'any', ref: 'Act 843 s.31', subjectsRef: 'Act 843 s.31',
      contents: ['Description of the breach and data involved', 'Measures taken', 'Advice to the person'],
      prov: P('Act 843 (security compromise notification)', 'secondary'),
    },
    dpia: { name: 'Data protection impact assessment', ref: 'DPC registration renewal gap analysis', binding: false, prov: P('Data Protection Commission renewal requirements', 'secondary', 'Not in the Act; requested at renewal.') },
    transfers: null,
    profileFields: [
      { key: 'registrationNumber', label: 'DPC registration number', type: 'text', help: 'Every data controller registers with the Data Protection Commission.' },
      { key: 'registrationExpiry', label: 'Registration expiry', type: 'date', help: 'Certificates are valid for two years.' },
    ],
  },
  EG: {
    code: 'EG', name: 'Egypt', law: 'Personal Data Protection Law 151 of 2020 and Executive Regulations', shortLaw: 'PDPL',
    regulator: 'Personal Data Protection Center', regulatorShort: 'PDPC',
    blurb: 'Licence from the PDPC, registered DPO, permits for transfers abroad, 72-hour breach notice.',
    officer: { title: 'Data Protection Officer', ref: 'PDPL Art. 8', prov: P('PDPL 151/2020', 'unverified') },
    sensitive: { term: 'sensitive personal data', ref: 'PDPL Art. 1', categories: ['health', 'genetic', 'biometric', 'financial', 'religious', 'political', 'criminal', 'children'], prov: P('PDPL 151/2020 Art. 1', 'secondary', 'Includes financial data.') },
    children: { ref: 'PDPL Art. 12' },
    bases: { ref: 'PDPL Art. 6', available: ALL_BASES({ consent: 'Art. 6', contract: 'Art. 6', 'legal-obligation': 'Art. 6', 'vital-interests': 'Art. 6' }), prov: P('PDPL 151/2020 Art. 6', 'unverified', 'No legitimate-interests or public-task basis found in summaries.') },
    special: { ref: 'PDPL Art. 12', prov: P('PDPL 151/2020', 'unverified') },
    rights: { available: { access: { ref: 'Art. 2' }, rectification: { ref: 'Art. 2' }, erasure: { ref: 'Art. 2' }, objection: { ref: 'Art. 2' }, 'withdraw-consent': { ref: 'Art. 2' }, complaint: { ref: 'Art. 33' } }, defaultDays: null, prov: P('PDPL 151/2020 Art. 2', 'unverified') },
    breach: { regulatorHours: 72, window: '72 hours', regulatorTest: 'any', subjectsTest: 'any', ref: 'PDPL Art. 7', subjectsRef: 'PDPL Art. 7', contents: ['Description of the breach', 'Data and people affected', 'Measures taken'], prov: P('PDPL Executive Regulations (secondary summaries)', 'secondary') },
    dpia: { name: 'Data protection impact assessment', ref: 'PDPL Executive Regulations', binding: false, prov: P('PDPL Executive Regulations', 'unverified') },
    transfers: { ref: 'PDPL Arts. 14–16', summary: 'Transfers abroad need a PDPC licence or permit and equivalent protection.', isDomestic: (c) => c === 'EG', prov: P('PDPL 151/2020 Arts. 14–16', 'secondary') },
    profileFields: [
      { key: 'licenceNumber', label: 'PDPC licence or permit number', type: 'text' },
      { key: 'licenceExpiry', label: 'Licence expiry', type: 'date' },
    ],
  },
  ZW: {
    code: 'ZW', name: 'Zimbabwe', law: 'Cyber and Data Protection Act 2021', shortLaw: 'CDPA',
    regulator: 'Postal and Telecommunications Regulatory Authority', regulatorShort: 'POTRAZ',
    blurb: 'Licence from POTRAZ, DPO, 24-hour breach notice to the authority.',
    officer: { title: 'Data Protection Officer', ref: 'CDPA s.20', prov: P('CDPA 2021', 'unverified') },
    sensitive: { term: 'sensitive data', ref: 'CDPA s.3', categories: ['racial-ethnic', 'political', 'religious', 'trade-union', 'health', 'sex-life', 'genetic', 'biometric', 'criminal'], prov: P('CDPA 2021 s.3', 'secondary') },
    children: { ref: 'CDPA s.12' },
    bases: { ref: 'CDPA s.9', available: ALL_BASES({ consent: 's.9', contract: 's.9', 'legal-obligation': 's.9', 'vital-interests': 's.9', 'public-task': 's.9', 'legitimate-interests': 's.9' }), prov: P('CDPA 2021', 'unverified') },
    special: { ref: 'CDPA s.11', prov: P('CDPA 2021', 'unverified') },
    rights: { available: { access: { ref: 'CDPA s.14' }, rectification: { ref: 'CDPA s.14' }, erasure: { ref: 'CDPA s.14' }, objection: { ref: 'CDPA s.14' }, 'automated-decision': { ref: 'CDPA s.25' }, complaint: { ref: 'CDPA' } }, defaultDays: null, prov: P('CDPA 2021', 'unverified') },
    breach: { regulatorHours: 24, window: '24 hours', regulatorTest: 'any', subjectsTest: 'any', ref: 'CDPA s.19', subjectsRef: 'CDPA s.19', contents: ['Description of the breach', 'Data and people affected', 'Measures taken'], prov: P('CDPA 2021 (secondary summaries)', 'secondary') },
    dpia: { name: 'Data protection impact assessment', ref: 'CDPA', binding: false, prov: P('CDPA 2021', 'unverified') },
    transfers: { ref: 'CDPA s.28', summary: 'Transfers need adequate protection in the destination or an approved basis.', isDomestic: (c) => c === 'ZW', prov: P('CDPA 2021 s.28', 'unverified') },
    profileFields: [
      { key: 'licenceNumber', label: 'POTRAZ licence number', type: 'text' },
      { key: 'licenceExpiry', label: 'Licence expiry', type: 'date' },
    ],
  },
  EU: {
    code: 'EU', name: 'European Union', law: 'General Data Protection Regulation (GDPR)', shortLaw: 'GDPR',
    regulator: 'Lead supervisory authority', regulatorShort: 'Supervisory authority',
    blurb: 'Records of processing, DPIA and prior consultation, 72-hour breach notice, an EU representative if established outside the EEA.',
    officer: { title: 'Data Protection Officer', ref: 'GDPR Arts. 37–39', prov: P('GDPR Arts. 37–39', 'primary') },
    sensitive: { term: 'special category data', ref: 'GDPR Arts. 9–10', categories: ['racial-ethnic', 'political', 'religious', 'trade-union', 'genetic', 'biometric', 'health', 'sex-life', 'criminal'], prov: P('GDPR Arts. 9–10', 'primary') },
    children: { ref: 'GDPR Art. 8' },
    bases: { ref: 'GDPR Art. 6(1)', available: ALL_BASES({ consent: 'Art. 6(1)(a)', contract: 'Art. 6(1)(b)', 'legal-obligation': 'Art. 6(1)(c)', 'vital-interests': 'Art. 6(1)(d)', 'public-task': 'Art. 6(1)(e)', 'legitimate-interests': 'Art. 6(1)(f)' }), prov: P('GDPR Art. 6', 'primary') },
    special: { ref: 'GDPR Art. 9(2)', prov: P('GDPR Art. 9(2)', 'primary') },
    rights: {
      available: { access: { ref: 'Art. 15' }, rectification: { ref: 'Art. 16' }, erasure: { ref: 'Art. 17' }, restriction: { ref: 'Art. 18' }, portability: { ref: 'Art. 20' }, objection: { ref: 'Art. 21' }, 'withdraw-consent': { ref: 'Art. 7(3)' }, 'automated-decision': { ref: 'Art. 22' }, complaint: { ref: 'Art. 77' } },
      defaultDays: 30, extension: { days: 60, ref: 'Art. 12(3)' }, prov: P('GDPR Art. 12(3): one month, extendable by two months', 'primary', 'Modelled as 30 days.'),
    },
    breach: {
      regulatorHours: 72, window: '72 hours from awareness', regulatorTest: 'risk', subjectsTest: 'high-risk', ref: 'GDPR Art. 33', subjectsRef: 'GDPR Art. 34',
      contents: ['Nature of the breach, categories and approximate numbers of people and records', 'Name and contact of the DPO', 'Likely consequences', 'Measures taken or proposed'],
      prov: P('GDPR Arts. 33–34', 'primary'),
    },
    dpia: { name: 'Data protection impact assessment', ref: 'GDPR Art. 35', binding: true, priorConsultation: 'GDPR Art. 36', prov: P('GDPR Arts. 35–36', 'primary') },
    transfers: { ref: 'GDPR Arts. 44–49', summary: 'Transfers outside the EEA need adequacy, appropriate safeguards (SCCs, BCRs) or an Art. 49 derogation.', isDomestic: (c) => EEA.includes(c), prov: P('GDPR Chapter V', 'primary') },
    profileFields: [
      { key: 'leadAuthority', label: 'Lead supervisory authority', type: 'text' },
      { key: 'representative', label: 'EU representative', type: 'text', help: 'Required under Art. 27 when not established in the EEA.' },
    ],
  },
  UK: {
    code: 'UK', name: 'United Kingdom', law: 'UK GDPR and Data Protection Act 2018', shortLaw: 'UK GDPR',
    regulator: "Information Commissioner's Office", regulatorShort: 'ICO',
    blurb: 'Annual data protection fee to the ICO, records, DPIA, 72-hour breach notice, a UK representative if established outside the UK.',
    officer: { title: 'Data Protection Officer', ref: 'UK GDPR Arts. 37–39', prov: P('UK GDPR Arts. 37–39', 'primary') },
    sensitive: { term: 'special category data', ref: 'UK GDPR Arts. 9–10; DPA 2018 Sch. 1', categories: ['racial-ethnic', 'political', 'religious', 'trade-union', 'genetic', 'biometric', 'health', 'sex-life', 'criminal'], prov: P('UK GDPR Arts. 9–10', 'primary') },
    children: { ref: 'UK GDPR Art. 8' },
    bases: { ref: 'UK GDPR Art. 6(1)', available: ALL_BASES({ consent: 'Art. 6(1)(a)', contract: 'Art. 6(1)(b)', 'legal-obligation': 'Art. 6(1)(c)', 'vital-interests': 'Art. 6(1)(d)', 'public-task': 'Art. 6(1)(e)', 'legitimate-interests': 'Art. 6(1)(f)' }), prov: P('UK GDPR Art. 6', 'primary') },
    special: { ref: 'UK GDPR Art. 9(2); DPA 2018 Sch. 1', prov: P('UK GDPR Art. 9; DPA 2018 Sch. 1', 'primary') },
    rights: {
      available: { access: { ref: 'Art. 15' }, rectification: { ref: 'Art. 16' }, erasure: { ref: 'Art. 17' }, restriction: { ref: 'Art. 18' }, portability: { ref: 'Art. 20' }, objection: { ref: 'Art. 21' }, 'withdraw-consent': { ref: 'Art. 7(3)' }, 'automated-decision': { ref: 'Art. 22' }, complaint: { ref: 'Art. 77' } },
      defaultDays: 30, extension: { days: 60, ref: 'Art. 12(3)' }, prov: P('UK GDPR Art. 12(3)', 'primary', 'Modelled as 30 days.'),
    },
    breach: {
      regulatorHours: 72, window: '72 hours from awareness', regulatorTest: 'risk', subjectsTest: 'high-risk', ref: 'UK GDPR Art. 33', subjectsRef: 'UK GDPR Art. 34',
      contents: ['Nature of the breach, categories and approximate numbers', 'DPO contact', 'Likely consequences', 'Measures taken or proposed'],
      prov: P('UK GDPR Arts. 33–34', 'primary'),
    },
    dpia: { name: 'Data protection impact assessment', ref: 'UK GDPR Art. 35', binding: true, priorConsultation: 'UK GDPR Art. 36', prov: P('UK GDPR Arts. 35–36', 'primary') },
    transfers: { ref: 'UK GDPR Arts. 44–49', summary: 'Transfers outside the UK need adequacy regulations, the IDTA or Addendum, or an exception.', isDomestic: (c) => c === 'GB', prov: P('UK GDPR Chapter V', 'primary') },
    profileFields: [
      { key: 'icoRegistration', label: 'ICO registration reference', type: 'text', help: 'Data Protection (Charges and Information) Regulations 2018.' },
      { key: 'icoRenewal', label: 'ICO fee renewal date', type: 'date' },
      { key: 'representative', label: 'UK representative', type: 'text', help: 'Required under Art. 27 when not established in the UK.' },
    ],
  },
};

export const JURISDICTION_CODES = Object.keys(PACKS) as JurisdictionCode[];
export const packFor = (c: JurisdictionCode) => PACKS[c];
export const jxName = (c: JurisdictionCode) => PACKS[c].name;

/** Whether the entity is established inside the jurisdiction. */
export function establishedIn(code: JurisdictionCode, country: string): boolean {
  const t = PACKS[code].transfers;
  if (t) return t.isDomestic(country);
  return ({ GH: 'GH' } as Record<string, string>)[code] === country;
}

/** The categories in a list that a jurisdiction treats as sensitive. */
export const sensitiveIn = (code: JurisdictionCode, categoryIds: string[]) => categoryIds.filter((c) => PACKS[code].sensitive.categories.includes(c));
