
import { PatientInput, PKParameters, PKResult } from '../types';
import { drugProfiles } from '../data/drugProfiles';

export class PKCalculationService {
  static calculatePKMetrics(input: PatientInput): PKResult {
    const drugProfile = drugProfiles[input.antibioticName.toLowerCase().replace(/[-\s]/g, '')];
    
    if (!drugProfile) {
      throw new Error(`Drug profile not found for ${input.antibioticName}`);
    }

    const pk = drugProfile.pkParameters;
    
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
      const ke = totalClearance / (pk.volumeOfDistribution * (input.weight || 70));
      percentTimeAboveMic = this.calculatePercentTimeAboveMIC(dose, pk.volumeOfDistribution, ke, input.mic, pk.interval);
    }
    
    // Generate concentration-time curve
    const concentrationCurve = this.generateConcentrationCurve(
      dose, 
      pk.volumeOfDistribution * (input.weight || 70), 
      totalClearance / (pk.volumeOfDistribution * (input.weight || 70)),
      pk.interval
    );
    
    // Generate dosing recommendation
    const doseRecommendation = this.generateDoseRecommendation(input, drugProfile, percentTimeAboveMic);
    
    return {
      totalClearance,
      auc024,
      percentTimeAboveMic,
      doseRecommendation: doseRecommendation.dose,
      rationale: doseRecommendation.rationale,
      concentrationCurve
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
    
    // Account for protein binding and sieving coefficient
    const freeDisposition = 1 - pk.proteinBinding;
    
    return baselineClearance * clearanceMultiplier * freeDisposition;
  }

  private static calculatePercentTimeAboveMIC(dose: number, vd: number, ke: number, mic: number, interval: number): number {
    const c0 = dose / vd;
    const timeToMIC = Math.log(c0 / mic) / ke;
    
    if (timeToMIC < 0 || timeToMIC > interval) {
      return timeToMIC < 0 ? 0 : 100;
    }
    
    return (timeToMIC / interval) * 100;
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
    let rationale = drugProfile.dosingSuggestions[0];
    
    // Adjust based on patient factors
    if (input.liverDisease) {
      rationale += '. Liver disease present - monitor closely for accumulation.';
    }
    
    if (input.ecmoTreatment) {
      rationale += '. ECMO therapy may increase volume of distribution - consider loading dose.';
    }
    
    if (input.mic && percentTimeAboveMic < 40) {
      rationale += ` Current %T>MIC is ${percentTimeAboveMic.toFixed(1)}% - consider dose escalation or extended infusion.`;
    }
    
    return { dose, rationale };
  }
}
