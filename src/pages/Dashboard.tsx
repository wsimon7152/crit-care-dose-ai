
import React, { useState } from 'react';
import { Navigation } from '../components/Navigation';
import { PatientInputForm } from '../components/PatientInputForm';
import { PKResultsDisplay } from '../components/PKResultsDisplay';
import { AIIntegration } from '../components/AIIntegration';
import { ResearchManagement } from '../components/ResearchManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { PKCalculationService } from '../services/pkCalculations';
import { PatientInput, PKResult } from '../types';
import { toast } from 'sonner';

export const Dashboard = () => {
  const [pkResults, setPkResults] = useState<PKResult | null>(null);
  const [currentInput, setCurrentInput] = useState<PatientInput | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isCalculating, setIsCalculating] = useState(false);

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="dosing">Dosing Calculator</TabsTrigger>
            <TabsTrigger value="research">Research Management</TabsTrigger>
          </TabsList>
          
          <TabsContent value="dosing" className="space-y-6">
            <PatientInputForm 
              onSubmit={handlePatientSubmit} 
              isLoading={isCalculating}
            />
            
            {pkResults && currentInput && (
              <>
                <PKResultsDisplay 
                  results={pkResults}
                  mic={currentInput.mic}
                  antibioticName={currentInput.antibioticName}
                />
                
                <AIIntegration
                  onSummaryGenerated={handleAISummary}
                  patientInput={currentInput}
                  pkResults={pkResults}
                />
                
                {aiSummary && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: aiSummary.replace(/\n/g, '<br/>') }} />
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
          
          <TabsContent value="research">
            <ResearchManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
