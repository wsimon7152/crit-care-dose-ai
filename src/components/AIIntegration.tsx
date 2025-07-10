
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../contexts/AuthContext';
import { ResearchIntegrationService } from '../services/researchIntegration';
import { AIService } from '../services/aiService';
import { toast } from 'sonner';

interface AIIntegrationProps {
  onSummaryGenerated: (summary: string) => void;
  patientInput: any;
  pkResults: any;
}

const MODEL_OPTIONS = {
  openai: [
    { id: 'gpt-4.1-2025-04-14', name: 'GPT-4.1 (Latest)' },
    { id: 'o3-2025-04-16', name: 'O3 (Reasoning)' },
    { id: 'o4-mini-2025-04-16', name: 'O4 Mini (Fast)' }
  ],
  claude: [
    { id: 'claude-opus-4-20250514', name: 'Claude Opus 4 (Most Capable)' },
    { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4 (High Performance)' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku (Fastest)' }
  ],
  anthropic: [
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus (Legacy)' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet (Legacy)' }
  ]
};

export const AIIntegration: React.FC<AIIntegrationProps> = ({ 
  onSummaryGenerated, 
  patientInput, 
  pkResults 
}) => {
  console.log('AIIntegration component loaded');
  console.log('Props received:', { patientInput, pkResults });
  
  const { user, updatePreferredModel } = useAuth();
  console.log('User data:', user);
  
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState(user?.preferredModel || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const userApiKeys = user?.apiKeys || [];
  console.log('Available API keys:', userApiKeys);
  
  const selectedKeyData = userApiKeys.find(key => key.id === selectedApiKey);
  const availableModels = selectedKeyData ? MODEL_OPTIONS[selectedKeyData.provider] || [] : [];
  
  console.log('Selected key data:', selectedKeyData);
  console.log('Available models:', availableModels);

  const generateSummary = async () => {
    console.log('Generate Summary clicked - Starting validation...');
    console.log('Selected API Key:', selectedApiKey);
    console.log('Selected Model:', selectedModel);
    console.log('User API Keys:', userApiKeys);
    console.log('Patient Input:', patientInput);
    console.log('PK Results:', pkResults);
    
    if (!selectedApiKey) {
      console.log('ERROR: No API key selected');
      toast.error('Please select an API key');
      return;
    }

    if (!selectedModel) {
      console.log('ERROR: No model selected');
      toast.error('Please select a model');
      return;
    }

    const selectedKeyData = userApiKeys.find(key => key.id === selectedApiKey);
    if (!selectedKeyData) {
      console.log('ERROR: Selected API key not found in user keys');
      toast.error('Selected API key not found');
      return;
    }

    console.log('All validations passed - starting AI generation...');
    setIsGenerating(true);
    
    try {
      // Update preferred model
      updatePreferredModel(selectedModel);

      // Generate research-integrated prompt using the service
      const researchPrompt = ResearchIntegrationService.generateStudyIntegratedPrompt(
        patientInput.antibioticName,
        patientInput,
        pkResults
      );

      // Make real AI API call
      console.log(`Generating AI summary with ${selectedKeyData.provider} - ${selectedModel}`);
      const aiSummary = await AIService.generateClinicalSummary(
        selectedKeyData,
        selectedModel,
        patientInput,
        pkResults,
        researchPrompt
      );
      
      const selectedModelName = availableModels.find(m => m.id === selectedModel)?.name || selectedModel;
      
      // Add metadata header to AI response
      const enhancedSummary = `# AI Clinical Analysis

**Generated using ${selectedModelName}**  
**Analysis completed at ${new Date().toLocaleString()}**

---

${aiSummary}

---

*This analysis was generated using real AI and incorporates available research data from the platform.*`;
      
      onSummaryGenerated(enhancedSummary);
      toast.success(`AI summary generated using ${selectedModelName}`);
    } catch (error) {
      console.error('AI generation error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to generate AI summary: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (userApiKeys.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">AI-Enhanced Summary</CardTitle>
          <CardDescription>
            Add API keys in your account settings to generate AI-powered clinical summaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500 py-8">
            No API keys configured. Please add an API key to use AI features.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">AI-Enhanced Summary</CardTitle>
        <CardDescription>
          Generate detailed clinical insights with verified studies using your configured API keys
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 p-3 rounded-lg text-sm">
          <strong>Study Verification Protocol:</strong> All referenced studies are verified for accuracy, 
          platform studies are prioritized, and newer external studies are flagged for review.
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key</Label>
            <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
              <SelectTrigger>
                <SelectValue placeholder="Select an API key" />
              </SelectTrigger>
              <SelectContent>
                {userApiKeys.map((apiKey) => (
                  <SelectItem key={apiKey.id} value={apiKey.id}>
                    {apiKey.name} ({apiKey.provider})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Select 
              value={selectedModel} 
              onValueChange={setSelectedModel}
              disabled={!selectedApiKey}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a model" />
              </SelectTrigger>
              <SelectContent>
                {availableModels.map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button 
          onClick={generateSummary} 
          disabled={isGenerating || !selectedApiKey || !selectedModel}
          className="w-full"
        >
          {isGenerating ? 'Verifying Studies & Generating Summary...' : 'Generate Verified AI Summary'}
        </Button>
        
        <div className="text-xs text-gray-500 mt-2">
          Using your stored API key. All studies are verified for accuracy.
        </div>
      </CardContent>
    </Card>
  );
};
