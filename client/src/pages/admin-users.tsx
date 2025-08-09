import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit, 
  Shield, 
  ShieldCheck, 
  Copy, 
  Plus,
  Link,
  Mail,
  RefreshCw
} from "lucide-react";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  company?: string;
  title?: string;
  adminRole?: string;
  isStakTeamMember?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Invite {
  id: string;
  inviteCode: string;
  invitedEmail?: string;
  adminRole?: string;
  isStakTeamMember?: boolean;
  maxUses: number;
  currentUses: number;
  expiresAt?: string;
  createdAt: string;
  usedAt?: string;
}

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateUserDialog, setShowCreateUserDialog] = useState(false);
  const [showCreateInviteDialog, setShowCreateInviteDialog] = useState(false);
  const [showEditUserDialog, setShowEditUserDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Form states
  const [newUserData, setNewUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    company: '',
    title: '',
    adminRole: '',
    isStakTeamMember: false
  });

  const [inviteData, setInviteData] = useState({
    invitedEmail: '',
    adminRole: '',
    isStakTeamMember: false,
    maxUses: 1,
    expiresIn: '7' // days
  });

  // Data fetching with aggressive cache invalidation
  const { data: userManagement, isLoading: usersLoading, error: usersError, refetch: refetchUsers } = useQuery({
    queryKey: ['/api/admin/users', { page: currentPage, limit: 50, search: searchQuery }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50'
      });
      
      if (searchQuery.trim()) {
        params.set('search', searchQuery.trim());
      }
      
      const res = await fetch(`/api/admin/users?${params}`, {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch users');
      }
      
      return res.json();
    },
    staleTime: 0, // Always fetch fresh data
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const { data: invites, refetch: refetchInvites } = useQuery({
    queryKey: ['/api/admin/invites'],
    queryFn: async () => {
      const res = await fetch('/api/admin/invites', {
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch invites');
      }
      
      return res.json();
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Mutations with immediate UI updates
  const createUserMutation = useMutation({
    mutationFn: async (userData: typeof newUserData) => {
      return apiRequest('/api/admin/users', 'POST', userData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "User created successfully",
      });
      setShowCreateUserDialog(false);
      setNewUserData({
        firstName: '',
        lastName: '',
        email: '',
        company: '',
        title: '',
        adminRole: '',
        isStakTeamMember: false
      });
      // Force immediate refresh
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics/30d'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
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
      // Force immediate refresh
      refetchUsers();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/analytics/30d'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
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
      setShowEditUserDialog(false);
      setSelectedUser(null);
      // Force immediate refresh
      refetchUsers();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const createInviteMutation = useMutation({
    mutationFn: async (inviteData: any) => {
      return apiRequest('/api/admin/invites', 'POST', inviteData);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Invite created successfully",
      });
      setShowCreateInviteDialog(false);
      setInviteData({
        invitedEmail: '',
        adminRole: '',
        isStakTeamMember: false,
        maxUses: 1,
        expiresIn: '7'
      });
      refetchInvites();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create invite",
        variant: "destructive",
      });
    },
  });

  // Auto-refresh every 5 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      refetchUsers();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [refetchUsers]);

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowEditUserDialog(true);
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      deleteUserMutation.mutate(userId);
    }
  };

  const copyInviteLink = (inviteCode: string) => {
    const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;
    navigator.clipboard.writeText(inviteUrl);
    toast({
      title: "Copied!",
      description: "Invite link copied to clipboard",
    });
  };

  const getStatusBadge = (user: User) => {
    if (user.adminRole === 'owner') {
      return <Badge variant="destructive" className="bg-red-100 text-red-800"><ShieldCheck className="h-3 w-3 mr-1" />Owner</Badge>;
    }
    if (user.adminRole === 'admin' || user.adminRole === 'super_admin') {
      return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Shield className="h-3 w-3 mr-1" />Admin</Badge>;
    }
    if (user.isStakTeamMember) {
      return <Badge variant="outline" className="bg-green-100 text-green-800">STAK Team</Badge>;
    }
    return <Badge variant="outline" className="bg-gray-100 text-gray-800">User</Badge>;
  };

  if (usersLoading) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
              <p className="text-gray-600">Loading user management...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">Manage users, create admins, and send invites</p>
          </div>
          <div className="flex gap-3">
            <Dialog open={showCreateInviteDialog} onOpenChange={setShowCreateInviteDialog}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Link className="h-4 w-4 mr-2" />
                  Create Invite
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Invite Link</DialogTitle>
                  <DialogDescription>Create an invite link for new users to join STAK Sync</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="invitedEmail">Email (Optional)</Label>
                    <Input
                      id="invitedEmail"
                      value={inviteData.invitedEmail}
                      onChange={(e) => setInviteData({ ...inviteData, invitedEmail: e.target.value })}
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="adminRole">Admin Role</Label>
                    <Select value={inviteData.adminRole} onValueChange={(value) => setInviteData({ ...inviteData, adminRole: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Regular User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isStakTeamMember"
                      checked={inviteData.isStakTeamMember}
                      onCheckedChange={(checked) => setInviteData({ ...inviteData, isStakTeamMember: checked })}
                    />
                    <Label htmlFor="isStakTeamMember">STAK Team Member</Label>
                  </div>
                  <div>
                    <Label htmlFor="maxUses">Max Uses</Label>
                    <Input
                      id="maxUses"
                      type="number"
                      value={inviteData.maxUses}
                      onChange={(e) => setInviteData({ ...inviteData, maxUses: parseInt(e.target.value) })}
                      min="1"
                      max="100"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowCreateInviteDialog(false)} variant="outline">Cancel</Button>
                  <Button 
                    onClick={() => createInviteMutation.mutate(inviteData)}
                    disabled={createInviteMutation.isPending}
                  >
                    {createInviteMutation.isPending ? 'Creating...' : 'Create Invite'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Dialog open={showCreateUserDialog} onOpenChange={setShowCreateUserDialog}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                  <DialogDescription>Create a new user account directly</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={newUserData.firstName}
                        onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={newUserData.lastName}
                        onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="company">Company</Label>
                      <Input
                        id="company"
                        value={newUserData.company}
                        onChange={(e) => setNewUserData({ ...newUserData, company: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        value={newUserData.title}
                        onChange={(e) => setNewUserData({ ...newUserData, title: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="adminRole">Admin Role</Label>
                    <Select value={newUserData.adminRole} onValueChange={(value) => setNewUserData({ ...newUserData, adminRole: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Regular User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isStakTeamMember"
                      checked={newUserData.isStakTeamMember}
                      onCheckedChange={(checked) => setNewUserData({ ...newUserData, isStakTeamMember: checked })}
                    />
                    <Label htmlFor="isStakTeamMember">STAK Team Member</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowCreateUserDialog(false)} variant="outline">Cancel</Button>
                  <Button 
                    onClick={() => createUserMutation.mutate(newUserData)}
                    disabled={createUserMutation.isPending || !newUserData.email || !newUserData.firstName || !newUserData.lastName}
                  >
                    {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search by name, email, or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <Button 
                onClick={() => refetchUsers()} 
                variant="outline"
                disabled={usersLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${usersLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Users ({userManagement?.total || 0})
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersError ? (
              <div className="text-center py-8">
                <p className="text-red-600">Error loading users: {usersError.message}</p>
                <Button onClick={() => refetchUsers()} className="mt-4">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            ) : userManagement?.users?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">Name</th>
                      <th className="text-left p-3">Email</th>
                      <th className="text-left p-3">Company</th>
                      <th className="text-left p-3">Role</th>
                      <th className="text-left p-3">Created</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userManagement.users.map((user: User) => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{user.firstName} {user.lastName}</div>
                            <div className="text-sm text-gray-500">{user.title || 'No title'}</div>
                          </div>
                        </td>
                        <td className="p-3">{user.email}</td>
                        <td className="p-3">{user.company || 'No company'}</td>
                        <td className="p-3">{getStatusBadge(user)}</td>
                        <td className="p-3">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteUser(user.id)}
                              disabled={deleteUserMutation.isPending}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No users found</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invites Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              Active Invites
            </CardTitle>
            <CardDescription>Manage and copy invite links for new users</CardDescription>
          </CardHeader>
          <CardContent>
            {invites?.length > 0 ? (
              <div className="space-y-3">
                {invites.map((invite: Invite) => (
                  <div key={invite.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono">
                          {invite.inviteCode}
                        </code>
                        {invite.adminRole && (
                          <Badge variant="secondary">
                            <Shield className="h-3 w-3 mr-1" />
                            {invite.adminRole}
                          </Badge>
                        )}
                        {invite.isStakTeamMember && (
                          <Badge variant="outline" className="bg-green-100 text-green-800">
                            STAK Team
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-500">
                        {invite.invitedEmail && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {invite.invitedEmail}
                          </span>
                        )}
                        <span>Uses: {invite.currentUses}/{invite.maxUses}</span>
                        <span className="ml-3">Created: {new Date(invite.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyInviteLink(invite.inviteCode)}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Link
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Link className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">No active invites</p>
                <Button 
                  onClick={() => setShowCreateInviteDialog(true)}
                  className="mt-4"
                >
                  Create Your First Invite
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <Dialog open={showEditUserDialog} onOpenChange={setShowEditUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user information and permissions</DialogDescription>
            </DialogHeader>
            {selectedUser && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>First Name</Label>
                    <Input
                      value={selectedUser.firstName}
                      onChange={(e) => setSelectedUser({ ...selectedUser, firstName: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Last Name</Label>
                    <Input
                      value={selectedUser.lastName}
                      onChange={(e) => setSelectedUser({ ...selectedUser, lastName: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Admin Role</Label>
                  <Select 
                    value={selectedUser.adminRole || ''} 
                    onValueChange={(value) => setSelectedUser({ ...selectedUser, adminRole: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Regular User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="super_admin">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={selectedUser.isStakTeamMember || false}
                    onCheckedChange={(checked) => setSelectedUser({ ...selectedUser, isStakTeamMember: checked })}
                  />
                  <Label>STAK Team Member</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button onClick={() => setShowEditUserDialog(false)} variant="outline">Cancel</Button>
              <Button 
                onClick={() => updateUserMutation.mutate({ userId: selectedUser!.id, userData: selectedUser })}
                disabled={updateUserMutation.isPending}
              >
                {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}