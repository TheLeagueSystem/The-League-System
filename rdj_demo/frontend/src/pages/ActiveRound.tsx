import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "src/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from "src/components/ui/card";
import { ArrowLeft, Share2, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';

import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";
import { 
  RadioGroup, 
  RadioGroupItem 
} from "../components/ui/radio-group";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Slider } from "../components/ui/slider";

import RoundResults from "../components/RoundResults";
import { fetchWithAuth } from '../utils/api';
import { apiConfig } from '../config/apiConfig';

interface RoundData {
  id: number;
  format: string;
  format_display: string;
  motion: {
    text: string;
    theme: {
      name: string;
    }
  };
  your_role: string;
  started_at: string;
  round_code: string;
  allocations?: Array<{
    username: string;
    role: string;
    user_id: number;  // Add this to identify users for scoring
  }>;
  status: string; // To check if the round is still active
}

const ActiveRound: React.FC = () => {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const { pageTransition } = useTheme();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roundData, setRoundData] = useState<RoundData | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false); // Add this line
  
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  const [resultSubmitting, setResultSubmitting] = useState(false);
  const [winningSide, setWinningSide] = useState<'GOVERNMENT' | 'OPPOSITION'>('GOVERNMENT');
  const [roundSummary, setRoundSummary] = useState('');
  const [speakerScores, setSpeakerScores] = useState<Array<{
    user_id: number;
    username: string;
    role: string;
    score: number;
    comments: string;
  }>>([]);

  useEffect(() => {
    // Get the admin status from localStorage
    const isAdmin = localStorage.getItem("is_admin") === "true";
    setUserIsAdmin(isAdmin);
    
    fetchRoundData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId]); // Disable the exhaustive-deps warning since fetchRoundData doesn't need to be a dependency
  
  const fetchRoundData = async () => {
    try {
      setLoading(true);
      
      // Use fetchWithAuth instead of direct fetch
      const data = await fetchWithAuth(`/round/${roundId}/`);
      
      setRoundData(data);
      setError("");
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching round data");
      console.error("Error fetching round data:", err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Initialize speaker scores when round data is loaded
    if (roundData?.allocations) {
      // Only include debaters, not adjudicators or spectators
      const debaterRoles = [
        'Prime Minister', 'Deputy Prime Minister', 'Member of Government', 'Government Whip',
        'Leader of Opposition', 'Deputy Leader of Opposition', 'Member of Opposition', 'Opposition Whip'
      ];
      
      const initialScores = roundData.allocations
        .filter(a => debaterRoles.includes(a.role))
        .map(a => ({
          user_id: a.user_id,
          username: a.username,
          role: a.role,
          score: 75, // default starting score
          comments: ''
        }));
        
      setSpeakerScores(initialScores);
    }
  }, [roundData]);

  const handleScoreChange = (userId: number, newScore: number) => {
    setSpeakerScores(prev => 
      prev.map(s => s.user_id === userId ? { ...s, score: newScore } : s)
    );
  };

  const handleCommentChange = (userId: number, comment: string) => {
    setSpeakerScores(prev => 
      prev.map(s => s.user_id === userId ? { ...s, comments: comment } : s)
    );
  };

  const submitRoundResults = async () => {
    if (!roundSummary.trim()) {
      toast.error("Please provide a round summary");
      return;
    }
    
    try {
      setResultSubmitting(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${apiConfig.baseURL}/api/round/${roundId}/results/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
        body: JSON.stringify({
          winning_side: winningSide,
          summary: roundSummary,
          speaker_scores: speakerScores
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit round results");
      }

      toast.success("Round results submitted successfully");
      setShowResultsDialog(false);
      
      // Refresh round data to show completed status
      fetchRoundData();
      
    } catch (err: any) {
      toast.error(err.message || "Error submitting results");
      console.error("Error submitting round results:", err);
    } finally {
      setResultSubmitting(false);
    }
  };

  const handleBack = () => {
    pageTransition(() => {
      navigate("/user-dashboard");
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
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  if (loading) {
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
      <Card className="w-full max-w-4xl mx-auto shadow-lg rounded-lg transition-colors duration-200 bg-gray-800 dark:bg-gray-800 light:bg-white">
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
            <CardTitle className="text-2xl font-bold dark:text-white light:text-gray-800">
              Active Round
            </CardTitle>
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
                  <div>
                    <p className="text-sm text-gray-400">Started At</p>
                    <p className="dark:text-white light:text-gray-800">
                      {new Date(roundData.started_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-sm text-gray-400">Motion</p>
                    <p className="dark:text-white light:text-gray-800 font-medium">{roundData.motion.text}</p>
                    <p className="text-sm text-blue-500 mt-1">{roundData.motion.theme.name}</p>
                  </div>
                </div>
              </div>
              
              {roundData.allocations && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold dark:text-white light:text-gray-800">Participants</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-blue-500">Government</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {roundData.allocations
                          .filter(a => ['Prime Minister', 'Deputy Prime Minister', 'Member of Government', 'Government Whip'].includes(a.role))
                          .map((allocation, index) => (
                            <div key={index} className="p-2 border rounded-lg dark:border-gray-700 light:border-gray-300 bg-blue-900 bg-opacity-5">
                              <p className="dark:text-white light:text-gray-800 font-medium">{allocation.username}</p>
                              <p className="text-sm text-blue-500">{allocation.role}</p>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-red-500">Opposition</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {roundData.allocations
                          .filter(a => ['Leader of Opposition', 'Deputy Leader of Opposition', 'Member of Opposition', 'Opposition Whip'].includes(a.role))
                          .map((allocation, index) => (
                            <div key={index} className="p-2 border rounded-lg dark:border-gray-700 light:border-gray-300 bg-red-900 bg-opacity-5">
                              <p className="dark:text-white light:text-gray-800 font-medium">{allocation.username}</p>
                              <p className="text-sm text-red-500">{allocation.role}</p>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2 text-purple-500">Adjudicators</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {roundData.allocations
                          .filter(a => ['Chair Adjudicator', 'Panelist', 'Trainee'].includes(a.role))
                          .map((allocation, index) => (
                            <div key={index} className="p-2 border rounded-lg dark:border-gray-700 light:border-gray-300">
                              <p className="dark:text-white light:text-gray-800 font-medium">{allocation.username}</p>
                              <p className={`text-sm ${allocation.role === 'Chair Adjudicator' ? 'text-purple-500 font-medium' : 'text-gray-500'}`}>
                                {allocation.role}
                              </p>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {roundData.round_code && userIsAdmin && (
                <div className="p-4 rounded-lg border-2 border-green-500 bg-green-900 bg-opacity-10 mt-4">
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

              {/* Chair Adjudicator Actions */}
              {roundData?.your_role === 'Chair Adjudicator' && roundData?.status === 'ACTIVE' && (
                <div className="mt-6">
                  <Button 
                    onClick={() => setShowResultsDialog(true)}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    Submit Round Results
                  </Button>
                </div>
              )}

              {/* Results Dialog */}
              <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Submit Round Results</DialogTitle>
                    <DialogDescription>
                      As the Chair Adjudicator, please submit the results and feedback for this debate round.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Winning Side Selection */}
                    <div className="space-y-2">
                      <Label>Winning Side</Label>
                      <RadioGroup 
                        value={winningSide} 
                        onValueChange={(v: string) => setWinningSide(v as 'GOVERNMENT' | 'OPPOSITION')} 
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="GOVERNMENT" id="government" />
                          <Label htmlFor="government" className="text-blue-500">Government</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="OPPOSITION" id="opposition" />
                          <Label htmlFor="opposition" className="text-red-500">Opposition</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    {/* Speaker Scores */}
                    <div className="space-y-2">
                      <Label>Speaker Scores</Label>
                      <Table>
                        <TableCaption>Set scores between 60-100 for each speaker</TableCaption>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Speaker</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead className="w-1/3">Comments</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {speakerScores.map((speaker) => (
                            <TableRow key={speaker.user_id}>
                              <TableCell className="font-medium">{speaker.username}</TableCell>
                              <TableCell className={
                                speaker.role.includes('Prime Minister') || 
                                speaker.role.includes('Deputy Prime Minister') || 
                                speaker.role.includes('Government') ? 
                                'text-blue-500' : 'text-red-500'
                              }>
                                {speaker.role}
                              </TableCell>
                              <TableCell className="w-48">
                                <div className="flex items-center space-x-2">
                                  <Slider
                                    min={60}
                                    max={100}
                                    step={0.5}
                                    value={[speaker.score]}
                                    onValueChange={(value: number[]) => handleScoreChange(speaker.user_id, value[0])}
                                    className="w-32"
                                  />
                                  <span className="text-sm w-12 text-center">
                                    {speaker.score.toFixed(1)}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Textarea
                                  placeholder="Feedback for this speaker"
                                  value={speaker.comments}
                                  onChange={(e) => handleCommentChange(speaker.user_id, e.target.value)}
                                  className="h-20 text-sm"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    
                    {/* Round Summary */}
                    <div className="space-y-2">
                      <Label>Round Summary and Feedback</Label>
                      <Textarea
                        placeholder="Provide a summary of the debate and general feedback..."
                        value={roundSummary}
                        onChange={(e) => setRoundSummary(e.target.value)}
                        className="min-h-[150px]"
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowResultsDialog(false)}>Cancel</Button>
                    <Button 
                      onClick={submitRoundResults}
                      className="bg-green-600 hover:bg-green-700"
                      disabled={resultSubmitting}
                    >
                      {resultSubmitting ? "Submitting..." : "Submit Results"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {roundData && roundData.status === 'COMPLETED' && (
                <div className="mt-6">
                  <RoundResults roundId={roundId || ''} />
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ActiveRound;