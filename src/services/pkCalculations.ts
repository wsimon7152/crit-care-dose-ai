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
    
    // Calculate CRRT clearance based on modality and flow rates
    const crrtClearance = this.calculateCRRTClearance(input, pk);
    
    // Calculate total clearance (renal + CRRT + hepatic)
    const hepaticClearance = input.liverDisease ? pk.crrtClearance * 0.5 : pk.crrtClearance * 0.8;
    const totalClearance = crrtClearance + hepaticClearance;
    
    // Calculate AUC0-24
    const dose = pk.standardDose;
    const dosesPerDay = 24 / pk.interval;
    const totalDailyDose = dose * dosesPerDay;
    const auc024 = totalDailyDose / totalClearance;
    
    // Calculate %T>MIC if MIC is provided
    let percentTimeAboveMic = 0;
    if (input.mic) {
      const vd = pk.volumeOfDistribution * (input.weight || 70);
      const ke = totalClearance / vd;
      percentTimeAboveMic = this.calculatePercentTimeAboveMIC(dose, vd, ke, input.mic, pk.interval);
    }
    
    // Generate concentration-time curve
    const concentrationCurve = this.generateConcentrationCurve(
      dose, 
      pk.volumeOfDistribution * (input.weight || 70), 
      totalClearance / (pk.volumeOfDistribution * (input.weight || 70)),
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
      citationText: citations.citationText
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
    
    // Account for protein binding and sieving coefficient
    const freeDisposition = 1 - pk.proteinBinding;
    
    return baselineClearance * clearanceMultiplier * freeDisposition;
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
