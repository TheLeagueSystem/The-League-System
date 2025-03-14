import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { apiConfig } from '../config/apiConfig';

export const ApiDebugger: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const testEndpoint = async (endpoint: string) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem('token');
      const response = await fetch(`${apiConfig.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      setResult({ status: response.status, data });
    } catch (err: any) {
      console.error("Test failed:", err);
      setError(err.message || "Failed to test endpoint");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>API Connection Debugger</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Button 
              onClick={() => testEndpoint('/api/debug/db-connection/')}
              disabled={loading}
              size="sm"
            >
              Test DB Connection
            </Button>
            <Button 
              onClick={() => testEndpoint('/api/motions/')}
              disabled={loading}
              size="sm"
            >
              Test Motions
            </Button>
            <Button 
              onClick={() => testEndpoint('/api/admin/rounds/')}
              disabled={loading}
              size="sm"
            >
              Test Rounds
            </Button>
          </div>
          
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded text-red-800">
              {error}
            </div>
          )}
          
          {result && (
            <div className="p-3 bg-gray-100 border border-gray-300 rounded">
              <div>Status: {result.status}</div>
              <pre className="mt-2 text-xs overflow-auto max-h-40">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};