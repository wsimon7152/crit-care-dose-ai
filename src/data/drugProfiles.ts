
import { DrugProfile } from '../types';

export const drugProfiles: Record<string, DrugProfile> = {
  vancomycin: {
    name: 'Vancomycin',
    pkParameters: {
      standardDose: 1000,
      interval: 12,
      volumeOfDistribution: 0.7,
      proteinBinding: 0.1,
      crrtClearance: 0.8,
      halfLife: 6
    },
    references: ['Smith et al. 2023', 'Johnson et al. 2022'],
    micBreakpoints: {
      'MRSA': 2,
      'CoNS': 4,
      'Enterococcus': 4
    },
    dosingSuggestions: [
      'Load with 25-30 mg/kg, then 15-20 mg/kg q12h',
      'Target trough 15-20 mg/L for serious infections',
      'Consider continuous infusion for hemodynamically unstable patients'
    ]
  },
  meropenem: {
    name: 'Meropenem',
    pkParameters: {
      standardDose: 1000,
      interval: 8,
      volumeOfDistribution: 0.25,
      proteinBinding: 0.02,
      crrtClearance: 1.2,
      halfLife: 4
    },
    references: ['Brown et al. 2023', 'Davis et al. 2022'],
    micBreakpoints: {
      'P. aeruginosa': 2,
      'K. pneumoniae': 1,
      'A. baumannii': 2
    },
    dosingSuggestions: [
      'Standard dose 1g q8h, increase to 2g q8h for resistant organisms',
      'Consider extended infusion (3-4 hours) to optimize %T>MIC',
      'Target 40-50% T>MIC for bacteriostatic effect'
    ]
  },
  piperacillinTazobactam: {
    name: 'Piperacillin-Tazobactam',
    pkParameters: {
      standardDose: 4000,
      interval: 8,
      volumeOfDistribution: 0.18,
      proteinBinding: 0.3,
      crrtClearance: 1.5,
      halfLife: 3.5
    },
    references: ['Wilson et al. 2023', 'Taylor et al. 2022'],
    micBreakpoints: {
      'P. aeruginosa': 16,
      'E. coli': 8,
      'K. pneumoniae': 8
    },
    dosingSuggestions: [
      '4.5g q8h standard, may increase to q6h for severe infections',
      'Extended infusion recommended (4 hours)',
      'Target 50% T>MIC for optimal efficacy'
    ]
  },
  cefepime: {
    name: 'Cefepime',
    pkParameters: {
      standardDose: 2000,
      interval: 12,
      volumeOfDistribution: 0.2,
      proteinBinding: 0.2,
      crrtClearance: 1.0,
      halfLife: 5
    },
    references: ['Anderson et al. 2023', 'Miller et al. 2022'],
    micBreakpoints: {
      'P. aeruginosa': 8,
      'K. pneumoniae': 2,
      'E. coli': 1
    },
    dosingSuggestions: [
      '2g q12h standard dosing',
      'May require q8h for resistant pathogens',
      'Target 60-70% T>MIC for optimal killing'
    ]
  },
  linezolid: {
    name: 'Linezolid',
    pkParameters: {
      standardDose: 600,
      interval: 12,
      volumeOfDistribution: 0.65,
      proteinBinding: 0.31,
      crrtClearance: 0.3,
      halfLife: 8
    },
    references: ['Garcia et al. 2023', 'Lee et al. 2022'],
    micBreakpoints: {
      'MRSA': 4,
      'VRE': 2,
      'CoNS': 4
    },
    dosingSuggestions: [
      '600mg q12h standard (minimal CRRT clearance)',
      'No dose adjustment typically needed',
      'Target AUC 400-600 mg*h/L for efficacy'
    ]
  }
};
