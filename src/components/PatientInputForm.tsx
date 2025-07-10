import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PatientInput } from '../types';
import { DemographicsSection } from './form-sections/DemographicsSection';
import { CRRTParametersSection } from './form-sections/CRRTParametersSection';
import { AntibioticSection } from './form-sections/AntibioticSection';
import { ComorbiditiesSection } from './form-sections/ComorbiditiesSection';

interface PatientInputFormProps {
  onSubmit: (input: PatientInput) => void;
  isLoading: boolean;
}

export const PatientInputForm: React.FC<PatientInputFormProps> = ({ onSubmit, isLoading }) => {
  const [input, setInput] = useState<PatientInput>({
    liverDisease: false,
    heartDisease: false,
    heartFailure: false,
    ecmoTreatment: false,
    antibioticName: '',
    filterType: 'high-flux'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.antibioticName) return;
    onSubmit(input);
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="text-xl text-blue-900">Patient Parameters</CardTitle>
        <CardDescription>
          Enter patient and CRRT parameters for dosing recommendation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <DemographicsSection input={input} setInput={setInput} />
            <CRRTParametersSection input={input} setInput={setInput} />
            <AntibioticSection input={input} setInput={setInput} />
          </div>

          <ComorbiditiesSection input={input} setInput={setInput} />

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading || !input.antibioticName}>
            {isLoading ? 'Calculating...' : 'Recommend Initial Dose'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};