import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card";
import { Avatar } from "src/components/ui/avatar";
import { Menu, X, Bell, Book, PlayCircle, FileText, Users, BookOpen, Home, LogOut, BarChart3, LayoutGrid } from "lucide-react";
import MotionGlossary from "./MotionGlossary";
import { ThemeToggle } from "src/components/ThemeToggle";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "framer-motion";
import { Input } from "src/components/ui/input";
import { Alert, AlertDescription } from "src/components/ui/alert";
import { fetchWithAuth } from '../utils/api';

// Add these imports at the top of your file
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

// Add this import at the top
import { useNotifications } from '../contexts/NotificationContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Add this import at the top
import ApiDebugger from '../components/ApiDebugger';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("main");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const { pageTransition } = useTheme();
  const notificationRef = useRef<HTMLDivElement>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [username, setUsername] = useState("");

  // Get user info from localStorage on component mount
  useEffect(() => {
    const isAdmin = localStorage.getItem("is_admin") === "true";
    const storedUsername = localStorage.getItem("username");
    
    setUserIsAdmin(isAdmin);
    setUsername(storedUsername || "User");
    
    console.log(`Dashboard loaded for ${isAdmin ? "admin" : "regular"} user: ${storedUsername}`);
  }, []);

  // Close notification dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("is_admin");
    localStorage.removeItem("username");
    navigate("/login");
  };

  // Update the getActiveComponent function
  const getActiveComponent = () => {
    switch(activeTab) {
      case "main":
        return <MainDashboard userIsAdmin={userIsAdmin} />;
      case "motions":
        return <MotionGlossary />;
      case "practice":
        return <PracticeMaterials />;
      case "history":
        return <DebateHistory />;
      default:
        return <MainDashboard userIsAdmin={userIsAdmin} />;
    }
  };

  // Inside your Dashboard component, add:
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <div className="flex min-h-screen transition-colors duration-200 bg-gray-900 dark:bg-gray-900 light:bg-gray-100 text-white dark:text-white light:text-gray-900">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 transition-all duration-300 bg-gray-800 dark:bg-gray-800 light:bg-white p-4 transform ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ease-in-out z-40`}
      >
        <button 
          className="mb-4 text-white dark:text-white light:text-gray-800 icon-button" 
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>
        <nav className="space-y-4">
          <Button 
            variant="ghost"
            className={`sidebar-btn w-full text-left justify-start dark:text-[#F5F5F5] light:text-gray-800 hover:bg-opacity-10 hover:translate-x-1 transition-all duration-200 ${
              activeTab === "main" ? "bg-gray-700 bg-opacity-50" : ""
            }`}
            onClick={() => setActiveTab("main")}
          >
            <Home size={18} className="mr-2" />
            {userIsAdmin ? "Admin Dashboard" : "Dashboard"}
          </Button>
          
          <Button 
            variant="ghost"
            className={`sidebar-btn w-full text-left justify-start dark:text-[#F5F5F5] light:text-gray-800 hover:bg-opacity-10 hover:translate-x-1 transition-all duration-200 ${
              activeTab === "motions" ? "bg-gray-700 bg-opacity-50" : ""
            }`}
            onClick={() => setActiveTab("motions")}
          >
            <Book size={18} className="mr-2" />
            Motion Glossary
          </Button>
          
          <Button 
            variant="ghost"
            className={`sidebar-btn w-full text-left justify-start dark:text-[#F5F5F5] light:text-gray-800 hover:bg-opacity-10 hover:translate-x-1 transition-all duration-200 ${
              activeTab === "practice" ? "bg-gray-700 bg-opacity-50" : ""
            }`}
            onClick={() => setActiveTab("practice")}
          >
            <BookOpen size={18} className="mr-2" />
            Practice Materials
          </Button>

          <Button 
            variant="ghost"
            className={`sidebar-btn w-full text-left justify-start dark:text-[#F5F5F5] light:text-gray-800 hover:bg-opacity-10 hover:translate-x-1 transition-all duration-200 ${
              activeTab === "history" ? "bg-gray-700 bg-opacity-50" : ""
            }`}
            onClick={() => setActiveTab("history")}
          >
            <BarChart3 size={18} className="mr-2" />
            Debate History
          </Button>
          
          {/* Logout button at bottom of sidebar */}
          <div className="absolute bottom-4 w-[calc(100%-2rem)]">
            <Button 
              variant="ghost"
              className="sidebar-btn w-full text-left justify-start text-red-400 hover:bg-opacity-10 hover:translate-x-1 transition-all duration-200"
              onClick={handleLogout}
            >
              <LogOut size={18} className="mr-2" />
              Logout
            </Button>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        {/* Navbar with Notification Icon */}
        <div className="flex items-center justify-between p-4 bg-gray-800 dark:bg-gray-800 light:bg-white shadow-lg">
          <button 
            className="icon-button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-white dark:text-white light:text-gray-800" />
          </button>
          
          <div className="flex items-center space-x-4">
            {/* Welcome message */}
            <p className="mr-4 dark:text-white light:text-gray-800 hidden md:block">
              Welcome, {username}
            </p>
            
            {/* Notification Icon and Dropdown */}
            <div className="relative" ref={notificationRef}>
              <button 
                className="icon-button relative"
                onClick={() => setNotificationOpen(!notificationOpen)}
                aria-label="Notifications"
              >
                <Bell className="w-6 h-6 text-white dark:text-white light:text-gray-800" />
                {unreadCount > 0 && (
                  <span className="notification-badge">
                    {unreadCount}
                  </span>
                )}
              </button>
              
              {/* Notification Dropdown */}
              {notificationOpen && (
                <div className="absolute right-0 mt-2 w-80 notification-dropdown bg-white dark:bg-gray-800 z-50">
                  <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                    <h3 className="text-lg font-medium dark:text-white light:text-gray-800">Recent Notifications</h3>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setNotificationOpen(false);
                        pageTransition(() => {
                          navigate("/account-settings", { state: { activeTab: "notifications" } });
                        });
                      }}
                      className="text-sm dark:text-blue-400 light:text-blue-800"
                    >
                      View All
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto notification-scroll">
                    {notifications.slice(0, 5).map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-3 border-b dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition cursor-pointer ${
                          !notification.read ? 'bg-blue-50 dark:bg-blue-900 dark:bg-opacity-10' : ''
                        }`}
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                          setNotificationOpen(false);
                          if (notification.link && typeof notification.link === 'string') {
                            const link = notification.link; // Create a new variable that TypeScript knows is definitely a string
                            pageTransition(() => {
                              navigate(link);
                            });
                          }
                        }}
                      >
                        <p className="text-sm dark:text-white light:text-gray-800">{notification.message}</p>
                        <span className="text-xs dark:text-gray-400 light:text-gray-600">{notification.time}</span>
                      </div>
                    ))}
                    
                    {notifications.length === 0 && (
                      <div className="p-4 text-center">
                        <p className="text-sm dark:text-white light:text-gray-800">No new notifications</p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-2 border-t dark:border-gray-700">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-sm"
                        onClick={markAllAsRead}
                      >
                        Mark all as read
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <ThemeToggle />
            <Avatar 
              className="w-10 h-10 cursor-pointer dark:bg-gray-700 light:bg-gray-200 hover:scale-110 transition-transform duration-200 avatar-pulse" 
              onClick={() => {
                pageTransition(() => {
                  navigate("/account-settings");
                });
              }} 
            />
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex justify-center items-center flex-1 p-4 transition-colors duration-200">
          {getActiveComponent()}
        </div>
      </div>
    </div>
  );
};

// Replace the MainDashboard component with this version
const MainDashboard: React.FC<{ userIsAdmin: boolean }> = ({ userIsAdmin }) => {
  const navigate = useNavigate();
  const { pageTransition, theme } = useTheme(); // Get the current theme

  // Keep all your existing navigation handlers
  const handleNavigateToUserManagement = () => {
    pageTransition(() => navigate("/user-management"));
  };

  const handleNavigateToMotions = () => {
    pageTransition(() => navigate("/admin/motions"));
  };

  const handleNavigateToNewRound = () => {
    pageTransition(() => navigate('/admin/rounds/new'));
  };

  const handleNavigateToRoundManagement = () => {
    pageTransition(() => navigate('/admin/rounds'));
  };
  
  const handleNavigateToNotifications = () => {
    pageTransition(() => navigate('/admin/notifications'));
  };

  // Common button class with theme-responsive styling
  const buttonClass = "h-auto py-3 text-white dark:text-white light:text-white font-medium transition-colors";

  return (
    <motion.div 
      className="p-4 w-full max-w-5xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className="text-2xl mb-4 font-bold dark:text-[#F5F5F5] light:text-gray-900">
        {userIsAdmin ? "Admin Dashboard" : "Dashboard"}
      </h1>
      
      <div className="grid grid-cols-1 gap-4">
        {/* Combined Card with All Actions */}
        <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
          <CardHeader className="pb-1">
            <CardTitle className="text-lg dark:text-white light:text-gray-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Join Round Form (for all users) */}
            <div className="mb-4">
              <p className="text-sm font-medium dark:text-gray-200 light:text-gray-700 mb-2">
                Join an active debate round:
              </p>
              <JoinRoundForm />
            </div>
            
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-3"></div>
            
            {/* Common actions grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
              <Button 
                onClick={() => navigate('/performance')}
                className={`${buttonClass} dark:bg-indigo-700 light:bg-indigo-500 dark:hover:bg-indigo-800 light:hover:bg-indigo-600`}
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                Performance Stats
              </Button>
            </div>
            
            {/* Admin-only actions */}
            {userIsAdmin && (
              <>
                <div className="h-px bg-gray-200 dark:bg-gray-700 my-3"></div>
                <p className="text-sm font-medium dark:text-gray-200 light:text-gray-700 mb-2">
                  Admin Controls:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Button 
                    onClick={handleNavigateToNewRound}
                    className={`${buttonClass} dark:bg-green-700 light:bg-green-500 dark:hover:bg-green-800 light:hover:bg-green-600`}
                  >
                    <PlayCircle className="mr-2 h-5 w-5" />
                    Create New Round
                  </Button>
                  
                  <Button 
                    onClick={handleNavigateToRoundManagement}
                    className={`${buttonClass} dark:bg-amber-700 light:bg-amber-500 dark:hover:bg-amber-800 light:hover:bg-amber-600`}
                  >
                    <LayoutGrid className="mr-2 h-5 w-5" />
                    Manage Rounds
                  </Button>
                  
                  <Button 
                    onClick={handleNavigateToUserManagement}
                    className={`${buttonClass} dark:bg-sky-700 light:bg-sky-500 dark:hover:bg-sky-800 light:hover:bg-sky-600`}
                  >
                    <Users className="mr-2 h-5 w-5" />
                    User Management
                  </Button>
                  
                  <Button 
                    onClick={handleNavigateToMotions}
                    className={`${buttonClass} dark:bg-emerald-700 light:bg-emerald-500 dark:hover:bg-emerald-800 light:hover:bg-emerald-600`}
                  >
                    <BookOpen className="mr-2 h-5 w-5" />
                    Motion Management
                  </Button>
                  
                  <Button 
                    onClick={handleNavigateToNotifications}
                    className={`${buttonClass} dark:bg-rose-700 light:bg-rose-500 dark:hover:bg-rose-800 light:hover:bg-rose-600`}
                  >
                    <Bell className="mr-2 h-5 w-5" />
                    Notification Management
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

// Add this component after your MainDashboard component
const JoinRoundForm: React.FC = () => {
  const [roundCode, setRoundCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();
  const { pageTransition } = useTheme();

  // Update the handleJoinRound function in your JoinRoundForm component
  const handleJoinRound = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roundCode.trim()) {
      setError("Please enter a round code");
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetchWithAuth('/rounds/join/', {
        method: 'POST',
        body: JSON.stringify({ round_code: roundCode })
      });

      // Success! Set success message and redirect
      setSuccess("Successfully joined the round!");
      setError("");
      
      // Redirect to the waiting room for the round
      setTimeout(() => {
        pageTransition(() => {
          navigate(`/round/${response.round_id}/setup`);
        });
      }, 1000);
      
    } catch (err: any) {
      setError(err.message || "Failed to join round");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleJoinRound} className="space-y-4">
      <div>
        <p className="text-sm dark:text-gray-300 light:text-gray-600 mb-4">
          Join an active debate round by entering the round code.
        </p>
        
        {error && (
          <Alert variant="destructive" className="mb-4 py-2">
            <AlertDescription className="text-sm">{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-4 py-2 bg-green-500 bg-opacity-10 border border-green-500">
            <AlertDescription className="text-sm text-green-500">{success}</AlertDescription>
          </Alert>
        )}
        
        <div className="flex space-x-2">
          <Input
            value={roundCode}
            onChange={(e) => setRoundCode(e.target.value.toUpperCase())}
            placeholder="Enter round code"
            className="dark:text-white light:text-gray-800 flex-1"
            maxLength={6}
            pattern="[A-Z0-9]{6}"
            title="6-character alphanumeric code"
          />
          
          <Button 
            type="submit"
            className="bg-blue-600 hover:bg-blue-700"
            disabled={loading || !roundCode.trim()}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⟳</span>
                Joining...
              </>
            ) : (
              "Join"
            )}
          </Button>
        </div>
        
        <p className="text-xs text-gray-500 mt-2">
          Round codes are 6-character codes provided by debate administrators.
        </p>
      </div>
    </form>
  );
};

// Practice Materials component
const PracticeMaterials: React.FC = () => {
  return (
    <div className="p-4 w-full max-w-4xl">
      <h1 className="text-3xl mb-6 font-bold dark:text-[#F5F5F5] light:text-gray-900">Practice Materials</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
          <CardHeader>
            <CardTitle className="dark:text-white light:text-gray-800">Speech Structure Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm dark:text-gray-300 light:text-gray-600 mb-4">
              Learn how to structure compelling arguments and deliver persuasive speeches.
            </p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              View Exercises
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
          <CardHeader>
            <CardTitle className="dark:text-white light:text-gray-800">Rebuttal Techniques</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm dark:text-gray-300 light:text-gray-600 mb-4">
              Practice techniques for addressing and countering opposing arguments effectively.
            </p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              View Techniques
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
          <CardHeader>
            <CardTitle className="dark:text-white light:text-gray-800">Motion Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm dark:text-gray-300 light:text-gray-600 mb-4">
              Learn to break down complex motions and identify key arguments for both sides.
            </p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              View Analysis Guides
            </Button>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
          <CardHeader>
            <CardTitle className="dark:text-white light:text-gray-800">Video Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm dark:text-gray-300 light:text-gray-600 mb-4">
              Watch recordings of exemplary debate speeches and detailed tutorials.
            </p>
            <Button className="w-full bg-purple-600 hover:bg-purple-700">
              View Videos
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Add this component after PracticeMaterials component
const DebateHistory: React.FC = () => {
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("debater");

  // Fetch performance data when component mounts
  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        setLoading(true);
        const data = await fetchWithAuth('/users/me/performance/');
        setPerformanceData(data);
        setError("");
      } catch (err: any) {
        setError(err.message || "Failed to load performance data");
        console.error("Error fetching performance data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

  // Sample data for development and testing
  // Replace this with actual data from the API
  const sampleDebaterData = {
    scoresByRound: {
      labels: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'Round 6'],
      datasets: [
        {
          label: 'Speaker Scores',
          data: [78, 81, 79, 84, 82, 86],
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.3,
        }
      ]
    },
    roleDistribution: {
      labels: ['Prime Minister', 'Deputy PM', 'Leader of Opp', 'Deputy Leader', 'Govt Whip', 'Opp Whip', 'Member of Govt', 'Member of Opp'],
      datasets: [
        {
          label: 'Roles Played',
          data: [3, 5, 2, 4, 1, 2, 3, 2],
          backgroundColor: [
            'rgba(54, 162, 235, 0.7)',
            'rgba(75, 192, 192, 0.7)',
            'rgba(255, 99, 132, 0.7)',
            'rgba(255, 159, 64, 0.7)',
            'rgba(153, 102, 255, 0.7)',
            'rgba(255, 205, 86, 0.7)',
            'rgba(201, 203, 207, 0.7)',
            'rgba(255, 159, 164, 0.7)'
          ],
        }
      ]
    },
    winLossRatio: {
      labels: ['Wins', 'Losses'],
      datasets: [
        {
          data: [14, 8],
          backgroundColor: ['rgba(75, 192, 192, 0.7)', 'rgba(255, 99, 132, 0.7)'],
          borderColor: ['rgb(75, 192, 192)', 'rgb(255, 99, 132)'],
          borderWidth: 1,
        }
      ]
    },
    recentRounds: [
      { id: 1, date: '2024-12-10', role: 'Deputy PM', motion: 'THW ban social media for children under 16', score: 84, result: 'Won' },
      { id: 2, date: '2024-12-03', role: 'Leader of Opp', motion: 'THW implement a universal basic income', score: 82, result: 'Lost' },
      { id: 3, date: '2024-11-26', role: 'Prime Minister', motion: 'THS mandatory voting in elections', score: 86, result: 'Won' },
    ]
  };

  const sampleAdjudicatorData = {
    chairPanelistRatio: {
      labels: ['Chair', 'Panelist', 'Trainee'],
      datasets: [
        {
          data: [6, 12, 4],
          backgroundColor: ['rgba(255, 206, 86, 0.7)', 'rgba(54, 162, 235, 0.7)', 'rgba(153, 102, 255, 0.7)'],
        }
      ]
    },
    roundsJudged: {
      labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
      datasets: [
        {
          label: 'Rounds Judged',
          data: [3, 5, 4, 7, 2, 6],
          backgroundColor: 'rgba(153, 102, 255, 0.5)',
          borderColor: 'rgb(153, 102, 255)',
          borderWidth: 1,
        }
      ]
    },
    formatExperience: {
      labels: ['Asian Parliamentary', 'British Parliamentary', 'World Schools'],
      datasets: [
        {
          label: 'Experience by Format',
          data: [12, 9, 5],
          backgroundColor: [
            'rgba(75, 192, 192, 0.7)',
            'rgba(54, 162, 235, 0.7)',
            'rgba(255, 159, 64, 0.7)'
          ],
        }
      ]
    },
    recentAdjudications: [
      { id: 1, date: '2024-12-15', role: 'Chair', motion: 'THW ban private healthcare', format: 'Asian Parliamentary' },
      { id: 2, date: '2024-12-08', role: 'Panelist', motion: 'THS the rise of AI in creative industries', format: 'British Parliamentary' },
      { id: 3, date: '2024-11-30', role: 'Chair', motion: 'THW make voting mandatory', format: 'Asian Parliamentary' },
    ]
  };

  // Visualization options
  const lineOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Speaker Score Progression',
      },
    },
    scales: {
      y: {
        min: 65,
        max: 100,
      }
    }
  };

  return (
    <div className="p-4 w-full max-w-4xl">
      <h1 className="text-3xl mb-6 font-bold dark:text-[#F5F5F5] light:text-gray-900">
        Debate Performance History
      </h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500">
          {error}
        </div>
      ) : (
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 mb-6 w-full md:w-96">
              <TabsTrigger value="debater">As Debater</TabsTrigger>
              <TabsTrigger value="adjudicator">As Adjudicator</TabsTrigger>
            </TabsList>

            <TabsContent value="debater" className="space-y-6">
              {/* Debater stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                  <CardHeader>
                    <CardTitle className="dark:text-white light:text-gray-800">Score Progression</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <Line 
                      options={lineOptions} 
                      // Replace this line:
                      // data={sampleDebaterData.scoresByRound}
                      // With this:
                      data={performanceData?.debater?.score_progression ? {
                        labels: performanceData.debater.score_progression.labels,
                        datasets: [{
                          label: 'Speaker Scores',
                          data: performanceData.debater.score_progression.scores,
                          borderColor: 'rgb(75, 192, 192)',
                          backgroundColor: 'rgba(75, 192, 192, 0.5)',
                          tension: 0.3,
                        }]
                      } : sampleDebaterData.scoresByRound}
                    />
                  </CardContent>
                </Card>

                <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                  <CardHeader>
                    <CardTitle className="dark:text-white light:text-gray-800">Win/Loss Ratio</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64 flex justify-center">
                    <div className="w-48">
                      <Doughnut data={sampleDebaterData.winLossRatio} />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                <CardHeader>
                  <CardTitle className="dark:text-white light:text-gray-800">Roles Distribution</CardTitle>
                </CardHeader>
                <CardContent className="h-72">
                  <Bar 
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                    }} 
                    data={sampleDebaterData.roleDistribution} 
                  />
                </CardContent>
              </Card>

              <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                <CardHeader>
                  <CardTitle className="dark:text-white light:text-gray-800">Recent Rounds</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b dark:border-gray-700">
                          <th className="py-2 px-3 text-left text-sm font-medium text-gray-500">Date</th>
                          <th className="py-2 px-3 text-left text-sm font-medium text-gray-500">Role</th>
                          <th className="py-2 px-3 text-left text-sm font-medium text-gray-500">Motion</th>
                          <th className="py-2 px-3 text-left text-sm font-medium text-gray-500">Score</th>
                          <th className="py-2 px-3 text-left text-sm font-medium text-gray-500">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sampleDebaterData.recentRounds.map(round => (
                          <tr key={round.id} className="border-b dark:border-gray-700">
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{round.date}</td>
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{round.role}</td>
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{round.motion}</td>
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{round.score}</td>
                            <td className={`py-3 px-3 text-sm font-medium ${round.result === 'Won' ? 'text-green-500' : 'text-red-500'}`}>
                              {round.result}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="adjudicator" className="space-y-6">
              {/* Adjudicator stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                  <CardHeader>
                    <CardTitle className="dark:text-white light:text-gray-800">Chair/Panelist Ratio</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64 flex justify-center">
                    <div className="w-48">
                      <Doughnut data={sampleAdjudicatorData.chairPanelistRatio} />
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                  <CardHeader>
                    <CardTitle className="dark:text-white light:text-gray-800">Rounds Judged</CardTitle>
                  </CardHeader>
                  <CardContent className="h-64">
                    <Bar 
                      options={{
                        responsive: true,
                        plugins: {
                          legend: {
                            display: false,
                          },
                        },
                      }} 
                      data={sampleAdjudicatorData.roundsJudged} 
                    />
                  </CardContent>
                </Card>
              </div>

              <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                <CardHeader>
                  <CardTitle className="dark:text-white light:text-gray-800">Format Experience</CardTitle>
                </CardHeader>
                <CardContent className="h-64 flex justify-center">
                  <div className="w-64">
                    <Doughnut data={sampleAdjudicatorData.formatExperience} />
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                <CardHeader>
                  <CardTitle className="dark:text-white light:text-gray-800">Recent Adjudications</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b dark:border-gray-700">
                          <th className="py-2 px-3 text-left text-sm font-medium text-gray-500">Date</th>
                          <th className="py-2 px-3 text-left text-sm font-medium text-gray-500">Role</th>
                          <th className="py-2 px-3 text-left text-sm font-medium text-gray-500">Motion</th>
                          <th className="py-2 px-3 text-left text-sm font-medium text-gray-500">Format</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sampleAdjudicatorData.recentAdjudications.map(round => (
                          <tr key={round.id} className="border-b dark:border-gray-700">
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{round.date}</td>
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{round.role}</td>
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{round.motion}</td>
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{round.format}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default Dashboard;