import { ApiKeyConfig, PatientInput, PKResult } from '../types';

export class AIService {
  /**
   * Generate AI summary using the specified provider and model
   */
  static async generateClinicalSummary(
    apiKey: ApiKeyConfig,
    modelId: string,
    patientInput: PatientInput,
    pkResults: PKResult,
    researchPrompt: string
  ): Promise<string> {
    console.log(`Starting AI analysis with ${apiKey.provider} - ${modelId}`);
    
    switch (apiKey.provider) {
      case 'openai':
        return this.generateOpenAISummary(apiKey.key, modelId, patientInput, pkResults, researchPrompt);
      case 'claude':
      case 'anthropic':
        return this.generateClaudeSummary(apiKey.key, modelId, patientInput, pkResults, researchPrompt);
      default:
        throw new Error(`Unsupported AI provider: ${apiKey.provider}`);
    }
  }

  /**
   * Generate summary using OpenAI API
   */
  private static async generateOpenAISummary(
    apiKey: string,
    modelId: string,
    patientInput: PatientInput,
    pkResults: PKResult,
    researchPrompt: string
  ): Promise<string> {
    const prompt = this.buildClinicalPrompt(patientInput, pkResults, researchPrompt);
    
    console.log('Making OpenAI API call...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          {
            role: 'system',
            content: `You are an expert clinical pharmacologist specializing in critical care and CRRT (Continuous Renal Replacement Therapy) antibiotic dosing. 

Your task is to analyze patient data, pharmacokinetic calculations, and research evidence to provide comprehensive clinical recommendations.

Format your response as a detailed clinical summary with clear sections for:
- Confidence level and evidence quality
- Dosing recommendations with rationale
- Pharmacokinetic analysis
- Clinical considerations
- Research gaps or updates needed
- Action items for clinicians

Use markdown formatting for better readability. Be precise, evidence-based, and highlight any limitations or areas requiring clinical judgment.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenAI API error:', response.status, errorData);
      throw new Error(`OpenAI API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('OpenAI API response received');
    
    return data.choices[0]?.message?.content || 'No response generated';
  }

  /**
   * Generate summary using Claude API
   */
  private static async generateClaudeSummary(
    apiKey: string,
    modelId: string,
    patientInput: PatientInput,
    pkResults: PKResult,
    researchPrompt: string
  ): Promise<string> {
    const prompt = this.buildClinicalPrompt(patientInput, pkResults, researchPrompt);
    
    console.log('Making Claude API call...');
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: modelId,
        max_tokens: 2000,
        temperature: 0.3,
        system: `You are an expert clinical pharmacologist specializing in critical care and CRRT (Continuous Renal Replacement Therapy) antibiotic dosing. 

Your task is to analyze patient data, pharmacokinetic calculations, and research evidence to provide comprehensive clinical recommendations.

Format your response as a detailed clinical summary with clear sections for:
- Confidence level and evidence quality
- Dosing recommendations with rationale
- Pharmacokinetic analysis
- Clinical considerations
- Research gaps or updates needed
- Action items for clinicians

Use markdown formatting for better readability. Be precise, evidence-based, and highlight any limitations or areas requiring clinical judgment.`,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Claude API error:', response.status, errorData);
      throw new Error(`Claude API error: ${response.status} ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('Claude API response received');
    
    return data.content[0]?.text || 'No response generated';
  }

  /**
   * Build comprehensive clinical prompt for AI analysis
   */
  private static buildClinicalPrompt(
    patientInput: PatientInput,
    pkResults: PKResult,
    researchPrompt: string
  ): string {
    return `Please analyze this critical care patient case and provide a comprehensive clinical summary:

## Patient Information
- **Age**: ${patientInput.age || 'Not specified'}
- **Gender**: ${patientInput.gender || 'Not specified'}  
- **Weight**: ${patientInput.weight || 'Not specified'} kg
- **Antibiotic**: ${patientInput.antibioticName}
- **Infection Type**: ${patientInput.infectionType || 'Not specified'}
- **Source of Infection**: ${patientInput.sourceOfInfection || 'Not specified'}
- **MIC**: ${patientInput.mic || 'Not specified'} mg/L

## CRRT Parameters
- **Modality**: ${patientInput.crrtModality || 'Not specified'}
- **Blood Flow Rate**: ${patientInput.bloodFlowRate || 'Not specified'} mL/min
- **Dialysate Flow Rate**: ${patientInput.dialysateFlowRate || 'Not specified'} mL/kg/hr
- **Pre-filter Replacement**: ${patientInput.preFilterReplacementRate || 'Not specified'} mL/kg/hr
- **Post-filter Replacement**: ${patientInput.postFilterReplacementRate || 'Not specified'} mL/kg/hr
- **Ultrafiltration Rate**: ${patientInput.ultrafiltrationRate || 'Not specified'} mL/hr

## Comorbidities
- **Liver Disease**: ${patientInput.liverDisease ? 'Yes' : 'No'}
- **Heart Disease**: ${patientInput.heartDisease ? 'Yes' : 'No'}
- **Heart Failure**: ${patientInput.heartFailure ? 'Yes' : 'No'}
- **ECMO Treatment**: ${patientInput.ecmoTreatment ? 'Yes' : 'No'}

## Calculated Pharmacokinetics
- **Total Clearance**: ${pkResults.totalClearance.toFixed(2)} L/h
- **AUC 0-24**: ${pkResults.auc024.toFixed(2)} mg*h/L
- **%T>MIC**: ${pkResults.percentTimeAboveMic.toFixed(1)}%
- **Current Dose Recommendation**: ${pkResults.doseRecommendation}
- **Rationale**: ${pkResults.rationale}

## Research Context & Evidence Base
${researchPrompt}

## Evidence Alerts
${pkResults.evidenceAlerts?.length ? pkResults.evidenceAlerts.join('\n- ') : 'No specific alerts'}

## Supporting Studies
${pkResults.supportingStudies?.length ? 
  pkResults.supportingStudies.map(study => `- ${study.title} (${study.authors}, ${study.year})`).join('\n') : 
  'No platform studies available for this combination'
}

---

Based on this comprehensive data, please provide:

1. **Overall Assessment**: Confidence level in the dosing recommendation and quality of available evidence
2. **Optimized Dosing Strategy**: Any adjustments needed based on patient-specific factors
3. **Monitoring Recommendations**: Key parameters to track and target values
4. **Clinical Alerts**: Important considerations or red flags
5. **Research Gaps**: Areas where additional studies would improve recommendations
6. **Next Steps**: Specific actions for the clinical team

Focus on practical, evidence-based recommendations that account for the complex interplay between CRRT parameters, patient comorbidities, and antibiotic pharmacokinetics.`;
  }
}