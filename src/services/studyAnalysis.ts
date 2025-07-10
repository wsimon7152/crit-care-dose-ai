import { ApiKeyConfig } from '../types';
// @ts-ignore
import * as pdfParse from 'pdf-parse';

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
      // Basic web scraping for publicly accessible content
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; StudyAnalyzer/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const html = await response.text();
      
      // Extract text content from HTML (basic implementation)
      const textContent = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]*>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      
      // For PubMed URLs, try to extract specific sections
      if (url.includes('pubmed.ncbi.nlm.nih.gov')) {
        const abstractMatch = textContent.match(/Abstract[:\s]+(.*?)(?:Keywords|Methods|Results|$)/i);
        const titleMatch = textContent.match(/<title[^>]*>([^<]+)/i);
        
        let extracted = `URL: ${url}\n\n`;
        if (titleMatch) extracted += `TITLE: ${titleMatch[1].trim()}\n\n`;
        if (abstractMatch) extracted += `ABSTRACT: ${abstractMatch[1].trim()}\n\n`;
        extracted += `FULL TEXT: ${textContent.substring(0, 2000)}...`;
        
        return extracted;
      }
      
      return `URL: ${url}\n\nEXTRACTED CONTENT:\n${textContent.substring(0, 3000)}...`;
      
    } catch (error) {
      console.error('URL extraction failed:', error);
      return `URL reference: ${url}\n\nText extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try uploading a PDF instead.`;
    }
  }

  /**
   * Extract text from PDF using pdf-parse library
   */
  static async extractTextFromPDF(file: File): Promise<string> {
    try {
      // Convert File to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Parse PDF text
      const pdfData = await pdfParse(uint8Array);
      
      if (!pdfData.text || pdfData.text.trim().length === 0) {
        throw new Error('No text content found in PDF');
      }
      
      // Clean up the extracted text
      const cleanText = pdfData.text
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();
      
      return `PDF FILE: ${file.name}
      
EXTRACTED TEXT:
${cleanText}

METADATA:
- Pages: ${pdfData.numpages}
- File size: ${(file.size / 1024 / 1024).toFixed(2)} MB
- Extraction timestamp: ${new Date().toISOString()}`;
      
    } catch (error) {
      console.error('PDF parsing failed:', error);
      
      // Fallback with more descriptive error
      return `PDF FILE: ${file.name}

ERROR: Failed to extract text from PDF file.
Reason: ${error instanceof Error ? error.message : 'Unknown parsing error'}

This may occur if:
- The PDF is password protected
- The PDF contains only images/scanned text (OCR required)
- The PDF is corrupted or in an unsupported format

Please try:
1. Using a different PDF file
2. Converting scanned PDFs to text-searchable format
3. Using the URL input method if the study is available online`;
    }
  }
}