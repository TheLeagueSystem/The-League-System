import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card";
import { Button } from "src/components/ui/button";
import { ArrowLeft, BarChart3, Award, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '../contexts/ThemeContext';
import { fetchWithAuth } from '../utils/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

// Import Chart.js components
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

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const DebateHistory: React.FC = () => {
  const navigate = useNavigate();
  const { pageTransition } = useTheme();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("debater");

  useEffect(() => {
    // Fetch data or simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleBack = () => {
    pageTransition(() => {
      navigate("/dashboard");
    });
  };

  // Sample data for visualization
  const speakerScoreData = {
    labels: ['Round 1', 'Round 2', 'Round 3', 'Round 4', 'Round 5', 'Round 6'],
    datasets: [
      {
        label: 'Speaker Scores',
        data: [75, 78, 76, 82, 84, 80],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3,
      }
    ]
  };

  const roleDistribution = {
    labels: ['Prime Minister', 'Deputy PM', 'Leader of Opp', 'Deputy LO'],
    datasets: [
      {
        label: 'Roles Played',
        data: [5, 3, 4, 2],
        backgroundColor: [
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
      }
    ]
  };

  const adjudicationData = {
    labels: ['Chair', 'Panelist', 'Trainee'],
    datasets: [
      {
        data: [7, 12, 3],
        backgroundColor: [
          'rgba(255, 206, 86, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(75, 192, 192, 0.7)',
        ],
      }
    ]
  };

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
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
  };

  return (
    <motion.div 
      className="p-4 w-full max-w-5xl mx-auto"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      <motion.div variants={itemVariants} className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="mr-2"
          onClick={handleBack}
        >
          <ArrowLeft size={20} />
        </Button>
        <h1 className="text-3xl font-bold dark:text-[#F5F5F5] light:text-gray-900">
          Debate Performance History
        </h1>
      </motion.div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <motion.div variants={itemVariants} className="p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500">
          {error}
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Tab Selection */}
          <motion.div variants={itemVariants} className="flex space-x-2 border-b dark:border-gray-700 pb-2">
            <button
              className={`px-4 py-2 rounded-t transition-colors ${activeTab === "debater" 
                ? "bg-blue-500 text-white" 
                : "text-gray-400 hover:text-gray-300"}`}
              onClick={() => setActiveTab("debater")}
            >
              <div className="flex items-center">
                <Trophy size={16} className="mr-2" />
                As Debater
              </div>
            </button>
            <button
              className={`px-4 py-2 rounded-t transition-colors ${activeTab === "adjudicator" 
                ? "bg-blue-500 text-white" 
                : "text-gray-400 hover:text-gray-300"}`}
              onClick={() => setActiveTab("adjudicator")}
            >
              <div className="flex items-center">
                <Award size={16} className="mr-2" />
                As Adjudicator
              </div>
            </button>
          </motion.div>

          {activeTab === "debater" ? (
            <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6">
              {/* Performance Overview */}
              <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center dark:text-white light:text-gray-800">
                    <BarChart3 size={20} className="mr-2" />
                    Debate Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64">
                      <Line 
                        data={speakerScoreData} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
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
                        }}
                      />
                    </div>
                    <div className="h-64">
                      <Doughnut 
                        data={roleDistribution}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'right' as const,
                            },
                            title: {
                              display: true,
                              text: 'Roles Distribution',
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Summary */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold dark:text-white light:text-gray-800">14</div>
                      <div className="text-sm text-gray-400">Total Debates</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold dark:text-white light:text-gray-800">9</div>
                      <div className="text-sm text-gray-400">Wins</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold dark:text-white light:text-gray-800">64.3%</div>
                      <div className="text-sm text-gray-400">Win Rate</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold dark:text-white light:text-gray-800">81.5</div>
                      <div className="text-sm text-gray-400">Avg. Speaker Score</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Debates */}
              <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                <CardHeader>
                  <CardTitle className="dark:text-white light:text-gray-800">Recent Debates</CardTitle>
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
                        {[
                          { id: 1, date: '2025-02-15', role: 'Deputy PM', motion: 'THW ban social media for children under 16', score: 84, result: 'Won' },
                          { id: 2, date: '2025-01-28', role: 'Leader of Opp', motion: 'THW implement universal basic income', score: 82, result: 'Lost' },
                          { id: 3, date: '2025-01-12', role: 'Prime Minister', motion: 'THS mandatory voting in elections', score: 86, result: 'Won' },
                        ].map(debate => (
                          <tr key={debate.id} className="border-b dark:border-gray-700">
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{debate.date}</td>
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{debate.role}</td>
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{debate.motion}</td>
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{debate.score}</td>
                            <td className={`py-3 px-3 text-sm font-medium ${debate.result === 'Won' ? 'text-green-500' : 'text-red-500'}`}>
                              {debate.result}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="grid grid-cols-1 gap-6">
              {/* Adjudication Overview */}
              <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                <CardHeader>
                  <CardTitle className="flex items-center dark:text-white light:text-gray-800">
                    <Award size={20} className="mr-2" />
                    Adjudication Experience
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 flex justify-center items-center">
                      <div className="w-48">
                        <Doughnut 
                          data={adjudicationData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom' as const,
                              },
                              title: {
                                display: true,
                                text: 'Chair/Panelist Distribution',
                              },
                            },
                          }}
                        />
                      </div>
                    </div>
                    <div className="h-64">
                      <Bar 
                        data={{
                          labels: ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'],
                          datasets: [
                            {
                              label: 'Rounds Judged',
                              data: [2, 3, 5, 4, 6, 2],
                              backgroundColor: 'rgba(54, 162, 235, 0.5)',
                            }
                          ]
                        }}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              position: 'top' as const,
                            },
                            title: {
                              display: true,
                              text: 'Monthly Activity',
                            },
                          },
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Stats Summary */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold dark:text-white light:text-gray-800">22</div>
                      <div className="text-sm text-gray-400">Total Adjudications</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold dark:text-white light:text-gray-800">8.2</div>
                      <div className="text-sm text-gray-400">Avg. Rating</div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold dark:text-white light:text-gray-800">3</div>
                      <div className="text-sm text-gray-400">Chair Positions</div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Recent Adjudications */}
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
                        {[
                          { id: 1, date: '2025-02-10', role: 'Chair', motion: 'THW ban private healthcare', format: 'Asian Parliamentary' },
                          { id: 2, date: '2025-01-25', role: 'Panelist', motion: 'THS the rise of AI in creative industries', format: 'British Parliamentary' },
                          { id: 3, date: '2025-01-14', role: 'Chair', motion: 'THW make voting mandatory', format: 'Asian Parliamentary' },
                        ].map(adj => (
                          <tr key={adj.id} className="border-b dark:border-gray-700">
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{adj.date}</td>
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{adj.role}</td>
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{adj.motion}</td>
                            <td className="py-3 px-3 text-sm dark:text-gray-300 light:text-gray-700">{adj.format}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default DebateHistory;