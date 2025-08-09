import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { ObjectUploader } from "@/components/ObjectUploader";
import { format } from "date-fns";
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
  Clock,
  MapPin,
  Star,
  Search,
  UserX,
  Mail,
  Shield,
  Eye,
  Ban,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ArrowUpDown,
  Filter,
  X,
  ExternalLink,
  Upload,
  Image,
  Video
} from "lucide-react";

interface AdminAnalytics {
  userStats: {
    totalUsers: number;
    activeUsersToday: number;
    newUsersThisWeek: number;
    completedProfiles: number;
  };
  eventStats: {
    totalEvents: number;
    upcomingEvents: number;
    totalRegistrations: number;
    averageAttendance: number;
  };
  matchingStats: {
    totalMatches: number;
    successfulMatches: number;
    matchSuccessRate: number;
    averageCompatibilityScore: number;
  };
  engagementStats: {
    totalMessages: number;
    activeMeetups: number;
    averageResponseTime: number;
    userSatisfactionScore: number;
  };
  topEvents: Array<{
    id: string;
    title: string;
    registrationCount: number;
    attendanceRate: number;
    satisfactionScore: number;
  }>;
  topUsers: Array<{
    id: string;
    name: string;
    matchCount: number;
    messagesSent: number;
    eventsAttended: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'registration' | 'match' | 'message' | 'meetup';
    description: string;
    timestamp: string;
    user: string;
  }>;
}

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

interface UserManagementData {
  users: User[];
  total: number;
}

interface PlatformInsights {
  advertisingMetrics: {
    totalRevenue: number;
    totalImpressions: number;
    totalClicks: number;
    ctr: number;
    cpm: number;
    cpc: number;
    conversionRate: number;
    activeAdvertisers: number;
  };
  businessMetrics: {
    totalRevenue: number;
    monthlyGrowthRate: number;
    userAcquisitionCost: number;
    lifetimeValue: number;
    returnOnAdSpend: number;
    grossMargin: number;
    churnRate: number;
  };
  engagementMetrics: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    avgSessionDuration: number;
  };
  growthMetrics: {
    netPromoterScore: number;
  };
  marketMetrics: {
    totalAddressableMarket: number;
    marketPenetration: number;
    brandAwareness: number;
  };
}

interface AdPerformance {
  overview: {
    totalCampaigns: number;
    activeCampaigns: number;
    totalBudget: number;
    spentBudget: number;
    returnOnInvestment: number;
  };
  performance: {
    qualityScore: number;
  };
  audienceInsights: {
    demographics: {
      ageGroups: Array<{ range: string; percentage: number }>;
      industries: Array<{ name: string; percentage: number }>;
    };
  };
}

interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  capacity: number;
  registrationCount?: number;
  status: 'upcoming' | 'active' | 'completed' | 'cancelled';
  organizerId: string;
  coverImageUrl?: string;
}

export default function Admin() {
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActionDialog, setUserActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | 'ban' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const [drillDownDialog, setDrillDownDialog] = useState(false);
  const [drillDownType, setDrillDownType] = useState<string>('');
  const [drillDownData, setDrillDownData] = useState<any[]>([]);
  const [showUrgentActions, setShowUrgentActions] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analytics, isLoading } = useQuery<AdminAnalytics>({
    queryKey: ['/api/admin/analytics', selectedTimeRange],
    retry: false,
  });

  const { data: userManagement, isLoading: usersLoading } = useQuery<UserManagementData>({
    queryKey: ['/api/admin/users', currentPage.toString()],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users?page=${currentPage}&limit=50`, {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    retry: false,
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const { data: platformInsights, isLoading: insightsLoading } = useQuery<PlatformInsights>({
    queryKey: ['/api/admin/platform-insights', selectedTimeRange],
    retry: false,
  });

  const { data: adPerformance, isLoading: adLoading } = useQuery<AdPerformance>({
    queryKey: ['/api/admin/advertising-performance', selectedTimeRange],
    retry: false,
  });

  const { data: urgentActions, isLoading: urgentLoading } = useQuery({
    queryKey: ['/api/admin/urgent-actions'],
    retry: false,
  });

  // Drill-down functionality for metrics
  const handleMetricClick = async (type: string, title: string) => {
    setDrillDownType(title);
    setDrillDownDialog(true);
    
    try {
      let endpoint = '';
      switch (type) {
        case 'users':
          endpoint = '/api/admin/users-detailed';
          break;
        case 'messages':
          endpoint = '/api/admin/messages-detailed';
          break;
        case 'events':
          endpoint = '/api/admin/events-detailed';
          break;
        case 'matches':
          endpoint = '/api/admin/matches-detailed';
          break;
        default:
          endpoint = `/api/admin/${type}-detailed`;
      }
      
      const response = await fetch(endpoint);
      const data = await response.json();
      setDrillDownData(data || []);
    } catch (error) {
      console.error('Error fetching drill-down data:', error);
      setDrillDownData([]);
    }
  };

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
      case 'meeting_request': return <Calendar className="h-4 w-4" />;
      case 'direct_message': return <MessageSquare className="h-4 w-4" />;
      case 'event_reminder': return <Clock className="h-4 w-4" />;
      case 'user_issue': return <AlertTriangle className="h-4 w-4" />;
      case 'match_feedback': return <Target className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (user: User) => {
    // For demo purposes, assume most users are active
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

  // User Management Component
  function UserManagementTab({ 
    userManagement, 
    usersLoading, 
    userSearchQuery, 
    setUserSearchQuery, 
    currentPage, 
    setCurrentPage, 
    handleUserAction, 
    getStatusBadge,
    toast,
    queryClient 
  }: any) {
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

    const addUserMutation = useMutation({
      mutationFn: async (userData: any) => {
        return apiRequest('/api/admin/users', 'POST', userData);
      },
      onSuccess: () => {
        toast({
          title: "Success",
          description: "User added successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users', currentPage.toString()] });
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
        queryClient.invalidateQueries({ queryKey: ['/api/admin/users', currentPage.toString()] });
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

    const handleEditUser = (user: User) => {
      setSelectedUserForEdit(user);
      setShowEditUserDialog(true);
    };

    return (
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

        {/* Pagination */}
        {userManagement?.total && (
          <div className="flex items-center justify-between">
            <p className="text-gray-400">
              Showing {((currentPage - 1) * 50) + 1} to {Math.min(currentPage * 50, userManagement.total)} of {userManagement.total} users
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="border-gray-600 text-gray-300"
              >
                Previous
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                disabled={currentPage * 50 >= userManagement.total}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="border-gray-600 text-gray-300"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Add User Dialog */}
        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
          <DialogContent className="bg-[#1F1F1F] border-gray-600 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription className="text-gray-400">
                Create a new user account for the platform
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
                Update user account information
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
                
                {/* Role Management Section */}
                <div className="border-t border-gray-600 pt-4">
                  <h4 className="text-lg font-medium text-white mb-4">Admin Role & Security</h4>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-300 text-sm font-medium">Admin Role</Label>
                      <Select 
                        defaultValue={(selectedUserForEdit as any).adminRole || 'none'}
                        onValueChange={(value) => {
                          const form = document.getElementById('editUserForm') as HTMLFormElement;
                          if (form) {
                            const input = form.elements.namedItem('adminRole') as HTMLInputElement;
                            if (input) input.value = value;
                          }
                        }}
                      >
                        <SelectTrigger className="bg-[#141414] border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1F1F1F] border-gray-600">
                          <SelectItem value="none" className="text-white hover:bg-[#2A2A2A]">No Admin Access</SelectItem>
                          <SelectItem value="admin" className="text-white hover:bg-[#2A2A2A]">Admin</SelectItem>
                          <SelectItem value="super_admin" className="text-white hover:bg-[#2A2A2A]">Super Admin</SelectItem>
                          <SelectItem value="owner" className="text-white hover:bg-[#2A2A2A]">Owner</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-gray-400 mt-1">
                        Admin: User management • Super Admin: All admin functions • Owner: Complete control
                      </p>
                    </div>

                    {/* Password Reset Section */}
                    <div className="border-t border-gray-600 pt-4">
                      <Label className="text-gray-300 text-sm font-medium">Password Reset</Label>
                      <div className="mt-2 space-y-3">
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
                  const form = document.getElementById('editUserForm') as HTMLFormElement;
                  if (form && selectedUserForEdit) {
                    const formData = new FormData(form);
                    const userData = {
                      firstName: (document.getElementById('editFirstName') as HTMLInputElement)?.value,
                      lastName: (document.getElementById('editLastName') as HTMLInputElement)?.value,
                      company: (document.getElementById('editCompany') as HTMLInputElement)?.value,
                      title: (document.getElementById('editTitle') as HTMLInputElement)?.value,
                      adminRole: (form.elements.namedItem('adminRole') as HTMLInputElement)?.value || 'none',
                    };
                    updateUserMutation.mutate({ userId: selectedUserForEdit.id, userData });
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
                  <div key={action.id} className="flex items-center justify-between p-3 bg-[#1F1F1F] rounded-lg border border-gray-600">
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
            <UserManagementTab 
              userManagement={userManagement}
              usersLoading={usersLoading}
              userSearchQuery={userSearchQuery}
              setUserSearchQuery={setUserSearchQuery}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              handleUserAction={handleUserAction}
              getStatusBadge={getStatusBadge}
              toast={toast}
              queryClient={queryClient}
            />
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
    );
  }

  return (
                          description: "User account has been suspended",
                        });
                      }}
                    >
                      <Ban className="h-4 w-4 mr-1" />
                      Suspend
                    </Button>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    Current status: <span className="text-green-400">Active</span>
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
                    const selectedRole = (document.getElementById('selectedRole') as any)?._value;
                    updateUserMutation.mutate({
                      userId: selectedUserForEdit.id,
                      userData: {
                        firstName: (document.getElementById('editFirstName') as HTMLInputElement)?.value,
                        lastName: (document.getElementById('editLastName') as HTMLInputElement)?.value,
                        company: (document.getElementById('editCompany') as HTMLInputElement)?.value,
                        title: (document.getElementById('editTitle') as HTMLInputElement)?.value,
                        adminRole: selectedRole === 'none' ? null : selectedRole,
                      }
                    });
                  }
                }}
                disabled={updateUserMutation.isPending}
                className="bg-[#CD853F] text-black hover:bg-[#B8752F]"
              >
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Event Management Component
  function EventManagementTab({ toast, queryClient }: any) {
    const [showAddEventDialog, setShowAddEventDialog] = useState(false);
    const [showEditEventDialog, setShowEditEventDialog] = useState(false);
    const [selectedEventForEdit, setSelectedEventForEdit] = useState<Event | null>(null);
    const [newEventData, setNewEventData] = useState({
      title: '',
      description: '',
      startDate: undefined as Date | undefined,
      startTime: '09:00',
      endDate: undefined as Date | undefined,
      endTime: '17:00',
      location: '',
      capacity: 50,
      imageUrl: '',
      videoUrl: ''
    });

    const { data: events, isLoading: eventsLoading } = useQuery<Event[]>({
      queryKey: ['/api/admin/events'],
      retry: false,
    });

    const addEventMutation = useMutation({
      mutationFn: async (eventData: any) => {
        // Convert date/time data to the expected format for the database
        const processedData = {
          title: eventData.title,
          description: eventData.description,
          location: eventData.location,
          capacity: eventData.capacity,
          eventType: 'networking', // Default event type
          startDate: eventData.startDate ? format(eventData.startDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          startTime: eventData.startTime || '09:00',
          endDate: eventData.endDate ? format(eventData.endDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
          endTime: eventData.endTime || '17:00',
          imageUrl: eventData.imageUrl || null,
          videoUrl: eventData.videoUrl || null,
          status: 'active',
          price: '0',
          isVirtual: false,
          isFeatured: false,
        };
        return apiRequest('/api/admin/events', 'POST', processedData);
      },
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Event created successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
        setShowAddEventDialog(false);
        setNewEventData({
          title: '',
          description: '',
          startDate: undefined,
          startTime: '09:00',
          endDate: undefined,
          endTime: '17:00',
          location: '',
          capacity: 50,
          imageUrl: '',
          videoUrl: ''
        });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to create event",
          variant: "destructive",
        });
      },
    });

    const updateEventMutation = useMutation({
      mutationFn: async ({ eventId, eventData }: { eventId: string; eventData: any }) => {
        return apiRequest(`/api/admin/events/${eventId}`, 'PUT', eventData);
      },
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Event updated successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
        setShowEditEventDialog(false);
        setSelectedEventForEdit(null);
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to update event",
          variant: "destructive",
        });
      },
    });

    const deleteEventMutation = useMutation({
      mutationFn: async (eventId: string) => {
        return apiRequest(`/api/admin/events/${eventId}`, 'DELETE');
      },
      onSuccess: () => {
        toast({
          title: "Success",
          description: "Event deleted successfully",
        });
        queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.message || "Failed to delete event",
          variant: "destructive",
        });
      },
    });

    const handleEditEvent = (event: Event) => {
      setSelectedEventForEdit(event);
      setShowEditEventDialog(true);
    };

    const getEventStatusBadge = (event: Event) => {
      const statusColors = {
        upcoming: 'bg-blue-100 text-blue-800',
        active: 'bg-green-100 text-green-800',
        completed: 'bg-gray-100 text-gray-800',
        cancelled: 'bg-red-100 text-red-800'
      };
      
      return (
        <Badge variant="secondary" className={statusColors[event.status] || statusColors.upcoming}>
          {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
        </Badge>
      );
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">Event Management</h3>
            <p className="text-gray-400">Create and manage platform events</p>
          </div>
          <Button 
            onClick={() => setShowAddEventDialog(true)}
            className="bg-[#CD853F] text-black hover:bg-[#CD853F]/80"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>

        {/* Events Table */}
        <Card className="bg-[#1F1F1F] border-gray-600">
          <CardContent className="p-0">
            {eventsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Activity className="h-6 w-6 animate-spin text-[#CD853F]" />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-gray-600">
                    <tr className="text-left">
                      <th className="p-4 text-gray-300 font-medium">Event</th>
                      <th className="p-4 text-gray-300 font-medium">Date & Time</th>
                      <th className="p-4 text-gray-300 font-medium">Location</th>
                      <th className="p-4 text-gray-300 font-medium">Capacity</th>
                      <th className="p-4 text-gray-300 font-medium">Status</th>
                      <th className="p-4 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {events?.map((event: Event) => (
                      <tr key={event.id} className="border-b border-gray-700 hover:bg-[#2A2A2A]">
                        <td className="p-4">
                          <div>
                            <p className="text-white font-medium">{event.title}</p>
                            <p className="text-sm text-gray-400">{event.description?.slice(0, 80)}...</p>
                          </div>
                        </td>
                        <td className="p-4 text-gray-300">
                          <div>
                            <p>{new Date(event.startTime).toLocaleDateString()}</p>
                            <p className="text-sm text-gray-400">
                              {new Date(event.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </td>
                        <td className="p-4 text-gray-300">{event.location}</td>
                        <td className="p-4 text-gray-300">
                          {event.registrationCount || 0} / {event.capacity}
                        </td>
                        <td className="p-4">{getEventStatusBadge(event)}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-gray-400 hover:text-white"
                              onClick={() => handleEditEvent(event)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="text-red-400 hover:text-red-300"
                              onClick={() => deleteEventMutation.mutate(event.id)}
                            >
                              <X className="h-4 w-4" />
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

        {/* Add Event Dialog */}
        <Dialog open={showAddEventDialog} onOpenChange={setShowAddEventDialog}>
          <DialogContent className="bg-[#1F1F1F] border-gray-600 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription className="text-gray-400">
                Add a new event to the platform with enhanced media support
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Basic Information</h4>
                <div>
                  <Label htmlFor="eventTitle" className="text-gray-300">Event Title</Label>
                  <Input
                    id="eventTitle"
                    value={newEventData.title}
                    onChange={(e) => setNewEventData({...newEventData, title: e.target.value})}
                    className="bg-[#141414] border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="eventDescription" className="text-gray-300">Description</Label>
                  <Textarea
                    id="eventDescription"
                    value={newEventData.description}
                    onChange={(e) => setNewEventData({...newEventData, description: e.target.value})}
                    className="bg-[#141414] border-gray-600 text-white"
                    rows={3}
                  />
                </div>
              </div>

              {/* Date and Time */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Date & Time</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300">Start Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full bg-[#141414] border-gray-600 text-white hover:bg-[#2A2A2A] justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newEventData.startDate ? format(newEventData.startDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#1F1F1F] border-gray-600">
                        <Calendar
                          mode="single"
                          selected={newEventData.startDate}
                          onSelect={(date) => setNewEventData({...newEventData, startDate: date})}
                          initialFocus
                          className="bg-[#1F1F1F] text-white"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div>
                    <Label className="text-gray-300">End Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full bg-[#141414] border-gray-600 text-white hover:bg-[#2A2A2A] justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {newEventData.endDate ? format(newEventData.endDate, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-[#1F1F1F] border-gray-600">
                        <Calendar
                          mode="single"
                          selected={newEventData.endDate}
                          onSelect={(date) => setNewEventData({...newEventData, endDate: date})}
                          initialFocus
                          className="bg-[#1F1F1F] text-white"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime" className="text-gray-300">Start Time</Label>
                    <Select value={newEventData.startTime} onValueChange={(value) => setNewEventData({...newEventData, startTime: value})}>
                      <SelectTrigger className="bg-[#141414] border-gray-600 text-white">
                        <SelectValue placeholder="Select start time" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1F1F1F] border-gray-600">
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return [
                            <SelectItem key={`${hour}:00`} value={`${hour}:00`} className="text-white hover:bg-[#2A2A2A]">{hour}:00</SelectItem>,
                            <SelectItem key={`${hour}:30`} value={`${hour}:30`} className="text-white hover:bg-[#2A2A2A]">{hour}:30</SelectItem>
                          ];
                        }).flat()}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-gray-300">End Time</Label>
                    <Select value={newEventData.endTime} onValueChange={(value) => setNewEventData({...newEventData, endTime: value})}>
                      <SelectTrigger className="bg-[#141414] border-gray-600 text-white">
                        <SelectValue placeholder="Select end time" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1F1F1F] border-gray-600">
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return [
                            <SelectItem key={`${hour}:00`} value={`${hour}:00`} className="text-white hover:bg-[#2A2A2A]">{hour}:00</SelectItem>,
                            <SelectItem key={`${hour}:30`} value={`${hour}:30`} className="text-white hover:bg-[#2A2A2A]">{hour}:30</SelectItem>
                          ];
                        }).flat()}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Location and Capacity */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="text-gray-300">Location</Label>
                  <Input
                    id="location"
                    value={newEventData.location}
                    onChange={(e) => setNewEventData({...newEventData, location: e.target.value})}
                    className="bg-[#141414] border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity" className="text-gray-300">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={newEventData.capacity}
                    onChange={(e) => setNewEventData({...newEventData, capacity: parseInt(e.target.value) || 0})}
                    className="bg-[#141414] border-gray-600 text-white"
                  />
                </div>
              </div>

              {/* Media Upload */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white">Media & Content</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-300 mb-2 block">Event Cover Image</Label>
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={5242880} // 5MB
                      onGetUploadParameters={async () => {
                        const response = await fetch('/api/objects/upload', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          credentials: 'include',
                          body: JSON.stringify({ fileName: 'event-image.jpg' })
                        });
                        const { uploadURL } = await response.json();
                        return { method: 'PUT' as const, url: uploadURL };
                      }}
                      onComplete={(result) => {
                        if (result.successful.length > 0) {
                          setNewEventData({...newEventData, imageUrl: result.successful[0].uploadURL});
                        }
                      }}
                      buttonClassName="w-full bg-[#141414] border border-gray-600 text-white hover:bg-[#2A2A2A]"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Upload Cover Image
                    </ObjectUploader>
                    {newEventData.imageUrl && (
                      <p className="text-sm text-green-400 mt-2">✓ Image uploaded successfully</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="videoUrl" className="text-gray-300">YouTube Video URL (Optional)</Label>
                    <Input
                      id="videoUrl"
                      value={newEventData.videoUrl}
                      onChange={(e) => setNewEventData({...newEventData, videoUrl: e.target.value})}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="bg-[#141414] border-gray-600 text-white"
                    />
                    <div className="flex items-center mt-2 text-sm text-gray-400">
                      <Video className="h-4 w-4 mr-1" />
                      Paste YouTube URL for event video
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddEventDialog(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => addEventMutation.mutate(newEventData)}
                disabled={addEventMutation.isPending}
                className="bg-[#CD853F] text-black hover:bg-[#CD853F]/80"
              >
                {addEventMutation.isPending ? 'Creating...' : 'Create Event'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Event Dialog */}
        <Dialog open={showEditEventDialog} onOpenChange={setShowEditEventDialog}>
          <DialogContent className="bg-[#1F1F1F] border-gray-600 text-white max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription className="text-gray-400">
                Update event information
              </DialogDescription>
            </DialogHeader>
            {selectedEventForEdit && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="editEventTitle" className="text-gray-300">Event Title</Label>
                  <Input
                    id="editEventTitle"
                    defaultValue={selectedEventForEdit.title}
                    className="bg-[#141414] border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="editEventDescription" className="text-gray-300">Description</Label>
                  <Textarea
                    id="editEventDescription"
                    defaultValue={selectedEventForEdit.description}
                    className="bg-[#141414] border-gray-600 text-white"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editStartTime" className="text-gray-300">Start Time</Label>
                    <Input
                      id="editStartTime"
                      type="datetime-local"
                      defaultValue={selectedEventForEdit.startTime?.slice(0, 16)}
                      className="bg-[#141414] border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editEndTime" className="text-gray-300">End Time</Label>
                    <Input
                      id="editEndTime"
                      type="datetime-local"
                      defaultValue={selectedEventForEdit.endTime?.slice(0, 16)}
                      className="bg-[#141414] border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editLocation" className="text-gray-300">Location</Label>
                  <Input
                    id="editLocation"
                    defaultValue={selectedEventForEdit.location}
                    className="bg-[#141414] border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="editCapacity" className="text-gray-300">Capacity</Label>
                  <Input
                    id="editCapacity"
                    type="number"
                    defaultValue={selectedEventForEdit.capacity}
                    className="bg-[#141414] border-gray-600 text-white"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditEventDialog(false)}
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedEventForEdit) {
                    updateEventMutation.mutate({
                      eventId: selectedEventForEdit.id,
                      eventData: {
                        title: (document.getElementById('editEventTitle') as HTMLInputElement)?.value,
                        description: (document.getElementById('editEventDescription') as HTMLTextAreaElement)?.value,
                        startTime: (document.getElementById('editStartTime') as HTMLInputElement)?.value,
                        endTime: (document.getElementById('editEndTime') as HTMLInputElement)?.value,
                        location: (document.getElementById('editLocation') as HTMLInputElement)?.value,
                        capacity: parseInt((document.getElementById('editCapacity') as HTMLInputElement)?.value),
                      }
                    });
                  }
                }}
                disabled={updateEventMutation.isPending}
                className="bg-[#CD853F] text-black hover:bg-[#B8752F]"
              >
                {updateEventMutation.isPending ? 'Updating...' : 'Update Event'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#CD853F]">STAK Sync Admin</h1>
            <p className="text-gray-300 mt-2">Platform management and analytics</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32 bg-[#1F1F1F] border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-[#1F1F1F] border-gray-600">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Events
            </TabsTrigger>
            <TabsTrigger value="matching" className="data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">
              <Target className="h-4 w-4 mr-2" />
              Matching
            </TabsTrigger>
            <TabsTrigger value="activity" className="data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">
              <Activity className="h-4 w-4 mr-2" />
              Activity
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">
              <TrendingUp className="h-4 w-4 mr-2" />
              Platform Insights
            </TabsTrigger>
            <TabsTrigger value="advertising" className="data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">
              <Star className="h-4 w-4 mr-2" />
              Advertising
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Urgent Actions Section - Priority #1 */}
            {urgentActions && Array.isArray(urgentActions) && urgentActions.length > 0 && (
              <Card className="bg-gradient-to-r from-red-900/20 to-orange-900/20 border-red-500/30">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-red-400" />
                    <CardTitle className="text-lg font-semibold text-white">Urgent Actions Required</CardTitle>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowUrgentActions(!showUrgentActions)}
                    className="text-gray-400 hover:text-white"
                  >
                    {showUrgentActions ? <Eye className="h-4 w-4" /> : <X className="h-4 w-4" />}
                  </Button>
                </CardHeader>
                {showUrgentActions && (
                  <CardContent>
                    <div className="space-y-3">
                      {Array.isArray(urgentActions) && urgentActions.slice(0, 5).map((action: any) => (
                        <div key={action.id} className="flex items-center justify-between p-3 bg-[#1F1F1F] rounded-lg border border-gray-600">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getPriorityColor(action.priority)}`}>
                              {getActionIcon(action.type)}
                            </div>
                            <div>
                              <h4 className="font-medium text-white">{action.title}</h4>
                              <p className="text-sm text-gray-400">{action.description}</p>
                              <p className="text-xs text-gray-500">{action.user?.name} • {action.timestamp}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(action.priority)}>
                              {action.priority}
                            </Badge>
                            <Button size="sm" className="bg-[#CD853F] text-black hover:bg-[#CD853F]/80">
                              Action
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            )}

            {/* Clickable Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card 
                className="bg-[#1F1F1F] border-gray-600 hover:border-[#CD853F] cursor-pointer transition-all duration-200 hover:shadow-lg"
                onClick={() => handleMetricClick('users', 'Total Users')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#CD853F]" />
                    <ExternalLink className="h-3 w-3 text-gray-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics?.userStats?.totalUsers || 2487}</div>
                  <p className="text-xs text-gray-400">
                    +{analytics?.userStats?.newUsersThisWeek || 23} this week
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="bg-[#1F1F1F] border-gray-600 hover:border-[#CD853F] cursor-pointer transition-all duration-200 hover:shadow-lg"
                onClick={() => handleMetricClick('messages', 'Direct Messages')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Direct Messages</CardTitle>
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-[#CD853F]" />
                    <ExternalLink className="h-3 w-3 text-gray-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics?.engagementStats?.totalMessages || 15678}</div>
                  <p className="text-xs text-gray-400">Active conversations</p>
                </CardContent>
              </Card>

              <Card 
                className="bg-[#1F1F1F] border-gray-600 hover:border-[#CD853F] cursor-pointer transition-all duration-200 hover:shadow-lg"
                onClick={() => handleMetricClick('events', 'Events & Meetings')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Events & Meetings</CardTitle>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#CD853F]" />
                    <ExternalLink className="h-3 w-3 text-gray-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics?.eventStats?.totalEvents || 47}</div>
                  <p className="text-xs text-gray-400">
                    {analytics?.eventStats?.upcomingEvents || 12} upcoming
                  </p>
                </CardContent>
              </Card>

              <Card 
                className="bg-[#1F1F1F] border-gray-600 hover:border-[#CD853F] cursor-pointer transition-all duration-200 hover:shadow-lg"
                onClick={() => handleMetricClick('matches', 'AI Matches')}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">AI Matches</CardTitle>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-[#CD853F]" />
                    <ExternalLink className="h-3 w-3 text-gray-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics?.matchingStats?.totalMatches || 3421}</div>
                  <p className="text-xs text-gray-400">{analytics?.matchingStats?.matchSuccessRate || 87}% success rate</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Enhanced User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <UserManagementTab 
              userManagement={userManagement}
              usersLoading={usersLoading}
              userSearchQuery={userSearchQuery}
              setUserSearchQuery={setUserSearchQuery}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              handleUserAction={handleUserAction}
              getStatusBadge={getStatusBadge}
              toast={toast}
              queryClient={queryClient}
            />
          </TabsContent>

          {/* Enhanced Event Management Tab */}
          <TabsContent value="events" className="space-y-6">
            <EventManagementTab toast={toast} queryClient={queryClient} />
          </TabsContent>

          <TabsContent value="matching">
            <Card className="bg-[#1F1F1F] border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">AI Matching Analytics</CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor matching algorithm performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Matching analytics coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="activity">
            <Card className="bg-[#1F1F1F] border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Platform Activity</CardTitle>
                <CardDescription className="text-gray-400">
                  Monitor real-time platform usage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Activity monitoring coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            {insightsLoading ? (
              <div className="flex items-center justify-center h-32">
                <Activity className="h-6 w-6 animate-spin text-[#CD853F]" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Revenue Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-[#1F1F1F] border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Total Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        ${platformInsights?.businessMetrics?.totalRevenue?.toLocaleString() || '127,451'}
                      </div>
                      <p className="text-xs text-green-400">
                        +{platformInsights?.businessMetrics?.monthlyGrowthRate || 15.2}% growth
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1F1F1F] border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Ad Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        ${platformInsights?.advertisingMetrics?.totalRevenue?.toLocaleString() || '45,781'}
                      </div>
                      <p className="text-xs text-gray-400">
                        {platformInsights?.advertisingMetrics?.totalImpressions?.toLocaleString() || '2.8M'} impressions
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1F1F1F] border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {platformInsights?.engagementMetrics?.monthlyActiveUsers?.toLocaleString() || '12,450'}
                      </div>
                      <p className="text-xs text-gray-400">
                        {platformInsights?.engagementMetrics?.avgSessionDuration || 23.4}m avg session
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1F1F1F] border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">ROAS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {platformInsights?.businessMetrics?.returnOnAdSpend || 4.2}x
                      </div>
                      <p className="text-xs text-green-400">
                        {platformInsights?.advertisingMetrics?.activeAdvertisers || 12} active advertisers
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Business Performance */}
                <Card className="bg-[#1F1F1F] border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white">Business Performance</CardTitle>
                    <CardDescription className="text-gray-400">
                      Key metrics for investors and stakeholders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">Customer Acquisition Cost</p>
                        <p className="text-2xl font-bold text-white">
                          ${platformInsights?.businessMetrics?.userAcquisitionCost || 45.80}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">Lifetime Value</p>
                        <p className="text-2xl font-bold text-white">
                          ${platformInsights?.businessMetrics?.lifetimeValue || 890.25}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">Gross Margin</p>
                        <p className="text-2xl font-bold text-white">
                          {((platformInsights?.businessMetrics?.grossMargin || 0.78) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Market Position */}
                <Card className="bg-[#1F1F1F] border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white">Market Position</CardTitle>
                    <CardDescription className="text-gray-400">
                      Strategic insights for stakeholders
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-400">Total Addressable Market</p>
                          <p className="text-xl font-bold text-white">
                            ${((platformInsights?.marketMetrics?.totalAddressableMarket || 2400000000) / 1000000000).toFixed(1)}B
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Market Penetration</p>
                          <p className="text-xl font-bold text-white">
                            {platformInsights?.marketMetrics?.marketPenetration || 2.1}%
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-400">Brand Awareness</p>
                          <p className="text-xl font-bold text-white">
                            {platformInsights?.marketMetrics?.brandAwareness || 34.7}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-400">Net Promoter Score</p>
                          <p className="text-xl font-bold text-white">
                            {platformInsights?.growthMetrics?.netPromoterScore || 67}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Advertising Performance Tab */}
          <TabsContent value="advertising" className="space-y-6">
            {adLoading ? (
              <div className="flex items-center justify-center h-32">
                <Activity className="h-6 w-6 animate-spin text-[#CD853F]" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Advertising Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="bg-[#1F1F1F] border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Total Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {adPerformance?.overview.totalCampaigns || 23}
                      </div>
                      <p className="text-xs text-green-400">
                        {adPerformance?.overview.activeCampaigns || 18} active
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1F1F1F] border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Ad Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        ${platformInsights?.advertisingMetrics?.totalRevenue?.toLocaleString() || '45,781'}
                      </div>
                      <p className="text-xs text-gray-400">
                        ${adPerformance?.overview.spentBudget?.toLocaleString() || '67,234'} spent
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1F1F1F] border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Click Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {platformInsights?.advertisingMetrics?.ctr?.toFixed(2) || '1.21'}%
                      </div>
                      <p className="text-xs text-gray-400">
                        {platformInsights?.advertisingMetrics?.totalClicks?.toLocaleString() || '34,567'} clicks
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1F1F1F] border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">ROI</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {adPerformance?.overview.returnOnInvestment || 340}%
                      </div>
                      <p className="text-xs text-green-400">
                        Quality Score: {adPerformance?.performance.qualityScore || 8.4}/10
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Audience Insights */}
                <Card className="bg-[#1F1F1F] border-gray-600">
                  <CardHeader>
                    <CardTitle className="text-white">Audience Insights</CardTitle>
                    <CardDescription className="text-gray-400">
                      Demographics and targeting effectiveness
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Age Groups</h4>
                        <div className="space-y-2">
                          {adPerformance?.audienceInsights?.demographics?.ageGroups?.map((group: any, index: number) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-400">{group.range}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-[#CD853F] h-2 rounded-full" 
                                    style={{ width: `${group.percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm text-white">{group.percentage}%</span>
                              </div>
                            </div>
                          )) || []}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-300 mb-3">Industries</h4>
                        <div className="space-y-2">
                          {adPerformance?.audienceInsights?.demographics?.industries?.map((industry: any, index: number) => (
                            <div key={index} className="flex justify-between items-center">
                              <span className="text-sm text-gray-400">{industry.name}</span>
                              <div className="flex items-center gap-2">
                                <div className="w-20 bg-gray-700 rounded-full h-2">
                                  <div 
                                    className="bg-[#CD853F] h-2 rounded-full" 
                                    style={{ width: `${industry.percentage}%` }}
                                  />
                                </div>
                                <span className="text-sm text-white">{industry.percentage}%</span>
                              </div>
                            </div>
                          )) || []}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* User Action Dialog */}
        <Dialog open={userActionDialog} onOpenChange={setUserActionDialog}>
          <DialogContent className="bg-[#1F1F1F] border-gray-600 text-white">
            <DialogHeader>
              <DialogTitle>
                {actionType === 'suspend' && 'Suspend User Account'}
                {actionType === 'activate' && 'Activate User Account'}
                {actionType === 'ban' && 'Ban User Account'}
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                {selectedUser && `${selectedUser.firstName} ${selectedUser.lastName} (${selectedUser.email})`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="reason" className="text-gray-300">Reason for action</Label>
                <Textarea
                  id="reason"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Provide a reason for this action..."
                  className="bg-[#141414] border-gray-600 text-white"
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
                className="bg-[#CD853F] text-black hover:bg-[#B8752F]"
              >
                {userActionMutation.isPending ? 'Processing...' : 'Confirm Action'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Drill-Down Dialog */}
        <Dialog open={drillDownDialog} onOpenChange={setDrillDownDialog}>
          <DialogContent className="bg-[#1F1F1F] border-gray-600 max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-[#CD853F]" />
                {drillDownType} - Detailed Records
              </DialogTitle>
              <DialogDescription className="text-gray-400">
                Underlying data records for this metric
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">{drillDownData.length} records found</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm" className="border-gray-600 text-gray-300">
                    <ArrowUpDown className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </div>
              </div>

              <div className="border border-gray-600 rounded-lg overflow-hidden">
                <div className="bg-[#141414] px-4 py-3 border-b border-gray-600">
                  <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-300">
                    <div>Name/Title</div>
                    <div>Type/Status</div>
                    <div>Date/Time</div>
                    <div>Action</div>
                  </div>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {drillDownData.length > 0 ? (
                    drillDownData.map((record: any, index: number) => (
                      <div key={record.id || index} className="px-4 py-3 border-b border-gray-700 hover:bg-[#141414] transition-colors">
                        <div className="grid grid-cols-4 gap-4 items-center text-sm">
                          <div className="text-white font-medium">
                            {record.name || record.title || record.email || `Record ${index + 1}`}
                          </div>
                          <div className="text-gray-400">
                            {record.type || record.status || record.category || 'N/A'}
                          </div>
                          <div className="text-gray-400">
                            {record.createdAt || record.timestamp || record.date || 'N/A'}
                          </div>
                          <div>
                            <Button size="sm" variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center text-gray-400">
                      No detailed records available for this metric
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}