
import React, { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { PatientInputForm } from '../components/PatientInputForm';
import { PKResultsDisplay } from '../components/PKResultsDisplay';
import { AIIntegration } from '../components/AIIntegration';
import { ResearchManagement } from '../components/ResearchManagement';
import { ApiKeyManagement } from '../components/ApiKeyManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { PKCalculationService } from '../services/pkCalculations';
import { drugProfiles } from '../data/drugProfiles';
import { useResearchUpdates } from '../hooks/use-research-updates';
import { PatientInput, PKResult } from '../types';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

export const Dashboard = () => {
  const [pkResults, setPkResults] = useState<PKResult | null>(null);
  const [currentInput, setCurrentInput] = useState<PatientInput | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Track research updates for automatic recalculation
  useResearchUpdates();

  const handlePatientSubmit = async (input: PatientInput) => {
    setIsCalculating(true);
    setCurrentInput(input);
    
    try {
      const results = PKCalculationService.calculatePKMetrics(input);
      setPkResults(results);
      toast.success('Dosing recommendation calculated');
    } catch (error) {
      console.error('PK calculation error:', error);
      toast.error('Error calculating dosing recommendation');
    } finally {
      setIsCalculating(false);
    }
  };

  const handleAISummary = (summary: string) => {
    setAiSummary(summary);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="dosing" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto">
            <TabsTrigger 
              value="dosing" 
              className="text-center whitespace-normal leading-tight py-3 px-2 h-auto min-h-[3rem]"
            >
              <span className="block">Dosing</span>
              <span className="block">Calculator</span>
            </TabsTrigger>
            <TabsTrigger 
              value="research" 
              className="text-center whitespace-normal leading-tight py-3 px-2 h-auto min-h-[3rem]"
            >
              <span className="block">Research</span>
              <span className="block">Management</span>
            </TabsTrigger>
            <TabsTrigger 
              value="settings" 
              className="text-center whitespace-normal leading-tight py-3 px-2 h-auto min-h-[3rem]"
            >
              <span className="block">API</span>
              <span className="block">Settings</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dosing" className="space-y-6">
            <PatientInputForm 
              onSubmit={handlePatientSubmit} 
              isLoading={isCalculating}
            />
            
            {pkResults && currentInput && (() => {
              // Get drug profile for additional data
              const normalizedDrugName = currentInput.antibioticName.toLowerCase().replace(/[-\s]/g, '');
              const drugProfile = drugProfiles[normalizedDrugName] || drugProfiles[Object.keys(drugProfiles)[0]];
              
              return (
                <>
                  <PKResultsDisplay 
                    results={pkResults}
                    mic={currentInput.mic}
                    antibioticName={currentInput.antibioticName}
                    patientInput={currentInput}
                    pkParameters={drugProfile.pkParameters}
                    drugReferences={drugProfile.references}
                  />
                
                <AIIntegration
                  onSummaryGenerated={handleAISummary}
                  patientInput={currentInput}
                  pkResults={pkResults}
                />
                
                {aiSummary && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-headings:mt-6 prose-headings:mb-4 prose-p:mb-4 prose-ul:mb-4 prose-li:mb-2">
                        <ReactMarkdown>{aiSummary}</ReactMarkdown>
                      </div>
                    </CardContent>
                  </Card>
                )}
                  </>
                );
              })()}
          </TabsContent>
          
          <TabsContent value="research">
            <ResearchManagement />
          </TabsContent>
          
          <TabsContent value="settings">
            <ApiKeyManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
