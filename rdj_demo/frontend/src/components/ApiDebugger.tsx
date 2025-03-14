import React, { useState } from 'react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { apiConfig } from '../config/apiConfig';

export const ApiDebugger = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("database");

  const testEndpoint = async (endpoint: string) => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem('token');
      
      console.log(`Testing endpoint: ${apiConfig.baseURL}${endpoint}`);
      
      const response = await fetch(`${apiConfig.baseURL}${endpoint}`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const contentType = response.headers.get("content-type");
      let data;
      
      if (contentType && contentType.includes("application/json")) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      setResult({ 
        status: response.status, 
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data 
      });
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
          <div className="flex space-x-2 border-b border-gray-700 pb-2">
            <Button 
              variant={activeTab === "database" ? "default" : "outline"}
              onClick={() => setActiveTab("database")}
              size="sm"
            >
              Database
            </Button>
            <Button 
              variant={activeTab === "endpoints" ? "default" : "outline"}
              onClick={() => setActiveTab("endpoints")}
              size="sm"
            >
              Endpoints
            </Button>
            <Button 
              variant={activeTab === "config" ? "default" : "outline"}
              onClick={() => setActiveTab("config")}
              size="sm"
            >
              Config
            </Button>
          </div>
          
          {activeTab === "database" && (
            <div className="flex space-x-2">
              <Button 
                onClick={() => testEndpoint('/api/debug/db-connection/')}
                disabled={loading}
                size="sm"
              >
                Test DB Connection
              </Button>
              <Button 
                onClick={() => testEndpoint('/api/utils/check-db/')}
                disabled={loading}
                size="sm"
              >
                Check DB Structure
              </Button>
            </div>
          )}
          
          {activeTab === "endpoints" && (
            <div className="grid grid-cols-2 gap-2">
              <Button 
                onClick={() => testEndpoint('/api/motions/')}
                disabled={loading}
                size="sm"
              >
                Motions
              </Button>
              <Button 
                onClick={() => testEndpoint('/api/motions/glossary/')}
                disabled={loading}
                size="sm"
              >
                Motion Glossary
              </Button>
              <Button 
                onClick={() => testEndpoint('/api/admin/rounds/')}
                disabled={loading}
                size="sm"
              >
                Rounds
              </Button>
              <Button 
                onClick={() => testEndpoint('/api/notifications/')}
                disabled={loading}
                size="sm"
              >
                Notifications
              </Button>
            </div>
          )}
          
          {activeTab === "config" && (
            <div>
              <h3 className="font-medium mb-2">Current API Configuration:</h3>
              <pre className="bg-gray-900 p-2 rounded text-xs overflow-auto">
                {JSON.stringify({
                  baseURL: apiConfig.baseURL,
                  environment: process.env.NODE_ENV || 'development',
                  tokenExists: !!localStorage.getItem('token'),
                  tokenLength: localStorage.getItem('token')?.length || 0
                }, null, 2)}
              </pre>
            </div>
          )}
          
          {loading && (
            <div className="flex items-center justify-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {error && (
            <div className="p-3 bg-red-900 bg-opacity-20 border border-red-700 rounded">
              <h3 className="text-red-500 font-medium">Error</h3>
              <p className="text-red-400">{error}</p>
            </div>
          )}
          
          {result && (
            <div className="p-3 bg-gray-900 border border-gray-700 rounded">
              <h3 className="font-medium mb-2 text-gray-300">Response (Status: {result.status} {result.statusText})</h3>
              <div className="mb-2">
                <h4 className="text-sm font-medium text-gray-400">Headers:</h4>
                <pre className="text-xs text-gray-400 overflow-auto max-h-20">
                  {JSON.stringify(result.headers, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-400">Body:</h4>
                <pre className="text-xs text-gray-300 overflow-auto max-h-60">
                  {typeof result.data === 'object' ? JSON.stringify(result.data, null, 2) : result.data}
                </pre>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApiDebugger;