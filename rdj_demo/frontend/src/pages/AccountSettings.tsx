import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "src/components/ui/card";
import { Avatar } from "src/components/ui/avatar";
import { Bell, ArrowLeft, LogOut } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";
import { useNotifications } from '../contexts/NotificationContext';

const AccountSettings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { pageTransition } = useTheme();
  const { notifications, markAsRead, markAsUnread, markAllAsRead } = useNotifications();

  // Initialize active tab from route state if provided
  useEffect(() => {
    if (location.state && location.state.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("is_admin");
    localStorage.removeItem("username");
    navigate("/login");
  };

  return (
    <div className="flex min-h-screen bg-gray-900 dark:bg-gray-900 light:bg-gray-100 text-white">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 dark:bg-gray-800 light:bg-white p-4 space-y-4">
        <Button 
          variant="ghost"
          className={`sidebar-btn w-full text-left justify-start dark:text-[#F5F5F5] light:text-gray-800 hover:bg-opacity-10 hover:translate-x-1 transition-all duration-200 ${activeTab === "profile" ? "bg-gray-700 bg-opacity-50" : ""}`}
          onClick={() => setActiveTab("profile")}
        >
          Profile
        </Button>
        <Button 
          variant="ghost"
          className={`sidebar-btn w-full text-left justify-start dark:text-[#F5F5F5] light:text-gray-800 hover:bg-opacity-10 hover:translate-x-1 transition-all duration-200 ${activeTab === "account" ? "bg-gray-700 bg-opacity-50" : ""}`}
          onClick={() => setActiveTab("account")}
        >
          Account
        </Button>
        <Button 
          variant="ghost"
          className={`sidebar-btn w-full text-left justify-start dark:text-[#F5F5F5] light:text-gray-800 hover:bg-opacity-10 hover:translate-x-1 transition-all duration-200 ${activeTab === "appearance" ? "bg-gray-700 bg-opacity-50" : ""}`}
          onClick={() => setActiveTab("appearance")}
        >
          Appearance
        </Button>
        <Button 
          variant="ghost"
          className={`sidebar-btn w-full text-left justify-start dark:text-[#F5F5F5] light:text-gray-800 hover:bg-opacity-10 hover:translate-x-1 transition-all duration-200 ${activeTab === "notifications" ? "bg-gray-700 bg-opacity-50" : ""}`}
          onClick={() => setActiveTab("notifications")}
        >
          <Bell className="w-4 h-4 mr-2" />
          Notifications
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex flex-col flex-1 p-8">
        {/* Navbar - Removed profile picture */}
        <div className="flex items-center justify-between p-4 bg-gray-800 dark:bg-gray-800 light:bg-white shadow-lg">
          <ArrowLeft 
            className="w-6 h-6 cursor-pointer dark:text-white light:text-gray-800" 
            onClick={() => {
              pageTransition(() => {
                navigate(-1);
              });
            }} 
          />
          <h1 className="text-2xl font-bold dark:text-white light:text-gray-800">
            {activeTab === "profile" && "Profile Settings"}
            {activeTab === "account" && "Account Settings"}
            {activeTab === "appearance" && "Appearance Settings"}
            {activeTab === "notifications" && "Notification History"}
          </h1>
          <div className="w-6"></div> {/* Empty div for flex spacing */}
        </div>

        {/* Profile Section */}
        {activeTab === "profile" && (
          <Card className="w-full max-w-2xl mx-auto mt-8 bg-gray-800 dark:bg-gray-800 light:bg-white">
            <CardHeader>
              <CardTitle className="text-2xl font-bold dark:text-white light:text-gray-800">Public Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Profile Picture */}
              <div className="flex justify-center">
                <Avatar className="w-24 h-24" />
              </div>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium dark:text-white light:text-gray-700">Name</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Input Field" />
                <p className="text-xs text-gray-400">This is the name visible in the tabs.</p>
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium dark:text-white light:text-gray-700">Public Email</label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Input Field" />
                <p className="text-xs text-gray-400">Alternate email for admins to contact aside from school email.</p>
              </div>

              {/* Edit & Logout Buttons */}
              <div className="flex justify-between">
                <Button className="bg-orange-500 hover:bg-orange-600">Save Changes</Button>
                <Button className="bg-red-600 hover:bg-red-700 flex items-center" onClick={handleLogout}>
                  <LogOut className="w-5 h-5 mr-2" /> Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notifications Tab (New) */}
        {activeTab === "notifications" && (
          <Card className="w-full max-w-4xl mx-auto mt-8 bg-gray-800 dark:bg-gray-800 light:bg-white">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-2xl font-bold dark:text-white light:text-gray-800">Notification History</CardTitle>
              <Button 
                variant="ghost" 
                className="text-sm dark:text-blue-400 light:text-blue-500 notification-action-btn"
                onClick={markAllAsRead}
              >
                Mark All as Read
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {notifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-4 border-b dark:border-gray-700 flex items-start justify-between transition hover:bg-opacity-50 ${
                    notification.read ? "" : "bg-blue-900 bg-opacity-10 dark:bg-blue-900 dark:bg-opacity-20"
                  }`}
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      {!notification.read && (
                        <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                      )}
                      <p className={`text-base dark:text-white light:text-gray-800 ${!notification.read ? "font-medium" : ""}`}>
                        {notification.message}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">{notification.time}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-xs dark:text-gray-400 light:text-gray-500 notification-action-btn"
                    onClick={() => notification.read ? markAsUnread(notification.id) : markAsRead(notification.id)}
                  >
                    {notification.read ? "Mark as Unread" : "Mark as Read"}
                  </Button>
                </div>
              ))}
              
              {notifications.length === 0 && (
                <div className="text-center py-8">
                  <p className="dark:text-white light:text-gray-800">You have no notifications</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default AccountSettings;
