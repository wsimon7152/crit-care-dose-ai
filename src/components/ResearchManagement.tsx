
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Research } from '../types';
import { useAuth } from '../contexts/AuthContext';

export const ResearchManagement = () => {
  const { user } = useAuth();
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadNote, setUploadNote] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Mock research data
  const [researchList] = useState<Research[]>([
    {
      id: '1',
      title: 'Pharmacokinetics of vancomycin during continuous renal replacement therapy',
      authors: 'Smith AB, Johnson CD, Williams EF',
      year: 2023,
      url: 'https://pubmed.ncbi.nlm.nih.gov/example1',
      status: 'approved',
      uploadedBy: 'admin@hospital.com',
      uploadedAt: new Date('2023-12-01'),
      tags: ['vancomycin', 'CRRT', 'PK study'],
      notes: 'Key study for vancomycin dosing in CVVHDF'
    },
    {
      id: '2',
      title: 'Meropenem dosing optimization in critically ill patients receiving CRRT',
      authors: 'Brown GH, Davis IJ, Taylor KL',
      year: 2023,
      url: 'https://pubmed.ncbi.nlm.nih.gov/example2',
      status: 'pending',
      uploadedBy: 'doctor@hospital.com',
      uploadedAt: new Date('2023-12-15'),
      tags: ['meropenem', 'dosing', 'critical care'],
      notes: 'Proposes extended infusion strategy'
    }
  ]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl) return;

    setIsUploading(true);
    
    // Mock upload process
    setTimeout(() => {
      toast.success('Research uploaded for admin review');
      setUploadUrl('');
      setUploadNote('');
      setIsUploading(false);
    }, 1500);
  };

  const approvedResearch = researchList.filter(r => r.status === 'approved');
  const pendingResearch = researchList.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-blue-900">Research Management</CardTitle>
          <CardDescription>
            Upload and manage research literature for dosing recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">Upload Research</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedResearch.length})</TabsTrigger>
              {user?.role === 'admin' && (
                <TabsTrigger value="pending">Pending Review ({pendingResearch.length})</TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="url">PubMed URL or DOI</Label>
                  <Input
                    id="url"
                    placeholder="https://pubmed.ncbi.nlm.nih.gov/... or DOI"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="note">Notes (optional)</Label>
                  <Textarea
                    id="note"
                    placeholder="Any relevant notes about this study..."
                    value={uploadNote}
                    onChange={(e) => setUploadNote(e.target.value)}
                  />
                </div>
                
                <Button type="submit" disabled={isUploading}>
                  {isUploading ? 'Uploading...' : 'Submit for Review'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="approved">
              <div className="space-y-4">
                {approvedResearch.map((research) => (
                  <Card key={research.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">{research.title}</h4>
                        <p className="text-sm text-gray-600">{research.authors} ({research.year})</p>
                        <div className="flex flex-wrap gap-1">
                          {research.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        {research.notes && (
                          <p className="text-sm text-gray-700">{research.notes}</p>
                        )}
                        {research.url && (
                          <a 
                            href={research.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            View Study →
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {user?.role === 'admin' && (
              <TabsContent value="pending">
                <div className="space-y-4">
                  {pendingResearch.map((research) => (
                    <Card key={research.id}>
                      <CardContent className="pt-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline">Pending Review</Badge>
                            <div className="text-xs text-gray-500">
                              Uploaded by {research.uploadedBy}
                            </div>
                          </div>
                          <h4 className="font-semibold">{research.title}</h4>
                          <p className="text-sm text-gray-600">{research.authors} ({research.year})</p>
                          {research.notes && (
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              <strong>Submitter notes:</strong> {research.notes}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button size="sm" className="bg-green-600 hover:bg-green-700">
                              Approve
                            </Button>
                            <Button size="sm" variant="outline">
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
