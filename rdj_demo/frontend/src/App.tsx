import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import AnimatedRoutes from './components/AnimatedRoutes';
import { ThemeProvider } from './contexts/ThemeContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <Router>
          <Toaster position="top-center" />
          <AnimatedRoutes />
        </Router>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
