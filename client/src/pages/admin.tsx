import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Activity, 
  MessageSquare, 
  Target,
  BarChart3,
  PieChart,
  Settings,
  UserCheck,
  Search,
  UserX,
  Ban,
  CheckCircle,
  AlertTriangle,
  ChevronRight
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  title?: string;
  profileImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [userActionDialog, setUserActionDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | 'ban' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    title: '',
    adminRole: '',
    isStakTeamMember: false
  });

  // Data fetching
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics/30d'],
  });

  const { data: userManagement, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users', currentPage.toString()],
  });

  const { data: urgentActions } = useQuery({
    queryKey: ['/api/admin/urgent-actions'],
  });

  // Mutations
  const userActionMutation = useMutation({
    mutationFn: async ({ userId, status, reason }: { userId: string; status: string; reason: string }) => {
      return apiRequest(`/api/admin/users/${userId}/status`, 'POST', { status, reason });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setUserActionDialog(false);
      setSelectedUser(null);
      setActionReason('');
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const addUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      return apiRequest('/api/admin/users', 'POST', userData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowAddUserDialog(false);
      setNewUserData({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        title: '',
        adminRole: '',
        isStakTeamMember: false
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, userData }: { userId: string; userData: any }) => {
      return apiRequest(`/api/admin/users/${userId}`, 'PUT', userData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      setShowEditUserDialog(false);
      setSelectedUserForEdit(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/admin/users/${userId}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async ({ userId, newPassword }: { userId: string; newPassword: string }) => {
      return apiRequest(`/api/admin/users/${userId}/reset-password`, 'POST', { newPassword });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Password reset successfully. User will be notified via email.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const handleUserAction = (user: User, action: 'suspend' | 'activate' | 'ban') => {
    setSelectedUser(user);
    setActionType(action);
    setUserActionDialog(true);
  };

  const confirmUserAction = () => {
    if (!selectedUser || !actionType) return;

    userActionMutation.mutate({
      userId: selectedUser.id,
      status: actionType === 'activate' ? 'active' : actionType === 'suspend' ? 'suspended' : 'banned',
      reason: actionReason,
    });
  };

  const handleEditUser = (user: User) => {
    setSelectedUserForEdit(user);
    setShowEditUserDialog(true);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-400 bg-red-900/20';
      case 'medium': return 'text-yellow-400 bg-yellow-900/20';
      case 'low': return 'text-green-400 bg-green-900/20';
      default: return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case 'meeting_request': return <CalendarIcon className="h-4 w-4" />;
      case 'direct_message': return <MessageSquare className="h-4 w-4" />;
      case 'event_reminder': return <CalendarIcon className="h-4 w-4" />;
      case 'user_issue': return <AlertTriangle className="h-4 w-4" />;
      case 'match_feedback': return <Target className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (user: User) => {
    return <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-[#CD853F]" />
              <p className="text-gray-300">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Comprehensive platform management and analytics</p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="bg-[#1F1F1F] border-gray-600">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Event Management
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">
              <PieChart className="h-4 w-4 mr-2" />
              Platform Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <Card className="bg-[#1F1F1F] border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics?.userStats?.totalUsers || 0}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                    <span className="text-sm text-green-400">+{analytics?.userStats?.newUsersThisWeek || 0} this week</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1F1F1F] border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Active Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics?.eventStats?.upcomingEvents || 0}</div>
                  <div className="flex items-center mt-2">
                    <CalendarIcon className="h-4 w-4 text-blue-400 mr-1" />
                    <span className="text-sm text-blue-400">{analytics?.eventStats?.totalRegistrations || 0} registrations</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1F1F1F] border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Matches Made</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics?.matchingStats?.totalMatches || 0}</div>
                  <div className="flex items-center mt-2">
                    <Target className="h-4 w-4 text-[#CD853F] mr-1" />
                    <span className="text-sm text-[#CD853F]">{analytics?.matchingStats?.matchSuccessRate || 0}% success rate</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1F1F1F] border-gray-600">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Messages Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics?.engagementStats?.totalMessages || 0}</div>
                  <div className="flex items-center mt-2">
                    <MessageSquare className="h-4 w-4 text-purple-400 mr-1" />
                    <span className="text-sm text-purple-400">{analytics?.engagementStats?.activeMeetups || 0} active meetups</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Items */}
            <Card className="bg-[#1F1F1F] border-gray-600 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  Urgent Actions Required
                </CardTitle>
                <CardDescription className="text-gray-400">
                  High-priority items that need immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Array.isArray(urgentActions) && urgentActions.slice(0, 5).map((action: any) => (
                  <div key={action.id} className="flex items-center justify-between p-3 bg-[#1F1F1F] rounded-lg border border-gray-600 mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getPriorityColor(action.priority)}`}>
                        {getActionIcon(action.type)}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{action.title}</h4>
                        <p className="text-sm text-gray-400">{action.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{action.timestamp}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-white">User Management</h3>
                  <p className="text-gray-400">Manage user accounts and permissions</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10 bg-[#1F1F1F] border-gray-600 text-white w-64"
                    />
                  </div>
                  <Button 
                    onClick={() => setShowAddUserDialog(true)}
                    className="bg-[#CD853F] text-black hover:bg-[#CD853F]/80"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>

              {/* Users Table */}
              <Card className="bg-[#1F1F1F] border-gray-600">
                <CardContent className="p-0">
                  {usersLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Activity className="h-6 w-6 animate-spin text-[#CD853F]" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-gray-600">
                          <tr className="text-left">
                            <th className="p-4 text-gray-300 font-medium">User</th>
                            <th className="p-4 text-gray-300 font-medium">Email</th>
                            <th className="p-4 text-gray-300 font-medium">Role</th>
                            <th className="p-4 text-gray-300 font-medium">Status</th>
                            <th className="p-4 text-gray-300 font-medium">Joined</th>
                            <th className="p-4 text-gray-300 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!userManagement && !usersLoading && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-400">
                                Unable to load user data. Please refresh the page.
                              </td>
                            </tr>
                          )}
                          {userManagement?.users?.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-400">
                                No users found. Try adjusting your search or check the system.
                              </td>
                            </tr>
                          )}
                          {userManagement?.users?.map((user: User) => (
                            <tr key={user.id} className="border-b border-gray-700 hover:bg-[#2A2A2A]">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#CD853F] flex items-center justify-center text-black font-semibold">
                                    {user.firstName?.[0] || user.email[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="text-white font-medium">
                                      {user.firstName && user.lastName 
                                        ? `${user.firstName} ${user.lastName}` 
                                        : user.email.split('@')[0]
                                      }
                                    </p>
                                    <p className="text-sm text-gray-400">{user.company || 'No company'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-gray-300">{user.email}</td>
                              <td className="p-4">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                  User
                                </Badge>
                              </td>
                              <td className="p-4">{getStatusBadge(user)}</td>
                              <td className="p-4 text-gray-300">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-blue-400 hover:text-blue-300"
                                    onClick={() => handleEditUser(user)}
                                    title="Edit User"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-yellow-400 hover:text-yellow-300"
                                    onClick={() => handleUserAction(user, 'suspend')}
                                    title="Suspend User"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-green-400 hover:text-green-300"
                                    onClick={() => handleUserAction(user, 'activate')}
                                    title="Activate User"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-400 hover:text-red-300"
                                    onClick={() => deleteUserMutation.mutate(user.id)}
                                    title="Delete User"
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events">
            <div className="text-center py-12">
              <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Event Management</h3>
              <p className="text-gray-400">Event management functionality coming soon</p>
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <div className="text-center py-12">
              <PieChart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Platform Insights</h3>
              <p className="text-gray-400">Advanced insights and analytics coming soon</p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add User Dialog */}
        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
          <DialogContent className="bg-[#1F1F1F] border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new user account with basic information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-gray-300">First Name</Label>
                  <Input
                    id="firstName"
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                    className="bg-[#141414] border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-gray-300">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                    className="bg-[#141414] border-gray-600 text-white"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-300">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  className="bg-[#141414] border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="company" className="text-gray-300">Company</Label>
                <Input
                  id="company"
                  value={newUserData.company}
                  onChange={(e) => setNewUserData({...newUserData, company: e.target.value})}
                  className="bg-[#141414] border-gray-600 text-white"
                />
              </div>
              <div>
                <Label htmlFor="title" className="text-gray-300">Title</Label>
                <Input
                  id="title"
                  value={newUserData.title}
                  onChange={(e) => setNewUserData({...newUserData, title: e.target.value})}
                  className="bg-[#141414] border-gray-600 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddUserDialog(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => addUserMutation.mutate(newUserData)}
                disabled={addUserMutation.isPending || !newUserData.email}
                className="bg-[#CD853F] text-black hover:bg-[#B8752F]"
              >
                {addUserMutation.isPending ? 'Adding...' : 'Add User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
          <DialogContent className="bg-[#1F1F1F] border-gray-600 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update user account information and permissions
              </DialogDescription>
            </DialogHeader>
            {selectedUserForEdit && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFirstName" className="text-gray-300">First Name</Label>
                    <Input
                      id="editFirstName"
                      defaultValue={selectedUserForEdit.firstName || ''}
                      className="bg-[#141414] border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editLastName" className="text-gray-300">Last Name</Label>
                    <Input
                      id="editLastName"
                      defaultValue={selectedUserForEdit.lastName || ''}
                      className="bg-[#141414] border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editEmail" className="text-gray-300">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    defaultValue={selectedUserForEdit.email}
                    className="bg-[#141414] border-gray-600 text-white"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="editCompany" className="text-gray-300">Company</Label>
                  <Input
                    id="editCompany"
                    defaultValue={selectedUserForEdit.company || ''}
                    className="bg-[#141414] border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="editTitle" className="text-gray-300">Title</Label>
                  <Input
                    id="editTitle"
                    defaultValue={selectedUserForEdit.title || ''}
                    className="bg-[#141414] border-gray-600 text-white"
                  />
                </div>
                
                {/* Password Reset Section */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-lg font-medium text-white mb-4">Security</h4>
                  <div className="space-y-3">
                    <Label className="text-gray-300 text-sm font-medium">Password Reset</Label>
                    <div>
                      <Input
                        id="newPassword"
                        type="password"
                        placeholder="Enter new secure password"
                        className="bg-[#141414] border-gray-600 text-white"
                      />
                      <div className="mt-2 text-xs text-gray-400">
                        <p>Password requirements:</p>
                        <ul className="list-disc list-inside space-y-1 mt-1">
                          <li>At least 8 characters long</li>
                          <li>Contains uppercase and lowercase letters</li>
                          <li>Contains at least one number</li>
                          <li>Contains at least one special character (!@#$%^&*)</li>
                        </ul>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-black"
                      onClick={() => {
                        const passwordInput = document.getElementById('newPassword') as HTMLInputElement;
                        if (passwordInput?.value) {
                          resetPasswordMutation.mutate({
                            userId: selectedUserForEdit.id,
                            newPassword: passwordInput.value
                          });
                          passwordInput.value = '';
                        }
                      }}
                      disabled={resetPasswordMutation.isPending}
                    >
                      {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
                    </Button>
                  </div>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditUserDialog(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedUserForEdit) {
                    updateUserMutation.mutate({
                      userId: selectedUserForEdit.id,
                      userData: {
                        firstName: (document.getElementById('editFirstName') as HTMLInputElement)?.value,
                        lastName: (document.getElementById('editLastName') as HTMLInputElement)?.value,
                        company: (document.getElementById('editCompany') as HTMLInputElement)?.value,
                        title: (document.getElementById('editTitle') as HTMLInputElement)?.value,
                      }
                    });
                  }
                }}
                disabled={updateUserMutation.isPending}
                className="bg-[#CD853F] text-black hover:bg-[#CD853F]/80"
              >
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Action Dialog */}
        <Dialog open={userActionDialog} onOpenChange={setUserActionDialog}>
          <DialogContent className="bg-[#1F1F1F] border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle>
                {actionType === 'suspend' ? 'Suspend User' : 
                 actionType === 'activate' ? 'Activate User' : 'Ban User'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedUser && `Are you sure you want to ${actionType} ${selectedUser.firstName} ${selectedUser.lastName}?`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="actionReason" className="text-gray-300">Reason (Optional)</Label>
                <Textarea
                  id="actionReason"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  className="bg-[#141414] border-gray-600 text-white"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUserActionDialog(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmUserAction}
                disabled={userActionMutation.isPending}
                className={
                  actionType === 'suspend' ? "bg-yellow-600 text-black hover:bg-yellow-700" :
                  actionType === 'activate' ? "bg-green-600 text-black hover:bg-green-700" :
                  "bg-red-600 text-black hover:bg-red-700"
                }
              >
                {userActionMutation.isPending ? 'Processing...' : 
                 actionType === 'suspend' ? 'Suspend User' : 
                 actionType === 'activate' ? 'Activate User' : 'Ban User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default AdminDashboard;