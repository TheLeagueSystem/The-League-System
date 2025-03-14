import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "src/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from "src/components/ui/card";
import { ArrowLeft, Clock, Share2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import WaitingRoom from '../components/WaitingRoom';
import { fetchWithAuth } from '../utils/api';

const RoundWaitingRoom: React.FC = () => {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const { pageTransition } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roundData, setRoundData] = useState<any>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);

  useEffect(() => {
    // Get the admin status from localStorage
    const isAdmin = localStorage.getItem("is_admin") === "true";
    setUserIsAdmin(isAdmin);
    
    fetchRoundData();
    
    // Set up polling to check if round has started
    const interval = setInterval(checkRoundStatus, 5000);
    
    // Cleanup
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId]);

  const fetchRoundData = async () => {
    try {
      setLoading(true);
      
      // Try different endpoints
      let data;
      let success = false;
      
      try {
        // Try the main endpoint first
        data = await fetchWithAuth(`/round/${roundId}/`);
        success = true;
      } catch (err) {
        console.log("Failed with main endpoint, trying fallback endpoint");
        try {
          // Try the waiting room specific endpoint
          data = await fetchWithAuth(`/round/${roundId}/waiting-room/`);
          success = true;
        } catch (err) {
          // Both endpoints failed
          throw err;
        }
      }
      
      if (success) {
        setRoundData(data);
        
        // If round has already started, redirect to active round
        if (data.status === 'ACTIVE') {
          pageTransition(() => {
            navigate(`/round/${roundId}`);
          });
        }
        
        setError("");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch round data");
      console.error("Error fetching round data:", err);
    } finally {
      setLoading(false);
    }
  };

  const checkRoundStatus = async () => {
    try {
      const data = await fetchWithAuth(`/round/${roundId}/status/`);
      
      // If round has started, redirect to active round
      if (data.status === 'ACTIVE') {
        pageTransition(() => {
          navigate(`/round/${roundId}`);
        });
      }
    } catch (err) {
      // Silent fail - will retry on next poll
      console.error("Error checking round status:", err);
    }
  };

  const handleStartRound = async () => {
    if (!userIsAdmin) return;
    
    try {
      await fetchWithAuth(`/admin/rounds/${roundId}/start/`, {
        method: "POST"
      });
      
      // Redirect to active round view
      pageTransition(() => {
        navigate(`/round/${roundId}`);
      });
    } catch (err: any) {
      toast.error(err.message || "Failed to start round");
      console.error("Error starting round:", err);
    }
  };

  const handleBack = () => {
    pageTransition(() => {
      navigate("/dashboard");
    });
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    },
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
  };

  if (loading && !roundData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <motion.div 
      className="p-4"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      <Card className="w-full max-w-5xl mx-auto shadow-lg rounded-lg transition-colors duration-200 bg-gray-800 dark:bg-gray-800 light:bg-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft size={16} />
            </Button>
            <div>
              <CardTitle className="text-2xl font-bold dark:text-white light:text-gray-800">
                Waiting Room
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Waiting for participants to join...
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Clock className="text-amber-500" size={18} />
            <span className="text-amber-500 font-medium">Waiting for round to start</span>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          {error && (
            <motion.div 
              variants={itemVariants}
              className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500"
            >
              {error}
            </motion.div>
          )}
          
          {roundData && (
            <motion.div variants={itemVariants} className="space-y-6">
              <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-900 bg-opacity-10">
                <h3 className="text-lg font-semibold dark:text-white light:text-gray-800 mb-4">Round Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Format</p>
                    <p className="dark:text-white light:text-gray-800 font-medium">{roundData.format_display}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Your Role</p>
                    <p className="dark:text-white light:text-gray-800 font-bold">{roundData.your_role}</p>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-sm text-gray-400">Motion</p>
                    <p className="dark:text-white light:text-gray-800 font-medium">{roundData.motion.text}</p>
                    <p className="text-sm text-blue-500 mt-1">{roundData.motion.theme.name}</p>
                  </div>
                </div>
              </div>
              
              {roundData.round_code && userIsAdmin && (
                <div className="p-4 rounded-lg border-2 border-green-500 bg-green-900 bg-opacity-10">
                  <h3 className="text-lg font-semibold dark:text-white light:text-gray-800 mb-2 flex items-center">
                    <Share2 size={18} className="mr-2" />
                    Share Round
                  </h3>
                  <p className="text-sm dark:text-gray-300 light:text-gray-600 mb-2">
                    Share this code with participants to join the round:
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="p-3 bg-gray-700 bg-opacity-30 rounded-lg text-center flex-1">
                      <p className="text-xl font-bold tracking-widest dark:text-white light:text-gray-800">
                        {roundData.round_code}
                      </p>
                    </div>
                    <Button 
                      size="sm" 
                      onClick={() => {
                        navigator.clipboard.writeText(roundData.round_code);
                        toast.success("Round code copied to clipboard");
                      }}
                      className="flex items-center space-x-1"
                    >
                      <Copy size={14} className="mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <h2 className="text-xl font-bold dark:text-white light:text-gray-800 mb-4">Waiting for Participants</h2>
                <WaitingRoom 
                  roundId={roundId || ''}
                  roundFormat={roundData?.format || 'ABP'}  // Add the ? optional chaining
                  onRoundStart={userIsAdmin ? handleStartRound : undefined}
                  isAdmin={userIsAdmin}
                />
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoundWaitingRoom;