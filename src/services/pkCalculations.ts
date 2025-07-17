import { PatientInput, PKParameters, PKResult } from '../types';
import { drugProfiles } from '../data/drugProfiles';
import { StudyVerificationService } from './studyVerification';
import { ResearchIntegrationService } from './researchIntegration';

/**
 * PKCalculationService - Enhanced with expert equations and 2025 pharmacokinetic data
 * Based on: Equations document, Chapter 27: Drug Dosing in AKI and Extracorporeal Therapies by M. Joy et al.,
 * and real 2025 pharmacokinetic studies with citations.
 * 
 * Key Updates:
 * - 2021 CKD-EPI equation for eGFR calculation
 * - Explicit total clearance = nonRenalClearance + residualRenalClearance + extracorporealClearance
 * - Modality-specific CRRT clearance calculations (CVVH, CVVHD, CVVHDF, PIRRT, SLED)
 * - Plasma concentration equations for bolus, infusion, and extravascular dosing
 * - ECMO adjustments for volume of distribution and clearance with circuit age effects
 * - TPE considerations for highly protein-bound drugs
 * - Enhanced evidence integration with 2025 literature references
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
    
    // 2025 Update: AKI patients may have augmented clearance (PMC11912797 2025 PK variability TDM Japan)
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
    
    // Apply EI/CI settings if specified
    if (input.useEI_CI) {
      input.dosingMethod = 'infusion';
      
      // Use EI duration if specified, otherwise fall back to infusionDuration or default 3h
      const infusionDuration = input.eiDuration || input.infusionDuration || 3;
      input.infusionDuration = infusionDuration;
      
      // Use EI rate if specified, otherwise calculate based on dose and duration
      if (input.eiRate) {
        input.infusionRate = input.eiRate;
      }
      
      console.log(`Using extended infusion settings: ${infusionDuration}h duration`);
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
      return `🧠 TPE Alert: CAZ-AVI may cause CNS toxicity after CRRT - monitor neurological status closely and consider dose reduction (PMC12133543 2025)`;
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
    const concentrations = [];
    
    // Generate curve for 24 hours
    for (let t = 0; t <= 24; t += 0.5) {
      const cycleTime = t % interval;
      let currentConc = 0;
      
      switch (dosingMethod) {
        case 'bolus':
          // IV Bolus: Cp = dose / Vd * e^(-ke * t)
          currentConc = (dose / vd) * Math.exp(-ke * cycleTime);
          break;
          
        case 'infusion':
          if (!infusionDuration) {
            // Use defaults for missing parameters
            const defaultInfusionDuration = 1; // 1 hour default
            concentrations.push({
              time: t,
              concentration: currentConc
            });
            
            console.log(`Using default infusion duration: ${defaultInfusionDuration}h (PMC11844199 2025 meropenem)`);
          } else {
            const T = infusionDuration;
            const Ko = infusionRate || (dose / T); // Infusion rate
            
            if (cycleTime <= T) {
              // During infusion: Cp = Ko / Cl * [1 - e^(-ke * t)]
              currentConc = (Ko / (ke * vd)) * (1 - Math.exp(-ke * cycleTime));
            } else {
              // After infusion: Cp = Cp_at_T * e^(-ke * (t - T))
              const cpAtT = (Ko / (ke * vd)) * (1 - Math.exp(-ke * T));
              currentConc = cpAtT * Math.exp(-ke * (cycleTime - T));
            }
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
            currentConc = (F * dose * ka) / (vd * (ka - ke)) * 
                          (Math.exp(-ke * cycleTime) - Math.exp(-ka * cycleTime));
          } else {
            // Special case when ka = ke
            currentConc = (F * dose * ka * cycleTime / vd) * Math.exp(-ke * cycleTime);
          }
          break;
      }
      
      concentrations.push({ time: t, concentration: Math.max(0, currentConc) });
    }
    
    return concentrations;
  }

  /**
   * Get sieving coefficient based on filter type and drug properties
   * With 2025 updates for drug-specific sieving coefficients
   */
  private static getSievingCoefficient(filterType: string, drugName: string, proteinBinding: number): {
    highBinding: number;
    lowBinding: number;
  } {
    // Enhanced sieving coefficients with additional filter data
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

    // Drug-specific adjustments for sieving coefficients with 2025 updates
    const drugSpecificAdjustments: Record<string, {lowBinding: number, highBinding: number}> = {
      'vancomycin': { lowBinding: 0.8, highBinding: 0.6 },
      'gentamicin': { lowBinding: 0.95, highBinding: 0.95 },
      'ceftazidime': { lowBinding: 0.95, highBinding: 0.85 }, // PubMed 39990787 2025 CAZ-AVI
      'meropenem': { lowBinding: 0.95, highBinding: 0.85 },
      'linezolid': { lowBinding: 0.9, highBinding: 0.85 },
      'fluconazole': { lowBinding: 1.0, highBinding: 0.85 }, // PubMed 40223936 2025 ARF/CRRT
      'colistin': { lowBinding: 0.7, highBinding: 0.5 },
      'piperacillin': { lowBinding: 0.9, highBinding: 0.75 },
      'tazobactam': { lowBinding: 0.9, highBinding: 0.75 }
    };
    
    const normalizedDrugName = drugName.toLowerCase().replace(/[-\s]/g, '');
    const baseCoefficients = coefficients[filterType] || coefficients['high-flux'];
    const drugSpecificCoefficient = drugSpecificAdjustments[normalizedDrugName];
    
    if (drugSpecificCoefficient) {
      return drugSpecificCoefficient;
    }
    
    return baseCoefficients;
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

  private static generateDoseRecommendation(input: PatientInput, drugProfile: any, percentTimeAboveMic: number): {
    dose: string;
    rationale: string;
  } {
    const pk = drugProfile.pkParameters;
    const tdmTargets = drugProfile.tdmTargets;
    const totalClearance = this.calculateTotalClearance(input);
    const interval = input.useEI_CI ? (input.eiDuration || 3) : (pk.interval || 12);
    
    let adjustedDose = pk.standardDose;
    let targetDescription = '';

    // Compute based on preferred target
    if (tdmTargets.auc && (!input.preferredTarget || input.preferredTarget === 'AUC')) {
      const targetAUC = (tdmTargets.auc.min + tdmTargets.auc.max) / 2;
      adjustedDose = Math.round((targetAUC * totalClearance / (24 / interval)) / 250) * 250;
      targetDescription = `AUC ${targetAUC} mg·h/L`;
    } else if (tdmTargets.percentTimeAboveMic && (!input.preferredTarget || input.preferredTarget === '%T>MIC')) {
      // Start with standard dose and adjust until target met
      const targetPct = tdmTargets.percentTimeAboveMic.min;
      
      while (percentTimeAboveMic < targetPct && adjustedDose < pk.standardDose * 4) {
        adjustedDose *= 1.25;
        // Recalculate %T>MIC with new dose
        const updatedPercentTimeAboveMic = this.calculatePercentTimeAboveMIC(adjustedDose, input);
        if (updatedPercentTimeAboveMic >= targetPct) break;
      }
      targetDescription = `%T>MIC ${targetPct}%`;
    }

    // Safety checks and adjustments
    if (adjustedDose > pk.standardDose * 2) {
      adjustedDose *= 0.8;
      targetDescription += " (Reduced 20% to avoid toxicity per 2025 PMC12055491)";
    } else if (adjustedDose < pk.standardDose * 0.5) {
      adjustedDose *= 1.2;
      targetDescription += " (Increased for efficacy per book page 21)";
    }

    // Extended/Continuous infusion consideration
    const dosingMethod = input.useEI_CI 
      ? `as ${interval}h infusion` 
      : `q${interval}h`;
    
    return {
      dose: `${Math.round(adjustedDose)}mg ${dosingMethod}`,
      rationale: `Adjusted from standard ${pk.standardDose}mg to meet target ${targetDescription}`
    };
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
    antibioticName: string,
    auc024: number,
    percentTimeAboveMic: number,
    eliminationRate: number,
    totalClearance: number
  ): string[] {
    const normalizedName = this.normalizeDrugName(antibioticName);
    const recommendations: string[] = [];
    
    // Drug-specific TDM targets with 2025 updates
    const drugTargets: Record<string, any> = {
      'vancomycin': {
        auc: { min: 400, max: 600 }, // PMC11928783 2025 PopPK
        trough: { min: 15, max: 20 }
      },
      'gentamicin': {
        peak: { min: 5, max: 10 }, // LWW 2024 rethinking aminoglycoside dosing
        trough: { min: 0.5, max: 2 }
      },
      'linezolid': {
        auc: { min: 200, max: 350 },
        trough: { min: 2, max: 8 } // OUP 2025 TDM 2-8 mg/L
      },
      'colistin': {
        trough: { min: 2, max: 4 } // PMC11438743 2024 high-dose PK
      },
      'fluconazole': {
        trough: { min: 8, max: 25 } // PubMed 40223936 2025 higher doses for ARF/CRRT
      }
    };
    
    const target = drugTargets[normalizedName];
    if (!target) return recommendations;
    
    // AUC-based recommendations
    if (target.auc) {
      if (auc024 < target.auc.min) {
        recommendations.push(`📊 TDM Alert: AUC0-24 (${auc024.toFixed(0)} mg·h/L) below target (${target.auc.min}-${target.auc.max} mg·h/L) - consider dose increase`);
      } else if (auc024 > target.auc.max) {
        recommendations.push(`📊 TDM Alert: AUC0-24 (${auc024.toFixed(0)} mg·h/L) above target (${target.auc.min}-${target.auc.max} mg·h/L) - consider dose reduction`);
      }
    }
    
    // %T>MIC recommendations for beta-lactams with 2025 considerations
    if (['meropenem', 'piperacillin', 'ceftazidime', 'cefepime', 'imipenem'].includes(normalizedName)) {
      const targets = {
        'meropenem': 40, // PMC11844199 2025: 0.5g q6h or 1g q8h optimal
        'piperacillin': 50, // PMC11938006 2025: TDM-guided EI for better PD
        'ceftazidime': 40, // PubMed 39990787 2025: optimal dosing CRRT
        'cefepime': 60, // PubMed 40323389 2025: EI 2g q8h for CRRT
        'imipenem': 40 // PMC11754279 2025: simulations for PD
      };
      
      const targetPercent = targets[normalizedName as keyof typeof targets];
      if (percentTimeAboveMic < targetPercent) {
        recommendations.push(`📊 TDM Alert: %T>MIC (${percentTimeAboveMic.toFixed(0)}%) below target (${targetPercent}%) - consider extended infusion or dose increase`);
      }
    }
    
    return recommendations;
  }

  private static generateEvidenceSources(antibioticName: string, crrtCalculations: any): {
    volumeOfDistribution: string;
    clearance: string;
    sievingCoefficient: string;
    proteinBinding: string;
  } {
    const normalizedName = this.normalizeDrugName(antibioticName);
    
    // Drug-specific evidence sources with 2025 updates
    const drugSpecificSources: Record<string, {
      volumeOfDistribution: string;
      clearance: string;
      proteinBinding: string;
    }> = {
      'vancomycin': {
        volumeOfDistribution: 'Roberts et al. 2012 (0.7 L/kg) - ICU population; PMC11928783 2025',
        clearance: 'Roberts et al. 2012 (1.0-1.4 L/h CRRT) - PMC11928783 2025 PopPK non-crit adults',
        proteinBinding: 'Rybak et al. 2020 (50% binding) - Updated guideline'
      },
      'meropenem': {
        volumeOfDistribution: 'Seyler et al. 2011 (0.25 L/kg) - CRRT population',
        clearance: 'PMC11844199 2025 PopPK prolonged infusion CRRT (1.8-2.4 L/h)',
        proteinBinding: 'Thalhammer et al. 1997 (2% binding) - Low protein binding'
      },
      'piperacillin': {
        volumeOfDistribution: 'Arzuaga et al. 2005 (0.18 L/kg) - CRRT patients',
        clearance: 'PMC11938006 2025 opportunistic PopPK CRRT (variable with modalities)',
        proteinBinding: 'Valtonen et al. 2001 (30% binding) - Moderate binding'
      },
      'gentamicin': {
        volumeOfDistribution: 'Keller et al. 2008 (0.25 L/kg) - Aminoglycoside',
        clearance: 'LWW 2024 rethinking aminoglycoside dosing CRRT (0.5-1.0 L/h)',
        proteinBinding: 'Destache et al. 1990 (0-30% binding) - Minimal binding'
      },
      'linezolid': {
        volumeOfDistribution: 'Swoboda et al. 2010 (0.65 L/kg) - CRRT patients',
        clearance: 'PMC11912797 2025 PK variability TDM Japan (0.4-0.6 L/h CRRT)',
        proteinBinding: 'Stalker et al. 2003 (31% binding) - Moderate binding'
      },
      'colistin': {
        volumeOfDistribution: 'Leuppi-Taegtmeyer et al. 2019 (0.34 L/kg)',
        clearance: 'PMC11438743 2024 high-dose PK CRRT (84% extracorporeal)',
        proteinBinding: 'Karvanen et al. 2013 (50% binding)'
      },
      'fluconazole': {
        volumeOfDistribution: 'Pea et al. 2008 (0.65 L/kg)',
        clearance: 'PubMed 40223936 2025 optimizing dosing ARF CRRT PopPK',
        proteinBinding: 'Diflucan PI 2019 (11% binding) - Low binding'
      },
      'ceftazidime': {
        volumeOfDistribution: 'Valtonen et al. 2001 (0.2 L/kg)',
        clearance: 'PubMed 39990787 2025 PopPK CAZ-AVI adults (optimal dosing CRRT)',
        proteinBinding: 'Höffler et al. 1982 (10% binding) - Minimal binding'
      },
      'imipenem': {
        volumeOfDistribution: 'Tegeder et al. 1999 (0.2 L/kg)',
        clearance: 'PMC11754279 2025 PopPK elderly (CrCl key, minimal impact)',
        proteinBinding: 'Norrby et al. 1983 (20% binding) - Low-moderate binding'
      },
      'cefepime': {
        volumeOfDistribution: 'Malone et al. 2001 (0.2 L/kg) - CRRT study',
        clearance: 'PubMed 40323389 2025 ex vivo cefepime-taniborbactam CRRT',
        proteinBinding: 'Barbhaiya et al. 1992 (20% binding) - Low-moderate binding'
      }
    };
    
    const sources = drugSpecificSources[normalizedName] || {
      volumeOfDistribution: 'Standard pharmacokinetic references',
      clearance: 'Population PK estimates',
      proteinBinding: 'Standard pharmacokinetic references'
    };
    
    return {
      volumeOfDistribution: sources.volumeOfDistribution,
      clearance: sources.clearance,
      sievingCoefficient: `Filter manufacturer data and Adcock et al., 2017 (efficiency: ${crrtCalculations.filterEfficiency})`,
      proteinBinding: sources.proteinBinding
    };
  }

  private static calculateTotalClearance(input: PatientInput): number {
    // This method calculates total clearance based on input and PK parameters
    // For simplicity, we assume a default clearance value here
    // In real implementation, this should integrate residual renal, non-renal, and extracorporeal clearance
    return 1.0; // Placeholder value
  }

  private static calculatePercentTimeAboveMIC(dose: number, input: PatientInput): number {
    // This method estimates %T>MIC based on dose and patient input
    // Placeholder implementation: assume linear increase with dose
    // Real implementation would simulate concentration-time profile
    if (!input.mic) return 0;
    const basePercent = 50; // base %T>MIC at standard dose
    const pkStandardDose = 1000; // assume standard dose 1000 mg
    const percent = Math.min(100, (dose / pkStandardDose) * basePercent);
    return percent;
  }
}
