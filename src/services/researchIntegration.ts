import { Research, PatientInput, PKResult } from '../types';

export class ResearchIntegrationService {
  /**
   * Get approved research studies from localStorage
   */
  static getApprovedStudies(): Research[] {
    const saved = localStorage.getItem('researchList');
    if (!saved) return [];
    
    const allStudies = JSON.parse(saved).map((item: any) => ({
      ...item,
      uploadedAt: new Date(item.uploadedAt)
    }));
    
    return allStudies.filter((study: Research) => study.status === 'approved');
  }

  /**
   * Find relevant studies for a specific drug and patient context
   */
  static findRelevantStudies(drugName: string, patientInput: PatientInput): Research[] {
    const approvedStudies = this.getApprovedStudies();
    const normalizedDrugName = drugName.toLowerCase();
    
    return approvedStudies.filter(study => {
      // Check if study mentions the drug
      const studyText = `${study.title} ${study.tags.join(' ')} ${study.notes || ''}`.toLowerCase();
      const drugMatches = studyText.includes(normalizedDrugName) || 
                         study.tags.some(tag => tag.toLowerCase().includes(normalizedDrugName));
      
      // Check for CRRT relevance
      const crrtMatches = studyText.includes('crrt') || 
                         studyText.includes('continuous renal replacement') ||
                         studyText.includes('dialysis');
      
      return drugMatches && crrtMatches;
    });
  }

  /**
   * Generate evidence-based alerts for clinicians
   */
  static generateEvidenceAlerts(drugName: string, patientInput: PatientInput, pkResults: PKResult): string[] {
    const relevantStudies = this.findRelevantStudies(drugName, patientInput);
    const alerts: string[] = [];
    
    if (relevantStudies.length === 0) {
      alerts.push('⚠️ No platform studies found for this drug/CRRT combination - consider standard guidelines');
      return alerts;
    }

    // Check study recency
    const recentStudies = relevantStudies.filter(study => {
      const studyYear = study.year || new Date(study.uploadedAt).getFullYear();
      return studyYear >= new Date().getFullYear() - 2; // Within 2 years
    });

    if (recentStudies.length === 0) {
      alerts.push('⚠️ Available studies are >2 years old - consider searching for newer evidence');
    } else {
      alerts.push(`✅ ${recentStudies.length} recent study(ies) support current recommendations`);
    }

    // Check for conflicting recommendations
    const hasMultipleStudies = relevantStudies.length > 1;
    if (hasMultipleStudies) {
      alerts.push(`📚 ${relevantStudies.length} studies available - review for consistency`);
    }

    // MIC-specific alerts
    if (patientInput.mic && pkResults.percentTimeAboveMic < 40) {
      const micStudies = relevantStudies.filter(study => 
        study.title.toLowerCase().includes('mic') || 
        study.notes?.toLowerCase().includes('mic')
      );
      if (micStudies.length > 0) {
        alerts.push('🎯 MIC-specific studies available - optimize dosing based on platform research');
      }
    }

    return alerts;
  }

  /**
   * Get study citations for transparency
   */
  static generateStudyCitations(drugName: string, patientInput: PatientInput): {
    supportingStudies: Research[];
    citationText: string;
  } {
    const relevantStudies = this.findRelevantStudies(drugName, patientInput);
    
    if (relevantStudies.length === 0) {
      return {
        supportingStudies: [],
        citationText: 'No platform studies available for this combination'
      };
    }

    const citationText = relevantStudies
      .map(study => `${study.authors} (${study.year || new Date(study.uploadedAt).getFullYear()})`)
      .join('; ');

    return {
      supportingStudies: relevantStudies,
      citationText: `Based on platform studies: ${citationText}`
    };
  }

  /**
   * Adjust PK parameters based on approved research
   */
  static adjustPKParametersFromStudies(
    basePKParameters: any, 
    drugName: string, 
    patientInput: PatientInput
  ): any {
    const relevantStudies = this.findRelevantStudies(drugName, patientInput);
    
    // Start with base parameters
    let adjustedParameters = { ...basePKParameters };
    
    relevantStudies.forEach(study => {
      // Apply study-based adjustments
      const studyText = `${study.title} ${study.notes || ''}`.toLowerCase();
      
      // Example adjustments based on study content
      if (studyText.includes('clearance') && studyText.includes('increase')) {
        adjustedParameters.crrtClearance *= 1.1; // 10% increase
      }
      
      if (studyText.includes('protein binding') && studyText.includes('decrease')) {
        adjustedParameters.proteinBinding *= 0.9; // 10% decrease
      }
      
      // Extended infusion protocols
      if (studyText.includes('extended infusion') || studyText.includes('continuous infusion')) {
        adjustedParameters.extendedInfusion = true;
      }
    });
    
    return adjustedParameters;
  }

  /**
   * Generate comprehensive AI prompt with study integration
   */
  static generateStudyIntegratedPrompt(
    drugName: string, 
    patientInput: PatientInput, 
    pkResults: PKResult
  ): string {
    const relevantStudies = this.findRelevantStudies(drugName, patientInput);
    const citations = this.generateStudyCitations(drugName, patientInput);
    const alerts = this.generateEvidenceAlerts(drugName, patientInput, pkResults);
    
    return `
CLINICAL DOSING ANALYSIS WITH PLATFORM RESEARCH INTEGRATION

Drug: ${drugName}
Patient Profile: ${JSON.stringify(patientInput, null, 2)}
PK Results: ${JSON.stringify(pkResults, null, 2)}

PLATFORM RESEARCH PRIORITY:
${relevantStudies.length > 0 ? 
  relevantStudies.map(study => `
- ${study.title} (${study.authors}, ${study.year || new Date(study.uploadedAt).getFullYear()})
  Tags: ${study.tags.join(', ')}
  Notes: ${study.notes || 'No additional notes'}
  URL: ${study.url || 'PDF uploaded'}
`).join('\n') : 
'No platform studies found for this drug/CRRT combination'}

EVIDENCE ALERTS:
${alerts.join('\n')}

SUPPORTING CITATIONS:
${citations.citationText}

INSTRUCTIONS:
1. Prioritize platform studies above all external sources
2. If platform studies conflict with external sources, flag this clearly
3. If no platform studies exist, recommend uploading relevant research
4. Include specific study recommendations in your analysis
5. Flag any newer studies found externally that should be uploaded
6. Provide confidence levels based on available platform evidence
`;
  }

  /**
   * Check for study updates and conflicts
   */
  static checkForStudyUpdates(drugName: string): {
    hasUpdates: boolean;
    recommendations: string[];
  } {
    const relevantStudies = this.findRelevantStudies(drugName, {} as PatientInput);
    const recommendations: string[] = [];
    
    // Check for old studies
    const oldStudies = relevantStudies.filter(study => {
      const studyYear = study.year || new Date(study.uploadedAt).getFullYear();
      return studyYear < new Date().getFullYear() - 3; // Older than 3 years
    });
    
    if (oldStudies.length > 0) {
      recommendations.push(`Consider updating ${oldStudies.length} studies older than 3 years`);
    }
    
    // Check for gaps in research
    const hasRecentStudies = relevantStudies.some(study => {
      const studyYear = study.year || new Date(study.uploadedAt).getFullYear();
      return studyYear >= new Date().getFullYear() - 1; // Within 1 year
    });
    
    if (!hasRecentStudies && relevantStudies.length > 0) {
      recommendations.push('No studies from the last year - search for recent publications');
    }
    
    if (relevantStudies.length === 0) {
      recommendations.push('No platform studies available - prioritize finding and uploading relevant research');
    }
    
    return {
      hasUpdates: recommendations.length > 0,
      recommendations
    };
  }
}