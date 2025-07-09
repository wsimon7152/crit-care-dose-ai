import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Brain, RefreshCw, XCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Research } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { StudyAnalysisService } from '../services/studyAnalysis';

export const ResearchManagement = () => {
  const { user } = useAuth();
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadNote, setUploadNote] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedApiKey, setSelectedApiKey] = useState('');
  const [useAIAnalysis, setUseAIAnalysis] = useState(true);

  const userApiKeys = user?.apiKeys || [];

  // Initialize research data from localStorage or default mock data
  const [researchList, setResearchList] = useState<Research[]>(() => {
    const saved = localStorage.getItem('researchList');
    if (saved) {
      return JSON.parse(saved).map((item: any) => ({
        ...item,
        uploadedAt: new Date(item.uploadedAt)
      }));
    }
    
    // Default mock data
    return [
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
    ];
  });

  // Save to localStorage whenever researchList changes
  React.useEffect(() => {
    localStorage.setItem('researchList', JSON.stringify(researchList));
  }, [researchList]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadFile(file);
    } else if (file) {
      toast.error('Please select a PDF file');
      e.target.value = '';
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadUrl && !uploadFile) {
      toast.error('Please provide either a URL or upload a PDF file');
      return;
    }

    if (useAIAnalysis && !selectedApiKey) {
      toast.error('Please select an API key for AI analysis');
      return;
    }

    setIsUploading(true);
    
    try {
      let studyMetadata = {
        title: uploadFile ? uploadFile.name.replace('.pdf', '') : 'Study from URL',
        authors: 'Unknown authors',
        year: new Date().getFullYear(),
        abstract: '',
        tags: ['user-submitted'] as string[]
      };

      // AI-powered study analysis if enabled and API key available
      if (useAIAnalysis && selectedApiKey) {
        const apiKeyData = userApiKeys.find(key => key.id === selectedApiKey);
        if (apiKeyData) {
          let textContent = '';
          
          if (uploadFile) {
            textContent = await StudyAnalysisService.extractTextFromPDF(uploadFile);
          } else if (uploadUrl) {
            textContent = await StudyAnalysisService.extractTextFromUrl(uploadUrl);
          }

          studyMetadata = await StudyAnalysisService.extractStudyMetadata(
            textContent,
            uploadFile?.name || 'URL Study',
            apiKeyData
          );
          
          toast.success('AI analysis completed - extracted study metadata');
        }
      }

      // Create new research entry with extracted metadata
      const newResearch: Research = {
        id: Date.now().toString(),
        title: studyMetadata.title,
        authors: studyMetadata.authors,
        year: studyMetadata.year,
        url: uploadUrl || undefined,
        pdfPath: uploadFile ? `/uploads/${uploadFile.name}` : undefined,
        status: 'pending',
        uploadedBy: user?.email || 'unknown',
        uploadedAt: new Date(),
        tags: [...studyMetadata.tags, ...(uploadNote ? ['annotated'] : [])],
        notes: uploadNote || studyMetadata.abstract || undefined,
        filename: uploadFile?.name
      };

      // Add the new research to the list
      setResearchList(prev => [...prev, newResearch]);
      
      if (uploadFile) {
        toast.success(`Study "${studyMetadata.title}" uploaded and analyzed`);
      } else {
        toast.success(`Study "${studyMetadata.title}" submitted for review`);
      }
      
      // Reset form
      setUploadUrl('');
      setUploadNote('');
      setUploadFile(null);
      const fileInput = document.getElementById('pdf-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      toast.error('Upload failed - please try again');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  // Function to revoke an approved study
  const handleRevokeStudy = (studyId: string, studyTitle: string) => {
    setResearchList(prev => 
      prev.map(study => 
        study.id === studyId 
          ? { ...study, status: 'revoked' as const }
          : study
      )
    );
    toast.success(`"${studyTitle}" has been revoked - calculations will update automatically`);
  };

  // Function to clear all studies and revert to standard therapies
  const handleClearAllStudies = () => {
    if (window.confirm('This will remove ALL studies and revert to standard therapy calculations. Are you sure?')) {
      setResearchList([]);
      localStorage.removeItem('researchList');
      toast.success('All studies cleared - reverted to standard therapy calculations');
    }
  };

  // Function to re-analyze an existing study
  const handleReanalyzeStudy = async (studyId: string) => {
    if (!selectedApiKey) {
      toast.error('Please select an API key for re-analysis');
      return;
    }

    const study = researchList.find(s => s.id === studyId);
    if (!study) return;

    const apiKeyData = userApiKeys.find(key => key.id === selectedApiKey);
    if (!apiKeyData) return;

    try {
      setIsUploading(true);
      toast.info('Re-analyzing study...');

      let textContent = '';
      if (study.pdfPath && study.filename) {
        textContent = await StudyAnalysisService.extractTextFromPDF(
          new File([], study.filename, { type: 'application/pdf' })
        );
      } else if (study.url) {
        textContent = await StudyAnalysisService.extractTextFromUrl(study.url);
      }

      const studyMetadata = await StudyAnalysisService.extractStudyMetadata(
        textContent,
        study.filename || study.title,
        apiKeyData
      );

      // Update the existing study with new metadata
      setResearchList(prev => 
        prev.map(s => 
          s.id === studyId 
            ? {
                ...s,
                title: studyMetadata.title,
                authors: studyMetadata.authors,
                year: studyMetadata.year,
                tags: [...new Set([...s.tags, ...studyMetadata.tags])], // Merge tags
                notes: studyMetadata.abstract || s.notes
              }
            : s
        )
      );

      toast.success(`Study re-analyzed: "${studyMetadata.title}"`);
    } catch (error) {
      toast.error('Re-analysis failed - please try again');
      console.error('Re-analysis error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const approvedResearch = researchList.filter(r => r.status === 'approved');
  const pendingResearch = researchList.filter(r => r.status === 'pending');
  const userPendingResearch = researchList.filter(r => r.status === 'pending' && r.uploadedBy === user?.email);
  const revokedResearch = researchList.filter(r => r.status === 'revoked');

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
            <TabsList className={`grid w-full ${user?.role === 'admin' ? 'grid-cols-6' : 'grid-cols-3'}`}>
              <TabsTrigger value="upload">Upload Research</TabsTrigger>
              <TabsTrigger value="approved">Approved ({approvedResearch.length})</TabsTrigger>
              {user?.role !== 'admin' && (
                <TabsTrigger value="my-pending">My Pending ({userPendingResearch.length})</TabsTrigger>
              )}
              {user?.role === 'admin' && (
                <>
                  <TabsTrigger value="pending">Admin Review ({pendingResearch.length})</TabsTrigger>
                  <TabsTrigger value="revoked">Revoked ({revokedResearch.length})</TabsTrigger>
                  <TabsTrigger value="admin-controls">Admin Controls</TabsTrigger>
                </>
              )}
            </TabsList>
            
            <TabsContent value="upload" className="space-y-4">
              <form onSubmit={handleUpload} className="space-y-4">
                {/* AI Analysis Toggle */}
                {userApiKeys.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-3 mb-3">
                      <Brain className="h-5 w-5 text-blue-600" />
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="useAI"
                          checked={useAIAnalysis}
                          onChange={(e) => setUseAIAnalysis(e.target.checked)}
                          className="rounded"
                        />
                        <Label htmlFor="useAI" className="font-medium">
                          Enable AI-powered study analysis
                        </Label>
                      </div>
                    </div>
                    
                    {useAIAnalysis && (
                      <div className="space-y-2">
                        <Label htmlFor="aiApiKey">API Key for Analysis</Label>
                        <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select API key for study analysis" />
                          </SelectTrigger>
                          <SelectContent>
                            {userApiKeys.map((apiKey) => (
                              <SelectItem key={apiKey.id} value={apiKey.id}>
                                {apiKey.name} ({apiKey.provider})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-blue-600">
                          AI will extract study title, authors, year, and generate relevant tags
                        </p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="url">PubMed URL or DOI</Label>
                  <Input
                    id="url"
                    placeholder="https://pubmed.ncbi.nlm.nih.gov/... or DOI"
                    value={uploadUrl}
                    onChange={(e) => setUploadUrl(e.target.value)}
                  />
                </div>
                
                <div className="flex items-center justify-center">
                  <div className="text-sm text-gray-500">OR</div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pdf-upload">Upload PDF File</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="pdf-upload"
                      type="file"
                      accept=".pdf"
                      onChange={handleFileChange}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <Upload className="h-4 w-4 text-gray-400" />
                  </div>
                  {uploadFile && (
                    <p className="text-sm text-green-600">
                      Selected: {uploadFile.name}
                    </p>
                  )}
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
                
                <Button 
                  type="submit" 
                  disabled={isUploading || (useAIAnalysis && !selectedApiKey)}
                  className="w-full"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {useAIAnalysis ? 'Analyzing & Uploading...' : 'Uploading...'}
                    </>
                  ) : (
                    'Submit for Review'
                  )}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="approved">
              {/* Re-analysis Controls for Approved Studies */}
              {userApiKeys.length > 0 && (
                <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-green-600" />
                      <Label className="text-sm font-medium">Select API key to enable re-analysis:</Label>
                    </div>
                    <Select value={selectedApiKey} onValueChange={setSelectedApiKey}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Select API key for re-analysis" />
                      </SelectTrigger>
                      <SelectContent>
                        {userApiKeys.map((apiKey) => (
                          <SelectItem key={apiKey.id} value={apiKey.id}>
                            {apiKey.name} ({apiKey.provider})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    Extract proper titles and metadata from existing studies
                  </p>
                </div>
              )}
              
              <div className="space-y-4">
                {approvedResearch.map((research) => (
                  <Card key={research.id}>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{research.title}</h4>
                            {/* Always show re-analyze option when API keys are available */}
                            {userApiKeys.length > 0 && (
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleReanalyzeStudy(research.id)}
                                  disabled={isUploading || !selectedApiKey}
                                  className="text-xs h-7 px-3"
                                  title={!selectedApiKey ? "Select an API key above first" : "Re-analyze this study with AI"}
                                >
                                  {isUploading ? (
                                    <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                                  ) : (
                                    <Brain className="h-3 w-3 mr-1" />
                                  )}
                                  {isUploading ? 'Analyzing...' : 'Re-analyze with AI'}
                                </Button>
                                {!selectedApiKey && (
                                  <span className="text-xs text-amber-600">
                                    ← Select API key above
                                  </span>
                                )}
                              </div>
                            )}
                            {userApiKeys.length === 0 && (
                              <div className="mt-2">
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  Add API key in settings to enable AI re-analysis
                                </span>
                              </div>
                            )}
                          </div>
                          {user?.role === 'admin' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRevokeStudy(research.id, research.title)}
                              className="ml-2 text-red-600 hover:text-red-800 border-red-300"
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Revoke
                            </Button>
                          )}
                        </div>
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
                        <div className="flex items-center space-x-4">
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
                          {research.pdfPath && (
                            <span className="text-sm text-gray-600 flex items-center">
                              <Upload className="h-3 w-3 mr-1" />
                              PDF Available
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            {user?.role !== 'admin' && (
              <TabsContent value="my-pending">
                <div className="space-y-4">
                  {userPendingResearch.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No pending submissions</p>
                      <p className="text-sm">Studies you submit will appear here while awaiting admin review</p>
                    </div>
                  ) : (
                    userPendingResearch.map((research) => (
                      <Card key={research.id}>
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                Awaiting Review
                              </Badge>
                              <div className="text-xs text-gray-500">
                                Submitted {research.uploadedAt.toLocaleDateString()}
                              </div>
                            </div>
                            <h4 className="font-semibold">{research.title}</h4>
                            <div className="flex items-center space-x-4">
                              {research.url && (
                                <span className="text-xs text-blue-600">URL provided</span>
                              )}
                              {research.pdfPath && (
                                <span className="text-xs text-green-600 flex items-center">
                                  <Upload className="h-3 w-3 mr-1" />
                                  PDF uploaded
                                </span>
                              )}
                            </div>
                            {research.notes && (
                              <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                                <strong>Your notes:</strong> {research.notes}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            )}
            
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
                          <div className="flex items-center space-x-4">
                            {research.url && (
                              <span className="text-xs text-blue-600">URL provided</span>
                            )}
                            {research.pdfPath && (
                              <span className="text-xs text-green-600 flex items-center">
                                <Upload className="h-3 w-3 mr-1" />
                                PDF uploaded
                              </span>
                            )}
                          </div>
                          {research.notes && (
                            <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                              <strong>Submitter notes:</strong> {research.notes}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => {
                                setResearchList(prev => 
                                  prev.map(r => 
                                    r.id === research.id 
                                      ? { ...r, status: 'approved' as const }
                                      : r
                                  )
                                );
                                toast.success('Research approved');
                              }}
                            >
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setResearchList(prev => prev.filter(r => r.id !== research.id));
                                toast.success('Research rejected and removed');
                              }}
                            >
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
            
            {user?.role === 'admin' && (
              <TabsContent value="revoked">
                <div className="space-y-4">
                  {revokedResearch.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <p>No revoked studies</p>
                    </div>
                  ) : (
                    revokedResearch.map((research) => (
                      <Card key={research.id} className="border-red-200 bg-red-50">
                        <CardContent className="pt-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                                Revoked
                              </Badge>
                              <div className="text-xs text-gray-500">
                                Originally by {research.uploadedBy}
                              </div>
                            </div>
                            <h4 className="font-semibold text-red-900">{research.title}</h4>
                            <p className="text-sm text-red-700">{research.authors} ({research.year})</p>
                            <div className="flex flex-wrap gap-1">
                              {research.tags.map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs bg-red-100 text-red-800">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            {research.notes && (
                              <p className="text-sm text-red-600 bg-red-100 p-2 rounded">
                                <strong>Notes:</strong> {research.notes}
                              </p>
                            )}
                            <div className="text-xs text-red-600 italic">
                              ⚠️ This study has been revoked and no longer influences dosing recommendations
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>
            )}

            {user?.role === 'admin' && (
              <TabsContent value="admin-controls">
                <div className="space-y-6">
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader>
                      <CardTitle className="text-amber-800 flex items-center">
                        <Trash2 className="h-5 w-5 mr-2" />
                        System Reset
                      </CardTitle>
                      <CardDescription className="text-amber-700">
                        Clear all research studies and revert to standard therapy calculations
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="p-4 border border-amber-300 rounded-lg bg-amber-100">
                          <h4 className="font-semibold text-amber-800 mb-2">About the default studies:</h4>
                          <p className="text-sm text-amber-700 mb-2">
                            The first 2 studies shown are example/mock data with non-functional links. 
                            They were included as sample data to demonstrate the system.
                          </p>
                          <p className="text-sm text-amber-700">
                            Use this reset function to remove all studies (including examples) and start fresh 
                            with standard pharmacokinetic calculations only.
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          onClick={handleClearAllStudies}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Clear All Studies & Reset to Standard Therapies
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
        </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
