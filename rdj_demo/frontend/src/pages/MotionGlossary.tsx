// Create a new file called MotionGlossary.tsx

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
import { FileText, Search, Filter, X } from "lucide-react";
import { apiConfig } from '../config/apiConfig';
import { fetchWithAuth } from '../utils/api';

// Define motion type
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

const MotionGlossary: React.FC = () => {
  const [motions, setMotions] = useState<Motion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [themeFilter, setThemeFilter] = useState<string>("");
  const [competitionFilter, setCompetitionFilter] = useState<string>("");
  const [availableThemes, setAvailableThemes] = useState<Theme[]>([]);
  const [availableCompetitions, setAvailableCompetitions] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Fetch motions on component mount
  useEffect(() => {
    fetchMotions();
  }, []);

  const fetchMotions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const data = await fetchWithAuth('/api/motions/glossary/');
      console.log("Motion glossary response:", data);
      setMotions(data.motions || []);
      setAvailableThemes(data.themes || []);
      setAvailableCompetitions(data.competition_types || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching motions");
      console.error("Error fetching motions:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter motions based on search term and filters
  const filteredMotions = motions.filter(motion => {
    const matchesSearch = 
      motion.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      motion.theme.name.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesTheme = themeFilter ? motion.theme.id === parseInt(themeFilter) : true;
    const matchesCompetition = competitionFilter ? motion.competition_type === competitionFilter : true;
    
    return matchesSearch && matchesTheme && matchesCompetition;
  });
  
  // Function to clear all filters
  const clearFilters = () => {
    setThemeFilter("");
    setCompetitionFilter("");
    setSearchTerm("");
    setShowFilters(false);
  };

  return (
    <div className="flex justify-center items-center w-full p-4">
      <Card className="w-full max-w-5xl transition-colors duration-200 bg-gray-800 dark:bg-gray-800 light:bg-white shadow-lg rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between p-6">
          <CardTitle className="text-2xl font-bold dark:text-white light:text-gray-800">
            Motion Glossary
          </CardTitle>
          <div className="flex space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={16} />
              <Input 
                placeholder="Search motions..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10 dark:text-white light:text-gray-800"
              />
            </div>
            <Button 
              variant="outline" 
              className={`${showFilters ? 'bg-blue-100 dark:bg-blue-900' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={16} className="mr-2" />
              Filters
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500">
              {error}
            </div>
          )}
          
          {/* Filters Panel */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium dark:text-white light:text-gray-800">Filter Motions</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                >
                  <X size={16} className="mr-1" /> Clear All
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="theme-filter" className="dark:text-white light:text-gray-800">Theme</Label>
                  <select
                    id="theme-filter"
                    value={themeFilter}
                    onChange={(e) => setThemeFilter(e.target.value)}
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white light:text-gray-800"
                  >
                    <option value="">All Themes</option>
                    {availableThemes.map((theme) => (
                      <option key={theme.id} value={theme.id.toString()}>{theme.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="competition-filter" className="dark:text-white light:text-gray-800">Competition</Label>
                  <select
                    id="competition-filter"
                    value={competitionFilter}
                    onChange={(e) => setCompetitionFilter(e.target.value)}
                    className="w-full rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm dark:text-white light:text-gray-800"
                  >
                    <option value="">All Competitions</option>
                    {availableCompetitions.map((comp) => (
                      <option key={comp} value={comp}>{comp}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 dark:text-white light:text-gray-800">Loading motions...</p>
            </div>
          ) : filteredMotions.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredMotions.map((motion) => (
                <Card key={motion.id} className="overflow-hidden border dark:border-gray-700 light:border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-2">
                      <div className="flex items-center mb-2 md:mb-0">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded mr-2">
                          {motion.theme.name}
                        </span>
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded
                          ${motion.competition_type === 'General' 
                            ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' 
                            : 'bg-purple-200 text-purple-800 dark:bg-purple-700 dark:text-purple-200'}`
                        }>
                          {motion.competition_type}
                        </span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(motion.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="dark:text-white light:text-gray-800 text-lg font-medium mt-1">{motion.text}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <p className="dark:text-white light:text-gray-800">
                {searchTerm || themeFilter || competitionFilter 
                  ? "No motions found matching your search criteria." 
                  : "No motions have been added yet."}
              </p>
              {(searchTerm || themeFilter || competitionFilter) && (
                <Button 
                  className="mt-4" 
                  onClick={clearFilters}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MotionGlossary;