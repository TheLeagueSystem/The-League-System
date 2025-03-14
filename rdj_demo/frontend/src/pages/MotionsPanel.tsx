import React, { useState, useEffect } from "react";
import { Button } from "src/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "src/components/ui/card";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { Textarea } from "src/components/ui/textarea";
import { X, Trash2, Check, Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
// Rename the motion import to avoid conflict with Motion type
import { motion as framerMotion } from "framer-motion";
import { fetchWithAuth, getApiBaseUrl } from '../utils/api';
// Import the function but not the types
import { parseMotionsFromResponse } from '../utils/helpers';

// Use the local interface definitions
interface Theme {
  id: number;
  name: string;
  description?: string;
}

interface Motion {
  id: number;
  theme: Theme | string;
  theme_name?: string;
  text: string;
  created_at: string;
  competition_type: string;
}

// New motion form initial state
const initialNewMotion = {
  theme_name: "",
  text: "",
  competition_type: "General"
};

const MotionsPanel: React.FC = () => {
  const navigate = useNavigate();
  const [motions, setMotions] = useState<Motion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewMotionForm, setShowNewMotionForm] = useState(false);
  const [newMotion, setNewMotion] = useState(initialNewMotion);
  
  // Log when component mounts
  useEffect(() => {
    console.log("MotionsPanel mounted");
    
    // Check auth status
    const token = localStorage.getItem("token");
    const isAdmin = localStorage.getItem("is_admin") === "true";
    console.log("Auth status in MotionsPanel:", { 
      hasToken: !!token, 
      token: token ? token.substring(0, 10) + "..." : "none",
      isAdmin 
    });
    
    fetchMotions();
  }, []);

  console.log("Current API base URL:", getApiBaseUrl());

  const fetchMotions = async () => {
    try {
      setLoading(true);
      console.log("Fetching motions from endpoint:", '/motions/');
      
      const data = await fetchWithAuth('/motions/');
      console.log("Motions response data:", data);
      
      // Make sure you're handling the response structure correctly
      setMotions(parseMotionsFromResponse(data));
      setError("");
    } catch (err: any) {
      console.error("Error details:", err);
      setError(err.message || "An error occurred while fetching motions");
    } finally {
      setLoading(false);
    }
  };

  const handleAddMotion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      await fetchWithAuth('/admin/motions/', {
        method: "POST",
        body: JSON.stringify(newMotion)
      });
      
      // Success - refresh the list and clear the form
      await fetchMotions();
      setNewMotion(initialNewMotion);
      setShowNewMotionForm(false);
      setError("");
      
    } catch (err: any) {
      setError(err.message || "An error occurred while adding the motion");
      console.error("Error adding motion:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMotion = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this motion?")) {
      return;
    }
    
    try {
      setLoading(true);
      
      await fetchWithAuth(`/admin/motions/${id}/`, {
        method: "DELETE"
      });
      
      // Remove from state
      setMotions(motions.filter(motion => motion.id !== id));
      setError("");
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting the motion");
      console.error("Error deleting motion:", err);
    } finally {
      setLoading(false);
    }
  };

  // Animation variants for the container
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

  // Animation variants for each element
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };

  // Navigate back to dashboard
  const handleBack = () => {
    navigate("/admin/dashboard");
  };

  return (
    <framerMotion.div 
      className="p-4"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      <Card className="shadow-lg rounded-lg mb-6 transition-colors duration-200 bg-gray-800 dark:bg-gray-800 light:bg-white">
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
            <CardTitle className="text-xl font-bold dark:text-white light:text-gray-800">
              Motion Management
            </CardTitle>
          </div>
          <Button 
            onClick={() => setShowNewMotionForm(!showNewMotionForm)} 
            className={showNewMotionForm ? "bg-red-600 hover:bg-red-700" : ""}
          >
            {showNewMotionForm ? <X size={16} className="mr-2" /> : <Plus size={16} className="mr-2" />}
            {showNewMotionForm ? "Cancel" : "Add Motion"}
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <framerMotion.div 
              variants={itemVariants}
              className="mb-4 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500"
            >
              {error}
            </framerMotion.div>
          )}
          
          {showNewMotionForm && (
            <framerMotion.form 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onSubmit={handleAddMotion} 
              className="space-y-4 mb-6"
            >
              <div>
                <Label htmlFor="theme_name" className="dark:text-white light:text-gray-800">Theme</Label>
                <Input 
                  type="text"
                  id="theme_name"
                  value={newMotion.theme_name}
                  onChange={(e) => setNewMotion({...newMotion, theme_name: e.target.value})}
                  placeholder="Enter theme (e.g., Politics, Economics, Social Issues)"
                  className="w-full dark:text-white light:text-gray-800"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">A category or subject area for the motion.</p>
              </div>

              <div>
                <Label htmlFor="text" className="dark:text-white light:text-gray-800">Motion Text</Label>
                <Textarea 
                  id="text"
                  value={newMotion.text}
                  onChange={(e) => setNewMotion({...newMotion, text: e.target.value})}
                  placeholder="Enter the motion text..."
                  className="w-full dark:text-white light:text-gray-800"
                  required
                />
              </div>

              <div>
                <Label htmlFor="competition_type" className="dark:text-white light:text-gray-800">Competition Type</Label>
                <select
                  id="competition_type"
                  value={newMotion.competition_type}
                  onChange={(e) => setNewMotion({...newMotion, competition_type: e.target.value})}
                  className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white light:text-gray-800"
                  required
                >
                  <option value="General">General</option>
                  <option value="WUDC">WUDC</option>
                  <option value="PDA">PDA</option>
                  <option value="AIDA">AIDA</option>
                  <option value="ABP">ABP</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">The competition source of this motion, if applicable.</p>
              </div>

              <div className="flex justify-end">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check size={16} className="mr-2" />
                  Save Motion
                </Button>
              </div>
            </framerMotion.form>
          )}

          <framerMotion.div 
            variants={itemVariants}
            className="overflow-x-auto"
          >
            <table className="min-w-full divide-y divide-gray-600 dark:divide-gray-600 light:divide-gray-200">
              <thead className="dark:bg-gray-700 light:bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Theme</th>
                  <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Motion</th>
                  <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Competition</th>
                  <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-500 dark:divide-gray-600 light:divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center dark:text-white light:text-gray-800">
                      Loading motions...
                    </td>
                  </tr>
                ) : motions.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center dark:text-white light:text-gray-800">
                      No motions have been added yet.
                    </td>
                  </tr>
                ) : (
                  motions.map((motion) => (
                    <tr key={motion.id} className="hover:bg-gray-700 hover:bg-opacity-20 dark:hover:bg-gray-700 light:hover:bg-gray-100">
                      <td className="px-6 py-4 whitespace-nowrap dark:text-white light:text-gray-800">
                        {typeof motion.theme === 'string' ? motion.theme : motion.theme.name}
                      </td>
                      <td className="px-6 py-4 dark:text-white light:text-gray-800">
                        {motion.text}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${motion.competition_type === 'General' 
                            ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' 
                            : 'bg-blue-200 text-blue-800 dark:bg-blue-700 dark:text-blue-200'}`
                        }>
                          {motion.competition_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          onClick={() => handleDeleteMotion(motion.id)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 ml-2"
                          title="Delete Motion"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </framerMotion.div>
        </CardContent>
      </Card>
    </framerMotion.div>
  );
};

export default MotionsPanel;