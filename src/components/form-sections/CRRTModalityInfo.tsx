import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info } from 'lucide-react';

export const CRRTModalityInfo: React.FC = () => {
  return (
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
  );
};