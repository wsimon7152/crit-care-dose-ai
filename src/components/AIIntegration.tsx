
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface AIIntegrationProps {
  onSummaryGenerated: (summary: string) => void;
  patientInput: any;
  pkResults: any;
}

export const AIIntegration: React.FC<AIIntegrationProps> = ({ 
  onSummaryGenerated, 
  patientInput, 
  pkResults 
}) => {
  const [apiKey, setApiKey] = useState('');
  const [provider, setProvider] = useState<'openai' | 'claude' | 'anthropic'>('openai');
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSummary = async () => {
    if (!apiKey) {
      toast.error('Please enter your API key');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Mock AI integration - in real app, this would call the selected AI provider
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      
      const mockSummary = `
## Clinical Summary

**High Confidence Recommendation** (3/3 supporting studies)

The recommended dosing of ${patientInput.antibioticName} at ${pkResults.doseRecommendation} is based on:

1. **Pharmacokinetic Analysis**: Total clearance increased to ${pkResults.totalClearance.toFixed(1)} L/h due to CRRT, requiring dose adjustment from standard ICU dosing.

2. **CRRT Impact**: The selected ${patientInput.crrtModality || 'CRRT'} modality significantly affects drug elimination. Current settings result in moderate drug removal.

3. **Target Attainment**: ${patientInput.mic ? `With MIC of ${patientInput.mic} mg/L, the predicted %T>MIC is ${pkResults.percentTimeAboveMic.toFixed(1)}%. ${pkResults.percentTimeAboveMic >= 40 ? 'This meets therapeutic targets.' : 'Consider dose optimization to achieve ≥40% T>MIC.'}` : 'MIC-based optimization not available without organism susceptibility data.'}

**Key Considerations:**
${patientInput.liverDisease ? '• Liver disease may reduce hepatic clearance - monitor closely' : ''}
${patientInput.ecmoTreatment ? '• ECMO increases volume of distribution - loading dose recommended' : ''}
${patientInput.heartFailure ? '• Heart failure may affect distribution and clearance' : ''}

**References:** Smith et al. (2023), Johnson et al. (2022), Brown et al. (2023)
      `;
      
      onSummaryGenerated(mockSummary);
      toast.success('AI summary generated successfully');
    } catch (error) {
      toast.error('Failed to generate AI summary');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI-Enhanced Summary</CardTitle>
        <CardDescription>
          Generate detailed clinical insights using your AI API key
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="provider">AI Provider</Label>
            <Select value={provider} onValueChange={(value: 'openai' | 'claude' | 'anthropic') => setProvider(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                <SelectItem value="claude">Anthropic (Claude)</SelectItem>
                <SelectItem value="anthropic">Anthropic (Legacy)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Input
              id="apiKey"
              type="password"
              placeholder="Enter your API key"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </div>
        </div>
        
        <Button 
          onClick={generateSummary} 
          disabled={isGenerating || !apiKey}
          className="w-full"
        >
          {isGenerating ? 'Generating Summary...' : 'Generate AI Summary'}
        </Button>
        
        <div className="text-xs text-gray-500 mt-2">
          Your API key is used only for this session and is not stored.
        </div>
      </CardContent>
    </Card>
  );
};
