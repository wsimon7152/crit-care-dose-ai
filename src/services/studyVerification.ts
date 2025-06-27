
import { Research } from '../types';

export interface StudyReference {
  id: string;
  citation: string;
  year: number;
  isVerified: boolean;
  isPlatformStudy: boolean;
  isNewer?: boolean;
  recommendation?: string;
}

export class StudyVerificationService {
  static async verifyAndPrioritizeStudies(
    drugName: string, 
    platformStudies: Research[]
  ): Promise<StudyReference[]> {
    
    // First pass: Get platform studies for the drug
    const relevantPlatformStudies = platformStudies
      .filter(study => 
        study.status === 'approved' && 
        study.title.toLowerCase().includes(drugName.toLowerCase())
      )
      .map(study => ({
        id: study.id,
        citation: `${study.authors} (${study.year})`,
        year: study.year,
        isVerified: true,
        isPlatformStudy: true,
      }));

    // Second pass: Verify external studies (mock verification process)
    const externalStudies = await this.mockExternalStudyVerification(drugName);
    
    // Third pass: Cross-reference and identify newer studies
    const verifiedStudies: StudyReference[] = [...relevantPlatformStudies];
    
    for (const external of externalStudies) {
      const newerThanPlatform = relevantPlatformStudies.every(
        platform => external.year > platform.year
      );
      
      if (newerThanPlatform) {
        verifiedStudies.push({
          ...external,
          isNewer: true,
          recommendation: 'Consider uploading to platform for integration'
        });
      }
    }
    
    // Sort by priority: platform studies first, then by year
    return verifiedStudies.sort((a, b) => {
      if (a.isPlatformStudy && !b.isPlatformStudy) return -1;
      if (!a.isPlatformStudy && b.isPlatformStudy) return 1;
      return b.year - a.year;
    });
  }

  private static async mockExternalStudyVerification(drugName: string): Promise<StudyReference[]> {
    // Simulate AI verification process
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock external studies that would be verified by AI
    const mockExternalStudies: StudyReference[] = [
      {
        id: 'ext-1',
        citation: 'Johnson CD, Williams EF, Davis GH (2024)',
        year: 2024,
        isVerified: true,
        isPlatformStudy: false,
      },
      {
        id: 'ext-2',
        citation: 'Taylor KL, Anderson MN (2023)',
        year: 2023,
        isVerified: true,
        isPlatformStudy: false,
      }
    ];
    
    return mockExternalStudies.filter(study => 
      study.citation.toLowerCase().includes(drugName.toLowerCase().substring(0, 4))
    );
  }

  static generateStudyVerificationPrompt(drugName: string): string {
    return `
      CRITICAL: You are generating clinical recommendations. Follow this EXACT study verification protocol:

      1. VERIFY STUDIES: Question your first set of results. Are these studies real and accurate?
      2. RE-CHECK: Verify again - do these studies actually exist in peer-reviewed literature?
      3. PLATFORM PRIORITY: Prioritize studies uploaded to this platform first
      4. DATE COMPARISON: If newer studies exist outside platform, flag them for review
      5. CROSS-REFERENCE: Ensure all citations are accurate and verifiable

      For ${drugName} dosing in CRRT:
      - Start with platform studies (highest priority)
      - Verify external studies are real (not hallucinated)
      - Identify newer studies outside platform
      - Suggest uploading newer studies to platform

      ALWAYS question your initial study selection and verify authenticity.
    `;
  }
}
