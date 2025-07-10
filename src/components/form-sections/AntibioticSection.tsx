import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientInput } from '../../types';
import { drugProfiles } from '../../data/drugProfiles';

interface AntibioticSectionProps {
  input: PatientInput;
  setInput: React.Dispatch<React.SetStateAction<PatientInput>>;
}

export const AntibioticSection: React.FC<AntibioticSectionProps> = ({ input, setInput }) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="antibiotic">Antibiotic *</Label>
        <Select value={input.antibioticName} onValueChange={(value) => setInput(prev => ({ ...prev, antibioticName: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select antibiotic" />
          </SelectTrigger>
          <SelectContent>
            {Object.values(drugProfiles).map((drug) => (
              <SelectItem key={drug.name} value={drug.name.toLowerCase().replace(/[-\s]/g, '')}>
                {drug.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="mic">MIC (mg/L)</Label>
        <Input
          id="mic"
          type="number"
          step="0.1"
          placeholder="4-8 (typical breakpoint)"
          value={input.mic || ''}
          onChange={(e) => setInput(prev => ({ ...prev, mic: Number(e.target.value) || undefined }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="infectionType">Infection Type</Label>
        <Select value={input.infectionType || ''} onValueChange={(value) => setInput(prev => ({ ...prev, infectionType: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select infection type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pneumonia">Pneumonia</SelectItem>
            <SelectItem value="bacteremia">Bacteremia</SelectItem>
            <SelectItem value="uti">UTI</SelectItem>
            <SelectItem value="iai">Intra-abdominal</SelectItem>
            <SelectItem value="ssti">Skin/Soft Tissue</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
};