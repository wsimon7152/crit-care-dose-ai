
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Info, AlertTriangle, CheckCircle, ExternalLink, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { PKResult } from '../types';

interface PKResultsDisplayProps {
  results: PKResult;
  mic?: number;
  antibioticName: string;
}

export const PKResultsDisplay: React.FC<PKResultsDisplayProps> = ({ results, mic, antibioticName }) => {
  const { evidenceAlerts = [], supportingStudies = [], citationText } = results;

  return (
    <div className="space-y-6">
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
    </div>
  );
};
