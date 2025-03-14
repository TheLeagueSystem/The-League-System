import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { ArrowLeft, AlertTriangle, AlertCircle } from "lucide-react"; // Removed X from imports
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Badge } from "../components/ui/badge";
import toast from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { fetchWithAuth } from '../utils/api';

interface Round {
  id: number;
  format: string;
  format_display: string;
  motion: {
    text: string;
    theme: {
      name: string;
    }
  };
  status: string;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_by: {
    id: number;
    username: string;
  };
  round_code: string;
  participant_count: number;
}

const RoundManagement: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rounds, setRounds] = useState<Round[]>([]);
  const [selectedRound, setSelectedRound] = useState<Round | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
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
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  useEffect(() => {
    // Check if token exists before fetching
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication required. Please log in again.");
      setLoading(false);
      // Optionally redirect to login
      // navigate('/login');
      return;
    }
    
    fetchRounds();
  }, []);

  // Inside the fetchRounds function, update your error handling:
  const fetchRounds = async () => {
    try {
      setLoading(true);
      console.log("Fetching rounds...");
      
      // Use specific endpoint with proper error handling
      const data = await fetchWithAuth("/admin/rounds/");
      console.log("Rounds data:", data);
      
      setRounds(data || []);
      setError("");
    } catch (err: any) {
      console.error("Error fetching rounds:", err);
      setError("Could not load rounds. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/dashboard");
  };

  const handleDeleteRound = async () => {
    if (!selectedRound) return;
    
    try {
      setLoading(true);
      await fetchWithAuth(`/admin/rounds/${selectedRound.id}/`, {
        method: "DELETE"
      });
      
      // Remove the deleted round from state
      setRounds(rounds.filter(round => round.id !== selectedRound.id));
      
      // Close dialog and reset selected round
      setShowDeleteDialog(false);
      setSelectedRound(null);
      
      // Show success message
      toast.success("Round deleted successfully");
      
      // Refresh rounds list to ensure UI is in sync with backend
      fetchRounds();
    } catch (err: any) {
      toast.error(err.message || "Error deleting round");
      console.error("Error deleting round:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateRound = async (roundId: number) => {
    try {
      await fetchWithAuth(`/admin/rounds/${roundId}/terminate/`, {
        method: "POST"
      });
      
      // Refresh rounds to get updated state
      fetchRounds();
      
      // Show success message
      toast.success("Round terminated successfully");
    } catch (err: any) {
      toast.error(err.message || "Error terminating round");
      console.error("Error terminating round:", err);
    }
  };

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SETUP':
        return 'bg-gray-500';
      case 'ALLOCATION':
        return 'bg-blue-500';
      case 'ACTIVE':
        return 'bg-green-500';
      case 'COMPLETED':
        return 'bg-purple-500';
      case 'TERMINATED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  return (
    <motion.div 
      className="p-4"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      <Card className="w-full max-w-5xl mx-auto transition-colors duration-200 bg-gray-800 dark:bg-gray-800 light:bg-white shadow-lg rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between p-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft size={16} />
            </Button>
            <CardTitle className="text-2xl font-bold dark:text-white light:text-gray-800">Round Management</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {error && (
            <motion.div 
              variants={itemVariants}
              className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500"
            >
              <div className="flex items-center">
                <AlertTriangle className="mr-2" size={20} />
                {error}
              </div>
            </motion.div>
          )}
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 dark:text-white light:text-gray-800">Loading rounds...</p>
            </div>
          ) : rounds.length > 0 ? (
            <motion.div variants={itemVariants}>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y dark:divide-gray-700 light:divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Format</th>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">By</th>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700 light:divide-gray-200">
                    {rounds.map((round) => (
                      <tr key={round.id} className="hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white light:text-gray-800">{round.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white light:text-gray-800">{round.format_display}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`${getStatusColor(round.status)} text-white`}>{round.status}</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white light:text-gray-800">{formatDate(round.created_at)}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white light:text-gray-800">{round.created_by.username}</td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-white light:text-gray-800">
                          {round.round_code || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className="flex space-x-2">
                            <Button 
                              size="sm"
                              onClick={() => navigate(`/round/${round.id}`)}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              View
                            </Button>
                            {round.status === 'ACTIVE' && (
                              <Button 
                                size="sm"
                                onClick={() => handleTerminateRound(round.id)}
                                className="bg-amber-600 hover:bg-amber-700"
                              >
                                Terminate
                              </Button>
                            )}
                            <Button 
                              size="sm"
                              onClick={() => {
                                setSelectedRound(round);
                                setShowDeleteDialog(true);
                              }}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 dark:text-white light:text-gray-800">No rounds found</p>
            </div>
          )}
          
          {/* Delete Confirmation Dialog */}
          <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Delete Round</DialogTitle>
                <DialogDescription>
                  Are you sure you want to delete this round? This action cannot be undone.
                </DialogDescription>
              </DialogHeader>
              
              {selectedRound && (
                <div className="py-4">
                  <div className="p-4 rounded-lg bg-gray-700 bg-opacity-20">
                    <p className="font-medium dark:text-white light:text-gray-800">Round #{selectedRound.id}</p>
                    <p className="text-sm text-gray-400 mt-1">{selectedRound.format_display}</p>
                    <p className="text-sm dark:text-white light:text-gray-800 mt-2">
                      Motion: {selectedRound.motion.text}
                    </p>
                    {selectedRound.status === 'ACTIVE' && (
                      <p className="mt-2 text-amber-500 text-sm flex items-center">
                        <AlertTriangle size={14} className="mr-1" />
                        This round is currently active with {selectedRound.participant_count} participants
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleDeleteRound}
                >
                  Delete Round
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoundManagement;