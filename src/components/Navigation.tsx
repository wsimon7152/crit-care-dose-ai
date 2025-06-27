
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '../contexts/AuthContext';

export const Navigation = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-blue-900">
              Drug PK Prediction
            </h1>
            <span className="text-sm text-gray-500 hidden sm:inline">
              CRRT Antibiotic Dosing Assistant
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600">
              <span className="hidden sm:inline">Welcome, </span>
              <span className="font-medium">{user?.name}</span>
              {user?.role === 'admin' && (
                <span className="ml-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  Admin
                </span>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={logout}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};
