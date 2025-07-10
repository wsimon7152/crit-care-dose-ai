
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info } from 'lucide-react';
import { PatientInput } from '../types';
import { drugProfiles } from '../data/drugProfiles';

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
    antibioticName: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.antibioticName) return;
    onSubmit(input);
  };

  const requiresCRRTDetails = input.crrtModality === 'CVVHDF';

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
            {/* Demographics */}
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

            {/* CRRT Parameters */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="crrtModality">CRRT Modality</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-1">
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-3">
                      <h4 className="font-medium">CRRT Modalities</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <strong>CVVH</strong> - Continuous Venovenous Hemofiltration
                          <p className="text-muted-foreground">Pure convection, replacement fluid only</p>
                        </div>
                        <div>
                          <strong>CVVHD</strong> - Continuous Venovenous Hemodialysis  
                          <p className="text-muted-foreground">Pure diffusion, dialysate fluid only</p>
                        </div>
                        <div>
                          <strong>CVVHDF</strong> - Continuous Venovenous Hemodiafiltration
                          <p className="text-muted-foreground">Combined convection + diffusion, both replacement and dialysate fluids</p>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <Select value={input.crrtModality || ''} onValueChange={(value: 'CVVH' | 'CVVHD' | 'CVVHDF') => setInput(prev => ({ ...prev, crrtModality: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select modality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CVVH">CVVH</SelectItem>
                  <SelectItem value="CVVHD">CVVHD</SelectItem>
                  <SelectItem value="CVVHDF">CVVHDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bloodFlow">Blood Flow Rate (mL/min)</Label>
              <Input
                id="bloodFlow"
                type="number"
                placeholder="150-200 (typical for elderly)"
                value={input.bloodFlowRate || ''}
                onChange={(e) => setInput(prev => ({ ...prev, bloodFlowRate: Number(e.target.value) || undefined }))}
              />
            </div>

            {requiresCRRTDetails && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="dialysateFlow">Dialysate Flow Rate *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="dialysateFlow"
                      type="number"
                      required={requiresCRRTDetails}
                      value={input.dialysateFlowRate || ''}
                      onChange={(e) => setInput(prev => ({ ...prev, dialysateFlowRate: Number(e.target.value) || undefined }))}
                      className="flex-1"
                    />
                    <Select 
                      value={input.dialysateFlowRateUnit || 'ml/kg/hr'} 
                      onValueChange={(value: 'ml/hr' | 'ml/kg/hr') => setInput(prev => ({ ...prev, dialysateFlowRateUnit: value }))}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ml/hr">mL/hr</SelectItem>
                        <SelectItem value="ml/kg/hr">mL/kg/hr</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preFilter">Pre-filter Replacement (mL/kg/hr) *</Label>
                  <Input
                    id="preFilter"
                    type="number"
                    required={requiresCRRTDetails}
                    value={input.preFilterReplacementRate || ''}
                    onChange={(e) => setInput(prev => ({ ...prev, preFilterReplacementRate: Number(e.target.value) || undefined }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="postFilter">Post-filter Replacement (mL/kg/hr) *</Label>
                  <Input
                    id="postFilter"
                    type="number"
                    required={requiresCRRTDetails}
                    value={input.postFilterReplacementRate || ''}
                    onChange={(e) => setInput(prev => ({ ...prev, postFilterReplacementRate: Number(e.target.value) || undefined }))}
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="ufRate">Ultrafiltration Rate (mL/hr)</Label>
              <Input
                id="ufRate"
                type="number"
                placeholder="100-200 (typical for elderly)"
                value={input.ultrafiltrationRate || ''}
                onChange={(e) => setInput(prev => ({ ...prev, ultrafiltrationRate: Number(e.target.value) || undefined }))}
              />
            </div>

            {/* Antibiotic Information */}
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
          </div>

          {/* Comorbidities */}
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

          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading || !input.antibioticName}>
            {isLoading ? 'Calculating...' : 'Recommend Initial Dose'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
