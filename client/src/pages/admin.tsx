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
import { Link } from "wouter";
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
  ChevronRight,
  CreditCard
} from "lucide-react";
import { STAKReceptionImport } from "@/components/STAKReceptionImport";
import { ObjectUploader } from "@/components/ObjectUploader";
import { AIMatchmakingManager } from "@/components/AIMatchmakingManager";
import { BadgeManager } from "@/components/BadgeManager";
import { Calculator, Brain, Award } from "lucide-react";

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
  const [showCreateEventDialog, setShowCreateEventDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("analytics");
  const [taxRates, setTaxRates] = useState<any>(null);
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    eventType: 'networking',
    startDate: '',
    startTime: '09:00',
    location: '',
    capacity: 50,
    isVirtual: false,
    isFeatured: false,
    coverImageUrl: '',
    videoUrl: ''
  });
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    title: '',
    adminRole: '',
    isStakTeamMember: false
  });
  const [activeInsightView, setActiveInsightView] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);

  // Data fetching
  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics/30d'],
  });

  const { data: userManagement, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['/api/admin/users', { page: currentPage, limit: 50, search: userSearchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      });
      
      if (userSearchQuery.trim()) {
        params.set('search', userSearchQuery.trim());
      }
      
      const res = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        console.error('Failed to fetch users:', res.status, res.statusText);
        // Return empty data instead of throwing
        return { users: [], total: 0 };
      }
      
      return res.json();
    },
    retry: false, // Don't retry on auth errors
    staleTime: 0, // Don't cache - always fetch fresh data for admin panel
    refetchOnWindowFocus: true, // Refetch when tab becomes active
  });

  const { data: urgentActions } = useQuery({
    queryKey: ['/api/admin/urgent-actions'],
  });

  // Add admin events query to show actual event data with admin privileges
  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/admin/events'],
    retry: false, // Don't retry if endpoint doesn't exist
  });

  const { data: searchSuggestions, isLoading: searchLoading } = useQuery({
    queryKey: ['/api/admin/users/search', userSearchQuery],
    queryFn: async () => {
      if (!userSearchQuery.trim()) return [];
      
      const res = await fetch(`/api/admin/users/search?q=${encodeURIComponent(userSearchQuery)}`, {
        credentials: 'include',
      });
      
      if (!res.ok) return [];
      
      return res.json();
    },
    enabled: userSearchQuery.length >= 2,
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics/30d'] });
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
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics/30d'] });
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
      // Invalidate all user queries
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/users'], 
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/analytics/30d'] 
      });
      // Force refetch current page
      queryClient.refetchQueries({ 
        queryKey: ['/api/admin/users', { page: currentPage, limit: 50, search: userSearchQuery }],
        exact: true 
      });
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
      // Invalidate all user-related queries with proper key structure
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/users'], 
        exact: false 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/admin/analytics/30d'] 
      });
      // Force immediate refetch of current page to update the UI
      queryClient.refetchQueries({ 
        queryKey: ['/api/admin/users', { page: currentPage, limit: 50, search: userSearchQuery }],
        exact: true 
      });
      // Also refetch the analytics to update user counts
      queryClient.refetchQueries({ 
        queryKey: ['/api/admin/analytics/30d'] 
      });
      // Force a complete cache refresh to ensure immediate UI update
      queryClient.invalidateQueries();
      queryClient.refetchQueries();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return apiRequest('/api/admin/events', 'POST', eventData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Event created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/events'] });
      setShowCreateEventDialog(false);
      setEventData({
        title: '',
        description: '',
        eventType: 'networking',
        startDate: '',
        startTime: '09:00',
        location: '',
        capacity: 50,
        isVirtual: false,
        isFeatured: false,
        coverImageUrl: '',
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
      setShowCreateEventDialog(false);
      setEditingEventId(null);
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
      <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Activity className="h-8 w-8 animate-spin mx-auto mb-4 text-navy" />
              <p className="text-gray-600">Loading admin dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-navy">STAK Sync Admin</h1>
          <p className="text-gray-600">Comprehensive platform management and analytics</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-gray-100 border border-gray-200 shadow-sm">
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:border data-[state=active]:border-gray-300 data-[state=active]:shadow-sm text-gray-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:border data-[state=active]:border-gray-300 data-[state=active]:shadow-sm text-gray-600" onClick={() => window.location.href = '/admin/users'}>
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="events" className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:border data-[state=active]:border-gray-300 data-[state=active]:shadow-sm text-gray-600">
              <CalendarIcon className="h-4 w-4 mr-2" />
              Event Management
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:border data-[state=active]:border-gray-300 data-[state=active]:shadow-sm text-gray-600">
              <PieChart className="h-4 w-4 mr-2" />
              Platform Insights
            </TabsTrigger>
            <TabsTrigger value="billing" className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:border data-[state=active]:border-gray-300 data-[state=active]:shadow-sm text-gray-600" onClick={() => window.location.href = '/admin/billing'}>
              <CreditCard className="h-4 w-4 mr-2" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="tax" className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:border data-[state=active]:border-gray-300 data-[state=active]:shadow-sm text-gray-600">
              <Calculator className="h-4 w-4 mr-2" />
              Tax
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:border data-[state=active]:border-gray-300 data-[state=active]:shadow-sm text-gray-600" onClick={() => window.location.href = '/admin/sponsors'}>
              <Settings className="h-4 w-4 mr-2" />
              Sponsors
            </TabsTrigger>
            <TabsTrigger value="import" className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:border data-[state=active]:border-gray-300 data-[state=active]:shadow-sm text-gray-600">
              <Users className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
            <TabsTrigger value="ai-matching" className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:border data-[state=active]:border-gray-300 data-[state=active]:shadow-sm text-gray-600">
              <Brain className="h-4 w-4 mr-2" />
              AI Matching
            </TabsTrigger>
            <TabsTrigger value="badges" className="data-[state=active]:bg-white data-[state=active]:text-navy data-[state=active]:border data-[state=active]:border-gray-300 data-[state=active]:shadow-sm text-gray-600">
              <Award className="h-4 w-4 mr-2" />
              Badges
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{(analytics as any)?.userStats?.totalUsers || 0}</div>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600 font-semibold">+{(analytics as any)?.userStats?.newUsersThisWeek || 0} this week</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">Active Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{(analytics as any)?.eventStats?.upcomingEvents || 0}</div>
                  <div className="flex items-center mt-2">
                    <CalendarIcon className="h-4 w-4 text-blue-600 mr-1" />
                    <span className="text-sm text-blue-600 font-semibold">{(analytics as any)?.eventStats?.totalRegistrations || 0} registrations</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">Matches Made</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{(analytics as any)?.matchingStats?.totalMatches || 0}</div>
                  <div className="flex items-center mt-2">
                    <Target className="h-4 w-4 text-[#CD853F] mr-1" />
                    <span className="text-sm text-[#CD853F] font-semibold">{(analytics as any)?.matchingStats?.matchSuccessRate || 0}% success rate</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-900">Messages Sent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">{(analytics as any)?.engagementStats?.totalMessages || 0}</div>
                  <div className="flex items-center mt-2">
                    <MessageSquare className="h-4 w-4 text-purple-600 mr-1" />
                    <span className="text-sm text-purple-600 font-semibold">{(analytics as any)?.engagementStats?.activeMeetups || 0} active meetups</span>
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
                  <h3 className="text-xl font-semibold text-navy">User Management</h3>
                  <p className="text-gray-600">Manage user accounts and permissions</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={userSearchQuery}
                      onChange={(e) => setUserSearchQuery(e.target.value)}
                      className="pl-10 bg-white border-gray-300 text-gray-900 w-64 focus:border-navy"
                    />
                    {userSearchQuery.length >= 2 && searchSuggestions && searchSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 z-50 max-h-48 overflow-y-auto shadow-lg">
                        {searchSuggestions.map((user: any) => (
                          <div
                            key={user.id}
                            className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                            onClick={() => {
                              setUserSearchQuery(user.email);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-navy flex items-center justify-center text-white text-xs font-semibold">
                                {user.firstName?.[0] || user.email[0].toUpperCase()}
                              </div>
                              <div>
                                <p className="text-gray-900 text-sm">
                                  {user.firstName && user.lastName 
                                    ? `${user.firstName} ${user.lastName}` 
                                    : user.email.split('@')[0]
                                  }
                                </p>
                                <p className="text-gray-600 text-xs">{user.email}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button 
                    onClick={() => setShowAddUserDialog(true)}
                    className="bg-navy text-white hover:bg-navy/90"
                  >
                    <UserCheck className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </div>

              {/* Users Table */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardContent className="p-0">
                  {usersLoading ? (
                    <div className="flex items-center justify-center h-32">
                      <Activity className="h-6 w-6 animate-spin text-navy" />
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b border-gray-200 bg-gray-50">
                          <tr className="text-left">
                            <th className="p-4 text-gray-700 font-medium">User</th>
                            <th className="p-4 text-gray-700 font-medium">Email</th>
                            <th className="p-4 text-gray-700 font-medium">Role</th>
                            <th className="p-4 text-gray-700 font-medium">Status</th>
                            <th className="p-4 text-gray-700 font-medium">Joined</th>
                            <th className="p-4 text-gray-700 font-medium">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {!userManagement && !usersLoading && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-600">
                                Unable to load user data. Please refresh the page.
                              </td>
                            </tr>
                          )}
                          {userManagement?.users?.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-gray-600">
                                No users found. Try adjusting your search or check the system.
                              </td>
                            </tr>
                          )}
                          {userManagement?.users?.map((user: User) => (
                            <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-50">
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-navy flex items-center justify-center text-white font-semibold">
                                    {user.firstName?.[0] || user.email[0].toUpperCase()}
                                  </div>
                                  <div>
                                    <Link href={`/admin/user/${user.id}`}>
                                      <p className="text-gray-900 font-medium hover:text-stak-copper cursor-pointer transition-colors">
                                        {user.firstName && user.lastName 
                                          ? `${user.firstName} ${user.lastName}` 
                                          : user.email.split('@')[0]
                                        }
                                      </p>
                                    </Link>
                                    <p className="text-sm text-gray-600">{user.company || 'No company'}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="p-4 text-gray-700">{user.email}</td>
                              <td className="p-4">
                                {(user as any).adminRole ? (
                                  <Badge variant="default" className="bg-copper text-white">
                                    {(user as any).adminRole === 'owner' ? 'Owner' : 
                                     (user as any).adminRole === 'super_admin' ? 'Super Admin' : 'Admin'}
                                  </Badge>
                                ) : (
                                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                    User
                                  </Badge>
                                )}
                              </td>
                              <td className="p-4">{getStatusBadge(user)}</td>
                              <td className="p-4 text-gray-700">
                                {new Date(user.createdAt).toLocaleDateString()}
                              </td>
                              <td className="p-4">
                                <div className="flex items-center gap-1">
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleEditUser(user)}
                                    title="Edit User"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                                    onClick={() => handleUserAction(user, 'suspend')}
                                    title="Suspend User"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleUserAction(user, 'activate')}
                                    title="Activate User"
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => {
                                      if (confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`)) {
                                        deleteUserMutation.mutate(user.id);
                                      }
                                    }}
                                    title="Delete User"
                                    disabled={deleteUserMutation.isPending}
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
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-navy">Event Management</h3>
                  <p className="text-gray-600">Create and manage platform events</p>
                </div>
                <Button 
                  onClick={() => setShowCreateEventDialog(true)}
                  className="bg-[#CD853F] text-black hover:bg-[#CD853F]/80"
                >
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
              </div>

              {/* Show events if they exist, otherwise show empty state */}
              {events && Array.isArray(events) && events.length > 0 ? (
                <Card className="bg-white border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-navy">Platform Events</CardTitle>
                    <CardDescription className="text-gray-600">
                      Manage your platform events and registrations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {events.map((event: any) => (
                        <div key={event.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                          <div className="flex-1">
                            <h4 className="text-lg font-semibold text-navy">{event.title}</h4>
                            <p className="text-gray-600 text-sm mt-1">{event.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                              <span>📅 {new Date(event.startDate).toLocaleDateString()}</span>
                              <span>📍 {event.location}</span>
                              <span>👥 {event.capacity} capacity</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-white bg-navy border-navy px-3 py-1">
                              {event.eventType}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="default"
                              className="bg-navy text-white hover:bg-navy/80 border-navy font-medium"
                              onClick={() => {
                                // Set the event data for editing
                                setEventData({
                                  title: event.title,
                                  description: event.description,
                                  eventType: event.eventType,
                                  startDate: new Date(event.startDate).toISOString().split('T')[0],
                                  startTime: new Date(event.startDate).toTimeString().slice(0, 5),
                                  location: event.location,
                                  capacity: event.capacity,
                                  isVirtual: event.isVirtual || false,
                                  isFeatured: event.isFeatured || false,
                                  coverImageUrl: event.coverImageUrl || '',
                                  videoUrl: event.videoUrl || ''
                                });
                                setEditingEventId(event.id);
                                setShowCreateEventDialog(true);
                              }}
                            >
                              Edit
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-2"
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
                                  deleteEventMutation.mutate(event.id);
                                }
                              }}
                              title="Delete Event"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white border border-gray-200">
                  <CardContent className="p-6">
                    <div className="text-center py-8">
                      <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold text-navy mb-2">No Events Yet</h3>
                      <p className="text-gray-600 mb-4">Create your first event to get started</p>
                      <Button 
                        onClick={() => setShowCreateEventDialog(true)}
                        className="bg-[#CD853F] text-black hover:bg-[#CD853F]/80"
                      >
                        Create First Event
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="insights">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-navy mb-2">Platform Insights</h3>
                <p className="text-gray-600">Advanced analytics and business intelligence</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Revenue Analytics */}
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer" 
                      onClick={() => setActiveInsightView('revenue')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900 flex items-center justify-between">
                      Total Revenue
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">$47,500</div>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                      <span className="text-sm text-green-600 font-semibold">+12.5% vs last month</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Click to view breakdown</div>
                  </CardContent>
                </Card>

                {/* User Acquisition Cost */}
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setActiveInsightView('acquisition')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900 flex items-center justify-between">
                      User Acquisition Cost
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">$24.50</div>
                    <div className="flex items-center mt-2">
                      <Target className="h-4 w-4 text-blue-600 mr-1" />
                      <span className="text-sm text-blue-600 font-semibold">-8.2% vs last month</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Click to view channel breakdown</div>
                  </CardContent>
                </Card>

                {/* Lifetime Value */}
                <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setActiveInsightView('ltv')}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-900 flex items-center justify-between">
                      Customer LTV
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">$180.25</div>
                    <div className="flex items-center mt-2">
                      <Activity className="h-4 w-4 text-[#CD853F] mr-1" />
                      <span className="text-sm text-[#CD853F] font-semibold">+15.8% vs last month</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">Click to view cohort analysis</div>
                  </CardContent>
                </Card>
              </div>

              {/* Insight Drill-Down Modal */}
              {activeInsightView && (
                <Card className="bg-white border border-gray-200 shadow-sm mb-6">
                  <CardHeader>
                    <CardTitle className="text-navy flex items-center justify-between">
                      {activeInsightView === 'revenue' ? 'Revenue Breakdown' :
                       activeInsightView === 'acquisition' ? 'User Acquisition Details' :
                       'Customer LTV Analysis'}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setActiveInsightView(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕ Close
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activeInsightView === 'revenue' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Subscriptions</h4>
                          <p className="text-2xl font-bold text-gray-900">$32,100</p>
                          <p className="text-sm text-gray-600">67.6% of total revenue</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Events</h4>
                          <p className="text-2xl font-bold text-gray-900">$12,800</p>
                          <p className="text-sm text-gray-600">26.9% of total revenue</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Advertising</h4>
                          <p className="text-2xl font-bold text-gray-900">$2,600</p>
                          <p className="text-sm text-gray-600">5.5% of total revenue</p>
                        </div>
                      </div>
                    )}
                    
                    {activeInsightView === 'acquisition' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Organic</h4>
                          <p className="text-2xl font-bold text-gray-900">$18.20</p>
                          <p className="text-sm text-gray-600">45% of new users</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Paid Social</h4>
                          <p className="text-2xl font-bold text-gray-900">$31.80</p>
                          <p className="text-sm text-gray-600">35% of new users</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Referrals</h4>
                          <p className="text-2xl font-bold text-gray-900">$12.40</p>
                          <p className="text-sm text-gray-600">15% of new users</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">Events</h4>
                          <p className="text-2xl font-bold text-gray-900">$8.90</p>
                          <p className="text-sm text-gray-600">5% of new users</p>
                        </div>
                      </div>
                    )}
                    
                    {activeInsightView === 'ltv' && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">0-6 Months</h4>
                          <p className="text-2xl font-bold text-gray-900">$85.50</p>
                          <p className="text-sm text-gray-600">Early engagement</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">6-12 Months</h4>
                          <p className="text-2xl font-bold text-gray-900">$142.30</p>
                          <p className="text-sm text-gray-600">Established users</p>
                        </div>
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <h4 className="font-medium text-gray-900">12+ Months</h4>
                          <p className="text-2xl font-bold text-gray-900">$225.80</p>
                          <p className="text-sm text-gray-600">Long-term members</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Advertising Platform */}
              <Card className="bg-white border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-navy">Advertising Platform</CardTitle>
                  <CardDescription className="text-gray-600">Campaign performance and ROI analytics</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">24</div>
                      <div className="text-sm text-gray-600">Active Campaigns</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">3.2%</div>
                      <div className="text-sm text-gray-600">Avg CTR</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">$2.45</div>
                      <div className="text-sm text-gray-600">Avg CPC</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">185%</div>
                      <div className="text-sm text-gray-600">ROAS</div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <h4 className="text-gray-900 font-medium mb-3">Top Performing Campaigns</h4>
                    <div className="space-y-2">
                      {[
                        { name: "STAK Professional Network Q1", ctr: "4.8%", spend: "$1,250", roas: "220%" },
                        { name: "Venture Capital Connections", ctr: "3.9%", spend: "$890", roas: "195%" },
                        { name: "Startup Founder Matching", ctr: "3.2%", spend: "$675", roas: "175%" }
                      ].map((campaign) => (
                        <div key={campaign.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                          <div>
                            <p className="text-gray-900 text-sm font-medium">{campaign.name}</p>
                            <p className="text-gray-600 text-xs">CTR: {campaign.ctr} • Spend: {campaign.spend}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[#CD853F] text-sm font-medium">{campaign.roas} ROAS</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="import">
            <STAKReceptionImport />
          </TabsContent>

          <TabsContent value="ai-matching">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-navy mb-2">AI Matchmaking System</h3>
                <p className="text-gray-600">Manage AI-powered pre-event networking and attendee matchmaking</p>
              </div>

              {/* Event Selection */}
              {events && events.length > 0 ? (
                <div className="space-y-4">
                  <h4 className="text-lg font-medium text-gray-900">Select Event for AI Matchmaking</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {events.map((event: any) => (
                      <Card key={event.id} className="bg-white border border-gray-200 shadow-sm hover:border-[#CD853F] transition-colors cursor-pointer">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base text-navy">{event.title}</CardTitle>
                          <CardDescription className="text-sm">
                            {new Date(event.startDate).toLocaleDateString()} • {event.registrationCount || 0} attendees
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <Button 
                            onClick={() => setEditingEventId(event.id)}
                            className="w-full bg-[#CD853F] hover:bg-[#CD853F]/80 text-white"
                          >
                            <Brain className="h-4 w-4 mr-2" />
                            Manage AI Matching
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Available</h3>
                  <p className="text-gray-500 mb-4">Create events first to manage AI matchmaking</p>
                  <Button 
                    onClick={() => setActiveTab("events")}
                    className="bg-[#CD853F] hover:bg-[#CD853F]/80 text-white"
                  >
                    Go to Event Management
                  </Button>
                </div>
              )}

              {/* AI Matchmaking Manager for Selected Event */}
              {editingEventId && events && (
                <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-medium text-gray-900">AI Matchmaking Manager</h4>
                    <Button 
                      variant="outline" 
                      onClick={() => setEditingEventId(null)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Back to Event List
                    </Button>
                  </div>
                  <AIMatchmakingManager 
                    eventId={editingEventId}
                    event={events.find((e: any) => e.id === editingEventId)}
                  />
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="badges">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-navy mb-2">STAK Badges & Recognition</h3>
                <p className="text-gray-600">Manage the badge system, award recognition, and track user achievements</p>
              </div>

              <BadgeManager userId="" isAdmin={true} />
            </div>
          </TabsContent>

          <TabsContent value="tax">
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold text-navy mb-2">Sales Tax Administration</h3>
                <p className="text-gray-600">Oakland, Alameda County, California tax settings and calculator</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tax Rate Information */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-navy flex items-center">
                      <Calculator className="h-5 w-5 mr-2" />
                      Current Tax Rates
                    </CardTitle>
                    <CardDescription>Oakland, Alameda County, California</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">California State</div>
                        <div className="text-lg font-semibold text-navy">7.25%</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Alameda County</div>
                        <div className="text-lg font-semibold text-navy">1.50%</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Oakland City</div>
                        <div className="text-lg font-semibold text-navy">1.00%</div>
                      </div>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">Special District</div>
                        <div className="text-lg font-semibold text-navy">0.25%</div>
                      </div>
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-base font-semibold text-gray-900">Total Tax Rate</span>
                        <span className="text-xl font-bold text-[#CD853F]">10.00%</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tax Calculator */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-navy">Tax Calculator</CardTitle>
                    <CardDescription>Calculate sales tax for any amount</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="taxAmount">Amount (before tax)</Label>
                      <Input
                        id="taxAmount"
                        type="number"
                        step="0.01"
                        placeholder="Enter amount..."
                        className="mt-1"
                        onChange={(e) => {
                          const amount = parseFloat(e.target.value) || 0;
                          const taxAmount = amount * 0.10;
                          const total = amount + taxAmount;
                          
                          // Update display elements
                          const taxDisplay = document.getElementById('calculatedTax');
                          const totalDisplay = document.getElementById('calculatedTotal');
                          if (taxDisplay) taxDisplay.textContent = `$${taxAmount.toFixed(2)}`;
                          if (totalDisplay) totalDisplay.textContent = `$${total.toFixed(2)}`;
                        }}
                      />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sales Tax (10.00%)</span>
                        <span id="calculatedTax" className="font-semibold">$0.00</span>
                      </div>
                      <div className="flex justify-between border-t pt-2">
                        <span className="font-semibold text-gray-900">Total Amount</span>
                        <span id="calculatedTotal" className="font-bold text-[#CD853F]">$0.00</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tax Categories */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-navy">Taxable Services</CardTitle>
                    <CardDescription>What services are subject to sales tax</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">SaaS Subscriptions</div>
                          <div className="text-sm text-gray-600">Monthly platform subscriptions</div>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-800">Taxable</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Event Tickets</div>
                          <div className="text-sm text-gray-600">All event and conference tickets</div>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-800">Taxable</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900">Digital Services</div>
                          <div className="text-sm text-gray-600">AI token usage and premium features</div>
                        </div>
                        <Badge variant="default" className="bg-green-100 text-green-800">Taxable</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Compliance Information */}
                <Card className="bg-white border border-gray-200 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-navy">Compliance Information</CardTitle>
                    <CardDescription>Tax reporting and compliance details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Location</span>
                      <span className="text-sm font-medium">Oakland, CA</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Last Rate Update</span>
                      <span className="text-sm font-medium">January 1, 2024</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Filing Frequency</span>
                      <span className="text-sm font-medium">Monthly</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tax Authority</span>
                      <span className="text-sm font-medium">CA CDTFA</span>
                    </div>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <div className="text-sm text-blue-800">
                        <strong>Note:</strong> All invoices automatically include appropriate sales tax calculations based on current Oakland, Alameda County rates.
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Add User Dialog */}
        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
          <DialogContent className="bg-white border border-gray-200 text-gray-900">
            <DialogHeader>
              <DialogTitle className="text-navy">Add New User</DialogTitle>
              <DialogDescription className="text-gray-600">
                Create a new user account with basic information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                />
              </div>
              <div>
                <Label htmlFor="company" className="text-gray-700 font-medium">Company</Label>
                <Input
                  id="company"
                  value={newUserData.company}
                  onChange={(e) => setNewUserData({...newUserData, company: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                />
              </div>
              <div>
                <Label htmlFor="title" className="text-gray-700 font-medium">Title</Label>
                <Input
                  id="title"
                  value={newUserData.title}
                  onChange={(e) => setNewUserData({...newUserData, title: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowAddUserDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={() => addUserMutation.mutate(newUserData)}
                disabled={addUserMutation.isPending || !newUserData.email}
                className="bg-navy text-white hover:bg-navy/80"
              >
                {addUserMutation.isPending ? 'Adding...' : 'Add User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
          <DialogContent className="bg-white border border-gray-200 text-gray-900 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-navy">Edit User</DialogTitle>
              <DialogDescription className="text-gray-600">
                Update user account information and permissions
              </DialogDescription>
            </DialogHeader>
            {selectedUserForEdit && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editFirstName" className="text-gray-700 font-medium">First Name</Label>
                    <Input
                      id="editFirstName"
                      defaultValue={selectedUserForEdit.firstName || ''}
                      className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                    />
                  </div>
                  <div>
                    <Label htmlFor="editLastName" className="text-gray-700 font-medium">Last Name</Label>
                    <Input
                      id="editLastName"
                      defaultValue={selectedUserForEdit.lastName || ''}
                      className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="editEmail" className="text-gray-700 font-medium">Email</Label>
                  <Input
                    id="editEmail"
                    type="email"
                    defaultValue={selectedUserForEdit.email}
                    className="bg-gray-100 border-gray-300 text-gray-700"
                    disabled
                  />
                </div>
                <div>
                  <Label htmlFor="editCompany" className="text-gray-700 font-medium">Company</Label>
                  <Input
                    id="editCompany"
                    defaultValue={selectedUserForEdit.company || ''}
                    className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                  />
                </div>
                <div>
                  <Label htmlFor="editTitle" className="text-gray-700 font-medium">Title</Label>
                  <Input
                    id="editTitle"
                    defaultValue={selectedUserForEdit.title || ''}
                    className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="editAdminRole" className="text-gray-700 font-medium">Admin Role</Label>
                    <select 
                      id="editAdminRole"
                      defaultValue={(selectedUserForEdit as any)?.adminRole || ''}
                      className="w-full p-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:border-navy"
                    >
                      <option value="">No Admin Role</option>
                      <option value="admin">Admin</option>
                      <option value="moderator">Moderator</option>
                      <option value="owner">Owner</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="editStatus" className="text-gray-700 font-medium">Account Status</Label>
                    <select 
                      id="editStatus"
                      defaultValue="active"
                      className="w-full p-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:border-navy"
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="banned">Banned</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="editIsStakTeamMember"
                    defaultChecked={(selectedUserForEdit as any)?.isStakTeamMember || false}
                    className="rounded border-gray-300 text-navy focus:ring-navy"
                  />
                  <Label htmlFor="editIsStakTeamMember" className="text-gray-700 font-medium">STAK Team Member</Label>
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
                        adminRole: (document.getElementById('editAdminRole') as HTMLSelectElement)?.value === '' ? null : (document.getElementById('editAdminRole') as HTMLSelectElement)?.value,
                        isStakTeamMember: (document.getElementById('editIsStakTeamMember') as HTMLInputElement)?.checked || false,
                      }
                    });
                  }
                }}
                disabled={updateUserMutation.isPending}
                className="bg-navy text-white hover:bg-navy/80"
              >
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* User Action Dialog */}
        <Dialog open={userActionDialog} onOpenChange={setUserActionDialog}>
          <DialogContent className="bg-white border border-gray-200 text-gray-900">
            <DialogHeader>
              <DialogTitle className="text-navy">
                {actionType === 'suspend' ? 'Suspend User' : 
                 actionType === 'activate' ? 'Activate User' : 'Ban User'}
              </DialogTitle>
              <DialogDescription className="text-gray-600">
                {selectedUser && `Are you sure you want to ${actionType} ${selectedUser.firstName} ${selectedUser.lastName}?`}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="actionReason" className="text-gray-700 font-medium">Reason (Optional)</Label>
                <Textarea
                  id="actionReason"
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter reason for this action..."
                  className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUserActionDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmUserAction}
                disabled={userActionMutation.isPending}
                className={
                  actionType === 'suspend' ? "bg-yellow-600 text-white hover:bg-yellow-700" :
                  actionType === 'activate' ? "bg-green-600 text-white hover:bg-green-700" :
                  "bg-red-600 text-white hover:bg-red-700"
                }
              >
                {userActionMutation.isPending ? 'Processing...' : 
                 actionType === 'suspend' ? 'Suspend User' : 
                 actionType === 'activate' ? 'Activate User' : 'Ban User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Event Dialog */}
        <Dialog open={showCreateEventDialog} onOpenChange={setShowCreateEventDialog}>
          <DialogContent className="bg-white border border-gray-200 text-gray-900 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-navy">Create New Event</DialogTitle>
              <DialogDescription className="text-gray-600">
                Create a new networking event for the STAK platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="eventTitle" className="text-gray-700 font-medium">Event Title</Label>
                  <Input
                    id="eventTitle"
                    placeholder="STAK Networking Event"
                    value={eventData.title}
                    onChange={(e) => setEventData({...eventData, title: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                  />
                </div>
                <div>
                  <Label htmlFor="eventType" className="text-gray-700 font-medium">Event Type</Label>
                  <select 
                    value={eventData.eventType}
                    onChange={(e) => setEventData({...eventData, eventType: e.target.value})}
                    className="w-full p-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:border-navy"
                  >
                    <option value="networking">Networking</option>
                    <option value="workshop">Workshop</option>
                    <option value="conference">Conference</option>
                    <option value="meetup">Meetup</option>
                    <option value="webinar">Webinar</option>
                  </select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="eventDescription" className="text-gray-700 font-medium">Description</Label>
                <textarea
                  id="eventDescription"
                  placeholder="Event description and details..."
                  value={eventData.description}
                  onChange={(e) => setEventData({...eventData, description: e.target.value})}
                  className="w-full p-2 bg-white border border-gray-300 rounded-md text-gray-900 h-24 resize-none focus:border-navy"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate" className="text-gray-700 font-medium">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={eventData.startDate}
                    onChange={(e) => setEventData({...eventData, startDate: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-navy [&::-webkit-calendar-picker-indicator]:opacity-100 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
                <div>
                  <Label htmlFor="startTime" className="text-gray-700 font-medium">Start Time</Label>
                  <select 
                    id="startTime"
                    value={eventData.startTime}
                    onChange={(e) => setEventData({...eventData, startTime: e.target.value})}
                    className="w-full p-2 bg-white border border-gray-300 rounded-md text-gray-900 focus:border-navy"
                  >
                    {Array.from({ length: 96 }, (_, i) => {
                      const hour = Math.floor(i / 4);
                      const minute = (i % 4) * 15;
                      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                      const displayTime = new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      });
                      return <option key={time} value={time}>{displayTime}</option>;
                    })}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="location" className="text-gray-700 font-medium">Location</Label>
                  <Input
                    id="location"
                    placeholder="Event location or 'Virtual'"
                    value={eventData.location}
                    onChange={(e) => setEventData({...eventData, location: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                  />
                </div>
                <div>
                  <Label htmlFor="capacity" className="text-gray-700 font-medium">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="50"
                    value={eventData.capacity}
                    onChange={(e) => setEventData({...eventData, capacity: parseInt(e.target.value) || 50})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-gray-700 font-medium">Cover Image</Label>
                  <div className="mt-2 space-y-3">
                    {/* Photo Upload Button */}
                    <ObjectUploader
                      maxNumberOfFiles={1}
                      maxFileSize={10485760} // 10MB
                      onGetUploadParameters={async () => {
                        const response = await apiRequest("POST", "/api/events/upload-image", {});
                        const data = await response.json();
                        return {
                          method: "PUT" as const,
                          url: data.uploadURL
                        };
                      }}
                      onComplete={async (result) => {
                        if (result.successful && result.successful.length > 0) {
                          const uploadedFile = result.successful[0];
                          // Convert upload URL to our public object serving path
                          const uploadURL = uploadedFile.uploadURL;
                          
                          // Extract the file path from the Google Cloud Storage URL
                          try {
                            const url = new URL(uploadURL);
                            const pathParts = url.pathname.split('/');
                            if (pathParts.length >= 4 && pathParts[2] === 'public' && pathParts[3] === 'events') {
                              // Convert to our public object serving path
                              const filename = pathParts[4];
                              const publicPath = `/public-objects/events/${filename}`;
                              setEventData({...eventData, coverImageUrl: publicPath});
                            } else {
                              // Fallback to original URL
                              setEventData({...eventData, coverImageUrl: uploadURL});
                            }
                          } catch (error) {
                            console.error("Error parsing upload URL:", error);
                            setEventData({...eventData, coverImageUrl: uploadURL});
                          }
                          
                          toast({
                            title: "Image Uploaded",
                            description: "Event cover image has been uploaded successfully",
                          });
                        }
                      }}
                      buttonClassName="w-full bg-[#CD853F] hover:bg-[#CD853F]/80 text-black"
                    >
                      📷 Upload Cover Image
                    </ObjectUploader>
                    
                    {/* Current Image Display */}
                    {eventData.coverImageUrl && (
                      <div className="relative">
                        <img 
                          src={eventData.coverImageUrl} 
                          alt="Event cover" 
                          className="w-full h-32 object-cover rounded-md border border-gray-300"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setEventData({...eventData, coverImageUrl: ''})}
                        >
                          Remove
                        </Button>
                      </div>
                    )}
                    
                    {/* Manual URL Input as Fallback */}
                    <div>
                      <Label htmlFor="coverImageUrl" className="text-sm text-gray-600">Or enter image URL manually</Label>
                      <Input
                        id="coverImageUrl"
                        placeholder="https://example.com/image.jpg"
                        value={eventData.coverImageUrl}
                        onChange={(e) => setEventData({...eventData, coverImageUrl: e.target.value})}
                        className="bg-white border-gray-300 text-gray-900 focus:border-navy text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="videoUrl" className="text-gray-700 font-medium">YouTube Video URL</Label>
                  <Input
                    id="videoUrl"
                    placeholder="https://youtube.com/watch?v=..."
                    value={eventData.videoUrl}
                    onChange={(e) => setEventData({...eventData, videoUrl: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isVirtual"
                    checked={eventData.isVirtual}
                    onChange={(e) => setEventData({...eventData, isVirtual: e.target.checked})}
                    className="rounded border-gray-600"
                  />
                  <Label htmlFor="isVirtual" className="text-gray-300">Virtual Event</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={eventData.isFeatured}
                    onChange={(e) => setEventData({...eventData, isFeatured: e.target.checked})}
                    className="rounded border-gray-600"
                  />
                  <Label htmlFor="isFeatured" className="text-gray-300">Featured Event</Label>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateEventDialog(false)}
                className="border-gray-600 text-gray-300 hover:bg-[#2A2A2A]"
              >
                Cancel
              </Button>
              <Button 
                className="bg-[#CD853F] text-black hover:bg-[#CD853F]/80"
                onClick={() => {
                  // Combine date and time into proper format
                  const startDateTime = new Date(`${eventData.startDate}T${eventData.startTime}`);
                  const eventPayload = {
                    ...eventData,
                    startDate: startDateTime.toISOString(),
                    endDate: new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000).toISOString(), // Default 2 hours
                  };
                  
                  if (editingEventId) {
                    updateEventMutation.mutate({ eventId: editingEventId, eventData: eventPayload });
                  } else {
                    createEventMutation.mutate(eventPayload);
                  }
                }}
                disabled={createEventMutation.isPending || updateEventMutation.isPending || !eventData.title || !eventData.startDate}
              >
                {(createEventMutation.isPending || updateEventMutation.isPending) ? 
                  (editingEventId ? 'Updating...' : 'Creating...') : 
                  (editingEventId ? 'Update Event' : 'Create Event')
                }
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add User Dialog */}
        <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
          <DialogContent className="bg-white border border-gray-200 text-gray-900">
            <DialogHeader>
              <DialogTitle className="text-navy">Add New User</DialogTitle>
              <DialogDescription className="text-gray-600">
                Create a new user account with basic information
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-gray-700 font-medium">First Name</Label>
                  <Input
                    id="firstName"
                    value={newUserData.firstName}
                    onChange={(e) => setNewUserData({...newUserData, firstName: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-gray-700 font-medium">Last Name</Label>
                  <Input
                    id="lastName"
                    value={newUserData.lastName}
                    onChange={(e) => setNewUserData({...newUserData, lastName: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({...newUserData, email: e.target.value})}
                  className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company" className="text-gray-700 font-medium">Company</Label>
                  <Input
                    id="company"
                    value={newUserData.company}
                    onChange={(e) => setNewUserData({...newUserData, company: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                  />
                </div>
                <div>
                  <Label htmlFor="title" className="text-gray-700 font-medium">Title</Label>
                  <Input
                    id="title"
                    value={newUserData.title}
                    onChange={(e) => setNewUserData({...newUserData, title: e.target.value})}
                    className="bg-white border-gray-300 text-gray-900 focus:border-navy"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowAddUserDialog(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Button>
              <Button 
                className="bg-navy text-white hover:bg-navy/80"
                onClick={() => {
                  addUserMutation.mutate(newUserData);
                }}
                disabled={addUserMutation.isPending || !newUserData.firstName || !newUserData.lastName || !newUserData.email}
              >
                {addUserMutation.isPending ? 'Adding...' : 'Add User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

export default AdminDashboard;