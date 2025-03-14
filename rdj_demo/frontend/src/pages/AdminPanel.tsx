import React from "react";
import { Button } from "src/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card";
import { FileText, Users, PlayCircle, Bell } from "lucide-react"; // Added Bell icon
import { useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";

const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const { pageTransition } = useTheme();

  // Navigation handlers
  const handleNavigateToUserManagement = () => {
    pageTransition(() => {
      navigate("/user-management");
    });
  };

  const handleNavigateToMotions = () => {
    pageTransition(() => {
      navigate("/admin/motions");
    });
  };

  // Handler for new round
  const handleNavigateToNewRound = () => {
    pageTransition(() => {
      navigate('/admin/rounds/new');
    });
  };

  // New handler for notification management
  const handleNavigateToNotifications = () => {
    pageTransition(() => {
      navigate('/admin/notifications');
    });
  };

  return (
    <div className="p-4 w-full max-w-4xl">
      <h1 className="text-3xl mb-6 font-bold dark:text-[#F5F5F5] light:text-gray-900">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Management Card */}
        <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
          <CardHeader>
            <CardTitle className="flex items-center dark:text-white light:text-gray-800">
              <Users className="mr-2" size={22} />
              User Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm dark:text-gray-300 light:text-gray-600 mb-4">
              Manage users, permissions, and roles. Add new users or update existing ones.
            </p>
            <Button 
              onClick={handleNavigateToUserManagement}
              className="w-full"
            >
              Manage Users
            </Button>
          </CardContent>
        </Card>

        {/* Motion Management Card */}
        <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
          <CardHeader>
            <CardTitle className="flex items-center dark:text-white light:text-gray-800">
              <FileText className="mr-2" size={22} />
              Motion Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm dark:text-gray-300 light:text-gray-600 mb-4">
              Create, update or delete debate motions. Organize motions by theme and competition type.
            </p>
            <Button 
              onClick={handleNavigateToMotions}
              className="w-full"
            >
              Manage Motions
            </Button>
          </CardContent>
        </Card>

        {/* New Debate Round Card */}
        <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
          <CardHeader>
            <CardTitle className="flex items-center dark:text-white light:text-gray-800">
              <PlayCircle className="mr-2" size={22} />
              New Debate Round
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm dark:text-gray-300 light:text-gray-600 mb-4">
              Start a new debate round. Select format, motion, and allocate participants and adjudicators.
            </p>
            <Button 
              onClick={handleNavigateToNewRound}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Start New Round
            </Button>
          </CardContent>
        </Card>

        {/* NEW: Notification Management Card */}
        <Card className="shadow-lg dark:bg-gray-800 light:bg-white">
          <CardHeader>
            <CardTitle className="flex items-center dark:text-white light:text-gray-800">
              <Bell className="mr-2" size={22} />
              Notification Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm dark:text-gray-300 light:text-gray-600 mb-4">
              Create and send system notifications to users. Schedule announcements and important updates.
            </p>
            <Button 
              onClick={handleNavigateToNotifications}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Manage Notifications
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
