import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { PatientInput } from '../../types';
import { drugProfiles } from '../../data/drugProfiles';

interface AntibioticSectionProps {
  input: PatientInput;
  setInput: React.Dispatch<React.SetStateAction<PatientInput>>;
}

export const AntibioticSection: React.FC<AntibioticSectionProps> = ({ input, setInput }) => {
  // Get the default preferred target based on drug profile
  const getDefaultTarget = (drugName: string) => {
    if (!drugName) return undefined;
    
    const normalizedName = drugName.toLowerCase().replace(/[-\s]/g, '');
    const drug = drugProfiles[normalizedName];
    
    if (!drug?.tdmTargets) return undefined;
    
    if (drug.tdmTargets.auc) return 'AUC';
    if (drug.tdmTargets.percentTimeAboveMic) return '%T>MIC';
    if (drug.tdmTargets.peak || drug.tdmTargets.trough) return 'Peak/Trough';
    
    return undefined;
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="antibiotic">Antibiotic *</Label>
        <Select 
          value={input.antibioticName} 
          onValueChange={(value) => {
            // Set preferred target based on selected antibiotic
            const defaultTarget = getDefaultTarget(value);
            setInput(prev => ({ 
              ...prev, 
              antibioticName: value,
              preferredTarget: defaultTarget
            }));
          }}
        >
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
        <Label htmlFor="preferredTarget">Preferred Target</Label>
        <Select 
          value={input.preferredTarget || getDefaultTarget(input.antibioticName) || ''} 
          onValueChange={(value) => setInput(prev => ({ ...prev, preferredTarget: value as 'AUC' | '%T>MIC' | 'Peak/Trough' }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select preferred target" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AUC">AUC</SelectItem>
            <SelectItem value="%T>MIC">{"%T>MIC"}</SelectItem>
            <SelectItem value="Peak/Trough">Peak/Trough</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="useEI_CI" 
            checked={input.useEI_CI || false}
            onCheckedChange={(checked) => {
              setInput(prev => ({ 
                ...prev, 
                useEI_CI: checked as boolean,
                dosingMethod: checked ? 'infusion' : 'bolus'
              }));
            }}
          />
          <Label htmlFor="useEI_CI" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Use Extended/Continuous Infusion (EI/CI)?
          </Label>
        </div>
        
        {input.useEI_CI && (
          <div className="pl-6 mt-2 space-y-2">
            <div className="space-y-2">
              <Label htmlFor="eiDuration">Infusion Duration (h)</Label>
              <Input
                id="eiDuration"
                type="number"
                step="0.5"
                placeholder="3"
                value={input.eiDuration || 3}
                onChange={(e) => setInput(prev => ({ 
                  ...prev, 
                  eiDuration: Number(e.target.value) || 3,
                  infusionDuration: Number(e.target.value) || 3
                }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="eiRate">Infusion Rate (mg/h) (optional)</Label>
              <Input
                id="eiRate"
                type="number"
                step="100"
                placeholder="Calculate automatically"
                value={input.eiRate || ''}
                onChange={(e) => setInput(prev => ({ 
                  ...prev, 
                  eiRate: Number(e.target.value) || undefined,
                  infusionRate: Number(e.target.value) || undefined
                }))}
              />
            </div>
          </div>
        )}
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