export interface TourStop {
  id: string
  city: string
  venue: string
  date: string
  status: 'tbd' | 'inprogress' | 'confirmed'
}

export interface ActivityRow {
  id: string
  name: string
  notes: string
  type: string
}

export interface ContactRow {
  id: string
  name: string
  role: string
  contact: string
  type: string
}

export interface BriefData {
  // Gate 1 — Client & Brand Brief
  client: string
  contact: string
  sector: string
  briefDate: string
  attendance: string
  duration: string
  evtDesc: string
  obj: string | null
  kpi: string
  kpi2: string
  restrict: string
  prev: string

  // Gate 2 — Event Format & Scope
  fmt: string | null
  evtName: string
  edition: string
  genre: string
  evtType: string
  role: string | null

  // Gate 3 — Event Identity & Creative
  centralIdea: string
  conceptDesc: string
  colour1: string
  colour2: string
  colourApp: string
  pillar1t: string
  pillar2t: string
  pillar3t: string
  pillar1d: string
  pillar2d: string
  pillar3d: string
  moodRef: string
  creativeRestrict: string
  delivFormat: string
  reelTurnaround: string
  galleryTurnaround: string
  creativeDeliverables: string[]
  experienceCoverage: string[]

  // Gate 4 — Audience & Market
  aud: string | null
  audDetail: string
  geo: string | null
  fanbase: string
  demand: string

  // Gate 5 — Scale & Capacity
  cap: string | null
  capNum: number
  days: number

  // Gate 6 — Production Services
  coreServices: string[]
  optionalServices: string[]
  experienceServices: string[]
  visualDisplay: string[]
  powerInfra: string[]
  g6delivFormat: string
  g6reelTurnaround: string
  g6galleryTurnaround: string

  // Gate 7 — Talent & Programming
  talent: string | null
  hlBudget: number
  supBudget: number
  additionalProgramming: string[]

  // Gate 8 — Competition Structure
  compType: string | null
  activities: ActivityRow[]
  mainCat: string
  optCats: string
  eligibility: string
  registration: string
  judging: string
  prize1: string
  prize2: string
  prize3: string
  prizeNotes: string
  prizeOwner: string

  // Gate 9 — Tour Routing
  tour: string | null
  stops: TourStop[]
  rig: string | null

  // Gate 10 — Permits & Compliance
  permitStatuses: Record<string, 'required' | 'inprogress' | 'secured'>
  insurance: string[]

  // Gate 11 — Budget & P&L
  c1: number; c2: number; c3: number; c4: number; c5: number; c6: number; c7: number
  c8: number; c9: number; c10: number; c11: number; c12: number; c13: number; c14: number
  r1p: number; r2p: number; r3p: number
  r1q: number; r2q: number; r3q: number
  r4: number; r5: number; r6: number

  // Gate 12 — Commercial Terms
  fee: string | null
  feeBase: number
  feePct: number
  openItems: string[]
  slayrAdditives: string[]
  paymentTerms: string[]

  // Gate 13 — Key Contacts
  slayrContacts: ContactRow[]
  extContacts: ContactRow[]
  radioEventDirector: string
  radioStageManager: string
  radioSecurityLead: string
  radioTechLead: string
  radioMedicalLead: string
  radioArtistLiaison: string

  // Gate 14 — Client Pitch Deck
  deckStyle: string | null
  deckModules: string[]
  deckTalkingPoints: Record<string, string>
  deckPresenter: string
  deckPreparedFor: string
  deckTagline: string
  deckConfidentiality: string

  // Gate 15 — Timeline
  leadWeeks: number
}

export const defaultBriefData = (): BriefData => ({
  client: '', contact: '', sector: '', briefDate: '',
  attendance: '', duration: '', evtDesc: '', obj: null,
  kpi: '', kpi2: '', restrict: '', prev: '',
  fmt: null, evtName: '', edition: '', genre: '', evtType: '', role: null,
  centralIdea: '', conceptDesc: '', colour1: '', colour2: '', colourApp: '',
  pillar1t: '', pillar2t: '', pillar3t: '', pillar1d: '', pillar2d: '', pillar3d: '',
  moodRef: '', creativeRestrict: '', delivFormat: '', reelTurnaround: '', galleryTurnaround: '',
  creativeDeliverables: [
    'Event name treatment and visual identity',
    'Digital assets',
    'Stage and competition zone design',
    'On-ground brand application',
    'Art direction brief for photography and video teams',
  ],
  experienceCoverage: [],
  aud: null, audDetail: '', geo: null, fanbase: '', demand: '',
  cap: null, capNum: 2000, days: 1,
  coreServices: [
    'Stage production — design, construction, rigging',
    'AV systems — sound, lighting, screens, LED walls',
    'Site infrastructure — power, fencing, toilets, waste',
    'Talent booking & artist management',
    'Ticketing platform management',
    'Security — crowd management & access control',
    'Medical services provision',
    'Permits, licensing & compliance',
  ],
  optionalServices: [], experienceServices: [], visualDisplay: [], powerInfra: [],
  g6delivFormat: '', g6reelTurnaround: '', g6galleryTurnaround: '',
  talent: null, hlBudget: 60000000, supBudget: 25000000, additionalProgramming: [],
  compType: null, activities: [], mainCat: '', optCats: '', eligibility: '', registration: '',
  judging: '', prize1: '', prize2: '', prize3: '', prizeNotes: '', prizeOwner: '',
  tour: null, stops: [], rig: null,
  permitStatuses: {}, insurance: [],
  c1: 15000000, c2: 35000000, c3: 20000000, c4: 60000000, c5: 25000000, c6: 8000000, c7: 3000000,
  c8: 5000000, c9: 4000000, c10: 12000000, c11: 5500000, c12: 6000000, c13: 4000000, c14: 20250000,
  r1p: 20000, r2p: 60000, r3p: 200000, r1q: 6000, r2q: 600, r3q: 60,
  r4: 50000000, r5: 40000000, r6: 3000000,
  fee: null, feeBase: 50000000, feePct: 15, openItems: [], slayrAdditives: [], paymentTerms: [],
  slayrContacts: [
    { id: '1', name: 'Benjamin Masebinu', role: 'Group C.E.O / Head of Production', contact: '', type: 'SlayR' },
    { id: '2', name: 'Seun', role: 'Technical Lead (SoundHook)', contact: '', type: 'SlayR' },
    { id: '3', name: 'Sam', role: 'Creative Director', contact: '', type: 'SlayR' },
    { id: '4', name: 'Dami', role: 'Event Coordinator', contact: '', type: 'SlayR' },
  ],
  extContacts: [
    { id: '1', name: '', role: 'Client', contact: '', type: 'Client' },
    { id: '2', name: '', role: 'Venue Manager', contact: '', type: 'Venue' },
    { id: '3', name: '', role: 'Safety Officer', contact: '', type: 'Safety' },
  ],
  radioEventDirector: '', radioStageManager: '', radioSecurityLead: '',
  radioTechLead: '', radioMedicalLead: '', radioArtistLiaison: '',
  deckStyle: null, deckModules: [
    'Event Overview', 'Creative Direction & Identity', 'Competition & Programme Structure',
    'Experience & Coverage', 'Event Programming Highlights', 'Technical Production',
    'Marketing & Promotions Plan', 'Why SlayR', 'Scope of Work Summary', 'Next Steps',
  ],
  deckTalkingPoints: {}, deckPresenter: '', deckPreparedFor: '', deckTagline: '', deckConfidentiality: '',
  leadWeeks: 12,
})
