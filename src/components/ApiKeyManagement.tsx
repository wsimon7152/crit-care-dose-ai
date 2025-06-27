
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Plus, Key } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export const ApiKeyManagement = () => {
  const { user, addApiKey, removeApiKey } = useAuth();
  const [newProvider, setNewProvider] = useState<'openai' | 'claude' | 'anthropic'>('openai');
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const handleAddKey = () => {
    if (!newKeyName.trim() || !newKey.trim()) {
      toast.error('Please enter both a name and API key');
      return;
    }

    addApiKey(newProvider, newKeyName.trim(), newKey.trim());
    setNewKeyName('');
    setNewKey('');
    setShowAddForm(false);
    toast.success('API key added successfully');
  };

  const handleRemoveKey = (keyId: string) => {
    removeApiKey(keyId);
    toast.success('API key removed');
  };

  const apiKeys = user?.apiKeys || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          API Key Management
        </CardTitle>
        <CardDescription>
          Manage your API keys for different AI providers. Keys are stored securely in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {apiKeys.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium">Your API Keys</h4>
            {apiKeys.map((apiKey) => (
              <div key={apiKey.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{apiKey.name}</div>
                  <div className="text-sm text-gray-500 capitalize">
                    {apiKey.provider} • Added {new Date(apiKey.createdAt).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-400 font-mono">
                    {apiKey.key.substring(0, 8)}...{apiKey.key.substring(apiKey.key.length - 4)}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveKey(apiKey.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {!showAddForm ? (
          <Button
            onClick={() => setShowAddForm(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add New API Key
          </Button>
        ) : (
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="provider">Provider</Label>
              <Select value={newProvider} onValueChange={(value: 'openai' | 'claude' | 'anthropic') => setNewProvider(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                  <SelectItem value="claude">Anthropic (Claude)</SelectItem>
                  <SelectItem value="anthropic">Anthropic (Legacy)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keyName">Key Name</Label>
              <Input
                id="keyName"
                placeholder="e.g., Main OpenAI Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="Enter your API key"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddKey} className="flex-1">
                Add Key
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false);
                  setNewKeyName('');
                  setNewKey('');
                }}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 mt-4">
          API keys are stored locally in your browser and are not sent to our servers.
        </div>
      </CardContent>
    </Card>
  );
};
