import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "src/components/ThemeToggle";
import { apiConfig } from '../config/apiConfig';

const Login: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem("token");
    const isAdmin = localStorage.getItem("is_admin") === "true";
    
    if (token && token !== "null" && token !== "undefined") {
      console.log("User already logged in, redirecting...");
      // Redirect based on user role
      if (isAdmin) {
        navigate("/admin/dashboard");
      } else {
        navigate("/user-dashboard");
      }
    }
  }, [navigate]);

  const handleLogin = async (formData: { identifier: string; password: string }) => {
    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`${apiConfig.baseURL}/api/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }
      
      // Make sure we're storing the token and user roles properly
      localStorage.setItem("token", data.token);
      localStorage.setItem("is_admin", data.is_admin ? "true" : "false");
      localStorage.setItem("username", data.username);
      
      console.log("Login successful:", data);
      
      // Now redirect everyone to the unified dashboard
      navigate("/dashboard");
      
    } catch (err: unknown) {
      console.error("Login error:", err);
      
      // Type guard to check if err is an Error object
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleLogin({ identifier: username, password });
  };

  return (
    <div className="flex items-center justify-center min-h-screen transition-colors duration-200 bg-gray-900 dark:bg-gray-900 light:bg-gray-100 p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <motion.div 
        initial={{ opacity: 0, y: -50 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5 }}
      >
        <Card className="w-96 shadow-lg rounded-lg transition-colors duration-200 bg-gray-800 dark:bg-gray-800 light:bg-white text-white dark:text-white light:text-gray-800">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">Login</CardTitle>
          </CardHeader>
          <CardContent>
            {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="username" className="text-sm dark:text-white light:text-gray-700">Username</Label>
                <Input
                  id="username"
                  type="text"
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 light:bg-white dark:text-white light:text-gray-800"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password" className="text-sm dark:text-white light:text-gray-700">Password</Label>
                <Input
                  id="password"
                  type="password"
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 light:bg-white dark:text-white light:text-gray-800"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full py-2 rounded-lg dark:bg-blue-600 dark:hover:bg-blue-700 light:bg-blue-400 light:hover:bg-blue-500"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Login;