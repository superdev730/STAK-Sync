import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  Calendar as CalendarIcon, 
  BarChart3,
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  TrendingUp,
  DollarSign,
  Activity,
  UserCheck,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building2,
  Award,
  Database,
  FileSpreadsheet,
  Bot,
  Download,
  Upload,
  Filter,
  MoreHorizontal
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  title?: string;
  profileImageUrl?: string;
  billingPlan?: string;
  billingStatus?: string;
  createdAt: string;
  updatedAt: string;
}

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  location: string;
  capacity: number;
  eventType: string;
  status: string;
  registrations?: number;
}

interface BillingStats {
  userStats: Array<{ billingPlan: string; count: number }>;
  tokenStats: { totalTokens: number; totalCost: number };
  monthlyRevenue: number;
  totalRevenue: number;
}

interface BillingUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  billingPlan: string;
  billingStatus: string;
  stakMembershipVerified: boolean;
  tokensUsedThisMonth: number;
  monthlyTokenAllowance: number;
  monthlyCost: number;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  userEmail: string;
  userName: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  subscriptionAmount: string;
  tokenUsageAmount: string;
  totalAmount: string;
  status: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

interface Sponsor {
  id: string;
  name: string;
  description: string;
  logoUrl?: string;
  websiteUrl?: string;
  contactEmail?: string;
  tier: string;
  isActive: boolean;
  createdAt: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  badgeType: string;
  tier: string;
  backgroundColor: string;
  textColor: string;
  rarity: string;
  points: number;
  isEventSpecific: boolean;
  eventId?: string;
}

interface Analytics {
  totalUsers: number;
  totalEvents: number;
  activeUsers: number;
  totalConnections: number;
  revenue: number;
  growth: {
    users: number;
    events: number;
    revenue: number;
  };
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateSponsorDialog, setShowCreateSponsorDialog] = useState(false);
  const [showCreateBadgeDialog, setShowCreateBadgeDialog] = useState(false);

  // Fetch analytics data
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/admin/analytics/30d'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/analytics/30d', 'GET');
      return response.json();
    },
  });

  // Fetch users data
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/users?limit=50', 'GET');
      return response.json();
    },
  });

  // Fetch events data  
  const { data: eventsData, isLoading: eventsLoading } = useQuery({
    queryKey: ['/api/admin/events'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/events', 'GET');
      return response.json();
    },
  });

  // Fetch billing data
  const { data: billingStats, isLoading: billingLoading } = useQuery({
    queryKey: ['/api/admin/billing/stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/billing/stats', 'GET');
      return response.json();
    },
    enabled: activeTab === "billing",
  });

  const { data: billingUsersResponse, isLoading: billingUsersLoading } = useQuery({
    queryKey: ['/api/admin/billing/users'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/billing/users', 'GET');
      return response.json();
    },
    enabled: activeTab === "billing",
  });

  const { data: invoicesResponse, isLoading: invoicesLoading } = useQuery({
    queryKey: ['/api/admin/billing/invoices'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/billing/invoices', 'GET');
      return response.json();
    },
    enabled: activeTab === "billing",
  });

  // Handle billing data properly - ensure arrays
  const billingUsers = Array.isArray(billingUsersResponse) ? billingUsersResponse : (billingUsersResponse?.users || []);
  const invoices = Array.isArray(invoicesResponse) ? invoicesResponse : (invoicesResponse?.invoices || []);

  // Fetch sponsors data
  const { data: sponsorsResponse, isLoading: sponsorsLoading } = useQuery({
    queryKey: ['/api/sponsors'],
    queryFn: async () => {
      const response = await apiRequest('/api/sponsors', 'GET');
      return response.json();
    },
    enabled: activeTab === "sponsors",
  });

  // Fetch badges data
  const { data: badgesResponse, isLoading: badgesLoading } = useQuery({
    queryKey: ['/api/badges'],
    queryFn: async () => {
      const response = await apiRequest('/api/badges', 'GET');
      return response.json();
    },
    enabled: activeTab === "badges",
  });

  // Handle data properly - ensure arrays
  const sponsors = Array.isArray(sponsorsResponse) ? sponsorsResponse : (sponsorsResponse?.sponsors || []);
  const badges = Array.isArray(badgesResponse) ? badgesResponse : (badgesResponse?.badges || []);

  const users = usersData || [];
  const events = eventsData?.events || [];

  // Format analytics data
  const formatAnalytics = (data: any): Analytics => {
    const userCount = users.length;
    const eventCount = events.length;
    
    if (!data) return {
      totalUsers: userCount,
      totalEvents: eventCount,
      activeUsers: 0,
      totalConnections: 0,
      revenue: 0,
      growth: { users: 0, events: 0, revenue: 0 }
    };

    return {
      totalUsers: data.userStats?.totalUsers || userCount,
      totalEvents: data.eventStats?.totalEvents || data.eventStats?.upcomingEvents || eventCount,
      activeUsers: data.userStats?.activeUsers || data.userStats?.newUsersThisWeek || Math.floor(userCount * 0.3),
      totalConnections: data.matchingStats?.totalMatches || data.engagementStats?.totalMatches || 0,
      revenue: billingStats?.totalRevenue || 0,
      growth: {
        users: data.growth?.users || 5,
        events: data.growth?.events || 10,  
        revenue: data.growth?.revenue || 15
      }
    };
  };

  const analyticsFormatted = formatAnalytics(analytics);

  // Export billing data
  const exportBillingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('/api/admin/billing/export', 'POST');
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Export Complete",
        description: "Billing data has been exported successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Export Failed",
        description: "Failed to export billing data.",
        variant: "destructive",
      });
    },
  });

  // Update user billing plan
  const updateBillingPlanMutation = useMutation({
    mutationFn: ({ userId, plan }: { userId: string; plan: string }) =>
      apiRequest(`/api/admin/billing/users/${userId}/plan`, 'PUT', { plan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/billing/users'] });
      toast({
        title: "Plan Updated",
        description: "User billing plan has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update user billing plan.",
        variant: "destructive",
      });
    },
  });

  // Generate invoice
  const generateInvoiceMutation = useMutation({
    mutationFn: (userId: string) =>
      apiRequest(`/api/admin/billing/users/${userId}/generate-invoice`, 'POST'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/billing/invoices'] });
      toast({
        title: "Invoice Generated",
        description: "Invoice has been generated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed", 
        description: "Failed to generate invoice.",
        variant: "destructive",
      });
    },
  });

  const getBillingPlanColor = (plan: string) => {
    switch (plan) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'paid_monthly': return 'bg-green-100 text-green-800';
      case 'free_stak_basic': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'past_due': return 'bg-yellow-100 text-yellow-800';
      case 'canceled': return 'bg-red-100 text-red-800';
      case 'incomplete': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInvoiceStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">STAK Sync Admin Panel</h1>
          <p className="text-gray-600">Comprehensive business management dashboard</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="sponsors" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Sponsors
            </TabsTrigger>
            <TabsTrigger value="badges" className="flex items-center gap-2">
              <Award className="h-4 w-4" />
              Badges
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsFormatted.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center text-green-600">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +{analyticsFormatted.growth.users}%
                    </span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsFormatted.totalEvents}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center text-green-600">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +{analyticsFormatted.growth.events}%
                    </span> from last month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analyticsFormatted.activeUsers}</div>
                  <p className="text-xs text-muted-foreground">
                    Last 7 days activity
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${analyticsFormatted.revenue}</div>
                  <p className="text-xs text-muted-foreground">
                    <span className="inline-flex items-center text-green-600">
                      <ArrowUpRight className="h-3 w-3 mr-1" />
                      +{analyticsFormatted.growth.revenue}%
                    </span> from last month
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Users</CardTitle>
                  <CardDescription>Latest user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.slice(0, 5).map((user: User) => (
                      <div key={user.id} className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          {user.firstName?.[0] || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{user.email}</p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recent Events</CardTitle>
                  <CardDescription>Latest event activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {events.slice(0, 5).map((event: Event) => (
                      <div key={event.id} className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-copper-100 rounded-full flex items-center justify-center">
                          <CalendarIcon className="h-4 w-4 text-copper-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{event.location}</p>
                        </div>
                        <Badge className={event.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {event.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 w-[300px]"
                    data-testid="input-search-users"
                  />
                </div>
              </div>
              <Button data-testid="button-add-user">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Manage all registered users</CardDescription>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                      <div className="col-span-3">User</div>
                      <div className="col-span-3">Email</div>
                      <div className="col-span-2">Company</div>
                      <div className="col-span-2">Created</div>
                      <div className="col-span-2">Actions</div>
                    </div>
                    {users
                      .filter((user: User) => 
                        !searchQuery || 
                        user.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.company?.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((user: User) => (
                        <div key={user.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100 hover:bg-gray-50">
                          <div className="col-span-3 flex items-center space-x-3">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              {user.firstName?.[0] || '?'}
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-sm text-gray-500">{user.title}</div>
                            </div>
                          </div>
                          <div className="col-span-3 text-sm text-gray-900">{user.email}</div>
                          <div className="col-span-2 text-sm text-gray-500">{user.company || '-'}</div>
                          <div className="col-span-2 text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                          <div className="col-span-2 flex items-center space-x-2">
                            <Button variant="outline" size="sm" data-testid={`button-view-user-${user.id}`}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" data-testid={`button-edit-user-${user.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Event Management</h3>
              <Button data-testid="button-create-event">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {eventsLoading ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                events.map((event: Event) => (
                  <Card key={event.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge className={event.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}>
                          {event.status}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {event.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          {new Date(event.startDate).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          {event.registrations || 0} / {event.capacity} attendees
                        </div>
                        <div className="flex items-center">
                          <Badge variant="outline">{event.eventType}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 mt-4">
                        <Button variant="outline" size="sm" data-testid={`button-view-event-${event.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-edit-event-${event.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-delete-event-${event.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Billing Management</h3>
              <Button 
                onClick={() => exportBillingMutation.mutate()}
                disabled={exportBillingMutation.isPending}
                data-testid="button-export-billing"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
            </div>

            {/* Billing Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${billingStats?.totalRevenue || 0}</div>
                  <p className="text-xs text-muted-foreground">All time</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${billingStats?.monthlyRevenue || 0}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Token Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{billingStats?.tokenStats?.totalTokens || 0}</div>
                  <p className="text-xs text-muted-foreground">Total tokens used</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Token Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${billingStats?.tokenStats?.totalCost || 0}</div>
                  <p className="text-xs text-muted-foreground">Total token costs</p>
                </CardContent>
              </Card>
            </div>

            {/* Billing Users Table */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Users</CardTitle>
                <CardDescription>Manage user billing plans and token usage</CardDescription>
              </CardHeader>
              <CardContent>
                {billingUsersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                      <div className="col-span-2">User</div>
                      <div className="col-span-2">Plan</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Tokens Used</div>
                      <div className="col-span-2">Monthly Cost</div>
                      <div className="col-span-2">Actions</div>
                    </div>
                    {billingUsers?.map((user: BillingUser) => (
                      <div key={user.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                        <div className="col-span-2">
                          <div className="font-medium">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                        <div className="col-span-2">
                          <Badge className={getBillingPlanColor(user.billingPlan)}>
                            {user.billingPlan.replace('_', ' ')}
                          </Badge>
                        </div>
                        <div className="col-span-2">
                          <Badge className={getStatusColor(user.billingStatus)}>
                            {user.billingStatus}
                          </Badge>
                        </div>
                        <div className="col-span-2">
                          <div>{user.tokensUsedThisMonth} / {user.monthlyTokenAllowance}</div>
                          <div className="text-sm text-gray-500">
                            {user.stakMembershipVerified && <span className="text-green-600">STAK Verified</span>}
                          </div>
                        </div>
                        <div className="col-span-2 font-medium">${user.monthlyCost}</div>
                        <div className="col-span-2 flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" data-testid={`button-edit-billing-${user.id}`}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Billing Plan</DialogTitle>
                                <DialogDescription>
                                  Change the billing plan for {user.firstName} {user.lastName}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                <Select 
                                  defaultValue={user.billingPlan}
                                  onValueChange={(plan) => updateBillingPlanMutation.mutate({ userId: user.id, plan })}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="free_stak_basic">Free STAK Basic</SelectItem>
                                    <SelectItem value="paid_monthly">Paid Monthly</SelectItem>
                                    <SelectItem value="enterprise">Enterprise</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => generateInvoiceMutation.mutate(user.id)}
                            disabled={generateInvoiceMutation.isPending}
                            data-testid={`button-generate-invoice-${user.id}`}
                          >
                            <FileSpreadsheet className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Invoices Table */}
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
                <CardDescription>All generated invoices and payment status</CardDescription>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4 text-sm font-medium text-gray-500 border-b pb-2">
                      <div className="col-span-2">Invoice #</div>
                      <div className="col-span-2">User</div>
                      <div className="col-span-2">Period</div>
                      <div className="col-span-2">Amount</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Due Date</div>
                    </div>
                    {invoices?.map((invoice: Invoice) => (
                      <div key={invoice.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100">
                        <div className="col-span-2 font-medium">{invoice.invoiceNumber}</div>
                        <div className="col-span-2">
                          <div className="font-medium">{invoice.userName}</div>
                          <div className="text-sm text-gray-500">{invoice.userEmail}</div>
                        </div>
                        <div className="col-span-2 text-sm">
                          {new Date(invoice.billingPeriodStart).toLocaleDateString()} - {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
                        </div>
                        <div className="col-span-2 font-medium">${invoice.totalAmount}</div>
                        <div className="col-span-2">
                          <Badge className={getInvoiceStatusColor(invoice.status)}>
                            {invoice.status}
                          </Badge>
                        </div>
                        <div className="col-span-2 text-sm">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sponsors Tab */}
          <TabsContent value="sponsors" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Sponsorship Management</h3>
              <Button onClick={() => setShowCreateSponsorDialog(true)} data-testid="button-create-sponsor">
                <Plus className="h-4 w-4 mr-2" />
                Add Sponsor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sponsorsLoading ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                sponsors?.map((sponsor: Sponsor) => (
                  <Card key={sponsor.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{sponsor.name}</CardTitle>
                        <Badge className={sponsor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                          {sponsor.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{sponsor.tier}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{sponsor.description}</p>
                      <div className="space-y-2 text-sm">
                        {sponsor.websiteUrl && (
                          <a href={sponsor.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {sponsor.websiteUrl}
                          </a>
                        )}
                        {sponsor.contactEmail && (
                          <div className="text-gray-600">{sponsor.contactEmail}</div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-4">
                        <Button variant="outline" size="sm" data-testid={`button-view-sponsor-${sponsor.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-edit-sponsor-${sponsor.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-delete-sponsor-${sponsor.id}`}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Badge Management</h3>
              <Button onClick={() => setShowCreateBadgeDialog(true)} data-testid="button-create-badge">
                <Plus className="h-4 w-4 mr-2" />
                Create Badge
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {badgesLoading ? (
                <div className="col-span-full flex items-center justify-center py-8">
                  <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                </div>
              ) : (
                badges?.map((badge: Badge) => (
                  <Card key={badge.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{badge.name}</CardTitle>
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: badge.backgroundColor, color: badge.textColor }}
                        >
                          {badge.name[0]}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline">{badge.tier}</Badge>
                        <Badge variant="outline">{badge.rarity}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-600 mb-4">{badge.description}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Type:</span>
                          <span className="font-medium">{badge.badgeType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Points:</span>
                          <span className="font-medium">{badge.points}</span>
                        </div>
                        {badge.isEventSpecific && badge.eventId && (
                          <div className="flex justify-between">
                            <span>Event Specific:</span>
                            <span className="font-medium">Yes</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2 mt-4">
                        <Button variant="outline" size="sm" data-testid={`button-view-badge-${badge.id}`}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-edit-badge-${badge.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" data-testid={`button-award-badge-${badge.id}`}>
                          <Award className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Advanced Analytics</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" data-testid="button-export-analytics">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" data-testid="button-filter-analytics">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
                <CardDescription>Detailed metrics and insights</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Advanced analytics dashboard coming soon...
                  <br />
                  Will include user engagement, event performance, and revenue analytics.
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">System Management</h3>
              <div className="flex items-center space-x-2">
                <Button variant="outline" data-testid="button-import-data">
                  <Upload className="h-4 w-4 mr-2" />
                  Import Data
                </Button>
                <Button variant="outline" data-testid="button-backup-system">
                  <Database className="h-4 w-4 mr-2" />
                  Backup
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Data Import/Export</CardTitle>
                  <CardDescription>Manage bulk data operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full" variant="outline" data-testid="button-stak-reception-import">
                      <Upload className="h-4 w-4 mr-2" />
                      Import from STAK Reception App
                    </Button>
                    <Button className="w-full" variant="outline" data-testid="button-csv-export">
                      <Download className="h-4 w-4 mr-2" />
                      Export All Data (CSV)
                    </Button>
                    <Button className="w-full" variant="outline" data-testid="button-user-export">
                      <Download className="h-4 w-4 mr-2" />
                      Export Users
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI & Services</CardTitle>
                  <CardDescription>Monitor AI systems and backend services</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full" variant="outline" data-testid="button-ai-matching-status">
                      <Bot className="h-4 w-4 mr-2" />
                      AI Matching Status
                    </Button>
                    <Button className="w-full" variant="outline" data-testid="button-token-usage-monitor">
                      <Activity className="h-4 w-4 mr-2" />
                      Token Usage Monitor
                    </Button>
                    <Button className="w-full" variant="outline" data-testid="button-profile-enrichment">
                      <UserCheck className="h-4 w-4 mr-2" />
                      Profile Enrichment Status
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}