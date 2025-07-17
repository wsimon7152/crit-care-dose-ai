import { PatientInput, PKParameters, PKResult } from '../types';
import { drugProfiles } from '../data/drugProfiles';
import { StudyVerificationService } from './studyVerification';
import { ResearchIntegrationService } from './researchIntegration';

/**
 * PKCalculationService - Enhanced with expert equations and book chapter guidance
 * Based on: Equations document and Chapter 27: Drug Dosing in AKI and Extracorporeal Therapies by M. Joy et al.
 * 
 * Key Updates:
 * - 2021 CKD-EPI equation for eGFR calculation
 * - Explicit total clearance = nonRenalClearance + residualRenalClearance + extracorporealClearance
 * - Modality-specific CRRT clearance calculations (CVVH, CVVHD, CVVHDF, PIRRT)
 * - Plasma concentration equations for bolus, infusion, and extravascular dosing
 * - ECMO adjustments for volume of distribution and clearance
 * - TPE considerations for highly protein-bound drugs
 * - Enhanced evidence integration with literature references
 */
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
    let pk = { ...adjustedPK };
    
    // Patient weight (use 70kg as default if not provided)
    const patientWeight = input.weight || 70;
    
    // Age-based adjustments (elderly patients may have altered PK)
    if (input.age && input.age >= 65) {
      pk.crrtClearance *= 0.85; // 15% reduction in clearance for elderly
      pk.volumeOfDistribution *= input.age >= 80 ? 0.9 : 0.95; // Further reduction for very elderly
    }
    
    // Gender-based adjustments (women typically have different body composition)
    if (input.gender === 'female') {
      pk.volumeOfDistribution *= 0.9; // Lower muscle mass, different fat distribution
    }
    
    // Enhanced eGFR calculation using 2021 CKD-EPI equation with AKI adjustments
    let residualRenalClearance = this.calculateResidualRenalClearance(input, patientWeight);
    
    // 2025 Update: AKI patients may have augmented clearance (PMC11912797 2025 augmented Cl in AKI)
    if (input.acuteKidneyInjury) {
      residualRenalClearance *= 1.2; // 20% increase for AKI augmented clearance
      console.log('AKI-adjusted residual renal clearance applied (PMC11912797 2025)');
    }
    
    // Calculate CRRT clearance with modality-specific equations
    const crrtCalculations = this.calculateCRRTClearanceDetailed(input, pk);
    
    // Calculate non-renal clearance (replaces hepaticClearance for broader accuracy)
    let nonRenalClearance = pk.nonRenalClearance || pk.hepaticClearance || 0.3;
    
    // AKI-specific adjustments from book chapter (page 17)
    if (input.liverDisease) {
      nonRenalClearance *= 0.7; // Reduced hepatic function in AKI
    }
    
    // Sepsis reduces Phase I metabolism (book chapter page 17)
    if (input.sepsis) {
      nonRenalClearance *= 0.7; // Inflammation reduces metabolism
    }
    
    // Heart disease affects cardiac output and drug distribution
    if (input.heartDisease) {
      nonRenalClearance *= 0.8; // Reduced hepatic blood flow
      pk.volumeOfDistribution *= 1.1; // Increased Vd due to poor perfusion
    }
    
    // Heart failure has more severe impact
    if (input.heartFailure) {
      nonRenalClearance *= 0.6; // Severely reduced hepatic clearance
      pk.volumeOfDistribution *= 1.2; // Significantly increased Vd
    }
    
    // Apply ECMO adjustments if present
    if (input.ecmoTreatment) {
      const ecmoAdjustments = this.calculateECMOAdjustments(pk, input.circuitAge);
      pk.volumeOfDistribution *= ecmoAdjustments.volumeMultiplier;
      nonRenalClearance *= ecmoAdjustments.clearanceMultiplier;
    }
    
    // Explicit total clearance calculation from equations doc and book chapter
    const totalClearance = nonRenalClearance + residualRenalClearance + crrtCalculations.adjustedClearance;
    
    // 2025 Enhancement: Log high extracorporeal clearance (e.g., colistin 84% - PMC11438743 2024)
    if (crrtCalculations.adjustedClearance > 0.8 * totalClearance) {
      console.log(`High extracorporeal clearance detected: ${(crrtCalculations.adjustedClearance/totalClearance*100).toFixed(0)}% of total clearance (PMC11438743 2024)`);
    }
    
    // Augmented renal clearance adjustment (book chapter page 18, LWW 2024 gentamicin rethinking)
    const estimatedGFR = this.calculateCKDEPIGFR(input);
    let augmentedClearanceMultiplier = 1;
    if (estimatedGFR > 130) {
      augmentedClearanceMultiplier = 1.5; // 50% increase for augmented clearance
      console.log('Augmented renal clearance detected (eGFR >130 mL/min/1.73m²) - LWW 2024');
    }
    
    const adjustedTotalClearance = totalClearance * augmentedClearanceMultiplier;
    
    // Calculate dosing parameters
    const dosesPerDay = 24 / pk.interval;
    const dailyDose = pk.standardDose * dosesPerDay;
    
    // Calculate AUC0-24
    const auc024 = dailyDose / adjustedTotalClearance;
    
    // Calculate volume of distribution and elimination rate
    const volumeOfDistribution = pk.volumeOfDistribution * patientWeight;
    const eliminationRate = adjustedTotalClearance / volumeOfDistribution;
    const initialConcentration = pk.standardDose / volumeOfDistribution;
    
    // Calculate %T>MIC if MIC is provided
    let percentTimeAboveMic = 0;
    let timeToReachMIC = undefined;
    if (input.mic && initialConcentration > input.mic) {
      timeToReachMIC = Math.log(initialConcentration / input.mic) / eliminationRate;
      percentTimeAboveMic = Math.min((timeToReachMIC / pk.interval) * 100, 100);
    }
    
    // Generate concentration-time curve with dosing method consideration
    const concentrationCurve = this.generateConcentrationCurve(
      pk.standardDose, 
      volumeOfDistribution, 
      eliminationRate,
      pk.interval,
      input.dosingMethod || 'bolus',
      input.infusionDuration,
      input.infusionRate,
      pk.absorptionRateKa
    );
    
    // Generate dosing recommendation with enhanced factors
    const doseRecommendation = this.generateDoseRecommendation(input, drugProfile, percentTimeAboveMic);
    
    // Generate evidence alerts and citations
    const evidenceAlerts = ResearchIntegrationService.generateEvidenceAlerts(
      input.antibioticName, 
      input, 
      { totalClearance: adjustedTotalClearance, auc024, percentTimeAboveMic } as PKResult
    );
    
    const citations = ResearchIntegrationService.generateStudyCitations(
      input.antibioticName, 
      input
    );
    
    // Generate TDM recommendations
    const tdmRecommendations = this.generateTDMRecommendations(
      input.antibioticName,
      auc024,
      percentTimeAboveMic,
      eliminationRate,
      adjustedTotalClearance
    );
    
    // Merge TDM recommendations with evidence alerts
    const allAlerts = [...evidenceAlerts, ...tdmRecommendations];
    
    // Add TPE considerations if applicable
    if (input.tpeTreatment) {
      const tpeAlert = this.generateTPEAlert(pk.proteinBinding, input.antibioticName);
      if (tpeAlert) allAlerts.push(tpeAlert);
    }
    
    // Generate enhanced evidence sources
    const evidenceSources = this.generateEvidenceSources(input.antibioticName, crrtCalculations);
    
    return {
      totalClearance: adjustedTotalClearance,
      auc024,
      percentTimeAboveMic,
      doseRecommendation: doseRecommendation.dose,
      rationale: doseRecommendation.rationale,
      concentrationCurve,
      evidenceAlerts: allAlerts,
      supportingStudies: citations.supportingStudies,
      citationText: citations.citationText,
      evidenceSources,
      calculationDetails: {
        patientWeight,
        crrtClearance: crrtCalculations.adjustedClearance,
        hepaticClearance: nonRenalClearance,
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

  /**
   * Calculate residual renal clearance using 2021 CKD-EPI equation
   * From equations doc page 1: eGFR = 142 × min(SCr/κ,1)^α × max(SCr/κ,1)^-1.200 × 0.9938^Age × 1.012 [if female]
   */
  private static calculateResidualRenalClearance(input: PatientInput, patientWeight: number): number {
    if (!input.serumCreatinine || !input.age || !input.gender) {
      console.warn('Missing required parameters for eGFR calculation, defaulting to minimal renal function');
      return 0.1;
    }

    const egfr = this.calculateCKDEPIGFR(input);
    
    // Convert eGFR to residual renal clearance
    // Cap at 30% of normal as per current logic, but note this may overestimate in AKI
    const residualRenalClearance = Math.min(egfr / 100, 0.3);
    
    return residualRenalClearance;
  }

  /**
   * Calculate eGFR using 2021 CKD-EPI equation
   * Reference: Hsu et al., NEJM 2021; doi:10.1056/NEJMoa2103753
   */
  private static calculateCKDEPIGFR(input: PatientInput): number {
    if (!input.serumCreatinine || !input.age || !input.gender) {
      return 0;
    }

    const scr = input.serumCreatinine; // mg/dL
    const age = input.age; // years
    const isFemale = input.gender === 'female';
    
    // Constants based on gender
    const kappa = isFemale ? 0.7 : 0.9;
    const alpha = isFemale ? -0.241 : -0.302;
    const genderMultiplier = isFemale ? 1.012 : 1.0;
    
    // Calculate eGFR using 2021 CKD-EPI equation
    const eGFR = 142 *
      Math.pow(Math.min(scr / kappa, 1), alpha) *
      Math.pow(Math.max(scr / kappa, 1), -1.200) *
      Math.pow(0.9938, age) *
      genderMultiplier;
    
    return eGFR; // mL/min/1.73 m²
  }

  /**
   * Enhanced CRRT clearance calculation with modality-specific equations
   * Based on equations doc pages 1-2 and book chapter pages 11-12
   */
  private static calculateCRRTClearanceDetailed(input: PatientInput, pk: PKParameters): {
    adjustedClearance: number;
    flowMultiplier: number;
    proteinBindingAdjustment: number;
    sievingCoefficient: number;
    filterEfficiency: string;
  } {
    const fub = pk.fractionUnbound || (1 - pk.proteinBinding); // Fraction unbound
    const patientWeight = input.weight || 70;
    
    // Convert flows to L/h for consistency
    const bloodFlowRate = (input.bloodFlowRate || 150) * 0.06; // mL/min to L/h
    const dialysateFlowRate = this.normalizeFlowRate(input.dialysateFlowRate || 25, input.dialysateFlowRateUnit, patientWeight);
    const ultrafiltrationRate = (input.ultrafiltrationRate || 0) * 0.001; // mL/h to L/h
    const preReplacementRate = (input.preFilterReplacementRate || 0) * 0.001; // mL/h to L/h
    const postReplacementRate = (input.postFilterReplacementRate || 0) * 0.001; // mL/h to L/h
    
    let clearance = 0;
    let modalityDescription = '';
    
    // Modality-specific clearance calculations
    switch (input.crrtModality) {
      case 'CVVHD': // Diffusion only
        clearance = fub * dialysateFlowRate;
        modalityDescription = 'Continuous Venovenous Hemodialysis (diffusion)';
        break;
        
      case 'CVVH': // Convection/UF only
        if (input.dilutionMode === 'pre') {
          // Pre-dilution: clearance = fub * Q_UF * [Q_blood / (Q_blood + Q_replacement)]
          clearance = fub * ultrafiltrationRate * (bloodFlowRate / (bloodFlowRate + preReplacementRate));
        } else {
          // Post-dilution: clearance = fub * Q_UF
          clearance = fub * ultrafiltrationRate;
        }
        modalityDescription = 'Continuous Venovenous Hemofiltration (convection)';
        break;
        
      case 'CVVHDF': // Combined modality
        if (input.dilutionMode === 'pre') {
          // Pre-dilution: clearance = fub * (Q_dialysate + Q_UF * [Q_blood / (Q_blood + Q_replacement)])
          clearance = fub * (dialysateFlowRate + ultrafiltrationRate * (bloodFlowRate / (bloodFlowRate + preReplacementRate)));
        } else {
          // Post-dilution: clearance = fub * (Q_dialysate + Q_UF)
          clearance = fub * (dialysateFlowRate + ultrafiltrationRate);
        }
        modalityDescription = 'Continuous Venovenous Hemodiafiltration (combined)';
        break;
        
      case 'PIRRT': // Prolonged Intermittent RRT
        // Lower flows for PIRRT (book chapter page 5)
        const pirrtDialysateFlow = Math.min(dialysateFlowRate, 0.3); // Cap at 300 mL/min
        clearance = fub * pirrtDialysateFlow * 0.8; // Adjust for intermittent nature
        modalityDescription = 'Prolonged Intermittent Renal Replacement Therapy';
        break;
        
      case 'SLED': // 2025 Addition: Sustained Low-Efficiency Dialysis
        // ScienceDirect 2025 colistin disposition SLED PopPK
        clearance = fub * dialysateFlowRate * 0.8; // Similar to PIRRT but different duration
        modalityDescription = 'Sustained Low-Efficiency Dialysis';
        break;
        
      default:
        // Fallback to existing logic if modality not specified
        clearance = pk.crrtClearance;
        modalityDescription = 'Standard CRRT calculation';
        console.log('Using fallback CRRT clearance calculation');
    }
    
    // Apply sieving coefficient modulation
    const sievingData = this.getSievingCoefficient(input.filterType || 'high-flux', input.antibioticName, pk.proteinBinding);
    const sievingCoefficient = pk.proteinBinding > 0.8 ? sievingData.highBinding : sievingData.lowBinding;
    
    // For highly protein-bound drugs (>80%), cap clearance (book chapter page 10)
    if (pk.proteinBinding > 0.8) {
      clearance *= 0.8; // Cap adjustment for highly bound drugs
    }
    
    // Apply sieving coefficient
    const finalClearance = clearance * sievingCoefficient;
    
    // Calculate flow multiplier for reporting
    const flowMultiplier = finalClearance / (pk.crrtClearance || 1);
    
    // Determine filter efficiency
    const filterEfficiency = sievingCoefficient > 0.9 ? 'High efficiency' :
                            sievingCoefficient > 0.7 ? 'Moderate efficiency' : 'Lower efficiency';
    
    return {
      adjustedClearance: finalClearance,
      flowMultiplier,
      proteinBindingAdjustment: sievingCoefficient,
      sievingCoefficient,
      filterEfficiency: `${filterEfficiency} (${modalityDescription})`
    };
  }

  /**
   * Normalize flow rate to L/h
   */
  private static normalizeFlowRate(flowRate: number, unit: string | undefined, patientWeight: number): number {
    if (unit === 'ml/hr') {
      return flowRate * 0.001; // mL/hr to L/h
    } else {
      // ml/kg/hr
      return (flowRate * patientWeight) * 0.001; // mL/kg/hr to L/h
    }
  }

  /**
   * Calculate ECMO adjustments for volume of distribution and clearance
   * Based on book chapter pages 23-27 with 2025 drug-specific refinements
   */
  private static calculateECMOAdjustments(pk: PKParameters, circuitAge?: string): {
    volumeMultiplier: number;
    clearanceMultiplier: number;
  } {
    const logP = pk.logP || 0; // Default to hydrophilic if not specified
    const proteinBinding = pk.proteinBinding || 0;
    
    // Volume of distribution adjustment for lipophilic drugs
    let volumeMultiplier = 1;
    if (logP > 0) {
      volumeMultiplier = 1.5; // 50% increase for lipophilic drugs
    }
    
    // 2025 Enhanced sequestration effects with drug-specific adjustments
    let clearanceMultiplier = 1;
    if (proteinBinding > 0.8 && logP > 2) {
      // High sequestration for highly bound, lipophilic drugs
      clearanceMultiplier = 0.3; // 70% reduction (e.g., fentanyl)
    } else if (proteinBinding > 0.5 && logP > 1) {
      // Moderate sequestration
      clearanceMultiplier = 0.9; // 10% reduction
    } else if (proteinBinding === 0.5 && logP === -1.5) {
      // 2025: Colistin-specific adjustment (PMC11438743 2024 ECMO sequestration)
      clearanceMultiplier = 0.9; // 10% reduction based on new data
    } else if (proteinBinding === 0.31 && logP === 0.23) {
      // 2025: Linezolid-specific adjustment for variability (OUP 2025 TDM 2-8 mg/L)
      clearanceMultiplier = 0.9; // 10% reduction if high variability
    }
    
    // Circuit age effect (book chapter page 26)
    if (circuitAge === 'used') {
      clearanceMultiplier *= 0.9; // 10% reduction for used circuits
    } else if (circuitAge === 'new') {
      clearanceMultiplier *= 1.0; // No additional adjustment for new circuits
    }
    
    return {
      volumeMultiplier,
      clearanceMultiplier
    };
  }

  /**
   * Generate TPE alert for highly protein-bound drugs
   * Based on book chapter pages 21-23 with 2025 drug-specific considerations
   */
  private static generateTPEAlert(proteinBinding: number, drugName: string): string | null {
    if (proteinBinding > 0.8) {
      return `🩸 TPE Alert: ${drugName} is highly protein-bound (${(proteinBinding * 100).toFixed(0)}%) - administer dose after plasma exchange to avoid 60-70% removal`;
    }
    
    // 2025 Addition: Special considerations for specific drugs (PMC12133543 2025 case PK)
    const normalizedDrugName = drugName.toLowerCase();
    if (normalizedDrugName.includes('ceftazidime') && normalizedDrugName.includes('avibactam')) {
      return `⚠️ CNS Alert: Ceftazidime-avibactam may cause CNS effects post-CRRT (PMC 2025) - monitor neurological status`;
    }
    
    return null;
  }

  /**
   * Enhanced concentration curve generation with multiple dosing methods
   * Based on equations doc page 2 and book chapter page 20
   */
  private static generateConcentrationCurve(
    dose: number, 
    vd: number, 
    ke: number, 
    interval: number,
    dosingMethod: string = 'bolus',
    infusionDuration?: number,
    infusionRate?: number,
    absorptionRateKa?: number
  ) {
    const points = [];
    
    // Generate curve for 24 hours
    for (let t = 0; t <= 24; t += 0.5) {
      const cycleTime = t % interval;
      let concentration = 0;
      
      switch (dosingMethod) {
        case 'bolus':
          // IV Bolus: Cp = dose / Vd * e^(-ke * t)
          concentration = (dose / vd) * Math.exp(-ke * cycleTime);
          break;
          
        case 'infusion':
          const T = infusionDuration || 1; // Default 1 hour infusion
          const Ko = infusionRate || (dose / T); // Infusion rate
          
          // 2025 Enhancement: Log default infusion duration when not provided
          if (!infusionDuration) {
            console.log('Using default infusion duration (1 hour) for infusion dosing');
          }
          
          if (cycleTime <= T) {
            // During infusion: Cp = Ko / Cl * [1 - e^(-ke * t)]
            concentration = (Ko / (ke * vd)) * (1 - Math.exp(-ke * cycleTime));
          } else {
            // After infusion: Cp = Cp_at_T * e^(-ke * (t - T))
            const cpAtT = (Ko / (ke * vd)) * (1 - Math.exp(-ke * T));
            concentration = cpAtT * Math.exp(-ke * (cycleTime - T));
          }
          break;
          
        case 'extravascular':
          const ka = absorptionRateKa || 1.5; // Default absorption rate
          const F = 1; // Bioavailability (assume 100% if not specified)
          
          // 2025 Enhancement: Log default values when not provided
          if (!absorptionRateKa) {
            console.log('Using default absorption rate constant (1.5 h⁻¹) for extravascular dosing');
          }
          
          // Extravascular: Cp = [F * dose * Ka] / [Vd * (Ka - Ke)] * [e^(-ke * t) - e^(-ka * t)]
          if (ka !== ke) {
            concentration = (F * dose * ka) / (vd * (ka - ke)) * 
                          (Math.exp(-ke * cycleTime) - Math.exp(-ka * cycleTime));
          } else {
            // Special case when ka = ke
            concentration = (F * dose * ka * cycleTime / vd) * Math.exp(-ke * cycleTime);
          }
          break;
      }
      
      points.push({ time: t, concentration: Math.max(0, concentration) });
    }
    
    return points;
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
    // Enhanced sieving coefficients with additional drug-specific data
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

    // Enhanced drug-specific adjustments from literature
    const drugSpecificAdjustments: Record<string, number> = {
      'vancomycin': 0.9,  // SC 0.7-0.9 from literature
      'teicoplanin': 0.6,  // High protein binding, lower sieving
      'ceftazidime': 0.95, // SC ~0.95 from literature
      'meropenem': 0.92,   // SC 0.92-0.95 from literature
      'piperacillintazobactam': 0.88, // SC ~0.88 from literature
      'cefepime': 0.95,    // SC ~0.95 from literature
      'linezolid': 0.95,   // SC ~0.95 from literature
      'gentamicin': 0.9,   // Aminoglycoside with adsorption
      'fluconazole': 1.0,  // Low protein binding, high SC
      'colistin': 0.7      // Variable clearance
    };

    const baseCoefficients = coefficients[filterType] || coefficients['high-flux'];
    const drugAdjustment = drugSpecificAdjustments[drugName.toLowerCase().replace(/[-\s]/g, '')] || 1;

    return {
      highBinding: baseCoefficients.highBinding * drugAdjustment,
      lowBinding: baseCoefficients.lowBinding * drugAdjustment
    };
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
    
    // Enhanced patient factor adjustments
    if (input.liverDisease) {
      rationale += '. Liver disease present - reduced non-renal clearance considered.';
    }
    
    if (input.ecmoTreatment) {
      rationale += '. ECMO therapy increases Vd and may reduce clearance - loading dose and TDM recommended.';
    }
    
    if (input.tpeTreatment && drugProfile.pkParameters.proteinBinding > 0.8) {
      rationale += '. TPE treatment - administer after plasma exchange for highly bound drugs.';
    }
    
    // PD target-based recommendations (book chapter page 21)
    if (input.mic && percentTimeAboveMic > 0) {
      const drugName = input.antibioticName.toLowerCase().replace(/[-\s]/g, '');
      const pdTargets: Record<string, number> = {
        'meropenem': 40,
        'piperacillintazobactam': 50,
        'cefepime': 60,
        'ceftazidime': 40
      };
      
      const target = pdTargets[drugName];
      if (target && percentTimeAboveMic < target) {
        rationale += ` Current %T>MIC is ${percentTimeAboveMic.toFixed(1)}% (target ≥${target}%) - consider dose optimization or extended infusion.`;
      }
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

  private static generateTDMRecommendations(
    drugName: string,
    auc024: number,
    percentTimeAboveMic: number,
    eliminationRate: number,
    totalClearance: number
  ): string[] {
    const recommendations: string[] = [];
    const halfLife = Math.log(2) / eliminationRate;

    // Enhanced drug-specific targets from literature
    const drugTargets: Record<string, {
      aucToxicity?: number;
      aucTarget?: { min: number; max: number };
      timeMicTarget?: number;
      troughTarget?: { min: number; max: number };
      peakTarget?: { min: number; max: number };
    }> = {
      vancomycin: {
        aucToxicity: 700,
        aucTarget: { min: 400, max: 600 },
        troughTarget: { min: 15, max: 20 }
      },
      meropenem: {
        aucToxicity: 2000,
        timeMicTarget: 40,
      },
      piperacillintazobactam: {
        aucToxicity: 1800,
        timeMicTarget: 50,
      },
      cefepime: {
        aucToxicity: 1500,
        timeMicTarget: 60,
      },
      linezolid: {
        aucToxicity: 400,
        aucTarget: { min: 200, max: 350 }
      },
      gentamicin: {
        aucToxicity: 300,
        peakTarget: { min: 5, max: 10 },
        troughTarget: { min: 0.5, max: 2 }
      }
    };

    const normalizedDrugName = drugName.toLowerCase().replace(/[-\s]/g, '');
    const targets = drugTargets[normalizedDrugName];

    if (!targets) return recommendations;

    // AUC-based toxicity alerts
    if (targets.aucToxicity && auc024 > targets.aucToxicity) {
      recommendations.push(`⚠️ AUC₀₋₂₄ (${auc024.toFixed(0)} mg·h/L) exceeds toxicity threshold (${targets.aucToxicity} mg·h/L) - consider dose reduction and TDM`);
    }

    // AUC target range recommendations
    if (targets.aucTarget) {
      if (auc024 < targets.aucTarget.min) {
        recommendations.push(`🎯 AUC₀₋₂₄ (${auc024.toFixed(0)} mg·h/L) below target range (${targets.aucTarget.min}-${targets.aucTarget.max} mg·h/L) - consider dose increase`);
      } else if (auc024 > targets.aucTarget.max) {
        recommendations.push(`🎯 AUC₀₋₂₄ (${auc024.toFixed(0)} mg·h/L) above target range (${targets.aucTarget.min}-${targets.aucTarget.max} mg·h/L) - consider dose reduction`);
      }
    }

    // Time above MIC recommendations for time-dependent antibiotics
    if (targets.timeMicTarget && percentTimeAboveMic < targets.timeMicTarget) {
      recommendations.push(`⏰ %T>MIC (${percentTimeAboveMic.toFixed(1)}%) below target (${targets.timeMicTarget}%) - consider dose optimization or extended infusion`);
    }

    // Half-life based TDM recommendations
    if (halfLife > 8) {
      recommendations.push(`📊 Prolonged half-life (${halfLife.toFixed(1)} hours) detected - recommend TDM to guide therapy`);
    }

    // Drug-specific TDM recommendations
    if (normalizedDrugName === 'vancomycin') {
      recommendations.push(`🩸 Recommend trough monitoring before 4th dose and AUC calculation for optimal dosing (target AUC 400-600 mg·h/L)`);
    }

    if (normalizedDrugName === 'linezolid') {
      if (halfLife > 12) {
        recommendations.push(`⚠️ Extended linezolid half-life suggests accumulation risk - monitor for peripheral neuropathy and thrombocytopenia`);
      }
    }

    return recommendations;
  }

  private static generateEvidenceSources(drugName: string, crrtCalculations: any): {
    volumeOfDistribution: string;
    clearance: string;
    sievingCoefficient: string;
    proteinBinding: string;
    residualRenal: string;
  } {
    // Enhanced evidence-based sources for each drug parameter
    const drugSources: Record<string, {
      volumeOfDistribution: string;
      clearance: string;
      proteinBinding: string;
    }> = {
      vancomycin: {
        volumeOfDistribution: "Roberts et al., 2012 (0.7 L/kg) - ICU population",
        clearance: "Roberts et al., 2012 (1.0-1.4 L/h CRRT) - Evidence-based range",
        proteinBinding: "Rybak et al., 2020 (50% binding) - Updated guideline"
      },
      meropenem: {
        volumeOfDistribution: "Seyler et al., 2011 (0.25 L/kg) - CRRT population",
        clearance: "Seyler et al., 2011 (1.8-2.4 L/h CRRT) - Multi-center study",
        proteinBinding: "Thalhammer et al., 1997 (2% binding) - Low protein binding"
      },
      piperacillintazobactam: {
        volumeOfDistribution: "Arzuaga et al., 2005 (0.18 L/kg) - CRRT patients",
        clearance: "Arzuaga et al., 2005 (1.5-2.1 L/h CRRT) - Clinical validation",
        proteinBinding: "Valtonen et al., 2001 (30% binding) - Moderate binding"
      },
      cefepime: {
        volumeOfDistribution: "Malone et al., 2001 (0.2 L/kg) - CRRT study",
        clearance: "Malone et al., 2001 (1.4-1.8 L/h CRRT) - Clinical data",
        proteinBinding: "Barbhaiya et al., 1992 (20% binding) - Low-moderate binding"
      },
      linezolid: {
        volumeOfDistribution: "Swoboda et al., 2010 (0.65 L/kg) - CRRT patients",
        clearance: "Swoboda et al., 2010 (0.4-0.6 L/h CRRT) - Minimal removal",
        proteinBinding: "Stalker et al., 2003 (31% binding) - Moderate binding"
      },
      gentamicin: {
        volumeOfDistribution: "Keller et al., 2008 (0.25 L/kg) - Aminoglycoside",
        clearance: "Keller et al., 2008 (0.5-1.0 L/h CRRT) - Variable clearance",
        proteinBinding: "Destache et al., 1990 (0-30% binding) - Minimal binding"
      }
    };

    const normalizedDrugName = drugName.toLowerCase().replace(/[-\s]/g, '');
    const sources = drugSources[normalizedDrugName] || {
      volumeOfDistribution: "Standard pharmacokinetic references",
      clearance: "Population PK estimates",
      proteinBinding: "Standard pharmacokinetic references"
    };

    return {
      volumeOfDistribution: sources.volumeOfDistribution,
      clearance: sources.clearance,
      sievingCoefficient: `Filter manufacturer data and Adcock et al., 2017 (efficiency: ${crrtCalculations.filterEfficiency})`,
      proteinBinding: sources.proteinBinding,
      residualRenal: 'Hsu et al., NEJM 2021; doi:10.1056/NEJMoa2103753 (2021 CKD-EPI equation)'
    };
  }
}
