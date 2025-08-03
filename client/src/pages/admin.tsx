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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Calendar, 
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
  CheckCircle
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

export default function Admin() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userActionDialog, setUserActionDialog] = useState(false);
  const [actionType, setActionType] = useState<'suspend' | 'activate' | 'ban' | null>(null);
  const [actionReason, setActionReason] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: analytics, isLoading } = useQuery<AdminAnalytics>({
    queryKey: ['/api/admin/analytics', selectedTimeRange],
    retry: false,
  });

  const { data: userManagement, isLoading: usersLoading } = useQuery<UserManagementData>({
    queryKey: ['/api/admin/users', currentPage],
    retry: false,
  });

  const { data: platformInsights, isLoading: insightsLoading } = useQuery({
    queryKey: ['/api/admin/platform-insights', selectedTimeRange],
    retry: false,
  });

  const { data: adPerformance, isLoading: adLoading } = useQuery({
    queryKey: ['/api/admin/advertising-performance', selectedTimeRange],
    retry: false,
  });

  const userActionMutation = useMutation({
    mutationFn: async ({ userId, status, reason }: { userId: string; status: string; reason: string }) => {
      return apiRequest(`/api/admin/users/${userId}/status`, {
        method: 'POST',
        body: { status, reason },
      });
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

  return (
    <div className="min-h-screen bg-[#141414] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#CD853F]">STAK Signal Admin</h1>
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
              <Calendar className="h-4 w-4 mr-2" />
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
            {/* User Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-[#1F1F1F] border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-[#CD853F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics?.userStats.totalUsers || 0}</div>
                  <p className="text-xs text-gray-400">
                    +{analytics?.userStats.newUsersThisWeek || 0} this week
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#1F1F1F] border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Active Today</CardTitle>
                  <UserCheck className="h-4 w-4 text-[#CD853F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics?.userStats.activeUsersToday || 0}</div>
                  <p className="text-xs text-gray-400">Users active today</p>
                </CardContent>
              </Card>

              <Card className="bg-[#1F1F1F] border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Total Events</CardTitle>
                  <Calendar className="h-4 w-4 text-[#CD853F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics?.eventStats.totalEvents || 0}</div>
                  <p className="text-xs text-gray-400">
                    {analytics?.eventStats.upcomingEvents || 0} upcoming
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-[#1F1F1F] border-gray-600">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-300">Match Success</CardTitle>
                  <Target className="h-4 w-4 text-[#CD853F]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-white">{analytics?.matchingStats.matchSuccessRate || 0}%</div>
                  <p className="text-xs text-gray-400">Successful matches</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">User Management</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    className="pl-10 bg-[#1F1F1F] border-gray-600 text-white"
                  />
                </div>
              </div>
            </div>

            <Card className="bg-[#1F1F1F] border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Platform Members</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage user accounts and access levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Activity className="h-6 w-6 animate-spin text-[#CD853F]" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userManagement?.users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-[#141414] rounded-lg border border-gray-600">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-[#CD853F] flex items-center justify-center text-black font-semibold">
                            {user.firstName?.[0]}{user.lastName?.[0]}
                          </div>
                          <div>
                            <h3 className="font-medium text-white">{user.firstName} {user.lastName}</h3>
                            <p className="text-sm text-gray-400">{user.email}</p>
                            {user.company && (
                              <p className="text-sm text-gray-500">{user.title} at {user.company}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getStatusBadge(user)}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserAction(user, 'suspend')}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUserAction(user, 'activate')}
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Other tabs content would go here */}
          <TabsContent value="events">
            <Card className="bg-[#1F1F1F] border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Event Management</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage events and attendee analytics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400">Event management features coming soon...</p>
              </CardContent>
            </Card>
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
                        ${platformInsights?.businessMetrics.totalRevenue?.toLocaleString() || '127,451'}
                      </div>
                      <p className="text-xs text-green-400">
                        +{platformInsights?.businessMetrics.monthlyGrowthRate || 15.2}% growth
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1F1F1F] border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Ad Revenue</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        ${platformInsights?.advertisingMetrics.totalRevenue?.toLocaleString() || '45,781'}
                      </div>
                      <p className="text-xs text-gray-400">
                        {platformInsights?.advertisingMetrics.totalImpressions?.toLocaleString() || '2.8M'} impressions
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1F1F1F] border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">Active Users</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {platformInsights?.engagementMetrics.monthlyActiveUsers?.toLocaleString() || '12,450'}
                      </div>
                      <p className="text-xs text-gray-400">
                        {platformInsights?.engagementMetrics.avgSessionDuration || 23.4}m avg session
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#1F1F1F] border-gray-600">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-300">ROAS</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-white">
                        {platformInsights?.businessMetrics.returnOnAdSpend || 4.2}x
                      </div>
                      <p className="text-xs text-green-400">
                        {platformInsights?.advertisingMetrics.activeAdvertisers || 12} active advertisers
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
                          ${platformInsights?.businessMetrics.userAcquisitionCost || 45.80}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">Lifetime Value</p>
                        <p className="text-2xl font-bold text-white">
                          ${platformInsights?.businessMetrics.lifetimeValue || 890.25}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-gray-400">Gross Margin</p>
                        <p className="text-2xl font-bold text-white">
                          {((platformInsights?.businessMetrics.grossMargin || 0.78) * 100).toFixed(1)}%
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
                            ${(platformInsights?.marketMetrics?.totalAddressableMarket / 1000000000 || 2.4).toFixed(1)}B
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
                        ${platformInsights?.advertisingMetrics.totalRevenue?.toLocaleString() || '45,781'}
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
                        {platformInsights?.advertisingMetrics.ctr?.toFixed(2) || '1.21'}%
                      </div>
                      <p className="text-xs text-gray-400">
                        {platformInsights?.advertisingMetrics.totalClicks?.toLocaleString() || '34,567'} clicks
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
                          {adPerformance?.audienceInsights.demographics.ageGroups?.map((group: any, index: number) => (
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
                          {adPerformance?.audienceInsights.demographics.industries?.map((industry: any, index: number) => (
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
      </div>
    </div>
  );
}