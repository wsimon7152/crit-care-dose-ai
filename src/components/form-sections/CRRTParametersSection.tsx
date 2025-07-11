import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PatientInput } from '../../types';
import { CRRTModalityInfo } from './CRRTModalityInfo';

interface CRRTParametersSectionProps {
  input: PatientInput;
  setInput: React.Dispatch<React.SetStateAction<PatientInput>>;
}

export const CRRTParametersSection: React.FC<CRRTParametersSectionProps> = ({ input, setInput }) => {
  const requiresCRRTDetails = input.crrtModality === 'CVVHDF';

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="crrtModality">CRRT Modality</Label>
          <CRRTModalityInfo />
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
            <Label htmlFor="preFilter">Pre-filter Replacement Rate (mL/hr) *</Label>
            <Input
              id="preFilter"
              type="number"
              required={requiresCRRTDetails}
              value={input.preFilterReplacementRate || ''}
              onChange={(e) => setInput(prev => ({ ...prev, preFilterReplacementRate: Number(e.target.value) || undefined }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="postFilter">Post-filter Replacement Rate (mL/hr) *</Label>
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

      <div className="space-y-2">
        <Label htmlFor="filterType">Filter/Device Type</Label>
        <Select value={input.filterType || 'high-flux'} onValueChange={(value) => setInput(prev => ({ ...prev, filterType: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Select filter type" />
          </SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="high-flux">High-flux (default)</SelectItem>
            <SelectItem value="prismax-hf1000">Prismax HF1000</SelectItem>
            <SelectItem value="prismax-hf1400">Prismax HF1400</SelectItem>
            <SelectItem value="multifiltrate-aev1000">Multifiltrate AEV1000</SelectItem>
            <SelectItem value="multifiltrate-aev600">Multifiltrate AEV600</SelectItem>
            <SelectItem value="fresenius-hf1000">Fresenius HF1000</SelectItem>
            <SelectItem value="fresenius-hf1400">Fresenius HF1400</SelectItem>
            <SelectItem value="baxter-st100">Baxter ST100</SelectItem>
            <SelectItem value="baxter-st150">Baxter ST150</SelectItem>
            <SelectItem value="low-flux">Low-flux</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </>
  );
};