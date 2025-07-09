import { ApiKeyConfig } from '../types';

export class StudyAnalysisService {
  /**
   * Extract study title and metadata from text using LLM APIs
   */
  static async extractStudyMetadata(
    text: string, 
    filename: string,
    apiKey: ApiKeyConfig
  ): Promise<{
    title: string;
    authors: string;
    year: number;
    abstract: string;
    tags: string[];
  }> {
    try {
      const prompt = `
Analyze this research paper text and extract the following information in JSON format:

{
  "title": "Full study title",
  "authors": "Primary authors (max 3, format: LastName AB, Smith CD, etc.)",
  "year": Publication year (number),
  "abstract": "Brief abstract/summary (max 200 words)",
  "tags": ["relevant", "keywords", "for", "categorization"]
}

Text to analyze:
${text.substring(0, 3000)}

Instructions:
- Extract the EXACT title as written in the paper
- Focus on authors, year, and key pharmacokinetic/clinical terms for tags
- If information is unclear, use reasonable defaults
- For filename reference: ${filename}
`;

      let response;
      
      if (apiKey.provider === 'openai') {
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4.1-2025-04-14',
            messages: [
              {
                role: 'system',
                content: 'You are a medical research analyst. Extract study metadata accurately and return valid JSON only.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1,
            max_tokens: 1000
          }),
        });
      } else if (apiKey.provider === 'claude' || apiKey.provider === 'anthropic') {
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey.key}`,
            'Content-Type': 'application/json',
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.1
          }),
        });
      }

      if (!response?.ok) {
        throw new Error(`API call failed: ${response?.status}`);
      }

      const data = await response.json();
      let content = '';
      
      if (apiKey.provider === 'openai') {
        content = data.choices[0]?.message?.content || '';
      } else {
        content = data.content[0]?.text || '';
      }

      // Parse JSON response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        return {
          title: extracted.title || filename.replace('.pdf', ''),
          authors: extracted.authors || 'Unknown authors',
          year: extracted.year || new Date().getFullYear(),
          abstract: extracted.abstract || 'No abstract available',
          tags: Array.isArray(extracted.tags) ? extracted.tags : ['user-submitted']
        };
      }

      throw new Error('Invalid JSON response from LLM');
      
    } catch (error) {
      console.error('Study analysis failed:', error);
      
      // Fallback to basic extraction
      return {
        title: filename.replace('.pdf', '').replace(/[-_]/g, ' '),
        authors: 'Unknown authors',
        year: new Date().getFullYear(),
        abstract: 'Study analysis unavailable - manual review recommended',
        tags: ['user-submitted', 'unanalyzed']
      };
    }
  }

  /**
   * Extract text from URL (for basic analysis)
   */
  static async extractTextFromUrl(url: string): Promise<string> {
    try {
      // For PubMed URLs, we could extract the abstract
      if (url.includes('pubmed.ncbi.nlm.nih.gov')) {
        // This would typically require scraping or using PubMed API
        return `Study from PubMed: ${url}. Full text analysis requires PDF upload.`;
      }
      
      // For DOIs, could resolve and extract
      if (url.includes('doi.org') || url.match(/10\.\d+/)) {
        return `DOI reference: ${url}. Full text analysis requires PDF upload.`;
      }
      
      return `External reference: ${url}. Limited analysis available from URL.`;
    } catch (error) {
      return `URL reference: ${url}. Text extraction failed.`;
    }
  }

  /**
   * Mock PDF text extraction (would need proper PDF parser in production)
   */
  static async extractTextFromPDF(file: File): Promise<string> {
    // In production, this would use a PDF parsing library
    // For now, return a mock text that includes common study elements
    return `
TITLE: ${file.name.replace('.pdf', '').replace(/[-_]/g, ' ')}

ABSTRACT: This is a placeholder for PDF text extraction. In a production environment, 
this would contain the actual extracted text from the PDF file including the title, 
authors, abstract, methods, results, and conclusions.

AUTHORS: Smith AB, Johnson CD, Williams EF

YEAR: ${new Date().getFullYear()}

KEYWORDS: pharmacokinetics, CRRT, dosing, antibiotic, critical care

[Full PDF text would be extracted here in production]
`;
  }
}