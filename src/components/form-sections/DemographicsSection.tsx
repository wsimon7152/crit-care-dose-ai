import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientInput } from '../../types';

interface DemographicsSectionProps {
  input: PatientInput;
  setInput: React.Dispatch<React.SetStateAction<PatientInput>>;
}

export const DemographicsSection: React.FC<DemographicsSectionProps> = ({ input, setInput }) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="age">Age (years)</Label>
        <Input
          id="age"
          type="number"
          value={input.age || ''}
          onChange={(e) => setInput(prev => ({ ...prev, age: Number(e.target.value) || undefined }))}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="gender">Gender</Label>
        <Select value={input.gender || ''} onValueChange={(value: 'male' | 'female') => setInput(prev => ({ ...prev, gender: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="weight">Weight (kg)</Label>
        <Input
          id="weight"
          type="number"
          value={input.weight || ''}
          onChange={(e) => setInput(prev => ({ ...prev, weight: Number(e.target.value) || undefined }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="serumCreatinine">Serum Creatinine (mg/dL)</Label>
        <Input
          id="serumCreatinine"
          type="number"
          step="0.1"
          placeholder="1.0-2.5 (typical for elderly)"
          value={input.serumCreatinine || ''}
          onChange={(e) => setInput(prev => ({ ...prev, serumCreatinine: Number(e.target.value) || undefined }))}
        />
      </div>
    </>
  );
};