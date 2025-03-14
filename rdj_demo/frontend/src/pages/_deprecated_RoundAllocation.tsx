import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "src/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "src/components/ui/select";
import { 
  ArrowLeft, 
  UserPlus,
  Users,
  UserCheck,
  Play,
  Ban,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { fetchWithAuth, getApiBaseUrl } from '../utils/api';

// Define types
interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_debater: boolean;
  is_adjudicator: boolean;
  selected_role?: string;
}

interface RoundDetails {
  id: number;
  format: 'ABP' | 'PDA';
  motion: {
    id: number;
    text: string;
    theme: {
      id: number;
      name: string;
    }
  };
  max_adjudicators: number;
  round_code: string; // Add this
}

interface Allocation {
  user_id: number;
  role: string;
}

const RoundAllocation: React.FC = () => {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const { pageTransition } = useTheme();
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [roundDetails, setRoundDetails] = useState<RoundDetails | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [selectedTab, setSelectedTab] = useState<'debaters' | 'adjudicators' | 'spectators'>('debaters');
  
  // Derived state
  const debaters = users.filter(user => user.selected_role && ['Prime Minister', 'Deputy Prime Minister', 'Government Whip', 'Leader of Opposition', 'Deputy Leader of Opposition', 'Opposition Whip', 'Member of Government', 'Member of Opposition'].includes(user.selected_role));
  const adjudicators = users.filter(user => user.selected_role && ['Chair Adjudicator', 'Panelist', 'Trainee'].includes(user.selected_role));
  const spectators = users.filter(user => user.selected_role === 'Spectator');
  const unassigned = users.filter(user => !user.selected_role);
  
  const availableDebaterRoles = getAvailableDebaterRoles();
  const availableAdjudicatorRoles = roundDetails?.max_adjudicators 
    ? ['Chair Adjudicator', 'Panelist', 'Trainee'].filter(role => {
        // Only one chair allowed
        if (role === 'Chair Adjudicator') {
          return !adjudicators.some(adj => adj.selected_role === 'Chair Adjudicator');
        }
        // For other roles, check against max adjudicators
        return adjudicators.length < roundDetails.max_adjudicators;
      })
    : [];

  // Fetch round details and users on component mount
  useEffect(() => {
    const fetchRoundDetailsInEffect = async () => {
      try {
        setLoading(true);
        console.log(`Fetching round details for round ID: ${roundId}`);
        
        let data;
        let endpointWorked = false;
        
        // Try this endpoint first in your loop
        const endpoints = [
          `/admin/rounds/${roundId}/allocation-details/`,  // New dedicated endpoint
          `/round/${roundId}/`,                           // Public endpoint
          `/admin/rounds/${roundId}/`                     // Admin endpoint
        ];
        
        for (const endpoint of endpoints) {
          try {
            console.log(`Trying endpoint: ${getApiBaseUrl()}${endpoint}`);
            data = await fetchWithAuth(endpoint);
            console.log(`Success with endpoint ${endpoint}`, data);
            endpointWorked = true;
            break; // Exit the loop if successful
          } catch (err) {
            console.error(`Failed with endpoint ${endpoint}:`, err);
            // Continue to next endpoint
          }
        }
        
        if (!endpointWorked) {
          throw new Error("All endpoints failed");
        }
        
        setRoundDetails(data);
        setError("");
      } catch (err: any) {
        console.error("Error fetching round details:", err);
        setError(err.message || "An error occurred while fetching round details");
      } finally {
        setLoading(false);
      }
    };

    fetchRoundDetailsInEffect();
    fetchUsers();
  }, [roundId]); // intentionally omit fetchRoundDetails to avoid re-fetches
  
  const fetchUsers = async () => {
    try {
      const data = await fetchWithAuth("/admin/users/");
      
      // Make sure data is an array before setting it to state
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && data.users && Array.isArray(data.users)) {
        // Some APIs return data in a nested object like { users: [...] }
        setUsers(data.users);
      } else {
        console.error("Received invalid user data format:", data);
        setUsers([]); // Set to empty array as fallback
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setUsers([]); // Ensure users is always an array even on error
    }
  };
  
  function getAvailableDebaterRoles(): string[] {
    if (!roundDetails) return [];
    
    const format = roundDetails.format;
    const takenRoles = debaters.map(d => d.selected_role);
    
    if (format === 'ABP') { // British Parliamentary
      return [
        'Prime Minister', 
        'Deputy Prime Minister',
        'Member of Government',
        'Government Whip',
        'Leader of Opposition',
        'Deputy Leader of Opposition',
        'Member of Opposition',
        'Opposition Whip'
      ].filter(role => !takenRoles.includes(role));
    } else { // Asian Parliamentary (PDA)
      return [
        'Prime Minister', 
        'Deputy Prime Minister',
        'Government Whip',
        'Leader of Opposition',
        'Deputy Leader of Opposition',
        'Opposition Whip'
      ].filter(role => !takenRoles.includes(role));
    }
  }
  
  const assignRole = (userId: number, role: string) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, selected_role: role } : user
      )
    );
    
    setAllocations(prev => {
      // Remove previous allocation for this user if exists
      const filtered = prev.filter(a => a.user_id !== userId);
      // Add new allocation
      return [...filtered, { user_id: userId, role }];
    });
  };
  
  const removeRole = (userId: number) => {
    setUsers(prevUsers => 
      prevUsers.map(user => 
        user.id === userId ? { ...user, selected_role: undefined } : user
      )
    );
    
    setAllocations(prev => prev.filter(a => a.user_id !== userId));
  };
  
  const handleBack = () => {
    pageTransition(() => {
      navigate("/admin/dashboard");
    });
  };
  
  const startRound = async () => {
    try {
      setLoading(true);
      
      // Validate allocations
      if (!validateAllocations()) {
        return;
      }
      
      // Send allocations to backend using fetchWithAuth
      await fetchWithAuth(`/admin/rounds/${roundId}/allocate/`, {
        method: "POST",
        body: JSON.stringify({ allocations })
      });
      
      // Start the round
      await fetchWithAuth(`/admin/rounds/${roundId}/start/`, {
        method: "POST"
      });
      
      // Navigate to round view
      pageTransition(() => {
        navigate(`/round/${roundId}`);
      });
    } catch (err: any) {
      setError(err.message || "An error occurred while starting the round");
      console.error("Error starting round:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const validateAllocations = (): boolean => {
    if (!roundDetails) return false;
    
    // Check if all required debater roles are filled
    const requiredRoles = roundDetails.format === 'ABP' 
      ? 8  // British Parliamentary requires 8 speakers
      : 6; // Asian Parliamentary requires 6 speakers
    
    if (debaters.length !== requiredRoles) {
      setError(`You need exactly ${requiredRoles} debaters for ${roundDetails.format === 'ABP' ? 'British' : 'Asian'} Parliamentary format.`);
      return false;
    }
    
    // Check if there's a chair adjudicator
    if (!adjudicators.some(adj => adj.selected_role === 'Chair Adjudicator')) {
      setError("You need at least one Chair Adjudicator.");
      return false;
    }
    
    // Clear any previous errors
    setError("");
    return true;
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

  if (loading && !roundDetails) {
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
              <CardTitle className="text-2xl font-bold dark:text-white light:text-gray-800">Round Allocation</CardTitle>
              <CardDescription className="text-gray-400 dark:text-gray-400 light:text-gray-600">
                Assign roles to participants for the debate round
              </CardDescription>
            </div>
          </div>
          
          <Button 
            onClick={startRound}
            className="bg-green-600 hover:bg-green-700"
            disabled={loading}
          >
            <Play size={18} className="mr-2" />
            Start Round
          </Button>
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
          
          {roundDetails && (
            <motion.div variants={itemVariants} className="mb-6">
              <div className="p-4 rounded-lg border-2 border-blue-500 bg-blue-900 bg-opacity-10">
                <h3 className="text-lg font-semibold dark:text-white light:text-gray-800 mb-2">Round Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Format</p>
                    <p className="dark:text-white light:text-gray-800">
                      {roundDetails.format === 'ABP' ? 'British Parliamentary' : 'Asian Parliamentary'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Max Adjudicators</p>
                    <p className="dark:text-white light:text-gray-800">{roundDetails.max_adjudicators}</p>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-sm text-gray-400">Motion</p>
                    <p className="dark:text-white light:text-gray-800 font-medium">{roundDetails.motion.text}</p>
                    <p className="text-sm text-blue-500 mt-1">{roundDetails.motion.theme.name}</p>
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <p className="text-sm text-gray-400">Round Code</p>
                    <p className="dark:text-white light:text-gray-800 font-medium tracking-wider">
                      {roundDetails.round_code}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      This code will be used by participants to join the round once it starts.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex space-x-4 mb-4">
              <Button 
                variant={selectedTab === 'debaters' ? 'default' : 'outline'} 
                onClick={() => setSelectedTab('debaters')}
                className="flex items-center"
              >
                <Users size={18} className="mr-2" />
                Debaters ({debaters.length}/{roundDetails?.format === 'ABP' ? 8 : 6})
              </Button>
              <Button 
                variant={selectedTab === 'adjudicators' ? 'default' : 'outline'} 
                onClick={() => setSelectedTab('adjudicators')}
                className="flex items-center"
              >
                <UserCheck size={18} className="mr-2" />
                Adjudicators ({adjudicators.length}/{roundDetails?.max_adjudicators || 0})
              </Button>
              <Button 
                variant={selectedTab === 'spectators' ? 'default' : 'outline'} 
                onClick={() => setSelectedTab('spectators')}
                className="flex items-center"
              >
                <UserPlus size={18} className="mr-2" />
                Spectators ({spectators.length})
              </Button>
            </div>
            
            <div className="border rounded-lg dark:border-gray-700 light:border-gray-300 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <div>
                  <h3 className="font-medium dark:text-white light:text-gray-800 mb-2">Unassigned Users ({unassigned.length})</h3>
                  <div className="h-64 overflow-y-auto border rounded-lg dark:border-gray-700 light:border-gray-300 p-2">
                    {unassigned.length === 0 ? (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">All users have been assigned</p>
                      </div>
                    ) : (
                      unassigned.map(user => (
                        <div key={user.id} className="p-2 mb-1 border rounded-lg dark:border-gray-700 light:border-gray-300 flex justify-between items-center">
                          <div>
                            <p className="dark:text-white light:text-gray-800 font-medium">{user.username}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            {selectedTab === 'debaters' && availableDebaterRoles.length > 0 && (
                              <Select onValueChange={(value: string) => assignRole(user.id, value)}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Assign as debater" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableDebaterRoles.map((role) => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {selectedTab === 'adjudicators' && availableAdjudicatorRoles.length > 0 && (
                              <Select onValueChange={(value: string) => assignRole(user.id, value)}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Assign as adjudicator" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableAdjudicatorRoles.map((role) => (
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            )}
                            
                            {selectedTab === 'spectators' && (
                              <Button 
                                onClick={() => assignRole(user.id, 'Spectator')}
                                variant="outline"
                                size="sm"
                              >
                                <UserPlus size={16} className="mr-2" />
                                Add as Spectator
                              </Button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium dark:text-white light:text-gray-800 mb-2">
                    {selectedTab === 'debaters' && 'Assigned Debaters'}
                    {selectedTab === 'adjudicators' && 'Assigned Adjudicators'}
                    {selectedTab === 'spectators' && 'Spectators'}
                  </h3>
                  <div className="h-64 overflow-y-auto border rounded-lg dark:border-gray-700 light:border-gray-300 p-2">
                    {selectedTab === 'debaters' && debaters.length === 0 && (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No debaters assigned yet</p>
                      </div>
                    )}
                    
                    {selectedTab === 'debaters' && debaters.length > 0 && (
                      <>
                        <h4 className="font-medium text-sm mb-2 text-blue-500">Government</h4>
                        <div className="mb-4">
                          {debaters
                            .filter(d => ['Prime Minister', 'Deputy Prime Minister', 'Member of Government', 'Government Whip'].includes(d.selected_role!))
                            .map(user => (
                              <div key={user.id} className="p-2 mb-1 border rounded-lg dark:border-gray-700 light:border-gray-300 flex justify-between items-center bg-blue-900 bg-opacity-5">
                                <div>
                                  <p className="dark:text-white light:text-gray-800 font-medium">{user.username}</p>
                                  <p className="text-sm text-blue-500">{user.selected_role}</p>
                                </div>
                                <Button 
                                  onClick={() => removeRole(user.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <Ban size={16} />
                                </Button>
                              </div>
                            ))}
                        </div>
                        
                        <h4 className="font-medium text-sm mb-2 text-red-500">Opposition</h4>
                        <div>
                          {debaters
                            .filter(d => ['Leader of Opposition', 'Deputy Leader of Opposition', 'Member of Opposition', 'Opposition Whip'].includes(d.selected_role!))
                            .map(user => (
                              <div key={user.id} className="p-2 mb-1 border rounded-lg dark:border-gray-700 light:border-gray-300 flex justify-between items-center bg-red-900 bg-opacity-5">
                                <div>
                                  <p className="dark:text-white light:text-gray-800 font-medium">{user.username}</p>
                                  <p className="text-sm text-red-500">{user.selected_role}</p>
                                </div>
                                <Button 
                                  onClick={() => removeRole(user.id)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 hover:text-red-600"
                                >
                                  <Ban size={16} />
                                </Button>
                              </div>
                            ))}
                        </div>
                      </>
                    )}
                    
                    {selectedTab === 'adjudicators' && adjudicators.length === 0 && (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No adjudicators assigned yet</p>
                      </div>
                    )}
                    
                    {selectedTab === 'adjudicators' && adjudicators.length > 0 && (
                      <>
                        {adjudicators.map(user => (
                          <div key={user.id} className="p-2 mb-1 border rounded-lg dark:border-gray-700 light:border-gray-300 flex justify-between items-center">
                            <div>
                              <p className="dark:text-white light:text-gray-800 font-medium">{user.username}</p>
                              <p className={`text-sm ${user.selected_role === 'Chair Adjudicator' ? 'text-purple-500 font-medium' : 'text-gray-500'}`}>
                                {user.selected_role}
                              </p>
                            </div>
                            <Button 
                              onClick={() => removeRole(user.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Ban size={16} />
                            </Button>
                          </div>
                        ))}
                      </>
                    )}
                    
                    {selectedTab === 'spectators' && spectators.length === 0 && (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-500">No spectators assigned yet</p>
                      </div>
                    )}
                    
                    {selectedTab === 'spectators' && spectators.length > 0 && (
                      <>
                        {spectators.map(user => (
                          <div key={user.id} className="p-2 mb-1 border rounded-lg dark:border-gray-700 light:border-gray-300 flex justify-between items-center">
                            <div>
                              <p className="dark:text-white light:text-gray-800 font-medium">{user.username}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                            <Button 
                              onClick={() => removeRole(user.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                            >
                              <Ban size={16} />
                            </Button>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
          
          <div className="pt-4 border-t border-gray-700 dark:border-gray-700 light:border-gray-300 flex justify-between">
            <Button 
              type="button" 
              variant="ghost" 
              onClick={handleBack}
            >
              <ArrowLeft size={16} className="mr-2" />
              Cancel
            </Button>
            <div className="flex space-x-2">
              <Button
                onClick={() => navigate(`/round/${roundId}/setup`)}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={loading}
              >
                View Waiting Room
              </Button>
              <Button 
                onClick={startRound}
                className="bg-green-600 hover:bg-green-700"
                disabled={loading}
              >
                <Play size={18} className="mr-2" />
                Start Round
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoundAllocation;