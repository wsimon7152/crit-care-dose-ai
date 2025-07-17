
import { DrugProfile } from '../types';

export const drugProfiles: Record<string, DrugProfile> = {
  vancomycin: {
    name: 'Vancomycin',
    pkParameters: {
      standardDose: 1000,
      interval: 12,
      volumeOfDistribution: 0.7,
      proteinBinding: 0.5,
      crrtClearance: 1.2, // PMC11928783 2025 PopPK non-crit adults: 1.0-1.4 L/h range
      hepaticClearance: 0.2, // Independent hepatic clearance (L/h)
      nonRenalClearance: 0.2,
      halfLife: 6,
      molecularWeight: 1485,
      fractionUnbound: 0.5,
      logP: -3.1,
      saltFactor: 1.0,
      bioavailability: 1.0
    },
    references: ['Roberts et al. 2012', 'Rybak et al. 2020', 'PMC11928783 2025', 'Springer 2024', 'Frontiers 2023'],
    micBreakpoints: {
      'MRSA': 2,
      'CoNS': 4,
      'Enterococcus': 4
    },
    dosingSuggestions: [
      'Load with 25-30 mg/kg, then 15-20 mg/kg q12h',
      'Target trough 15-20 mg/L for serious infections',
      'Consider continuous infusion for hemodynamically unstable patients',
      '≥15 mg/kg/day for high-intensity CRRT, AUC:MIC monitoring vs trough'
    ],
    tdmTargets: {
      trough: { min: 15, max: 20, unit: 'mg/L' },
      auc: { min: 400, max: 600, unit: 'mg·h/L' }
    }
  },
  meropenem: {
    name: 'Meropenem',
    pkParameters: {
      standardDose: 1000,
      interval: 8,
      volumeOfDistribution: 0.25,
      proteinBinding: 0.02,
      crrtClearance: 2.1, // PMC11844199 2025 PopPK prolonged infusion CRRT: 1.8-2.4 L/h
      hepaticClearance: 0.4, // Independent hepatic clearance (L/h)
      nonRenalClearance: 0.4,
      halfLife: 4,
      molecularWeight: 437,
      fractionUnbound: 0.98,
      logP: -0.7,
      saltFactor: 1.0,
      bioavailability: 1.0
    },
    references: ['Seyler et al. 2011', 'Thalhammer et al. 1997', 'PMC11844199 2025', 'PubMed 39991086 2025', 'Taylor 2023'],
    micBreakpoints: {
      'P. aeruginosa': 2,
      'K. pneumoniae': 1,
      'A. baumannii': 2
    },
    dosingSuggestions: [
      'Standard dose 1g q8h, increase to 2g q8h for resistant organisms',
      'Consider extended infusion (3-4 hours) to optimize %T>MIC',
      'Target 40-50% T>MIC for bacteriostatic effect',
      '0.5g q6h or 1g q8h optimal for CRRT, vaborbactam combo for AKI'
    ],
    tdmTargets: {
      percentTimeAboveMic: { min: 40, max: 100 }
    }
  },
  piperacillinTazobactam: {
    name: 'Piperacillin-Tazobactam',
    pkParameters: {
      standardDose: 4000,
      interval: 8,
      volumeOfDistribution: 0.18,
      proteinBinding: 0.3,
      crrtClearance: 1.8, // PMC11938006 2025 opportunistic PopPK CRRT: variable with modalities
      hepaticClearance: 0.6, // Independent hepatic clearance (L/h)
      nonRenalClearance: 0.6,
      halfLife: 3.5,
      molecularWeight: 517, // Piperacillin MW
      fractionUnbound: 0.7,
      logP: -1.2,
      saltFactor: 1.0,
      bioavailability: 1.0
    },
    references: ['Arzuaga et al. 2005', 'Valtonen et al. 2001', 'PMC11938006 2025', 'ASM 2022', 'Wiley 2022'],
    micBreakpoints: {
      'P. aeruginosa': 16,
      'E. coli': 8,
      'K. pneumoniae': 8
    },
    dosingSuggestions: [
      '4.5g q8h standard, may increase to q6h for severe infections',
      'Extended infusion recommended (4 hours)',
      'Target 50% T>MIC for optimal efficacy',
      'TDM-guided EI for better PD in CRRT, q6h for severe'
    ],
    tdmTargets: {
      percentTimeAboveMic: { min: 50, max: 100 }
    }
  },
  cefepime: {
    name: 'Cefepime',
    pkParameters: {
      standardDose: 2000,
      interval: 12,
      volumeOfDistribution: 0.2,
      proteinBinding: 0.2,
      crrtClearance: 1.6, // PubMed 40323389 2025 ex vivo cefepime-taniborbactam CRRT: variable CL
      hepaticClearance: 0.3, // Independent hepatic clearance (L/h)
      nonRenalClearance: 0.3,
      halfLife: 5,
      molecularWeight: 480,
      fractionUnbound: 0.8,
      logP: -1.02,
      saltFactor: 1.0,
      bioavailability: 1.0
    },
    references: ['Malone et al. 2001', 'Barbhaiya et al. 1992', 'PubMed 40323389 2025', 'OUP 2025', 'Academic OUP 2025'],
    micBreakpoints: {
      'P. aeruginosa': 8,
      'K. pneumoniae': 2,
      'E. coli': 1
    },
    dosingSuggestions: [
      '2g q12h standard dosing',
      'May require q8h for resistant pathogens',
      'Target 60-70% T>MIC for optimal killing',
      'EI 2g q8h for CRRT, PopPK validation for taniborbactam'
    ],
    tdmTargets: {
      percentTimeAboveMic: { min: 60, max: 100 }
    }
  },
  linezolid: {
    name: 'Linezolid',
    pkParameters: {
      standardDose: 600,
      interval: 12,
      volumeOfDistribution: 0.65,
      proteinBinding: 0.31,
      crrtClearance: 0.5, // ScienceDirect 2023 dosing RRT modalities: 3x higher in anurics/variability
      hepaticClearance: 2.8, // Independent hepatic clearance (L/h) - primarily hepatic
      nonRenalClearance: 2.8,
      halfLife: 8,
      molecularWeight: 337,
      fractionUnbound: 0.69,
      logP: 0.23,
      saltFactor: 1.0,
      bioavailability: 1.0
    },
    references: ['Swoboda et al. 2010', 'Stalker et al. 2003', 'ScienceDirect 2023', 'OUP 2025', 'PMC11912797 2025'],
    micBreakpoints: {
      'MRSA': 4,
      'VRE': 2,
      'CoNS': 4
    },
    dosingSuggestions: [
      '600mg q12h standard (minimal CRRT clearance)',
      'No dose adjustment typically needed',
      'Target AUC 400-600 mg*h/L for efficacy',
      'TDM for RRT variability, CI if prolonged, maintain trough 2-8 mg/L'
    ],
    tdmTargets: {
      trough: { min: 2, max: 8, unit: 'mg/L' },
      auc: { min: 200, max: 350, unit: 'mg·h/L' }
    }
  },
  gentamicin: {
    name: 'Gentamicin',
    pkParameters: {
      standardDose: 400,
      interval: 24,
      volumeOfDistribution: 0.25,
      proteinBinding: 0.1,
      crrtClearance: 0.75, // LWW 2024 rethinking aminoglycoside dosing CRRT: 0.5-1.0 L/h
      hepaticClearance: 0.1,
      nonRenalClearance: 0.1,
      halfLife: 2,
      molecularWeight: 478,
      fractionUnbound: 0.9,
      logP: -2.2,
      saltFactor: 1.0,
      bioavailability: 1.0
    },
    references: ['Keller et al. 2008', 'Destache et al. 1990', 'LWW 2024', 'PMC8747548 2022', 'BMC Pediatr 2019'],
    micBreakpoints: {
      'P. aeruginosa': 4,
      'K. pneumoniae': 4,
      'E. coli': 4
    },
    dosingSuggestions: [
      'Extended interval dosing: 5-7 mg/kg q24h',
      'Target peak 5-10 mg/L, trough <2 mg/L',
      'Monitor renal function and ototoxicity',
      '7 mg/kg q24h extended interval for CRRT 30 mL/kg/h, rethinking traditional vs EI'
    ],
    tdmTargets: {
      peak: { min: 5, max: 10, unit: 'mg/L' },
      trough: { min: 0.5, max: 2, unit: 'mg/L' }
    }
  },
  colistin: {
    name: 'Colistin',
    pkParameters: {
      standardDose: 300,
      interval: 12,
      volumeOfDistribution: 0.34,
      proteinBinding: 0.5,
      crrtClearance: 1.0, // PMC11438743 2024 high-dose PK CRRT: 84% extracorporeal
      hepaticClearance: 0.2,
      nonRenalClearance: 0.2,
      halfLife: 5,
      molecularWeight: 1634,
      fractionUnbound: 0.5,
      logP: -1.5,
      saltFactor: 1.0,
      bioavailability: 1.0
    },
    references: ['Leuppi-Taegtmeyer et al. 2019', 'Karvanen et al. 2013', 'PMC11438743 2024', 'ScienceDirect 2025', 'PMC12064624 2025'],
    micBreakpoints: {
      'P. aeruginosa': 2,
      'K. pneumoniae': 2,
      'A. baumannii': 2
    },
    dosingSuggestions: [
      'Loading dose: 9 million IU, then 4.5 million IU q12h',
      'Target steady-state plasma concentration 2-4 mg/L',
      'Monitor renal function closely',
      'High-dose for CRRT/SLED, steady-state above targets, CMS/PB variability'
    ],
    tdmTargets: {
      trough: { min: 2, max: 4, unit: 'mg/L' }
    }
  },
  imipenem: {
    name: 'Imipenem',
    pkParameters: {
      standardDose: 500,
      interval: 6,
      volumeOfDistribution: 0.2,
      proteinBinding: 0.2,
      crrtClearance: 1.5, // PMC11754279 2025 PopPK elderly: CrCl key, minimal impact
      hepaticClearance: 0.3,
      nonRenalClearance: 0.3,
      halfLife: 3,
      molecularWeight: 317,
      fractionUnbound: 0.8,
      logP: -1.8,
      saltFactor: 1.0,
      bioavailability: 1.0
    },
    references: ['Tegeder et al. 1999', 'Norrby et al. 1983', 'PMC11754279 2025', 'Karger 2023', 'RRTJournal 2021'],
    micBreakpoints: {
      'P. aeruginosa': 4,
      'K. pneumoniae': 1,
      'E. coli': 1
    },
    dosingSuggestions: [
      'Standard dose 500mg q6h, increase to 1g q6h for severe infections',
      'Consider extended infusion for resistant organisms',
      'Target 40% T>MIC for bacteriostatic effect',
      '500mg q6h optimal in elderly ICU/CRRT, simulations for PD'
    ],
    tdmTargets: {
      percentTimeAboveMic: { min: 40, max: 100 }
    }
  },
  fluconazole: {
    name: 'Fluconazole',
    pkParameters: {
      standardDose: 800,
      interval: 24,
      volumeOfDistribution: 0.65,
      proteinBinding: 0.11,
      crrtClearance: 0.8, // PubMed 40223936 2025 optimizing dosing ARF CRRT PopPK: higher doses needed
      hepaticClearance: 0.4,
      nonRenalClearance: 0.4,
      halfLife: 30,
      molecularWeight: 306,
      fractionUnbound: 0.89,
      logP: 0.5,
      saltFactor: 1.0,
      bioavailability: 1.0
    },
    references: ['Pea et al. 2008', 'Diflucan PI 2019', 'PubMed 40223936 2025', 'Frontiers 2025', 'PMC11985842 2025'],
    micBreakpoints: {
      'C. albicans': 2,
      'C. glabrata': 32,
      'C. parapsilosis': 2
    },
    dosingSuggestions: [
      'Loading dose: 800mg, then 400-800mg q24h',
      'Target AUC/MIC >25 for Candida species',
      'No dose adjustment needed for CRRT',
      '400mg BID min for target attainment in ARF/CRRT, PopPK model'
    ],
    tdmTargets: {
      trough: { min: 8, max: 25, unit: 'mg/L' }
    }
  },
  ceftazidime: {
    name: 'Ceftazidime',
    pkParameters: {
      standardDose: 2000,
      interval: 8,
      volumeOfDistribution: 0.2,
      proteinBinding: 0.1,
      crrtClearance: 1.7, // PubMed 39990787 2025 PopPK CAZ-AVI adults: optimal dosing CRRT
      hepaticClearance: 0.2,
      nonRenalClearance: 0.2,
      halfLife: 4,
      molecularWeight: 547,
      fractionUnbound: 0.9,
      logP: -1.2,
      saltFactor: 1.0,
      bioavailability: 1.0
    },
    references: ['Valtonen et al. 2001', 'Höffler et al. 1982', 'PubMed 39990787 2025', 'PMC12133543 2025', 'ScienceDirect 2024'],
    micBreakpoints: {
      'P. aeruginosa': 8,
      'K. pneumoniae': 1,
      'E. coli': 1
    },
    dosingSuggestions: [
      'Standard dose 2g q8h, may increase to q6h for resistant organisms',
      'Consider extended infusion for optimal %T>MIC',
      'Target 40-50% T>MIC for bacteriostatic effect',
      'PK with AVI: high Cl in CRRT, dose after, PopPK eval for adult/child'
    ],
    tdmTargets: {
      percentTimeAboveMic: { min: 40, max: 100 }
    }
  }
};
