import { PatientInput, PKParameters, PKResult } from '../types';
import { drugProfiles } from '../data/drugProfiles';
import { StudyVerificationService } from './studyVerification';
import { ResearchIntegrationService } from './researchIntegration';

export class PKCalculationService {
  static calculatePKMetrics(input: PatientInput): PKResult {
    // Normalize the drug name to match drugProfiles keys
    const normalizedDrugName = this.normalizeDrugName(input.antibioticName);
    const drugProfile = drugProfiles[normalizedDrugName];
    
    if (!drugProfile) {
      console.error('Available drug profiles:', Object.keys(drugProfiles));
      console.error('Requested drug name:', input.antibioticName);
      console.error('Normalized drug name:', normalizedDrugName);
      throw new Error(`Drug profile not found for ${input.antibioticName}`);
    }

    // Adjust PK parameters based on approved research studies
    const adjustedPK = ResearchIntegrationService.adjustPKParametersFromStudies(
      drugProfile.pkParameters, 
      input.antibioticName, 
      input
    );
    const pk = adjustedPK;
    
    // Patient weight (use 70kg as default if not provided)
    const patientWeight = input.weight || 70;
    
    // Calculate CRRT clearance with detailed breakdown
    const crrtCalculations = this.calculateCRRTClearanceDetailed(input, pk);
    
    // Calculate hepatic and renal clearance
    const hepaticClearance = input.liverDisease ? pk.crrtClearance * 0.5 : pk.crrtClearance * 0.8;
    const residualRenalClearance = 0.1; // Assume minimal residual renal function in CRRT patients
    
    // Calculate total clearance (CRRT + hepatic + residual renal)
    const totalClearance = crrtCalculations.adjustedClearance + hepaticClearance + residualRenalClearance;
    
    // Calculate dosing parameters
    const dosesPerDay = 24 / pk.interval;
    const dailyDose = pk.standardDose * dosesPerDay;
    
    // Calculate AUC0-24
    const auc024 = dailyDose / totalClearance;
    
    // Calculate volume of distribution and elimination rate
    const volumeOfDistribution = pk.volumeOfDistribution * patientWeight;
    const eliminationRate = totalClearance / volumeOfDistribution;
    const initialConcentration = pk.standardDose / volumeOfDistribution;
    
    // Calculate %T>MIC if MIC is provided
    let percentTimeAboveMic = 0;
    let timeToReachMIC = undefined;
    if (input.mic && initialConcentration > input.mic) {
      timeToReachMIC = Math.log(initialConcentration / input.mic) / eliminationRate;
      percentTimeAboveMic = Math.min((timeToReachMIC / pk.interval) * 100, 100);
    }
    
    // Generate concentration-time curve
    const concentrationCurve = this.generateConcentrationCurve(
      pk.standardDose, 
      volumeOfDistribution, 
      eliminationRate,
      pk.interval
    );
    
    // Generate dosing recommendation with research integration
    const doseRecommendation = this.generateDoseRecommendation(input, drugProfile, percentTimeAboveMic);
    
    // Generate evidence alerts and citations
    const evidenceAlerts = ResearchIntegrationService.generateEvidenceAlerts(
      input.antibioticName, 
      input, 
      { totalClearance, auc024, percentTimeAboveMic } as PKResult
    );
    
    const citations = ResearchIntegrationService.generateStudyCitations(
      input.antibioticName, 
      input
    );
    
    return {
      totalClearance,
      auc024,
      percentTimeAboveMic,
      doseRecommendation: doseRecommendation.dose,
      rationale: doseRecommendation.rationale,
      concentrationCurve,
      evidenceAlerts,
      supportingStudies: citations.supportingStudies,
      citationText: citations.citationText,
      calculationDetails: {
        patientWeight,
        crrtClearance: crrtCalculations.adjustedClearance,
        hepaticClearance,
        residualRenalClearance,
        flowMultiplier: crrtCalculations.flowMultiplier,
        proteinBindingAdjustment: crrtCalculations.proteinBindingAdjustment,
        volumeOfDistribution,
        eliminationRate,
        initialConcentration,
        dailyDose,
        dosesPerDay,
        timeToReachMIC,
        sievingCoefficient: crrtCalculations.sievingCoefficient,
        filterEfficiency: crrtCalculations.filterEfficiency
      }
    };
  }

  private static normalizeDrugName(drugName: string): string {
    // Handle specific drug name mappings
    const drugNameMappings: Record<string, string> = {
      'piperacillintazobactam': 'piperacillinTazobactam',
      'piperacillin-tazobactam': 'piperacillinTazobactam',
      'piperacillin tazobactam': 'piperacillinTazobactam'
    };

    const normalized = drugName.toLowerCase().replace(/[-\s]/g, '');
    return drugNameMappings[normalized] || normalized;
  }

  private static calculateCRRTClearanceDetailed(input: PatientInput, pk: PKParameters): {
    adjustedClearance: number;
    flowMultiplier: number;
    proteinBindingAdjustment: number;
    sievingCoefficient: number;
    filterEfficiency: string;
  } {
    const baselineClearance = pk.crrtClearance;
    
    // Calculate flow multiplier based on CRRT settings
    let flowMultiplier = 1;
    
    if (input.bloodFlowRate) {
      flowMultiplier *= Math.min(input.bloodFlowRate / 150, 1.5); // Baseline 150 mL/min
    }
    
    if (input.dialysateFlowRate) {
      flowMultiplier *= Math.min(input.dialysateFlowRate / 25, 1.3); // Baseline 25 mL/kg/hr
    }
    
    // Calculate protein binding adjustment with filter-specific considerations
    const proteinBindingAdjustment = this.calculateProteinBindingAdjustment(
      pk.proteinBinding, 
      input.filterType || 'high-flux',
      input.antibioticName
    );
    
    // Get sieving coefficient for detailed reporting
    const sievingData = this.getSievingCoefficient(input.filterType || 'high-flux', input.antibioticName, pk.proteinBinding);
    const sievingCoefficient = pk.proteinBinding > 0.8 ? sievingData.highBinding : sievingData.lowBinding;
    
    // Determine filter efficiency category
    const filterEfficiency = sievingCoefficient > 0.9 ? 'High efficiency' : 
                           sievingCoefficient > 0.7 ? 'Moderate efficiency' : 'Lower efficiency';
    
    const adjustedClearance = baselineClearance * flowMultiplier * proteinBindingAdjustment;
    
    return {
      adjustedClearance,
      flowMultiplier,
      proteinBindingAdjustment,
      sievingCoefficient,
      filterEfficiency
    };
  }

  private static calculateCRRTClearance(input: PatientInput, pk: PKParameters): number {
    const baselineClearance = pk.crrtClearance;
    
    // Adjust based on CRRT settings
    let clearanceMultiplier = 1;
    
    if (input.bloodFlowRate) {
      clearanceMultiplier *= Math.min(input.bloodFlowRate / 150, 1.5); // Baseline 150 mL/min
    }
    
    if (input.dialysateFlowRate) {
      clearanceMultiplier *= Math.min(input.dialysateFlowRate / 25, 1.3); // Baseline 25 mL/kg/hr
    }
    
    // Calculate protein binding adjustment with filter-specific considerations
    const proteinBindingAdjustment = this.calculateProteinBindingAdjustment(
      pk.proteinBinding, 
      input.filterType || 'high-flux',
      input.antibioticName
    );
    
    return baselineClearance * clearanceMultiplier * proteinBindingAdjustment;
  }

  private static calculateProteinBindingAdjustment(proteinBinding: number, filterType: string, drugName: string): number {
    // Free fraction of drug
    const freeFraction = 1 - proteinBinding;
    
    // Filter-specific sieving coefficients for different membrane types
    const sievingCoefficients = this.getSievingCoefficient(filterType, drugName, proteinBinding);
    
    // For highly protein-bound drugs, filter type significantly impacts clearance
    // For low protein binding drugs, effect is minimal
    const filterImpact = proteinBinding > 0.8 ? sievingCoefficients.highBinding : sievingCoefficients.lowBinding;
    
    return freeFraction * filterImpact;
  }

  private static getSievingCoefficient(filterType: string, drugName: string, proteinBinding: number): { highBinding: number; lowBinding: number } {
    // Sieving coefficients based on filter membrane characteristics
    const coefficients: Record<string, { highBinding: number; lowBinding: number }> = {
      'high-flux': { highBinding: 0.7, lowBinding: 0.95 },
      'low-flux': { highBinding: 0.4, lowBinding: 0.85 },
      'prismax-hf1000': { highBinding: 0.8, lowBinding: 0.98 },
      'prismax-hf1400': { highBinding: 0.85, lowBinding: 0.98 },
      'multifiltrate-aev1000': { highBinding: 0.75, lowBinding: 0.95 },
      'multifiltrate-aev600': { highBinding: 0.7, lowBinding: 0.92 },
      'fresenius-hf1000': { highBinding: 0.72, lowBinding: 0.94 },
      'fresenius-hf1400': { highBinding: 0.78, lowBinding: 0.96 },
      'baxter-st100': { highBinding: 0.68, lowBinding: 0.93 },
      'baxter-st150': { highBinding: 0.73, lowBinding: 0.95 }
    };

    // Drug-specific adjustments for certain antibiotics
    const drugSpecificAdjustments: Record<string, number> = {
      'vancomycin': 0.9,  // Lower protein binding, higher sieving
      'teicoplanin': 0.6,  // High protein binding, lower sieving
      'ceftazidime': 0.95, // Low protein binding
      'meropenem': 0.92,   // Low protein binding
      'piperacillintazobactam': 0.88 // Moderate protein binding
    };

    const baseCoefficients = coefficients[filterType] || coefficients['high-flux'];
    const drugAdjustment = drugSpecificAdjustments[drugName.toLowerCase().replace(/[-\s]/g, '')] || 1;

    return {
      highBinding: baseCoefficients.highBinding * drugAdjustment,
      lowBinding: baseCoefficients.lowBinding * drugAdjustment
    };
  }

  private static calculatePercentTimeAboveMIC(dose: number, vd: number, ke: number, mic: number, interval: number): number {
    // Calculate initial concentration after dose
    const c0 = dose / vd;
    
    // If initial concentration is below MIC, no time above MIC
    if (c0 <= mic) {
      return 0;
    }
    
    // Calculate time when concentration drops to MIC level
    // C(t) = C0 * e^(-ke * t)
    // When C(t) = MIC: MIC = C0 * e^(-ke * t)
    // Solving for t: t = ln(C0/MIC) / ke
    const timeToReachMIC = Math.log(c0 / mic) / ke;
    
    // If time to reach MIC is greater than dosing interval, 
    // concentration stays above MIC for the entire interval
    if (timeToReachMIC >= interval) {
      return 100;
    }
    
    // Calculate percentage of dosing interval where concentration > MIC
    const percentTimeAbove = (timeToReachMIC / interval) * 100;
    
    return Math.max(0, percentTimeAbove);
  }

  private static generateConcentrationCurve(dose: number, vd: number, ke: number, interval: number) {
    const points = [];
    const c0 = dose / vd;
    
    // Generate curve for 24 hours
    for (let t = 0; t <= 24; t += 0.5) {
      const cycleTime = t % interval;
      const concentration = c0 * Math.exp(-ke * cycleTime);
      points.push({ time: t, concentration });
    }
    
    return points;
  }

  private static generateDoseRecommendation(input: PatientInput, drugProfile: any, percentTimeAboveMic: number) {
    let dose = `${drugProfile.pkParameters.standardDose}mg every ${drugProfile.pkParameters.interval} hours`;
    
    // Get research-based rationale
    const relevantStudies = ResearchIntegrationService.findRelevantStudies(input.antibioticName, input);
    let rationale = `${drugProfile.dosingSuggestions[0]}`;
    
    if (relevantStudies.length > 0) {
      rationale += ` (Based on ${relevantStudies.length} verified platform study/studies)`;
    } else {
      rationale += ' (Standard guidelines - no platform studies available)';
    }
    
    // Adjust based on patient factors with study verification note
    if (input.liverDisease) {
      rationale += '. Liver disease present - dosing adjustment per clinical studies.';
    }
    
    if (input.ecmoTreatment) {
      rationale += '. ECMO therapy increases Vd - loading dose recommended per research.';
    }
    
    if (input.mic && percentTimeAboveMic < 40) {
      rationale += ` Current %T>MIC is ${percentTimeAboveMic.toFixed(1)}% - consider optimization per available studies.`;
    }
    
    return { dose, rationale };
  }

  static async generateStudyVerifiedSummary(input: PatientInput, pkResults: PKResult): Promise<string> {
    // Generate comprehensive research-integrated prompt
    const researchPrompt = ResearchIntegrationService.generateStudyIntegratedPrompt(
      input.antibioticName,
      input,
      pkResults
    );
    
    // In production, this would be sent to the AI API
    console.log('Research-integrated AI prompt:', researchPrompt);
    
    return researchPrompt;
  }
}
