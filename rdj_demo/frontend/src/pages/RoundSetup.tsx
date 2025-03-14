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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "src/components/ui/tabs";
import { fetchWithAuth } from '../utils/api';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, UserCheck } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import WaitingRoom from '../components/WaitingRoom';

// Define interfaces
interface User {
  id: number;
  username: string;
  email: string;
  is_staff?: boolean;
  is_superuser?: boolean;
}

interface Allocation {
  user_id: number;
  role: string;
}

interface RoundDetails {
  id: number;
  format: string;
  status: string;
  round_code: string;
  max_adjudicators: number;
  created_at: string;
  started_at?: string;
  motion?: {
    id: number;
    text: string;
    theme?: {
      id: number;
      name: string;
    };
  };
}

interface ParticipantsListProps {
  participants: User[];
  allocations: Allocation[];
}

interface RoleAllocationProps {
  users: User[];
  availableRoles: string[];
  allocations: Allocation[];
  assignRole: (userId: number, role: string) => void;
  removeRole: (userId: number) => void;
  roundFormat?: string;
}

// Component for participants waiting in the room
const ParticipantsList: React.FC<ParticipantsListProps> = ({ participants, allocations }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Participants ({participants.length})</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {participants.map((participant) => {
          const allocation = allocations.find(a => a.user_id === participant.id);
          return (
            <div key={participant.id} className="flex items-center p-2 rounded-md bg-card border">
              <div className="flex-1">
                <p className="font-medium">{participant.username}</p>
                <p className="text-sm text-muted-foreground">{participant.email}</p>
              </div>
              {allocation ? (
                <div className="text-sm px-2 py-1 rounded-full bg-primary/10 text-primary">
                  {allocation.role}
                </div>
              ) : (
                <div className="text-sm px-2 py-1 rounded-full bg-muted text-muted-foreground">
                  Waiting
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Component for role allocation
const RoleAllocation: React.FC<RoleAllocationProps> = ({ users, availableRoles, allocations, assignRole, removeRole, roundFormat }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Search users..."
          className="flex-1 px-3 py-2 border rounded-md"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredUsers.map((user) => {
          const allocation = allocations.find(a => a.user_id === user.id);
          return (
            <div key={user.id} className="p-3 border rounded-md">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium">{user.username}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                {allocation ? (
                  <div className="flex items-center">
                    <span className="text-sm mr-2">{allocation.role}</span>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={() => removeRole(user.id)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <select 
                    className="border rounded-md p-1"
                    onChange={e => assignRole(user.id, e.target.value)}
                    value=""
                  >
                    <option value="" disabled>Assign role</option>
                    {availableRoles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RoundSetup: React.FC = () => {
  const { roundId } = useParams<{ roundId: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('participants');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [roundDetails, setRoundDetails] = useState<RoundDetails | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const { theme } = useTheme();
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    // 1. Quick initial check from localStorage (consistent with your existing pattern)
    const isAdminFromStorage = localStorage.getItem("is_admin") === "true";
    setIsAdmin(isAdminFromStorage);
    
    // 2. Then function to load all data
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch round details
        const roundData = await fetchWithAuth(`/round/${roundId}/`);
        setRoundDetails(roundData);
        
        // Fetch participants
        const participantsData = await fetchWithAuth(`/round/${roundId}/participants/`);
        setParticipants(participantsData);
        
        // If admin, also fetch allocations
        if (isAdminFromStorage) {
          const allocationsData = await fetchWithAuth(`/admin/rounds/${roundId}/allocation-details/`);
          setAllocations(allocationsData.allocations || []);
        }
        
        setError('');
      } catch (err) {
        setError('Failed to load round data');
        console.error("Error loading round data:", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    
    // Set up polling for participant updates
    const intervalId = setInterval(async () => {
      try {
        const participantsData = await fetchWithAuth(`/round/${roundId}/participants/`);
        setParticipants(participantsData);
        
        // If round has started, redirect to active round
        const statusData = await fetchWithAuth(`/round/${roundId}/status/`);
        if (statusData.status === 'ACTIVE') {
          navigate(`/round/${roundId}`);
        }
      } catch (err) {
        console.error("Error updating participants:", err);
      }
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [roundId, navigate]);

  useEffect(() => {
    const verifyAdminStatus = async () => {
      // In the background, verify admin status with server
      try {
        const userData = await fetchWithAuth('/users/me/');
        const serverAdminStatus = userData.is_staff || userData.is_superuser;
        
        // If different from localStorage, update both state and storage
        if (isAdmin !== serverAdminStatus) {
          setIsAdmin(serverAdminStatus);
          localStorage.setItem("is_admin", serverAdminStatus.toString());
        }
      } catch (err) {
        console.error("Error verifying admin status:", err);
      }
    };
    
    // Call this after initial render
    if (localStorage.getItem("token")) {
      verifyAdminStatus();
    }
  }, [isAdmin]);
  
  const getAvailableRoles = () => {
    const format = roundDetails?.format || 'ABP';
    const takenRoles = allocations.map(a => a.role);
    
    if (format === 'ABP') {
      return [
        'Opening Government Speaker 1', 'Opening Government Speaker 2',
        'Opening Opposition Speaker 1', 'Opening Opposition Speaker 2',
        'Closing Government Speaker 1', 'Closing Government Speaker 2',
        'Closing Opposition Speaker 1', 'Closing Opposition Speaker 2',
        'Chair Adjudicator', 'Panelist', 'Trainee'
      ].filter(role => !takenRoles.includes(role));
    } else {
      return [
        'Prime Minister', 'Deputy Prime Minister', 'Government Whip',
        'Leader of Opposition', 'Deputy Leader of Opposition', 'Opposition Whip',
        'Chair Adjudicator', 'Panelist', 'Trainee'
      ].filter(role => !takenRoles.includes(role));
    }
  };
  
  const assignRole = async (userId: number, role: string) => {
    try {
      setAllocations(prev => {
        // Remove previous allocation for this user if exists
        const filtered = prev.filter(a => a.user_id !== userId);
        // Add new allocation
        return [...filtered, { user_id: userId, role }];
      });
    } catch (err) {
      setError('Failed to assign role');
      console.error("Error assigning role:", err);
    }
  };
  
  const removeRole = async (userId: number) => {
    try {
      setAllocations(prev => prev.filter(a => a.user_id !== userId));
    } catch (err) {
      setError('Failed to remove role');
      console.error("Error removing role:", err);
    }
  };
  
  const saveAllocations = async () => {
    try {
      setLoading(true);
      
      await fetchWithAuth(`/admin/rounds/${roundId}/allocate/`, {
        method: 'POST',
        body: JSON.stringify({ allocations })
      });
      
      setError('');
    } catch (err) {
      setError('Failed to save allocations');
      console.error("Error saving allocations:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const startRound = async () => {
    try {
      setLoading(true);
      
      // Make sure allocations are saved first
      await saveAllocations();
      
      // Start the round
      await fetchWithAuth(`/admin/rounds/${roundId}/start/`, {
        method: 'POST'
      });
      
      // Navigate to active round
      navigate(`/round/${roundId}`);
    } catch (err) {
      setError('Failed to start round');
      console.error("Error starting round:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    navigate('/admin/dashboard');
  };
  
  if (loading && !roundDetails) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (error && !roundDetails) {
    return (
      <div className="flex flex-col justify-center items-center h-screen">
        <h2 className="text-2xl font-bold mb-4">Error</h2>
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => navigate('/admin/dashboard')}>Return to Dashboard</Button>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`container mx-auto px-4 py-8 ${theme === 'dark' ? 'bg-gray-900 text-white' : ''}`}
    >
      <Button 
        variant="ghost" 
        className="mb-6" 
        onClick={handleBack}
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back
      </Button>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <div>
              Round Setup: {roundDetails?.round_code || ''}
            </div>
            {isAdmin && (
              <Button 
                onClick={startRound} 
                disabled={loading}
              >
                Start Round
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            {roundDetails?.motion?.text || 'No motion set'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {isAdmin ? (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="participants">
                  <Users className="w-4 h-4 mr-2" /> Participants
                </TabsTrigger>
                <TabsTrigger value="allocations">
                  <UserCheck className="w-4 h-4 mr-2" /> Role Allocation
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="participants">
                <ParticipantsList 
                  participants={participants} 
                  allocations={allocations}
                />
              </TabsContent>
              
              <TabsContent value="allocations">
                <div className="space-y-4">
                  <RoleAllocation 
                    users={participants}  // Only show users who have joined
                    availableRoles={getAvailableRoles()}
                    allocations={allocations}
                    assignRole={assignRole}
                    removeRole={removeRole}
                    roundFormat={roundDetails?.format}
                  />
                  
                  <div className="flex justify-end mt-4">
                    <Button 
                      onClick={saveAllocations}
                      disabled={loading}
                    >
                      Save Allocations
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="space-y-6">
              <ParticipantsList 
                participants={participants} 
                allocations={allocations}
              />
              
              <WaitingRoom
                roundId={roundId || ''}
                roundFormat={roundDetails?.format || 'ABP'}
                isAdmin={isAdmin}
              />
              
              <div className="p-4 border rounded-md bg-muted/40">
                <h3 className="text-lg font-medium mb-2">Waiting for round to start</h3>
                <p>The admin will assign roles and start the round shortly.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default RoundSetup;