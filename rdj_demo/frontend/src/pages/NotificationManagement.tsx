import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";
import { fetchWithAuth } from '../utils/api';
import toast from "react-hot-toast";
import { Check, ArrowLeft, Bell, Users, Send, AlertCircle } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "src/components/ui/card";
import { Button } from "src/components/ui/button";
import { Input } from "src/components/ui/input";
import { Textarea } from "src/components/ui/textarea";
import { Badge } from "src/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "src/components/ui/dialog";
import { Avatar } from "src/components/ui/avatar";
import { Checkbox } from "src/components/ui/checkbox";

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_adjudicator: boolean;
}

interface Notification {
  id: number;
  recipients: number[];
  type: string;
  message: string;
  link?: string;
  created_at: string;
  sent_by: {
    id: number;
    username: string;
  };
  sent_to_all: boolean;
}

const NotificationManagement: React.FC = () => {
  const navigate = useNavigate();
  const { pageTransition } = useTheme();
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [sentNotifications, setSentNotifications] = useState<Notification[]>([]);
  const [showNewNotificationDialog, setShowNewNotificationDialog] = useState(false);
  const [showUserSelectionDialog, setShowUserSelectionDialog] = useState(false);
  
  // New notification form state
  const [notificationType, setNotificationType] = useState<string>("SYSTEM");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationLink, setNotificationLink] = useState("");
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);
  const [sendToAll, setSendToAll] = useState(false);
  const [userFilter, setUserFilter] = useState("");
  
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
    exit: { opacity: 0, transition: { duration: 0.3 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.3 } }
  };

  useEffect(() => {
    fetchUsers();
    fetchSentNotifications();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await fetchWithAuth('/admin/users/');
      // Make sure data is an array before setting it to state
      if (Array.isArray(data)) {
        setUsers(data);
      } else if (data && data.users && Array.isArray(data.users)) {
        // Some APIs return data in a nested object like { users: [...] }
        setUsers(data.users);
      } else {
        console.error("Received invalid user data format:", data);
        setUsers([]); // Set to empty array as fallback
      }
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setUsers([]); // Ensure users is always an array even on error
    }
  };

  const fetchSentNotifications = async () => {
    try {
      const data = await fetchWithAuth('/admin/notifications/');
      setSentNotifications(data);
      setLoading(false);
    } catch (err: any) {
      console.error("Error fetching notifications:", err);
      setError("Failed to load sent notifications");
      setLoading(false);
    }
  };

  const handleBack = () => {
    pageTransition(() => {
      navigate("/dashboard"); // This should be the route where your AdminPanel component is rendered
    });
  };

  const handleSendNotification = async () => {
    if (!notificationMessage.trim()) {
      toast.error("Please enter a notification message");
      return;
    }

    if (!sendToAll && selectedUserIds.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    try {
      setLoading(true);
      
      await fetchWithAuth('/admin/notifications/', {
        method: 'POST',
        body: JSON.stringify({
          type: notificationType,
          message: notificationMessage,
          link: notificationLink || null,
          recipients: sendToAll ? [] : selectedUserIds,
          send_to_all: sendToAll
        })
      });
      
      // Reset form
      setNotificationType("SYSTEM");
      setNotificationMessage("");
      setNotificationLink("");
      setSelectedUserIds([]);
      setSendToAll(false);
      
      // Close dialog
      setShowNewNotificationDialog(false);
      
      // Refresh notifications list
      fetchSentNotifications();
      
      toast.success("Notification sent successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to send notification");
      console.error("Error sending notification:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelection = (userId: number) => {
    setSelectedUserIds(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleSelectAllUsers = () => {
    const filteredUserIds = filterUsers().map(user => user.id);
    
    if (selectedUserIds.length === filteredUserIds.length) {
      // If all are selected, deselect all
      setSelectedUserIds([]);
    } else {
      // Otherwise select all
      setSelectedUserIds(filteredUserIds);
    }
  };

  const filterUsers = () => {
    if (!Array.isArray(users)) {
      console.warn("Users is not an array:", users);
      return [];
    }
    
    return users.filter(user => 
      user.username.toLowerCase().includes(userFilter.toLowerCase()) ||
      user.email.toLowerCase().includes(userFilter.toLowerCase()) ||
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(userFilter.toLowerCase())
    );
  };

  const getUsernamesText = () => {
    if (sendToAll) return "All users";
    
    if (selectedUserIds.length === 0) return "No users selected";
    
    if (selectedUserIds.length > 3) {
      const firstThree = selectedUserIds
        .slice(0, 3)
        .map(id => users.find(user => user.id === id)?.username)
        .join(", ");
      return `${firstThree} and ${selectedUserIds.length - 3} more`;
    }
    
    return selectedUserIds
      .map(id => users.find(user => user.id === id)?.username)
      .join(", ");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <motion.div 
      className="p-4"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      <Card className="w-full max-w-5xl mx-auto shadow-lg rounded-lg bg-gray-800 dark:bg-gray-800 light:bg-white transition-colors duration-200">
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
              <CardTitle className="text-2xl font-bold dark:text-white light:text-gray-800">
                Notification Management
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Create and manage system notifications
              </p>
            </div>
          </div>
          
          <Button 
            onClick={() => setShowNewNotificationDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Bell size={16} className="mr-2" />
            Send New Notification
          </Button>
        </CardHeader>
        
        <CardContent className="p-6">
          {error && (
            <motion.div 
              variants={itemVariants}
              className="mb-6 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500"
            >
              <div className="flex items-center">
                <AlertCircle className="mr-2" size={20} />
                {error}
              </div>
            </motion.div>
          )}
          
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-semibold mb-4 dark:text-white light:text-gray-800">
              Recently Sent Notifications
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 dark:text-white light:text-gray-800">Loading notifications...</p>
              </div>
            ) : sentNotifications.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y dark:divide-gray-700 light:divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Message</th>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Recipients</th>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Sent At</th>
                      <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Sent By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700 light:divide-gray-200">
                    {sentNotifications.map(notification => (
                      <tr key={notification.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={`
                            ${notification.type === 'SYSTEM' ? 'bg-blue-500' : 
                              notification.type === 'ROUND_START' ? 'bg-green-500' : 
                              notification.type === 'RESULTS_AVAILABLE' ? 'bg-purple-500' : 
                              'bg-gray-500'} 
                            text-white`
                          }>
                            {notification.type.replace('_', ' ')}
                          </Badge>
                        </td>
                        <td className="px-6 py-4">
                          <p className="dark:text-white light:text-gray-800 line-clamp-2">{notification.message}</p>
                          {notification.link && (
                            <span className="text-xs text-blue-500">
                              Has link: {notification.link}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {notification.sent_to_all ? (
                            <span className="text-sm dark:text-white light:text-gray-800">All Users</span>
                          ) : (
                            <span className="text-sm dark:text-white light:text-gray-800">
                              {notification.recipients.length} users
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white light:text-gray-800">
                          {formatDate(notification.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm dark:text-white light:text-gray-800">
                          {notification.sent_by.username}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-4 dark:text-white light:text-gray-800">No notifications have been sent yet</p>
              </div>
            )}
          </motion.div>
        </CardContent>
      </Card>

      {/* New Notification Dialog */}
      <Dialog open={showNewNotificationDialog} onOpenChange={setShowNewNotificationDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Send New Notification</DialogTitle>
            <DialogDescription>
              Create a notification to send to selected users or everyone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-white light:text-gray-800">
                Notification Type
              </label>
              <Select
                value={notificationType}
                onValueChange={setNotificationType}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SYSTEM">System Notification</SelectItem>
                  <SelectItem value="ROUND_START">Round Starting</SelectItem>
                  <SelectItem value="RESULTS_AVAILABLE">Results Available</SelectItem>
                  <SelectItem value="ROLE_ASSIGNED">Role Assignment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-white light:text-gray-800">
                Message
              </label>
              <Textarea
                placeholder="Enter notification message..."
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-white light:text-gray-800">
                Link (Optional)
              </label>
              <Input
                placeholder="e.g., /round/123 or /dashboard"
                value={notificationLink}
                onChange={(e) => setNotificationLink(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Enter a relative path that users will be directed to when clicking the notification.
              </p>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium dark:text-white light:text-gray-800 flex items-center space-x-2">
                <span>Recipients</span>
                <div className="flex-1"></div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sendToAll"
                    checked={sendToAll}
                    onCheckedChange={(checked: boolean | "indeterminate") => setSendToAll(checked === true)}
                    className="mr-1"
                  />
                  <label htmlFor="sendToAll" className="text-sm cursor-pointer">
                    Send to all users
                  </label>
                </div>
              </label>
              
              {!sendToAll && (
                <div className="border rounded-md p-2 flex justify-between items-center">
                  <div className="truncate">
                    {getUsernamesText()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUserSelectionDialog(true)}
                  >
                    <Users size={16} className="mr-1" />
                    Select Users
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewNotificationDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleSendNotification}
              disabled={loading}
            >
              <Send size={16} className="mr-2" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Selection Dialog */}
      <Dialog open={showUserSelectionDialog} onOpenChange={setShowUserSelectionDialog}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Select Recipients</DialogTitle>
            <DialogDescription>
              Choose which users will receive this notification.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex justify-between items-center mb-4">
              <div className="relative flex-1 mr-4">
                <Input
                  placeholder="Search users..."
                  value={userFilter}
                  onChange={(e) => setUserFilter(e.target.value)}
                  className="pl-9"
                />
                <Users className="absolute left-3 top-2.5 h-4 w-4 text-gray-500" />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAllUsers}
              >
                {selectedUserIds.length === filterUsers().length ? "Deselect All" : "Select All"}
              </Button>
            </div>
            
            <div className="max-h-[400px] overflow-y-auto border rounded-md divide-y dark:divide-gray-700 light:divide-gray-200">
              {filterUsers().length > 0 ? (
                filterUsers().map(user => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 hover:bg-gray-700 hover:bg-opacity-30 cursor-pointer"
                    onClick={() => handleUserSelection(user.id)}
                  >
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-3" />
                      <div>
                        <p className="font-medium dark:text-white light:text-gray-800">{user.username}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {user.is_staff && (
                        <Badge className="bg-purple-500 text-white">Admin</Badge>
                      )}
                      {user.is_adjudicator && (
                        <Badge className="bg-green-500 text-white">Adjudicator</Badge>
                      )}
                      <div className={`h-5 w-5 rounded-full border flex items-center justify-center
                        ${selectedUserIds.includes(user.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-400'}`}
                      >
                        {selectedUserIds.includes(user.id) && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-400">
                  No users match your search
                </div>
              )}
            </div>
            
            <div className="mt-4 text-sm text-gray-400">
              {selectedUserIds.length} user(s) selected
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowUserSelectionDialog(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowUserSelectionDialog(false)}
            >
              Confirm Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default NotificationManagement;