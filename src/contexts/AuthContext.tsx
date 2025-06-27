
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, ApiKeyConfig } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  addApiKey: (provider: 'openai' | 'claude' | 'anthropic', name: string, key: string) => void;
  removeApiKey: (keyId: string) => void;
  updatePreferredModel: (modelId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token
    const storedUser = localStorage.getItem('pkapp_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock authentication - in real app, this would call your backend
    const mockUsers = [
      { id: '1', email: 'admin@hospital.com', role: 'admin' as const, name: 'Dr. Admin', institution: 'General Hospital' },
      { id: '2', email: 'doctor@hospital.com', role: 'standard' as const, name: 'Dr. Smith', institution: 'General Hospital' }
    ];
    
    const foundUser = mockUsers.find(u => u.email === email);
    if (foundUser && password === 'demo123') {
      // Load existing user data if available
      const storedUserData = localStorage.getItem(`pkapp_user_${foundUser.id}`);
      const userData = storedUserData ? JSON.parse(storedUserData) : { ...foundUser, apiKeys: [] };
      
      setUser(userData);
      localStorage.setItem('pkapp_user', JSON.stringify(userData));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('pkapp_user');
  };

  const addApiKey = (provider: 'openai' | 'claude' | 'anthropic', name: string, key: string) => {
    if (!user) return;
    
    const newApiKey: ApiKeyConfig = {
      id: Date.now().toString(),
      provider,
      name,
      key,
      createdAt: new Date()
    };
    
    const updatedUser = {
      ...user,
      apiKeys: [...(user.apiKeys || []), newApiKey]
    };
    
    setUser(updatedUser);
    localStorage.setItem('pkapp_user', JSON.stringify(updatedUser));
    localStorage.setItem(`pkapp_user_${user.id}`, JSON.stringify(updatedUser));
  };

  const removeApiKey = (keyId: string) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      apiKeys: (user.apiKeys || []).filter(key => key.id !== keyId)
    };
    
    setUser(updatedUser);
    localStorage.setItem('pkapp_user', JSON.stringify(updatedUser));
    localStorage.setItem(`pkapp_user_${user.id}`, JSON.stringify(updatedUser));
  };

  const updatePreferredModel = (modelId: string) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      preferredModel: modelId
    };
    
    setUser(updatedUser);
    localStorage.setItem('pkapp_user', JSON.stringify(updatedUser));
    localStorage.setItem(`pkapp_user_${user.id}`, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      isLoading, 
      addApiKey, 
      removeApiKey, 
      updatePreferredModel 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
