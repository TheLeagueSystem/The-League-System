import React, { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { AlertCircle } from 'lucide-react';

interface ApiErrorProps {
  error: Error | null;
  onClose?: () => void;
}

export const ApiError: React.FC<ApiErrorProps> = ({ error, onClose }) => {
  const [visible, setVisible] = useState(!!error);

  useEffect(() => {
    setVisible(!!error);
  }, [error]);

  if (!visible || !error) return null;

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        {error.message || "An error occurred while communicating with the server"}
      </AlertDescription>
      {onClose && (
        <button 
          onClick={() => { setVisible(false); onClose(); }}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      )}
    </Alert>
  );
};