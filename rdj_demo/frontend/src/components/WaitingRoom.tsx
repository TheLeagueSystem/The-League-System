import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Users, Award, Eye } from 'lucide-react';
import { fetchWithAuth } from '../utils/api';
import { Avatar } from 'src/components/ui/avatar';
import { Button } from 'src/components/ui/button';

interface Participant {
  id: number;
  username: string;
  role: string;
  is_ready: boolean;
}

interface WaitingRoomProps {
  roundId: string;
  roundFormat: string;
  onRoundStart?: () => void;
  isAdmin: boolean;
}

const WaitingRoom: React.FC<WaitingRoomProps> = ({ 
  roundId, 
  roundFormat, 
  onRoundStart,
  isAdmin 
}) => {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Animation variants for smooth transitions
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        duration: 0.3,
        when: "beforeChildren",
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
  };

  useEffect(() => {
    // Initial fetch
    fetchParticipants();
    
    // Set up polling every 5 seconds
    const interval = setInterval(fetchParticipants, 5000);
    setRefreshInterval(interval);
    
    // Cleanup on unmount
    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roundId]);

  const fetchParticipants = async () => {
    try {
      setLoading(true);
      const data = await fetchWithAuth(`/round/${roundId}/participants/`);
      setParticipants(data.participants || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "Failed to fetch participants");
      console.error("Error fetching participants:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter participants by role
  const governmentSpeakers = participants.filter(p => 
    ['Prime Minister', 'Deputy Prime Minister', 'Government Whip', 'Member of Government'].includes(p.role)
  );
  
  const oppositionSpeakers = participants.filter(p => 
    ['Leader of Opposition', 'Deputy Leader of Opposition', 'Opposition Whip', 'Member of Opposition'].includes(p.role)
  );

  const adjudicators = {
    chair: participants.filter(p => p.role === 'Chair Adjudicator'),
    panelist: participants.filter(p => p.role === 'Panelist'),
    trainee: participants.filter(p => p.role === 'Trainee')
  };
  
  const spectators = participants.filter(p => p.role === 'Spectator');

  // Helper to get capacity labels
  const getTeamCapacity = (team: Participant[]) => {
    const format = roundFormat === 'ABP' ? 'BP' : 'AP';
    const capacity = format === 'BP' ? 
      (team[0]?.role.includes('Opening') ? 2 : 2) : 3;
    return `(${team.length}/${capacity})`;
  };

  // Helper to get BP-specific teams
  const getBPTeams = () => {
    return {
      openingGov: participants.filter(p => ['Prime Minister', 'Deputy Prime Minister'].includes(p.role)),
      openingOpp: participants.filter(p => ['Leader of Opposition', 'Deputy Leader of Opposition'].includes(p.role)),
      closingGov: participants.filter(p => ['Government Whip', 'Member of Government'].includes(p.role)),
      closingOpp: participants.filter(p => ['Opposition Whip', 'Member of Opposition'].includes(p.role))
    };
  };

  const ParticipantCard: React.FC<{ participant: Participant }> = ({ participant }) => (
    <motion.div 
      variants={itemVariants}
      className="flex items-center justify-between p-3 mb-2 bg-gray-700 bg-opacity-30 rounded-lg"
    >
      <div className="flex items-center">
        <Avatar className="h-8 w-8 mr-3" />
        <div>
          <p className="font-medium dark:text-white light:text-gray-800">{participant.username}</p>
          <p className="text-xs text-gray-400">{participant.role}</p>
        </div>
      </div>
      {participant.is_ready && (
        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
      )}
    </motion.div>
  );

  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {loading && participants.length === 0 ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      ) : (
        <>
          {/* Debaters Section */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-xl font-bold flex items-center dark:text-white light:text-gray-800">
              <Users className="mr-2" size={20} />
              Debaters
            </h2>
            
            {roundFormat === 'ABP' ? (
              // British Parliamentary Format - 4 teams
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-md font-medium text-blue-400 mb-2">Opening Government {getTeamCapacity(getBPTeams().openingGov)}</h3>
                  <div className="border border-blue-900 rounded-lg p-2 bg-blue-900 bg-opacity-10">
                    {getBPTeams().openingGov.map(p => (
                      <ParticipantCard key={p.id} participant={p} />
                    ))}
                    {getBPTeams().openingGov.length < 2 && (
                      <div className="flex items-center justify-center p-6 text-gray-500">
                        <UserPlus size={20} className="mr-2" />
                        Waiting for speakers...
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-md font-medium text-blue-400 mt-4 mb-2">Closing Government {getTeamCapacity(getBPTeams().closingGov)}</h3>
                  <div className="border border-blue-900 rounded-lg p-2 bg-blue-900 bg-opacity-10">
                    {getBPTeams().closingGov.map(p => (
                      <ParticipantCard key={p.id} participant={p} />
                    ))}
                    {getBPTeams().closingGov.length < 2 && (
                      <div className="flex items-center justify-center p-6 text-gray-500">
                        <UserPlus size={20} className="mr-2" />
                        Waiting for speakers...
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-md font-medium text-red-400 mb-2">Opening Opposition {getTeamCapacity(getBPTeams().openingOpp)}</h3>
                  <div className="border border-red-900 rounded-lg p-2 bg-red-900 bg-opacity-10">
                    {getBPTeams().openingOpp.map(p => (
                      <ParticipantCard key={p.id} participant={p} />
                    ))}
                    {getBPTeams().openingOpp.length < 2 && (
                      <div className="flex items-center justify-center p-6 text-gray-500">
                        <UserPlus size={20} className="mr-2" />
                        Waiting for speakers...
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-md font-medium text-red-400 mt-4 mb-2">Closing Opposition {getTeamCapacity(getBPTeams().closingOpp)}</h3>
                  <div className="border border-red-900 rounded-lg p-2 bg-red-900 bg-opacity-10">
                    {getBPTeams().closingOpp.map(p => (
                      <ParticipantCard key={p.id} participant={p} />
                    ))}
                    {getBPTeams().closingOpp.length < 2 && (
                      <div className="flex items-center justify-center p-6 text-gray-500">
                        <UserPlus size={20} className="mr-2" />
                        Waiting for speakers...
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              // Asian Parliamentary Format - 2 teams
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-md font-medium text-blue-500 mb-2">Government {getTeamCapacity(governmentSpeakers)}</h3>
                  <div className="border border-blue-900 rounded-lg p-2 bg-blue-900 bg-opacity-10">
                    {governmentSpeakers.map(p => (
                      <ParticipantCard key={p.id} participant={p} />
                    ))}
                    {governmentSpeakers.length < 3 && (
                      <div className="flex items-center justify-center p-6 text-gray-500">
                        <UserPlus size={20} className="mr-2" />
                        Waiting for speakers...
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-md font-medium text-red-500 mb-2">Opposition {getTeamCapacity(oppositionSpeakers)}</h3>
                  <div className="border border-red-900 rounded-lg p-2 bg-red-900 bg-opacity-10">
                    {oppositionSpeakers.map(p => (
                      <ParticipantCard key={p.id} participant={p} />
                    ))}
                    {oppositionSpeakers.length < 3 && (
                      <div className="flex items-center justify-center p-6 text-gray-500">
                        <UserPlus size={20} className="mr-2" />
                        Waiting for speakers...
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
          
          {/* Adjudicators Section */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-xl font-bold flex items-center dark:text-white light:text-gray-800">
              <Award className="mr-2" size={20} />
              Adjudicators
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-md font-medium text-purple-500 mb-2">Chair Adjudicator ({adjudicators.chair.length}/1)</h3>
                <div className="border border-purple-900 rounded-lg p-2 bg-purple-900 bg-opacity-10">
                  {adjudicators.chair.map(p => (
                    <ParticipantCard key={p.id} participant={p} />
                  ))}
                  {adjudicators.chair.length === 0 && (
                    <div className="flex items-center justify-center p-6 text-gray-500">
                      <UserPlus size={20} className="mr-2" />
                      Waiting for chair adjudicator...
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-purple-500 mb-2">Panelists ({adjudicators.panelist.length}/2)</h3>
                <div className="border border-purple-900 rounded-lg p-2 bg-purple-900 bg-opacity-10">
                  {adjudicators.panelist.map(p => (
                    <ParticipantCard key={p.id} participant={p} />
                  ))}
                  {adjudicators.panelist.length < 1 && (
                    <div className="flex items-center justify-center p-6 text-gray-500">
                      <UserPlus size={20} className="mr-2" />
                      Waiting for panelists...
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium text-purple-500 mb-2">Trainees ({adjudicators.trainee.length})</h3>
                <div className="border border-purple-900 rounded-lg p-2 bg-purple-900 bg-opacity-10 min-h-[120px]">
                  {adjudicators.trainee.map(p => (
                    <ParticipantCard key={p.id} participant={p} />
                  ))}
                  {adjudicators.trainee.length === 0 && (
                    <div className="flex items-center justify-center p-6 text-gray-500">
                      <span className="text-sm">No trainees</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Spectators Section */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h2 className="text-xl font-bold flex items-center dark:text-white light:text-gray-800">
              <Eye className="mr-2" size={20} />
              Spectators ({spectators.length})
            </h2>
            
            <div className="border border-gray-700 rounded-lg p-2 min-h-[100px]">
              {spectators.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {spectators.map(p => (
                    <ParticipantCard key={p.id} participant={p} />
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center p-6 text-gray-500">
                  <span className="text-sm">No spectators</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Admin-only: Start Round Button */}
          {isAdmin && onRoundStart && (
            <motion.div variants={itemVariants} className="pt-4 mt-4 border-t border-gray-700">
              <Button 
                onClick={onRoundStart}
                className="w-full bg-green-600 hover:bg-green-700"
                disabled={
                  // At least 1 chair adjudicator required
                  adjudicators.chair.length === 0 ||
                  // Format-specific speaker requirements
                  (roundFormat === 'ABP' ? 
                    (getBPTeams().openingGov.length < 2 || 
                     getBPTeams().openingOpp.length < 2 ||
                     getBPTeams().closingGov.length < 2 ||
                     getBPTeams().closingOpp.length < 2) : 
                    (governmentSpeakers.length < 3 || oppositionSpeakers.length < 3)
                  )
                }
              >
                Start Round
              </Button>
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default WaitingRoom;