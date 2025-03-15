import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "framer-motion";
import { apiConfig } from "../config/apiConfig";
import { fetchWithAuth } from "../utils/api";
import { 
  Button, 
  Input, 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger
} from "../components/ui/";
import { 
  Download, 
  ArrowLeft, 
  Filter, 
  Calendar,
  Search,
  Users,
  Clock
} from "lucide-react";
import { format } from "date-fns";

// Types
interface LogEntry {
  id: number;
  user: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  round: {
    id: number;
    format: string;
    motion: {
      text: string;
    };
  };
  role: string;
  action: string;
  timestamp: string;
}

const LogsPanel: React.FC = () => {
  const navigate = useNavigate();
  const { pageTransition } = useTheme();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("attendance");
  const [dateRange, setDateRange] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    fetchLogs();
  }, [activeTab]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === "attendance" ? "/api/admin/logs/attendance/" : "/api/admin/logs/system/";
      const data = await fetchWithAuth(endpoint);
      setLogs(data);
      setError("");
    } catch (err: any) {
      console.error("Error fetching logs:", err);
      setError(err.message || "Failed to load logs");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    pageTransition(() => {
      navigate("/admin/dashboard");
    });
  };

  const handleExportCsv = () => {
    // Filter logs based on current filters
    const filteredLogs = getFilteredLogs();
    
    // Convert logs to CSV format
    let csv = "Username,Full Name,Role,Round,Motion,Action,Date & Time\n";
    
    filteredLogs.forEach(log => {
      const fullName = `${log.user.first_name} ${log.user.last_name}`.trim();
      const timestamp = format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss");
      const row = [
        log.user.username,
        fullName || log.user.username,
        log.role,
        `Round ${log.round.id} (${log.round.format})`,
        `"${log.round.motion.text}"`,
        log.action,
        timestamp
      ].join(",");
      
      csv += row + "\n";
    });
    
    // Create and trigger download
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    
    link.setAttribute("href", url);
    link.setAttribute("download", `debate_logs_${format(new Date(), "yyyyMMdd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilteredLogs = () => {
    return logs.filter(log => {
      // Search term filter
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch = 
        log.user.username.toLowerCase().includes(searchTermLower) ||
        log.user.first_name.toLowerCase().includes(searchTermLower) ||
        log.user.last_name.toLowerCase().includes(searchTermLower) ||
        log.round.motion.text.toLowerCase().includes(searchTermLower);
        
      // Date range filter
      let matchesDate = true;
      if (dateRange !== "all") {
        const logDate = new Date(log.timestamp);
        const now = new Date();
        
        if (dateRange === "today") {
          matchesDate = logDate.toDateString() === now.toDateString();
        } else if (dateRange === "week") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          matchesDate = logDate >= weekAgo;
        } else if (dateRange === "month") {
          const monthAgo = new Date();
          monthAgo.setMonth(now.getMonth() - 1);
          matchesDate = logDate >= monthAgo;
        }
      }
      
      // Role filter
      const matchesRole = roleFilter === "all" || log.role === roleFilter;
      
      // Action filter
      const matchesAction = actionFilter === "all" || log.action === actionFilter;
      
      return matchesSearch && matchesDate && matchesRole && matchesAction;
    });
  };
  
  const filteredLogs = getFilteredLogs();
  
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

  return (
    <motion.div 
      className="flex justify-center items-start w-full p-4"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      <div className="w-full max-w-6xl">
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold dark:text-white light:text-gray-900 flex-1">
            Activity Logs
          </h1>
          <Button 
            onClick={handleExportCsv}
            className="bg-green-600 hover:bg-green-700 ml-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
        
        <div className="p-4 bg-gray-800 bg-opacity-40 rounded-lg shadow-lg mb-6">
          <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="attendance">Attendance Logs</TabsTrigger>
              <TabsTrigger value="system">System Events</TabsTrigger>
            </TabsList>
            
            <div className="mb-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex items-center space-x-2">
                  <Search className="h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by name or motion..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <Select 
                    value={dateRange} 
                    onValueChange={setDateRange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Date Range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">Last 7 Days</SelectItem>
                      <SelectItem value="month">Last 30 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <Select 
                    value={roleFilter} 
                    onValueChange={setRoleFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      <SelectItem value="Prime Minister">Prime Minister</SelectItem>
                      <SelectItem value="Leader of Opposition">Leader of Opposition</SelectItem>
                      <SelectItem value="Chair Adjudicator">Chair Adjudicator</SelectItem>
                      <SelectItem value="Panelist">Panelist</SelectItem>
                      <SelectItem value="Trainee">Trainee</SelectItem>
                      <SelectItem value="Spectator">Spectator</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <Select 
                    value={actionFilter} 
                    onValueChange={setActionFilter}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Filter by Action" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Actions</SelectItem>
                      <SelectItem value="joined">Joined Round</SelectItem>
                      <SelectItem value="allocated">Allocated</SelectItem>
                      <SelectItem value="completed">Completed Round</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <TabsContent value="attendance" className="mt-4">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-500 bg-opacity-20 border border-red-600 rounded-md text-red-100">
                  {error}
                </div>
              ) : (
                <>
                  <div className="text-sm text-gray-400 mb-2">
                    Showing {filteredLogs.length} of {logs.length} records
                  </div>
                  <div className="bg-gray-900 dark:bg-gray-800 rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-700">
                      <thead className="bg-gray-900">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            User
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Role
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Round
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Action
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                            Time
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {filteredLogs.map(log => (
                          <tr key={log.id} className="hover:bg-gray-800">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div>
                                  <div className="text-sm font-medium text-white">
                                    {log.user.username}
                                  </div>
                                  <div className="text-sm text-gray-400">
                                    {log.user.first_name} {log.user.last_name}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${log.role.includes('Adjudicator') ? 'bg-purple-700 bg-opacity-20 text-purple-300' : 
                                  log.role.includes('Minister') || log.role.includes('Government') ? 'bg-blue-700 bg-opacity-20 text-blue-300' : 
                                  log.role.includes('Opposition') ? 'bg-red-700 bg-opacity-20 text-red-300' : 
                                  'bg-gray-700 bg-opacity-20 text-gray-300'}`}>
                                {log.role}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              <div>Round #{log.round.id}</div>
                              <div className="text-xs text-gray-400 mt-1 truncate max-w-[200px]" title={log.round.motion.text}>
                                {log.round.motion.text}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${log.action === 'joined' ? 'bg-green-700 bg-opacity-20 text-green-300' : 
                                  log.action === 'allocated' ? 'bg-yellow-700 bg-opacity-20 text-yellow-300' : 
                                  log.action === 'completed' ? 'bg-blue-700 bg-opacity-20 text-blue-300' : 
                                  'bg-gray-700 bg-opacity-20 text-gray-300'}`}>
                                {log.action === 'joined' ? 'Joined Round' : 
                                  log.action === 'allocated' ? 'Allocated' : 
                                  log.action === 'completed' ? 'Completed Round' : log.action}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {format(new Date(log.timestamp), "MMM d, yyyy h:mm a")}
                            </td>
                          </tr>
                        ))}
                        
                        {filteredLogs.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                              No logs match your search criteria
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </TabsContent>
            
            <TabsContent value="system">
              <div className="text-center py-20 text-gray-500">
                System events logging functionality available in the next update
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </motion.div>
  );
};

export default LogsPanel;