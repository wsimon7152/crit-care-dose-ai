import React from 'react';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { PatientInput } from '../../types';

interface ComorbiditiesSectionProps {
  input: PatientInput;
  setInput: React.Dispatch<React.SetStateAction<PatientInput>>;
}

export const ComorbiditiesSection: React.FC<ComorbiditiesSectionProps> = ({ input, setInput }) => {
  return (
    <div className="space-y-3">
      <Label className="text-base font-medium">Comorbidities</Label>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="liver"
            checked={input.liverDisease}
            onCheckedChange={(checked) => setInput(prev => ({ ...prev, liverDisease: !!checked }))}
          />
          <Label htmlFor="liver">Liver Disease</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="heart"
            checked={input.heartDisease}
            onCheckedChange={(checked) => setInput(prev => ({ ...prev, heartDisease: !!checked }))}
          />
          <Label htmlFor="heart">Heart Disease</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="hf"
            checked={input.heartFailure}
            onCheckedChange={(checked) => setInput(prev => ({ ...prev, heartFailure: !!checked }))}
          />
          <Label htmlFor="hf">Heart Failure</Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="ecmo"
            checked={input.ecmoTreatment}
            onCheckedChange={(checked) => setInput(prev => ({ ...prev, ecmoTreatment: !!checked }))}
          />
          <Label htmlFor="ecmo">ECMO Treatment</Label>
        </div>
      </div>
    </div>
  );
};