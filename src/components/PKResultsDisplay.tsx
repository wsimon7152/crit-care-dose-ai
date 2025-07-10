import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Info, AlertTriangle, CheckCircle, ExternalLink, FileText, Calculator, BookOpen, Beaker } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { PKResult, PatientInput, PKParameters } from '../types';

interface PKResultsDisplayProps {
  results: PKResult;
  mic?: number;
  antibioticName: string;
  patientInput: PatientInput;
  pkParameters: PKParameters;
  drugReferences?: string[];
}

export const PKResultsDisplay: React.FC<PKResultsDisplayProps> = ({ 
  results, 
  mic, 
  antibioticName, 
  patientInput, 
  pkParameters, 
  drugReferences = [] 
}) => {
  const { evidenceAlerts = [], supportingStudies = [], citationText } = results;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="results" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="results">Clinical Results</TabsTrigger>
          <TabsTrigger value="calculations">Calculation Details</TabsTrigger>
          <TabsTrigger value="references">Data Sources</TabsTrigger>
        </TabsList>
        
        <TabsContent value="results" className="space-y-6">
          {/* Evidence Alerts Section */}
          {evidenceAlerts.length > 0 && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Evidence-Based Alerts
                </CardTitle>
                <CardDescription>
                  Real-time alerts based on approved platform research
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {evidenceAlerts.map((alert, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg flex items-start gap-2 ${
                        alert.includes('⚠️') ? 'bg-yellow-100 border border-yellow-300' :
                        alert.includes('✅') ? 'bg-green-100 border border-green-300' :
                        'bg-blue-100 border border-blue-300'
                      }`}
                    >
                      <div className="flex-1 text-sm font-medium">
                        {alert}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dose Recommendation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-blue-900">Dosing Recommendation</CardTitle>
              <CardDescription>Evidence-based dosing for CRRT patients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-lg mb-2">{antibioticName}</h3>
                  <p className="text-2xl font-bold text-blue-800 mb-2">{results.doseRecommendation}</p>
                  <p className="text-sm text-gray-700">{results.rationale}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* PK Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">Total Clearance</CardTitle>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-1">
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Total Clearance</h4>
                        <p className="text-sm text-muted-foreground">
                          The sum of renal clearance, hepatic clearance, and CRRT clearance. 
                          Higher values indicate faster drug elimination from the body.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {results.totalClearance.toFixed(1)} L/h
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">AUC₀₋₂₄</CardTitle>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-1">
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Area Under the Curve (0-24h)</h4>
                        <p className="text-sm text-muted-foreground">
                          Total drug exposure over 24 hours. Higher AUC values indicate 
                          greater drug exposure, which correlates with efficacy for many antibiotics.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {results.auc024.toFixed(0)} mg·h/L
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">MIC</CardTitle>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-1">
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Minimum Inhibitory Concentration</h4>
                        <p className="text-sm text-muted-foreground">
                          The lowest concentration of antibiotic that inhibits bacterial growth. 
                          Lower MIC values indicate higher bacterial susceptibility to the antibiotic.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">
                  {mic ? `${mic} mg/L` : 'Not specified'}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-sm font-medium">%T &gt; MIC</CardTitle>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-auto p-1">
                        <Info className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-medium">Percent Time Above MIC</h4>
                        <p className="text-sm text-muted-foreground">
                          The percentage of time that drug concentration remains above the MIC. 
                          For beta-lactams like meropenem, target is typically ≥40% for efficacy.
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-2">
                  <div className="text-2xl font-bold text-purple-600">
                    {mic ? `${results.percentTimeAboveMic.toFixed(1)}%` : 'N/A'}
                  </div>
                  {mic && (
                    <Badge variant={results.percentTimeAboveMic >= 40 ? 'default' : 'destructive'}>
                      {results.percentTimeAboveMic >= 40 ? 'Target' : 'Low'}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Concentration-Time Curve */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Concentration-Time Profile</CardTitle>
              <CardDescription>Simulated plasma concentration over 24 hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={results.concentrationCurve}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (hours)', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Concentration (mg/L)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(2)} mg/L`, 'Concentration']}
                      labelFormatter={(time) => `Time: ${time} hours`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="concentration" 
                      stroke="#2563eb" 
                      strokeWidth={2}
                      dot={false}
                    />
                    {mic && (
                      <ReferenceLine 
                        y={mic} 
                        stroke="#dc2626" 
                        strokeDasharray="5 5"
                        label={{ value: `MIC: ${mic} mg/L`, position: 'top' }}
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Supporting Studies Section */}
          {supportingStudies.length > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-green-600" />
                  Supporting Research
                </CardTitle>
                <CardDescription>
                  Platform studies that informed this recommendation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {supportingStudies.map((study) => (
                    <div key={study.id} className="bg-white p-4 rounded-lg border border-green-200">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-green-900 mb-1">{study.title}</h4>
                          <p className="text-sm text-green-700 mb-2">
                            {study.authors} ({study.year || new Date(study.uploadedAt).getFullYear()})
                          </p>
                          <div className="flex flex-wrap gap-1 mb-2">
                            {study.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs bg-green-100 text-green-800">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          {study.notes && (
                            <p className="text-sm text-green-600 italic">{study.notes}</p>
                          )}
                        </div>
                        {study.url && (
                          <a 
                            href={study.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-4 p-2 text-green-600 hover:text-green-800"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {citationText && (
                  <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
                    <p className="text-sm text-green-700">
                      <strong>Citation:</strong> {citationText}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* No Studies Available */}
          {supportingStudies.length === 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  Research Gap Identified
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-yellow-800">
                  No platform studies found for this drug/CRRT combination. Consider uploading relevant research 
                  to improve evidence-based recommendations for future patients.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calculations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" />
                Pharmacokinetic Calculations
              </CardTitle>
              <CardDescription>
                Complete transparency of all formulas and calculations used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Input Parameters Section */}
              <div>
                <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
                  <Beaker className="h-4 w-4" />
                  Input Parameters
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Patient Characteristics</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                      <div>Age: {patientInput.age || 'Not specified'} years</div>
                      <div>Weight: {patientInput.weight || 70} kg (default if not specified)</div>
                      <div>Gender: {patientInput.gender || 'Not specified'}</div>
                      <div>Liver Disease: {patientInput.liverDisease ? 'Yes' : 'No'}</div>
                      <div>ECMO: {patientInput.ecmoTreatment ? 'Yes' : 'No'}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">CRRT Settings</h4>
                    <div className="bg-gray-50 p-3 rounded text-sm space-y-1">
                      <div>Modality: {patientInput.crrtModality || 'Not specified'}</div>
                      <div>Blood Flow: {patientInput.bloodFlowRate || 'Default'} mL/min</div>
                      <div>Dialysate Flow: {patientInput.dialysateFlowRate || 'Default'} mL/kg/hr</div>
                      <div>Pre-filter: {patientInput.preFilterReplacementRate || 'N/A'} mL/kg/hr</div>
                      <div>Post-filter: {patientInput.postFilterReplacementRate || 'N/A'} mL/kg/hr</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Drug Parameters Section */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Drug Parameters ({antibioticName})</h3>
                <div className="bg-blue-50 p-4 rounded">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Standard Dose</div>
                      <div>{pkParameters.standardDose} mg</div>
                    </div>
                    <div>
                      <div className="font-medium">Dosing Interval</div>
                      <div>{pkParameters.interval} hours</div>
                    </div>
                    <div>
                      <div className="font-medium">Volume of Distribution</div>
                      <div>{pkParameters.volumeOfDistribution} L/kg</div>
                    </div>
                    <div>
                      <div className="font-medium">Protein Binding</div>
                      <div>{(pkParameters.proteinBinding * 100).toFixed(1)}%</div>
                    </div>
                    <div>
                      <div className="font-medium">CRRT Clearance (baseline)</div>
                      <div>{pkParameters.crrtClearance} L/h</div>
                    </div>
                    <div>
                      <div className="font-medium">Half-life</div>
                      <div>{pkParameters.halfLife} hours</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calculation Steps */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Step-by-Step Calculations</h3>
                <div className="space-y-4">
                  
                  {/* Patient & Drug Parameters */}
                  <div className="bg-gray-50 p-4 rounded border border-gray-200">
                    <h4 className="font-medium mb-2">Patient & Drug Parameters Used</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Patient Weight:</strong> {results.calculationDetails?.patientWeight || patientInput.weight || 70} kg {!patientInput.weight ? "(default - weight not specified)" : ""}</div>
                      <div><strong>Drug:</strong> {antibioticName}</div>
                      <div><strong>Standard Dose:</strong> {pkParameters.standardDose} mg</div>
                      <div><strong>Dosing Interval:</strong> {pkParameters.interval} hours</div>
                      <div><strong>Volume of Distribution:</strong> {pkParameters.volumeOfDistribution} L/kg</div>
                      <div><strong>Protein Binding:</strong> {(pkParameters.proteinBinding * 100).toFixed(1)}%</div>
                      <div><strong>Filter Type:</strong> {patientInput.filterType || "high-flux (default)"}</div>
                      <div><strong>CRRT Modality:</strong> {patientInput.crrtModality || "Not specified"}</div>
                    </div>
                  </div>

                  {/* Step 1: Volume of Distribution Calculation */}
                  <div className="bg-blue-50 p-4 rounded border border-blue-200">
                    <h4 className="font-medium mb-2">1. Volume of Distribution Calculation</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Formula:</strong> Vd (L) = Vd (L/kg) × Weight (kg)</div>
                      <div><strong>Calculation:</strong> {pkParameters.volumeOfDistribution} L/kg × {results.calculationDetails?.patientWeight || 70} kg</div>
                      <div><strong>Result:</strong> {results.calculationDetails?.volumeOfDistribution?.toFixed(1)} L</div>
                      <div className="text-xs text-blue-700 italic">This represents the total body space available for drug distribution</div>
                    </div>
                  </div>

                  {/* Step 2: CRRT Clearance Calculation */}
                  <div className="bg-green-50 p-4 rounded border border-green-200">
                    <h4 className="font-medium mb-2">2. CRRT Clearance Calculation</h4>
                    <div className="text-sm space-y-2">
                      <div><strong>Baseline CRRT Clearance:</strong> {pkParameters.crrtClearance} L/h</div>
                      
                      <div><strong>Flow Rate Multiplier:</strong></div>
                      <ul className="ml-4 space-y-1">
                        <li>• Blood Flow: {patientInput.bloodFlowRate || 150} mL/min (baseline: 150 mL/min)</li>
                        <li>• Dialysate Flow: {patientInput.dialysateFlowRate || 25} mL/kg/hr (baseline: 25 mL/kg/hr)</li>
                        <li>• <strong>Flow Multiplier:</strong> {results.calculationDetails?.flowMultiplier?.toFixed(3)}</li>
                      </ul>
                      
                      <div><strong>Protein Binding Adjustment:</strong></div>
                      <ul className="ml-4 space-y-1">
                        <li>• Free Fraction: (1 - {pkParameters.proteinBinding}) = {(1 - pkParameters.proteinBinding).toFixed(3)}</li>
                        <li>• Sieving Coefficient: {results.calculationDetails?.sievingCoefficient?.toFixed(3)} ({results.calculationDetails?.filterEfficiency})</li>
                        <li>• <strong>Protein Binding Adjustment:</strong> {results.calculationDetails?.proteinBindingAdjustment?.toFixed(3)}</li>
                      </ul>
                      
                      <div><strong>Final CRRT Clearance:</strong></div>
                      <div className="ml-4">
                        {pkParameters.crrtClearance} × {results.calculationDetails?.flowMultiplier?.toFixed(3)} × {results.calculationDetails?.proteinBindingAdjustment?.toFixed(3)} = <strong>{results.calculationDetails?.crrtClearance?.toFixed(2)} L/h</strong>
                      </div>
                      <div className="text-xs text-green-700 italic">CRRT removes drug from blood; efficiency depends on filter type and protein binding</div>
                    </div>
                  </div>

                  {/* Step 3: Total Clearance Calculation */}
                  <div className="bg-purple-50 p-4 rounded border border-purple-200">
                    <h4 className="font-medium mb-2">3. Total Body Clearance</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Components:</strong></div>
                      <ul className="ml-4 space-y-1">
                        <li>• CRRT Clearance: {results.calculationDetails?.crrtClearance?.toFixed(2)} L/h</li>
                        <li>• Hepatic Clearance: {results.calculationDetails?.hepaticClearance?.toFixed(2)} L/h {patientInput.liverDisease ? "(reduced due to liver disease)" : "(normal hepatic function)"}</li>
                        <li>• Residual Renal: {results.calculationDetails?.residualRenalClearance?.toFixed(2)} L/h (minimal in CRRT patients)</li>
                      </ul>
                      <div><strong>Total Clearance:</strong> {results.calculationDetails?.crrtClearance?.toFixed(2)} + {results.calculationDetails?.hepaticClearance?.toFixed(2)} + {results.calculationDetails?.residualRenalClearance?.toFixed(2)} = <strong>{results.totalClearance.toFixed(2)} L/h</strong></div>
                      <div className="text-xs text-purple-700 italic">Total rate at which drug is eliminated from the body</div>
                    </div>
                  </div>

                  {/* Step 4: Elimination Rate */}
                  <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                    <h4 className="font-medium mb-2">4. Elimination Rate Constant</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Formula:</strong> k_e = Total Clearance / Volume of Distribution</div>
                      <div><strong>Calculation:</strong> {results.totalClearance.toFixed(2)} L/h ÷ {results.calculationDetails?.volumeOfDistribution?.toFixed(1)} L</div>
                      <div><strong>Result:</strong> {results.calculationDetails?.eliminationRate?.toFixed(4)} h⁻¹</div>
                      <div className="text-xs text-yellow-700 italic">Rate constant describing how fast drug concentration declines</div>
                    </div>
                  </div>

                  {/* Step 5: Initial Concentration */}
                  <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
                    <h4 className="font-medium mb-2">5. Initial Concentration After Dose</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Formula:</strong> C₀ = Dose / Volume of Distribution</div>
                      <div><strong>Calculation:</strong> {pkParameters.standardDose} mg ÷ {results.calculationDetails?.volumeOfDistribution?.toFixed(1)} L</div>
                      <div><strong>Result:</strong> {results.calculationDetails?.initialConcentration?.toFixed(2)} mg/L</div>
                      <div className="text-xs text-indigo-700 italic">Peak concentration immediately after IV dose administration</div>
                    </div>
                  </div>

                  {/* Step 6: Daily Dose and AUC */}
                  <div className="bg-teal-50 p-4 rounded border border-teal-200">
                    <h4 className="font-medium mb-2">6. Daily Dosing and AUC₀₋₂₄</h4>
                    <div className="text-sm space-y-1">
                      <div><strong>Doses per Day:</strong> 24 hours ÷ {pkParameters.interval} hours = {results.calculationDetails?.dosesPerDay?.toFixed(1)} doses</div>
                      <div><strong>Total Daily Dose:</strong> {pkParameters.standardDose} mg × {results.calculationDetails?.dosesPerDay?.toFixed(1)} = {results.calculationDetails?.dailyDose?.toFixed(0)} mg</div>
                      <div><strong>AUC₀₋₂₄ Formula:</strong> AUC = Daily Dose / Total Clearance</div>
                      <div><strong>AUC₀₋₂₄ Calculation:</strong> {results.calculationDetails?.dailyDose?.toFixed(0)} mg ÷ {results.totalClearance.toFixed(2)} L/h</div>
                      <div><strong>Result:</strong> {results.auc024.toFixed(0)} mg·h/L</div>
                      <div className="text-xs text-teal-700 italic">Total drug exposure over 24 hours - key efficacy parameter</div>
                    </div>
                  </div>

                  {/* Step 7: Time Above MIC */}
                  {mic && results.calculationDetails?.timeToReachMIC && (
                    <div className="bg-orange-50 p-4 rounded border border-orange-200">
                      <h4 className="font-medium mb-2">7. Percent Time Above MIC (%T&gt;MIC)</h4>
                      <div className="text-sm space-y-1">
                        <div><strong>MIC Target:</strong> {mic} mg/L</div>
                        <div><strong>Initial Concentration:</strong> {results.calculationDetails?.initialConcentration?.toFixed(2)} mg/L</div>
                        <div><strong>Elimination Rate:</strong> {results.calculationDetails?.eliminationRate?.toFixed(4)} h⁻¹</div>
                        
                        <div><strong>Time to Reach MIC Formula:</strong> t = ln(C₀/MIC) / k_e</div>
                        <div><strong>Calculation:</strong> ln({results.calculationDetails?.initialConcentration?.toFixed(2)}/{mic}) ÷ {results.calculationDetails?.eliminationRate?.toFixed(4)}</div>
                        <div><strong>Time to MIC:</strong> {results.calculationDetails?.timeToReachMIC?.toFixed(2)} hours</div>
                        
                        <div><strong>%T&gt;MIC Formula:</strong> (Time to MIC / Dosing Interval) × 100%</div>
                        <div><strong>Calculation:</strong> ({results.calculationDetails?.timeToReachMIC?.toFixed(2)} ÷ {pkParameters.interval}) × 100%</div>
                        <div><strong>Result:</strong> {results.percentTimeAboveMic.toFixed(1)}% {results.percentTimeAboveMic >= 40 ? "✅ Target achieved" : "⚠️ Below target (40%)"}</div>
                        <div className="text-xs text-orange-700 italic">Critical parameter for beta-lactam efficacy - target ≥40% for most infections</div>
                      </div>
                    </div>
                  )}

                  {/* Clinical Interpretation */}
                  <div className="bg-gray-100 p-4 rounded border border-gray-300">
                    <h4 className="font-medium mb-2">Clinical Interpretation</h4>
                    <div className="text-sm space-y-2">
                      <div><strong>Clearance Assessment:</strong> 
                        {results.totalClearance > 3 ? " High clearance - may need dose increase" : 
                         results.totalClearance < 1 ? " Low clearance - consider dose reduction" : " Moderate clearance - standard dosing appropriate"}
                      </div>
                      <div><strong>Filter Efficiency:</strong> {results.calculationDetails?.filterEfficiency} for {antibioticName} removal</div>
                      {mic && (
                        <div><strong>Efficacy Prediction:</strong> 
                          {results.percentTimeAboveMic >= 60 ? " Excellent probability of clinical success" :
                           results.percentTimeAboveMic >= 40 ? " Good probability of clinical success" :
                           " Consider dose optimization or alternative therapy"}
                        </div>
                      )}
                      <div className="text-xs text-gray-600 italic mt-2">
                        Note: These calculations are based on population pharmacokinetics. Individual patient response may vary. 
                        Consider therapeutic drug monitoring when available.
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Research Study Adjustments */}
              {supportingStudies.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Research-Based Adjustments</h3>
                  <div className="bg-green-50 p-4 rounded border border-green-200">
                    <div className="text-sm space-y-2">
                      <div><strong>Applied Studies:</strong> {supportingStudies.length} platform study(ies)</div>
                      <div><strong>Adjustments Made:</strong> Parameters modified based on {supportingStudies.map(s => s.title).join(', ')}</div>
                      <div className="text-xs text-green-700 italic">
                        Note: Research studies may have influenced clearance calculations, dosing intervals, or target parameters
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="references" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Data Sources & References
              </CardTitle>
              <CardDescription>
                All sources of data used in calculations and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Drug Database References */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Drug Database References</h3>
                <div className="bg-blue-50 p-4 rounded border border-blue-200">
                  <div className="space-y-2">
                    <div className="font-medium">Pharmacokinetic Parameters Source:</div>
                    {drugReferences.length > 0 ? (
                      <ul className="text-sm space-y-1">
                        {drugReferences.map((ref, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="text-blue-600">•</span>
                            {ref}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-sm text-gray-600">Standard pharmacokinetic literature and manufacturer data</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Platform Research */}
              {supportingStudies.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Platform Research Studies</h3>
                  <div className="space-y-3">
                    {supportingStudies.map((study) => (
                      <div key={study.id} className="bg-green-50 p-4 rounded border border-green-200">
                        <div className="space-y-2">
                          <div className="font-medium">{study.title}</div>
                          <div className="text-sm text-gray-700">{study.authors} ({study.year || new Date(study.uploadedAt).getFullYear()})</div>
                          <div className="flex flex-wrap gap-1">
                            {study.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          {study.notes && (
                            <div className="text-sm text-green-700 bg-green-100 p-2 rounded">
                              <strong>Study Impact:</strong> {study.notes}
                            </div>
                          )}
                          <div className="text-xs text-gray-600">
                            Uploaded by: {study.uploadedBy} on {study.uploadedAt.toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clinical Guidelines */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Clinical Guidelines & Standards</h3>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="space-y-2 text-sm">
                    <div><strong>CRRT Guidelines:</strong> Kidney Disease: Improving Global Outcomes (KDIGO)</div>
                    <div><strong>Antibiotic Dosing:</strong> Sanford Guide to Antimicrobial Therapy</div>
                    <div><strong>Pharmacokinetics:</strong> Applied Pharmacokinetics & Pharmacodynamics</div>
                    <div><strong>Critical Care:</strong> Society of Critical Care Medicine (SCCM) Guidelines</div>
                  </div>
                </div>
              </div>

              {/* Calculation Methodology */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Calculation Methodology</h3>
                <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                  <div className="space-y-2 text-sm">
                    <div><strong>PK Model:</strong> One-compartment pharmacokinetic model with first-order elimination</div>
                    <div><strong>CRRT Modeling:</strong> Extracorporeal clearance based on flow rates and sieving coefficients</div>
                    <div><strong>Protein Binding:</strong> Free drug concentration calculations for CRRT efficiency</div>
                    <div><strong>Statistical Methods:</strong> Population pharmacokinetic parameters with individual patient adjustments</div>
                    <div className="text-xs text-yellow-700 italic mt-2">
                      Note: Calculations are estimates based on population data and should be used in conjunction with clinical judgment and therapeutic drug monitoring when available.
                    </div>
                  </div>
                </div>
              </div>

              {/* System Information */}
              <div>
                <h3 className="font-semibold text-lg mb-3">System Information</h3>
                <div className="bg-gray-50 p-4 rounded border border-gray-200">
                  <div className="space-y-1 text-sm">
                    <div><strong>Platform:</strong> Clinical Decision Support System for CRRT Antibiotic Dosing</div>
                    <div><strong>Calculation Date:</strong> {new Date().toLocaleString()}</div>
                    <div><strong>Version:</strong> 1.0.0</div>
                    <div><strong>Research Integration:</strong> {supportingStudies.length > 0 ? 'Active' : 'Standard guidelines only'}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};