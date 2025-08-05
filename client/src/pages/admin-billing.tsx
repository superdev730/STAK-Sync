import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Activity,
  Download,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

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
  totalCostThisMonth: number;
  lastActivityAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  userEmail: string;
  userName: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  subscriptionAmount: number;
  tokenUsageAmount: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

interface BillingStats {
  totalUsers: number;
  stakBasicUsers: number;
  paidUsers: number;
  monthlyRecurringRevenue: number;
  tokenUsageRevenue: number;
  totalTokensUsed: number;
  averageTokensPerUser: number;
  overageUsers: number;
}

export default function AdminBilling() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlan, setFilterPlan] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: billingStats, isLoading: statsLoading } = useQuery<BillingStats>({
    queryKey: ["/api/admin/billing/stats"],
  });

  const { data: billingUsers, isLoading: usersLoading } = useQuery<BillingUser[]>({
    queryKey: ["/api/admin/billing/users", searchTerm, filterPlan, filterStatus],
  });

  const { data: invoices, isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/admin/billing/invoices"],
  });

  // Filter users based on search and filters
  const filteredUsers = billingUsers?.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPlan = filterPlan === "all" || user.billingPlan === filterPlan;
    const matchesStatus = filterStatus === "all" || user.billingStatus === filterStatus;
    
    return matchesSearch && matchesPlan && matchesStatus;
  }) || [];

  const updateBillingPlanMutation = useMutation({
    mutationFn: async ({ userId, plan }: { userId: string; plan: string }) => {
      return apiRequest(`/api/admin/billing/users/${userId}/plan`, "PUT", { plan });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Billing plan updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/billing/users"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update billing plan",
        variant: "destructive",
      });
    },
  });

  const exportBillingDataMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/admin/billing/export", "POST");
    },
    onSuccess: (data: any) => {
      // Create and download CSV file
      const blob = new Blob([data.csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `billing-data-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Billing data exported successfully",
      });
    },
  });

  const generateInvoiceMutation = useMutation({
    mutationFn: async (userId: string) => {
      return apiRequest(`/api/admin/billing/users/${userId}/generate-invoice`, "POST");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invoice generated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/billing/invoices"] });
    },
  });

  const getBillingPlanColor = (plan: string) => {
    switch (plan) {
      case "free_stak_basic": return "bg-green-100 text-green-800";
      case "paid_monthly": return "bg-blue-100 text-blue-800";
      case "enterprise": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getBillingStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "past_due": return "bg-yellow-100 text-yellow-800";
      case "canceled": return "bg-red-100 text-red-800";
      case "incomplete": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getInvoiceStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "pending": return <Clock className="h-4 w-4 text-yellow-600" />;
      case "overdue": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "failed": return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  if (statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Billing Management</h1>
            <p className="text-gray-600 mt-1">Manage subscriptions, token usage, and invoicing</p>
          </div>
          <Button 
            onClick={() => exportBillingDataMutation.mutate()}
            disabled={exportBillingDataMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>

        {/* Billing Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{billingStats?.totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${billingStats?.monthlyRecurringRevenue?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Zap className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Token Usage Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${billingStats?.tokenUsageRevenue?.toFixed(2) || '0.00'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overage Users</p>
                  <p className="text-2xl font-bold text-gray-900">{billingStats?.overageUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Billing Management Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="users">User Billing</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Billing Management</CardTitle>
                <div className="flex space-x-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Select value={filterPlan} onValueChange={setFilterPlan}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Plans</SelectItem>
                      <SelectItem value="free_stak_basic">STAK Basic</SelectItem>
                      <SelectItem value="paid_monthly">Paid Monthly</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="past_due">Past Due</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                      <SelectItem value="incomplete">Incomplete</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Tokens Used</TableHead>
                      <TableHead>Monthly Cost</TableHead>
                      <TableHead>STAK Member</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                          <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                        </TableRow>
                      ))
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={getBillingPlanColor(user.billingPlan)}>
                              {user.billingPlan.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getBillingStatusColor(user.billingStatus)}>
                              {user.billingStatus.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {user.tokensUsedThisMonth.toLocaleString()} / {user.monthlyTokenAllowance.toLocaleString()}
                              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                <div 
                                  className={`h-2 rounded-full ${
                                    user.tokensUsedThisMonth > user.monthlyTokenAllowance 
                                      ? 'bg-red-500' 
                                      : 'bg-blue-500'
                                  }`}
                                  style={{ 
                                    width: `${Math.min(100, (user.tokensUsedThisMonth / user.monthlyTokenAllowance) * 100)}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">${user.totalCostThisMonth.toFixed(2)}</span>
                          </TableCell>
                          <TableCell>
                            {user.stakMembershipVerified ? (
                              <Badge className="bg-green-100 text-green-800">Verified</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800">No</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Select
                                value={user.billingPlan}
                                onValueChange={(value) => 
                                  updateBillingPlanMutation.mutate({ userId: user.id, plan: value })
                                }
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="free_stak_basic">STAK Basic</SelectItem>
                                  <SelectItem value="paid_monthly">Paid Monthly</SelectItem>
                                  <SelectItem value="enterprise">Enterprise</SelectItem>
                                </SelectContent>
                              </Select>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => generateInvoiceMutation.mutate(user.id)}
                                disabled={generateInvoiceMutation.isPending}
                              >
                                Invoice
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Invoice Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Token Usage</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Due Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoicesLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 8 }).map((_, j) => (
                            <TableCell key={j}>
                              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      invoices?.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{invoice.userName}</p>
                              <p className="text-sm text-gray-500">{invoice.userEmail}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(invoice.billingPeriodStart).toLocaleDateString()} - {new Date(invoice.billingPeriodEnd).toLocaleDateString()}
                          </TableCell>
                          <TableCell>${invoice.subscriptionAmount.toFixed(2)}</TableCell>
                          <TableCell>${invoice.tokenUsageAmount.toFixed(2)}</TableCell>
                          <TableCell className="font-medium">${invoice.totalAmount.toFixed(2)}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {getInvoiceStatusIcon(invoice.status)}
                              <span className="text-sm capitalize">{invoice.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(invoice.dueDate).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Analytics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subscription Revenue</span>
                    <span className="font-semibold">${billingStats?.monthlyRecurringRevenue?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Token Usage Revenue</span>
                    <span className="font-semibold">${billingStats?.tokenUsageRevenue?.toFixed(2) || '0.00'}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total Monthly Revenue</span>
                    <span>${((billingStats?.monthlyRecurringRevenue || 0) + (billingStats?.tokenUsageRevenue || 0)).toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Distribution</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">STAK Basic Members</span>
                    <span className="font-semibold">{billingStats?.stakBasicUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Paid Subscribers</span>
                    <span className="font-semibold">{billingStats?.paidUsers || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Users Over Allowance</span>
                    <span className="font-semibold">{billingStats?.overageUsers || 0}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Token Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {billingStats?.totalTokensUsed?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-gray-600">Total Tokens Used</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {billingStats?.averageTokensPerUser?.toLocaleString() || '0'}
                    </p>
                    <p className="text-sm text-gray-600">Avg Tokens per User</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {billingStats?.overageUsers || '0'}
                    </p>
                    <p className="text-sm text-gray-600">Users Over Limit</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}