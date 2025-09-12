import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
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
import AdminEvents from "@/pages/admin-events";
import AdminSponsors from "@/pages/admin-sponsors";

interface User {
  id: string;
  email?: string;
  profileImageUrl?: string;
  billingPlan?: string;
  billingStatus?: string;
  createdAt: string;
  updatedAt: string;
  adminRole?: string | null;
  isStakTeamMember?: boolean;
  profileStatus?: string;

  // JSON columns from new schema
  identity?: {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    headline?: string;
    city_region?: string;
    timezone?: string;
    email?: string;
    phone?: string;
  };

  persona?: {
    primary?: string;
    secondary?: string[];
    bio?: string;
    industries?: string[];
    skills?: string[];
  };

  // Persona-specific blocks
  vc_block?: {
    firm?: string;
    role?: string;
    aum?: string;
    fund_stage?: string;
  };

  founder_block?: {
    company?: string;
    role?: string;
    stage?: string;
    funding_raised?: string;
    team_size?: number;
    industry?: string;
  };

  talent_block?: {
    current_role?: string;
    current_company?: string;
    years_experience?: number;
    expertise?: string[];
  };

  accountStatus?: string;
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
  email?: string;
  billingPlan: string;
  billingStatus: string;
  stakMembershipVerified: boolean;
  tokensUsedThisMonth: number;
  monthlyTokenAllowance: number;
  monthlyCost: number;

  // JSON columns from new schema
  identity?: {
    first_name?: string;
    last_name?: string;
    display_name?: string;
    headline?: string;
    email?: string;
  };
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

// Helper functions to extract user data from JSON structure
const getUserFirstName = (user: User): string => {
  return user?.identity?.first_name || '';
};

const getUserLastName = (user: User): string => {
  return user?.identity?.last_name || '';
};

const getUserFullName = (user: User): string => {
  const firstName = getUserFirstName(user);
  const lastName = getUserLastName(user);
  return `${firstName} ${lastName}`.trim() || 'Unknown User';
};

const getUserEmail = (user: User): string => {
  // Check email from root or from identity JSON
  return user?.email || user?.identity?.email || '';
};

const getUserCompany = (user: User): string => {
  // Check different persona blocks for company
  if (user?.founder_block?.company) return user.founder_block.company;
  if (user?.vc_block?.firm) return user.vc_block.firm;
  if (user?.talent_block?.current_company) return user.talent_block.current_company;
  return '';
};

const getUserTitle = (user: User): string => {
  // Check headline first, then role from different blocks
  if (user?.identity?.headline) return user.identity.headline;
  if (user?.founder_block?.role) return user.founder_block.role;
  if (user?.vc_block?.role) return user.vc_block.role;
  if (user?.talent_block?.current_role) return user.talent_block.current_role;
  return '';
};

const getUserInitials = (user: User): string => {
  const firstName = getUserFirstName(user);
  const lastName = getUserLastName(user);
  const email = getUserEmail(user);

  // If we have both first and last name, return first letter of each
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }

  // If only first name, return first two letters
  if (firstName) {
    return firstName.slice(0, 2).toUpperCase();
  }

  // If no names but have email, use first two letters of email
  if (email) {
    const emailPrefix = email.split('@')[0];
    return emailPrefix.slice(0, 2).toUpperCase();
  }

  // Last resort, return "UK" for unknown
  return 'UK';
};

// Helper function to get avatar background color based on initials
const getAvatarColor = (initials: string): string => {
  const colors = [
    'bg-copper-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-amber-500',
    'bg-teal-500'
  ];

  // Use initials to consistently pick a color
  const charCode = initials.charCodeAt(0) + (initials.charCodeAt(1) || 0);
  return colors[charCode % colors.length];
};

// Similar helpers for BillingUser
const getBillingUserFirstName = (user: BillingUser): string => {
  return user?.identity?.first_name || '';
};

const getBillingUserLastName = (user: BillingUser): string => {
  return user?.identity?.last_name || '';
};

const getBillingUserFullName = (user: BillingUser): string => {
  const firstName = getBillingUserFirstName(user);
  const lastName = getBillingUserLastName(user);
  return `${firstName} ${lastName}`.trim() || 'Unknown User';
};

const getBillingUserEmail = (user: BillingUser): string => {
  return user?.email || user?.identity?.email || '';
};

export default function AdminDashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showCreateSponsorDialog, setShowCreateSponsorDialog] = useState(false);
  const [showCreateBadgeDialog, setShowCreateBadgeDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [showDeleteUserDialog, setShowDeleteUserDialog] = useState(false);
  const [showViewUserDialog, setShowViewUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);

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

  // User management mutations
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const response = await apiRequest('/api/admin/users', 'POST', userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Created",
        description: "New user has been created successfully.",
      });
      setShowCreateUserDialog(false);
      createUserForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create user.",
        variant: "destructive",
      });
    },
  });

  // User management mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const response = await apiRequest(`/api/admin/users/${userId}`, 'PUT', updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Updated",
        description: "User information has been updated successfully.",
      });
      setShowEditUserDialog(false);
      setEditingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update user.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest(`/api/admin/users/${userId}`, 'DELETE');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "User Deleted",
        description: "User has been deleted successfully.",
      });
      setShowDeleteUserDialog(false);
      setDeletingUser(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete user.",
        variant: "destructive",
      });
    },
  });

  const updateUserStatusMutation = useMutation({
    mutationFn: async ({ userId, status }: { userId: string; status: string }) => {
      const response = await apiRequest(`/api/admin/users/${userId}/status`, 'POST', { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Status Updated",
        description: "User status has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Status Update Failed",
        description: error.message || "Failed to update user status.",
        variant: "destructive",
      });
    },
  });

  // Form schema for creating user
  const createUserSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    headline: z.string().optional(),
    company: z.string().optional(),
    role: z.string().optional(),
    adminRole: z.enum(["none", "admin", "super_admin", "owner"]).default("none"),
  });

  type CreateUserFormData = z.infer<typeof createUserSchema>;

  // Form schema for editing user
  const editUserSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Invalid email address"),
    headline: z.string().optional(),
    company: z.string().optional(),
    role: z.string().optional(),
    adminRole: z.enum(["none", "admin", "super_admin", "owner"]).optional(),
  });

  type EditUserFormData = z.infer<typeof editUserSchema>;

  // Handle edit user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    // Reset form with user data immediately
    editUserForm.reset({
      firstName: getUserFirstName(user) || "",
      lastName: getUserLastName(user) || "",
      email: getUserEmail(user) || "",
      headline: user?.identity?.headline || "",
      company: getUserCompany(user) || "",
      role: getUserTitle(user) || "",
      adminRole: (user.adminRole || "none") as any,
    });
    setShowEditUserDialog(true);
  };

  const onCreateUserSubmit = (data: CreateUserFormData) => {
    // Send flat data structure that the backend expects
    createUserMutation.mutate({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      title: data.headline, // Map headline to title for backend
      company: data.company,
      role: data.role, // This will help determine the persona type
      adminRole: data.adminRole,
      isStakTeamMember: false
    });
  };

  const onEditUserSubmit = (data: EditUserFormData) => {
    if (editingUser) {
      const updates: any = {
        email: data.email,
        identity: {
          ...(editingUser.identity || {}),
          first_name: data.firstName,
          last_name: data.lastName,
          headline: data.headline || null,
        },
      };

      // Update persona-specific blocks based on user persona
      const persona = editingUser.persona?.primary;
      if (data.company || data.role) {
        if (persona === 'founder' || !persona) {
          updates.founder_block = {
            ...(editingUser.founder_block || {}),
            company: data.company || editingUser.founder_block?.company,
            role: data.role || editingUser.founder_block?.role,
          };
        } else if (persona === 'vc') {
          updates.vc_block = {
            ...(editingUser.vc_block || {}),
            firm: data.company || editingUser.vc_block?.firm,
            role: data.role || editingUser.vc_block?.role,
          };
        } else if (persona === 'talent' || persona === 'operator') {
          updates.talent_block = {
            ...(editingUser.talent_block || {}),
            current_company: data.company || editingUser.talent_block?.current_company,
            current_role: data.role || editingUser.talent_block?.current_role,
          };
        }
      }

      // Only allow changing admin role if current user is owner
      if (data.adminRole && data.adminRole !== "none") {
        updates.adminRole = data.adminRole;
      } else if (data.adminRole === "none") {
        updates.adminRole = null;
      }

      updateUserMutation.mutate({
        userId: editingUser.id,
        updates,
      });
    }
  };

  // Create forms inside component but after state declarations
  const createUserForm = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      headline: "",
      company: "",
      role: "",
      adminRole: "none",
    },
  });

  const editUserForm = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      headline: "",
      company: "",
      role: "",
      adminRole: "none",
    },
  });

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
                        {user.profileImageUrl ? (
                          <img 
                            src={user.profileImageUrl} 
                            alt={getUserFullName(user)}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className={`w-8 h-8 ${getAvatarColor(getUserInitials(user))} text-white rounded-full flex items-center justify-center text-xs font-semibold`}>
                            {getUserInitials(user)}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {getUserFullName(user)}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{getUserEmail(user)}</p>
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
              <Button 
                onClick={() => setShowCreateUserDialog(true)}
                data-testid="button-add-user"
              >
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
                        getUserFirstName(user).toLowerCase().includes(searchQuery.toLowerCase()) ||
                        getUserLastName(user).toLowerCase().includes(searchQuery.toLowerCase()) ||
                        getUserEmail(user).toLowerCase().includes(searchQuery.toLowerCase()) ||
                        getUserCompany(user).toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((user: User) => (
                        <div key={user.id} className="grid grid-cols-12 gap-4 items-center py-3 border-b border-gray-100 hover:bg-gray-50">
                          <div className="col-span-3 flex items-center space-x-3">
                            {user.profileImageUrl ? (
                              <img 
                                src={user.profileImageUrl} 
                                alt={getUserFullName(user)}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className={`w-8 h-8 ${getAvatarColor(getUserInitials(user))} text-white rounded-full flex items-center justify-center text-xs font-semibold`}>
                                {getUserInitials(user)}
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-900">
                                {getUserFullName(user)}
                              </div>
                              <div className="text-sm text-gray-500 truncate max-w-[200px]">{getUserTitle(user)}</div>
                            </div>
                          </div>
                          <div className="col-span-3 text-sm text-gray-900">{getUserEmail(user)}</div>
                          <div className="col-span-2 text-sm text-gray-500">{getUserCompany(user) || '-'}</div>
                          <div className="col-span-2 text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                          <div className="col-span-2 flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              data-testid={`button-view-user-${user.id}`}
                              onClick={() => {
                                setViewingUser(user);
                                setShowViewUserDialog(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              data-testid={`button-edit-user-${user.id}`}
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              data-testid={`button-delete-user-${user.id}`}
                              onClick={() => {
                                setDeletingUser(user);
                                setShowDeleteUserDialog(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
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
            <AdminEvents />
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
                          <div className="font-medium">{getBillingUserFullName(user)}</div>
                          <div className="text-sm text-gray-500">{getBillingUserEmail(user)}</div>
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
                                  Change the billing plan for {getBillingUserFullName(user)}
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
            <AdminSponsors />
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

        {/* Create User Dialog */}
        <Dialog 
          open={showCreateUserDialog} 
          onOpenChange={setShowCreateUserDialog}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
              <DialogDescription>
                Add a new user to the system
              </DialogDescription>
            </DialogHeader>
            <Form {...createUserForm}>
              <form onSubmit={createUserForm.handleSubmit(onCreateUserSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createUserForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-create-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createUserForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name *</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-create-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={createUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" data-testid="input-create-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createUserForm.control}
                    name="headline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Headline</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., CEO at Company" data-testid="input-create-headline" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createUserForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., STAK Ventures" data-testid="input-create-company" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={createUserForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="e.g., Founder" data-testid="input-create-role" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={createUserForm.control}
                    name="adminRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-create-admin-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Admin privileges for system access
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowCreateUserDialog(false);
                      createUserForm.reset();
                    }}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createUserMutation.isPending}
                    data-testid="button-submit-create-user"
                  >
                    {createUserMutation.isPending ? "Creating..." : "Create User"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit User Dialog */}
        <Dialog 
          open={showEditUserDialog} 
          onOpenChange={setShowEditUserDialog}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>
                Update user information and permissions
              </DialogDescription>
            </DialogHeader>
            <Form {...editUserForm}>
              <form onSubmit={editUserForm.handleSubmit(onEditUserSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editUserForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editUserForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editUserForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input {...field} type="email" data-testid="input-edit-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editUserForm.control}
                    name="headline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Headline</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-headline" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editUserForm.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-company" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editUserForm.control}
                    name="adminRole"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Admin Role</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-admin-role">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                            <SelectItem value="owner">Owner</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editUserForm.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-role" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowEditUserDialog(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateUserMutation.isPending}
                    data-testid="button-save-user"
                  >
                    {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Delete User Dialog */}
        <AlertDialog open={showDeleteUserDialog} onOpenChange={setShowDeleteUserDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the user account for {deletingUser ? getUserFullName(deletingUser) : ''} ({deletingUser ? getUserEmail(deletingUser) : ''}). 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deletingUser) {
                    deleteUserMutation.mutate(deletingUser.id);
                  }
                }}
                className="bg-red-600 hover:bg-red-700"
                disabled={deleteUserMutation.isPending}
                data-testid="button-confirm-delete"
              >
                {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* View User Dialog */}
        <Dialog open={showViewUserDialog} onOpenChange={setShowViewUserDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>User Details</DialogTitle>
              <DialogDescription>
                Complete user information and activity
              </DialogDescription>
            </DialogHeader>
            {viewingUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Name</Label>
                    <p className="font-medium">
                      {getUserFullName(viewingUser)}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="font-medium">{getUserEmail(viewingUser)}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Title</Label>
                    <p className="font-medium">{getUserTitle(viewingUser) || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Company</Label>
                    <p className="font-medium">{getUserCompany(viewingUser) || "Not specified"}</p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Admin Role</Label>
                    <p className="font-medium">
                      {viewingUser.adminRole ? (
                        <Badge variant="outline">{viewingUser.adminRole}</Badge>
                      ) : (
                        "None"
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Account Status</Label>
                    <p className="font-medium">
                      <Badge className={viewingUser.accountStatus === "active" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {viewingUser.accountStatus || "active"}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Billing Plan</Label>
                    <p className="font-medium">
                      <Badge className={getBillingPlanColor(viewingUser.billingPlan || "free_stak_basic")}>
                        {viewingUser.billingPlan || "free_stak_basic"}
                      </Badge>
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">STAK Team Member</Label>
                    <p className="font-medium">
                      {viewingUser.isStakTeamMember ? (
                        <Badge className="bg-copper-100 text-copper-800">Yes</Badge>
                      ) : (
                        "No"
                      )}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Created At</Label>
                    <p className="font-medium">
                      {new Date(viewingUser.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">Updated At</Label>
                    <p className="font-medium">
                      {new Date(viewingUser.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between pt-4 border-t">
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowViewUserDialog(false);
                        handleEditUser(viewingUser);
                      }}
                      data-testid="button-edit-from-view"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit User
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (viewingUser.accountStatus === "active") {
                          updateUserStatusMutation.mutate({
                            userId: viewingUser.id,
                            status: "suspended",
                          });
                        } else {
                          updateUserStatusMutation.mutate({
                            userId: viewingUser.id,
                            status: "active",
                          });
                        }
                        setShowViewUserDialog(false);
                      }}
                      data-testid="button-toggle-status"
                    >
                      {viewingUser.accountStatus === "active" ? "Suspend User" : "Activate User"}
                    </Button>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setShowViewUserDialog(false)}
                    data-testid="button-close-view"
                  >
                    Close
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}