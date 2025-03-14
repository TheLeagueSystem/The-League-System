import React from "react";
import { useTheme } from "../contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

export const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme}
      className="rounded-full w-10 h-10 bg-transparent border-gray-500 dark:border-gray-400"
      title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-amber-200" /> // Less saturated yellow
      ) : (
        <Moon className="h-5 w-5 text-gray-600" /> // Less saturated dark color
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
};