export interface User {
  id: string;
  email: string;
  role: 'standard' | 'admin';
  name: string;
  institution?: string;
  apiKeys?: ApiKeyConfig[];
  preferredModel?: string;
}

export interface ApiKeyConfig {
  id: string;
  provider: 'openai' | 'claude' | 'anthropic';
  name: string;
  key: string;
  createdAt: Date;
}

export interface PatientInput {
  age?: number;
  gender?: 'male' | 'female';
  weight?: number;
  serumCreatinine?: number;
  liverDisease: boolean;
  heartDisease: boolean;
  heartFailure: boolean;
  dialysateFlowRate?: number;
  dialysateFlowRateUnit?: 'ml/hr' | 'ml/kg/hr';
  bloodFlowRate?: number;
  preFilterReplacementRate?: number;
  postFilterReplacementRate?: number;
  ultrafiltrationRate?: number;
  microbiologicalCulture?: string;
  ecmoTreatment: boolean;
  antibioticName: string;
  infectionType?: string;
  sourceOfInfection?: string;
  mic?: number;
  crrtModality?: 'CVVH' | 'CVVHD' | 'CVVHDF' | 'PIRRT' | 'SLED';
  filterType?: string;
  dilutionMode?: 'pre' | 'post';
  dosingMethod?: 'bolus' | 'infusion' | 'extravascular';
  infusionDuration?: number;
  infusionRate?: number;
  tpeTreatment?: boolean;
  circuitAge?: 'new' | 'used';
  sepsis?: boolean;
  acuteKidneyInjury?: boolean;
}

export interface PKParameters {
  standardDose: number;
  interval: number;
  volumeOfDistribution: number;
  proteinBinding: number;
  crrtClearance: number;
  hepaticClearance?: number;
  nonRenalClearance?: number;
  halfLife: number;
  molecularWeight?: number;
  fractionUnbound?: number;
  logP?: number;
  saltFactor?: number;
  bioavailability?: number;
  absorptionRateKa?: number;
}

export interface PKResult {
  totalClearance: number;
  auc024: number;
  percentTimeAboveMic: number;
  doseRecommendation: string;
  rationale: string;
  concentrationCurve: Array<{ time: number; concentration: number }>;
  evidenceAlerts?: string[];
  supportingStudies?: Research[];
  citationText?: string;
  evidenceSources?: {
    volumeOfDistribution: string;
    clearance: string;
    sievingCoefficient: string;
    proteinBinding: string;
  };
  calculationDetails?: {
    patientWeight: number;
    crrtClearance: number;
    hepaticClearance: number;
    residualRenalClearance: number;
    flowMultiplier: number;
    proteinBindingAdjustment: number;
    volumeOfDistribution: number;
    eliminationRate: number;
    initialConcentration: number;
    dailyDose: number;
    dosesPerDay: number;
    timeToReachMIC?: number;
    sievingCoefficient?: number;
    filterEfficiency?: string;
  };
}

export interface Research {
  id: string;
  title: string;
  authors: string;
  year: number;
  url?: string;
  pdfPath?: string;
  status: 'pending' | 'approved' | 'rejected' | 'revoked';
  uploadedBy: string;
  uploadedAt: Date;
  tags: string[];
  notes?: string;
  adminNotes?: string;
  filename?: string;
}

export interface DrugProfile {
  name: string;
  pkParameters: PKParameters;
  references: string[];
  micBreakpoints: Record<string, number>;
  dosingSuggestions: string[];
  tdmTargets?: {
    trough?: { min: number; max: number; unit: string };
    peak?: { min: number; max: number; unit: string };
    auc?: { min: number; max: number; unit: string };
    percentTimeAboveMic?: { min: number; max: number };
  };
}
