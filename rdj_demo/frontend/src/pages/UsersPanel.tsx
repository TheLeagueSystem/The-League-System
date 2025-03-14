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
import { UserPlus, X, Trash2, Check, Shield, UserCog, X as XIcon, ArrowLeft } from "lucide-react"; // Added ArrowLeft
import { useNavigate } from "react-router-dom"; // Add this import
import { motion } from "framer-motion"; // Add this import for animations

// Define user type
interface User {
  id: number;
  username: string;
  email: string;
  is_admin: boolean;
  is_debater: boolean;
  is_adjudicator: boolean;
}

// New user form initial state
const initialNewUser = {
  username: "",
  email: "",
  password: "",
  is_admin: false,
  is_debater: false,
  is_adjudicator: false,
};

// New interface for editable user data
interface EditableUserData {
  username: string;
  email: string;
  is_admin: boolean;
  is_debater: boolean;
  is_adjudicator: boolean;
}

const UsersPanel: React.FC = () => {
  const navigate = useNavigate(); // Add navigate hook
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUser, setNewUser] = useState(initialNewUser);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editData, setEditData] = useState<EditableUserData | null>(null);
  
  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://127.0.0.1:8000/api/admin/users/", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
      setError("");
    } catch (err: any) {
      setError(err.message || "An error occurred while fetching users");
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch("http://127.0.0.1:8000/api/admin/users/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add user");
      }

      // Refresh user list
      await fetchUsers();
      
      // Reset form and hide it
      setNewUser(initialNewUser);
      setShowNewUserForm(false);
      setError("");
    } catch (err: any) {
      setError(err.message || "An error occurred while adding the user");
      console.error("Error adding user:", err);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://127.0.0.1:8000/api/admin/users/${userId}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete user");
      }

      // Remove user from state
      setUsers(users.filter(user => user.id !== userId));
      setError("");
    } catch (err: any) {
      setError(err.message || "An error occurred while deleting the user");
      console.error("Error deleting user:", err);
    }
  };

  const handleUpdateUser = async (userId: number, userData: Partial<User>) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      const response = await fetch(`http://127.0.0.1:8000/api/admin/users/${userId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Token ${token}`
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Failed to update user");
      }

      // Update user in state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, ...userData } : user
      ));
      
      // Reset edit states
      setEditingUserId(null);
      setEditData(null);
      setError("");
    } catch (err: any) {
      setError(err.message || "An error occurred while updating the user");
      console.error("Error updating user:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add a new function to start editing a user
  const startEditingUser = (user: User) => {
    setEditingUserId(user.id);
    setEditData({
      username: user.username,
      email: user.email,
      is_admin: user.is_admin,
      is_debater: user.is_debater,
      is_adjudicator: user.is_adjudicator
    });
  };

  // Add a function to cancel editing
  const cancelEditing = () => {
    setEditingUserId(null);
    setEditData(null);
  };

  // Add a function to promote user to admin
  const promoteToAdmin = async (userId: number) => {
    if (window.confirm("Are you sure you want to promote this user to admin?")) {
      await handleUpdateUser(userId, { is_admin: true });
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add animation variants for a smooth transition
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

  // Add handle back function
  const handleBack = () => {
    navigate("/admin/dashboard");
  };

  return (
    <motion.div 
      className="flex justify-center items-center w-full p-4"
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={containerVariants}
    >
      <Card className="w-full max-w-5xl transition-colors duration-200 bg-gray-800 dark:bg-gray-800 light:bg-white shadow-lg rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between p-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="mr-2"
            >
              <ArrowLeft size={16} />
            </Button>
            <CardTitle className="text-2xl font-bold dark:text-white light:text-gray-800">User Management</CardTitle>
          </div>
          <div className="flex space-x-2">
            <Input 
              placeholder="Search users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64 dark:text-white light:text-gray-800"
            />
            <Button 
              className="flex items-center space-x-1 btn-primary"
              onClick={() => setShowNewUserForm(true)}
              disabled={showNewUserForm}
            >
              <UserPlus size={18} />
              <span>Add User</span>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-500 bg-opacity-10 border border-red-500 rounded-lg text-red-500">
              {error}
            </div>
          )}

          {showNewUserForm && (
            <div className="mb-6 p-4 border rounded-lg dark:border-gray-700 light:border-gray-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium dark:text-white light:text-gray-800">Add New User</h3>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowNewUserForm(false)}
                  className="h-8 w-8"
                >
                  <X size={18} />
                </Button>
              </div>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username" className="dark:text-white light:text-gray-800">Username</Label>
                    <Input 
                      id="username"
                      value={newUser.username}
                      onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="dark:text-white light:text-gray-800">Email</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="password" className="dark:text-white light:text-gray-800">Password</Label>
                    <Input 
                      id="password"
                      type="password"
                      value={newUser.password}
                      onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                      required
                    />
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newUser.is_admin}
                      onChange={(e) => setNewUser({...newUser, is_admin: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="dark:text-white light:text-gray-800">Admin</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newUser.is_debater}
                      onChange={(e) => setNewUser({...newUser, is_debater: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="dark:text-white light:text-gray-800">Debater</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={newUser.is_adjudicator}
                      onChange={(e) => setNewUser({...newUser, is_adjudicator: e.target.checked})}
                      className="w-4 h-4"
                    />
                    <span className="dark:text-white light:text-gray-800">Adjudicator</span>
                  </label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-2">
                  <Button 
                    variant="ghost" 
                    type="button" 
                    onClick={() => setShowNewUserForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="btn-primary">
                    Add User
                  </Button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 dark:text-white light:text-gray-800">Loading users...</p>
            </div>
          ) : filteredUsers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700 dark:divide-gray-700 light:divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Roles</th>
                    <th className="px-6 py-3 text-left text-xs font-medium dark:text-gray-400 light:text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 dark:divide-gray-700 light:divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700 dark:hover:bg-gray-700 light:hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === user.id && editData ? (
                          <Input
                            value={editData.username}
                            onChange={(e) => setEditData({...editData, username: e.target.value})}
                            className="w-full dark:text-white light:text-gray-800"
                          />
                        ) : (
                          <div className="dark:text-white light:text-gray-800">{user.username}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingUserId === user.id && editData ? (
                          <Input
                            value={editData.email}
                            onChange={(e) => setEditData({...editData, email: e.target.value})}
                            className="w-full dark:text-white light:text-gray-800"
                          />
                        ) : (
                          <div className="dark:text-white light:text-gray-800">{user.email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingUserId === user.id && editData ? (
                          <div className="flex flex-wrap gap-3">
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={editData.is_admin}
                                onChange={(e) => setEditData({...editData, is_admin: e.target.checked})}
                                className="w-4 h-4"
                              />
                              <span className="dark:text-white light:text-gray-800">Admin</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={editData.is_debater}
                                onChange={(e) => setEditData({...editData, is_debater: e.target.checked})}
                                className="w-4 h-4"
                              />
                              <span className="dark:text-white light:text-gray-800">Debater</span>
                            </label>
                            <label className="flex items-center space-x-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={editData.is_adjudicator}
                                onChange={(e) => setEditData({...editData, is_adjudicator: e.target.checked})}
                                className="w-4 h-4"
                              />
                              <span className="dark:text-white light:text-gray-800">Adjudicator</span>
                            </label>
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {user.is_admin && (
                              <span className="px-2 py-1 text-xs rounded-full bg-purple-500 bg-opacity-20 text-purple-500">Admin</span>
                            )}
                            {user.is_debater && (
                              <span className="px-2 py-1 text-xs rounded-full bg-blue-500 bg-opacity-20 text-blue-500">Debater</span>
                            )}
                            {user.is_adjudicator && (
                              <span className="px-2 py-1 text-xs rounded-full bg-green-500 bg-opacity-20 text-green-500">Adjudicator</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {editingUserId === user.id ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => {
                                  if (editData) {
                                    handleUpdateUser(user.id, editData);
                                  }
                                }}
                                className="h-8 w-8 dark:text-green-400 light:text-green-600"
                                title="Save changes"
                              >
                                <Check size={16} />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={cancelEditing}
                                className="h-8 w-8 dark:text-gray-400 light:text-gray-600"
                                title="Cancel"
                              >
                                <XIcon size={16} />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => startEditingUser(user)}
                                className="h-8 w-8 dark:text-blue-400 light:text-blue-600"
                                title="Edit user"
                              >
                                <UserCog size={16} />
                              </Button>
                              {!user.is_admin && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => promoteToAdmin(user.id)}
                                  className="h-8 w-8 dark:text-purple-400 light:text-purple-600"
                                  title="Promote to admin"
                                >
                                  <Shield size={16} />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => handleDeleteUser(user.id)}
                                className="h-8 w-8 dark:text-red-400 light:text-red-600"
                                title="Delete user"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="dark:text-white light:text-gray-800">
                {searchTerm ? "No users found matching your search." : "No users found."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default UsersPanel;