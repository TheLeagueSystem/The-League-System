import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "src/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "src/components/ui/card";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { Textarea } from "src/components/ui/textarea";
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Check, 
  X 
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { fetchWithAuth } from '../utils/api';
import { parseMotionsFromResponse } from '../utils/helpers';

// Define types
interface Theme {
  id: number;
  name: string;
  description?: string;
}

interface Motion {
  id: number;
  theme: Theme;
  text: string;
  created_at: string;
  competition_type: string;
}

interface RoundFormData {
  format: 'ABP' | 'PDA';
  motion_id?: number;
  max_adjudicators: number;
  new_motion_text?: string;
  new_motion_theme?: string;
}

const NewRoundSetup: React.FC = () => {
  const navigate = useNavigate();
  const { pageTransition } = useTheme();
  
  // State variables
  const [formData, setFormData] = useState<RoundFormData>({
    format: 'ABP',
    max_adjudicators: 3,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [motions, setMotions] = useState<Motion[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingNewMotion, setIsAddingNewMotion] = useState(false);
  
  // Fetch motions and themes on component mount
  useEffect(() => {
    fetchMotionsAndThemes();
  }, []);
  
  const fetchMotionsAndThemes = async () => {
    try {
      setLoading(true);
      console.log("Fetching motions and themes...");
      
      const response = await fetchWithAuth('/api/motions/');
      console.log("Raw motions response:", response);
      
      // Parse and convert to your local Motion type
      const parsedData = parseMotionsFromResponse(response);
      const localMotions: Motion[] = parsedData.map(m => ({
        id: m.id,
        theme: typeof m.theme === 'string' 
          ? { id: 0, name: m.theme } // Convert string themes to Theme objects
          : m.theme,
        text: m.text,
        created_at: m.created_at,
        competition_type: m.competition_type
      }));
      
      console.log("Parsed motions:", localMotions);
      setMotions(localMotions);
      
      // Extract themes directly
      const themes: Theme[] = localMotions.map(m => m.theme)
        .filter((theme, index, self) => 
          index === self.findIndex(t => t.name === theme.name)
        );
      
      setThemes(themes);
      
      setError("");
    } catch (err: any) {
      console.error("Error fetching motions:", err);
      setError("Failed to fetch motions");
    } finally {
      setLoading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      
      // Validate form data
      if (!formData.motion_id && (!formData.new_motion_text || !formData.new_motion_theme)) {
        setError("Please select a motion or create a new one");
        setLoading(false);
        return;
      }
      
      // Create the round using fetchWithAuth helper
      const data = await fetchWithAuth("/admin/rounds/", {
        method: "POST",
        body: JSON.stringify(formData)
      });
      
      // Navigate to the allocation screen
      pageTransition(() => {
        navigate(`/round/${data.round_id}/setup`);
      });
    } catch (err: any) {
      setError(err.message || "An error occurred while creating the round");
      console.error("Error creating round:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBack = () => {
    pageTransition(() => {
      navigate("/admin/dashboard");
    });
  };
  
  // Filter motions based on search term
  const filteredMotions = motions.filter(motion => 
    motion.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
    motion.theme.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
  
  useEffect(() => {
    // Log themes when they change
    console.debug(`${themes.length} themes loaded`);
  }, [themes]);

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
            <div>
              <CardTitle className="text-2xl font-bold dark:text-white light:text-gray-800">New Debate Round</CardTitle>
              <CardDescription className="text-gray-400 dark:text-gray-400 light:text-gray-600">
                Set up a new debate round and motion
              </CardDescription>
            </div>
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
          
          <motion.form 
            variants={itemVariants}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div className="space-y-4">
              <h3 className="text-lg font-semibold dark:text-white light:text-gray-800">Debate Format</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                    formData.format === 'ABP' 
                      ? 'border-blue-500 bg-blue-900 bg-opacity-10' 
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  onClick={() => setFormData({...formData, format: 'ABP'})}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium dark:text-white light:text-gray-800">British Parliamentary</h4>
                    {formData.format === 'ABP' && <Check className="text-blue-500" size={20} />}
                  </div>
                  <p className="text-sm mt-2 dark:text-gray-300 light:text-gray-600">
                    8 speakers, 4 teams across opening and closing government and opposition.
                  </p>
                </div>
                
                <div 
                  className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                    formData.format === 'PDA' 
                      ? 'border-blue-500 bg-blue-900 bg-opacity-10' 
                      : 'border-gray-600 hover:border-gray-400'
                  }`}
                  onClick={() => setFormData({...formData, format: 'PDA'})}
                >
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium dark:text-white light:text-gray-800">Asian Parliamentary</h4>
                    {formData.format === 'PDA' && <Check className="text-blue-500" size={20} />}
                  </div>
                  <p className="text-sm mt-2 dark:text-gray-300 light:text-gray-600">
                    6 speakers, 3 speakers on each side (government and opposition).
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold dark:text-white light:text-gray-800">Debate Motion</h3>
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => setIsAddingNewMotion(!isAddingNewMotion)} 
                  className="text-sm flex items-center"
                >
                  {isAddingNewMotion ? (
                    <>
                      <X size={16} className="mr-1" />
                      Cancel new motion
                    </>
                  ) : (
                    <>
                      <Plus size={16} className="mr-1" />
                      Create new motion
                    </>
                  )}
                </Button>
              </div>
              
              {isAddingNewMotion ? (
                <div className="space-y-4 p-4 border rounded-lg dark:border-gray-700 light:border-gray-300">
                  <div>
                    <Label htmlFor="new_motion_theme" className="dark:text-white light:text-gray-800">Theme</Label>
                    <Input 
                      id="new_motion_theme"
                      value={formData.new_motion_theme || ''}
                      onChange={(e) => setFormData({...formData, new_motion_theme: e.target.value})}
                      placeholder="Enter theme (e.g., Politics, Economics, Social Issues)"
                      className="dark:text-white light:text-gray-800"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="new_motion_text" className="dark:text-white light:text-gray-800">Motion Text</Label>
                    <Textarea 
                      id="new_motion_text"
                      value={formData.new_motion_text || ''}
                      onChange={(e) => setFormData({...formData, new_motion_text: e.target.value})}
                      placeholder="Enter the motion text..."
                      className="dark:text-white light:text-gray-800"
                      rows={3}
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-500" size={16} />
                    <Input 
                      placeholder="Search existing motions..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 dark:text-white light:text-gray-800"
                    />
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto border rounded-lg dark:border-gray-700 light:border-gray-300">
                    {loading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-2 text-sm dark:text-gray-300 light:text-gray-600">Loading motions...</p>
                      </div>
                    ) : filteredMotions.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-gray-500">No motions found. Try a different search term or create a new motion.</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-700 dark:divide-gray-700 light:divide-gray-200">
                        {filteredMotions.map((motion) => (
                          <div 
                            key={motion.id}
                            onClick={() => setFormData({...formData, motion_id: motion.id})}
                            className={`p-3 cursor-pointer transition-colors ${
                              formData.motion_id === motion.id 
                                ? 'bg-blue-900 bg-opacity-20' 
                                : 'hover:bg-gray-700 hover:bg-opacity-20'
                            }`}
                          >
                            <div className="flex justify-between">
                              <span className="font-medium dark:text-white light:text-gray-800">{motion.text}</span>
                              {formData.motion_id === motion.id && (
                                <Check className="text-blue-500" size={20} />
                              )}
                            </div>
                            <div className="mt-1 flex items-center text-sm">
                              <span className="text-blue-500">{motion.theme.name}</span>
                              <span className="mx-2 text-gray-500">•</span>
                              <span className="text-gray-500">{motion.competition_type}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold dark:text-white light:text-gray-800">Adjudication</h3>
              
              <div>
                <Label htmlFor="max_adjudicators" className="dark:text-white light:text-gray-800">
                  Maximum number of adjudicators
                </Label>
                <Input 
                  id="max_adjudicators"
                  type="number"
                  min={1}
                  max={10}
                  value={formData.max_adjudicators}
                  onChange={(e) => setFormData({...formData, max_adjudicators: parseInt(e.target.value)})}
                  className="w-32 dark:text-white light:text-gray-800"
                />
                <p className="text-sm mt-1 text-gray-500">
                  Typically 3-5 adjudicators depending on debate format and availability.
                </p>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-700 dark:border-gray-700 light:border-gray-300 flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="ghost" 
                onClick={handleBack}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Creating...' : 'Start Allocation'}
              </Button>
            </div>
          </motion.form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default NewRoundSetup;