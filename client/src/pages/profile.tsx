import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  User, 
  MapPin, 
  Briefcase, 
  Link as LinkIcon, 
  CheckCircle, 
  CircleAlert, 
  XCircle, 
  Upload,
  AlertTriangle,
  Calendar,
  MessageSquare,
  Users,
  TrendingUp,
  Brain,
  RefreshCw,
  ExternalLink,
  Eye,
  Filter,
  ArrowUpDown,
  BarChart3
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { User as UserType } from "@shared/schema";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  title: z.string().optional(),
  company: z.string().optional(),
  bio: z.string().optional(),
  location: z.string().optional(),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  twitterUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  networkingGoal: z.string().optional(),
  industries: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  meetingPreference: z.string().optional(),
  profileVisible: z.boolean().optional(),
  showOnlineStatus: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function Profile() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "privacy">("profile");
  const [drillDownDialog, setDrillDownDialog] = useState(false);
  const [drillDownType, setDrillDownType] = useState("");
  const [drillDownData, setDrillDownData] = useState<any[]>([]);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      title: "",
      company: "",
      bio: "",
      location: "",
      linkedinUrl: "",
      twitterUrl: "",
      websiteUrl: "",
      networkingGoal: "",
      industries: [],
      skills: [],
      meetingPreference: "",
      profileVisible: true,
      showOnlineStatus: true,
      emailNotifications: true,
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Set form values when user data loads
  useEffect(() => {
    if (user) {
      form.reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        title: user.title || "",
        company: user.company || "",
        bio: user.bio || "",
        location: user.location || "",
        linkedinUrl: user.linkedinUrl || "",
        twitterUrl: user.twitterUrl || "",
        websiteUrl: user.websiteUrl || "",
        networkingGoal: user.networkingGoal || "",
        industries: user.industries || [],
        skills: user.skills || [],
        meetingPreference: user.meetingPreference || "",
        profileVisible: user.profileVisible ?? true,
        showOnlineStatus: user.showOnlineStatus ?? true,
        emailNotifications: user.emailNotifications ?? true,
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const analyzeProfileMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/profile/analyze", {}),
    onSuccess: () => {
      toast({
        title: "Profile Analyzed!",
        description: "AI analysis completed. Your matching algorithm has been enhanced.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to analyze profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleMetricClick = async (metricType: string) => {
    setDrillDownType(metricType);
    setDrillDownDialog(true);

    // Fetch detailed data based on metric type
    try {
      let endpoint = '';
      switch (metricType) {
        case 'Connections':
          endpoint = '/api/user/connections-detailed';
          break;
        case 'Meetings':
          endpoint = '/api/user/meetings-detailed';
          break;
        case 'Messages':
          endpoint = '/api/user/messages-detailed';
          break;
        case 'Match Score':
          endpoint = '/api/user/matches-detailed';
          break;
        default:
          return;
      }

      const response = await apiRequest('GET', endpoint);
      setDrillDownData(response || []);
    } catch (error) {
      console.error('Error fetching detailed data:', error);
      setDrillDownData([]);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
          </div>
          <div className="space-y-6">
            <div className="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getProfileCompletion = () => {
    const fields = [
      user.firstName,
      user.lastName,
      user.title,
      user.bio,
      user.profileImageUrl,
      user.linkedinUrl,
      user.networkingGoal,
      user.industries?.length,
    ];
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const profileStats = [
    { label: "Connections", value: "87", icon: Users },
    { label: "Match Score", value: "94%", icon: TrendingUp },
    { label: "Meetings", value: "23", icon: Calendar },
    { label: "Messages", value: "156", icon: MessageSquare },
  ];

  const recentActivity = [
    {
      type: "connection",
      description: "Connected with Sarah Chen, Managing Partner at Sequoia",
      time: "2 days ago",
      icon: Users,
    },
    {
      type: "meeting",
      description: "Completed meeting with Marcus Rodriguez",
      time: "1 week ago",
      icon: Calendar,
    },
    {
      type: "profile",
      description: "Updated profile with new achievements",
      time: "2 weeks ago",
      icon: User,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-stak-white mb-4">Your Professional Profile</h1>
        <p className="text-xl text-stak-light-gray">Enhance your profile to attract better matches</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Profile Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Preview */}
          <Card className="bg-stak-black border border-stak-gray">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-stak-white">Profile Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-6 mb-8">
                <Avatar className="w-24 h-24 rounded-2xl">
                  <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || ""} />
                  <AvatarFallback className="bg-stak-copper text-stak-black text-xl rounded-2xl">
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-stak-white mb-2">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-stak-copper font-semibold mb-3">{user.title || "Professional Title"}</p>
                  {user.company && (
                    <p className="text-stak-light-gray mb-3">at {user.company}</p>
                  )}
                  <p className="text-stak-light-gray leading-relaxed mb-4">
                    {user.bio || "Add a compelling bio to tell your professional story and attract the right connections."}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-stak-light-gray">
                    {user.location && (
                      <span className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {user.location}
                      </span>
                    )}
                    {user.linkedinUrl && (
                      <span className="flex items-center text-stak-copper">
                        <LinkIcon className="w-4 h-4 mr-1" />
                        LinkedIn
                      </span>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="border-stak-copper text-stak-copper hover:bg-stak-copper/10">
                  <Upload className="w-4 h-4 mr-2" />
                  Change Photo
                </Button>
              </div>

              {/* Profile Stats */}
              <div className="grid grid-cols-4 gap-6 p-6 bg-stak-gray rounded-xl">
                {profileStats.map((stat) => (
                  <div 
                    key={stat.label} 
                    className="text-center cursor-pointer hover:bg-stak-black/50 p-3 rounded-lg transition-all duration-200 group"
                    onClick={() => handleMetricClick(stat.label)}
                  >
                    <div className="text-2xl font-bold text-stak-copper group-hover:text-stak-white transition-colors">
                      {stat.value}
                    </div>
                    <div className="text-sm text-stak-light-gray flex items-center justify-center gap-1">
                      {stat.label}
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Profile Form */}
          <Card className="bg-stak-black border border-stak-gray">
            <CardHeader>
              <div className="flex space-x-4 border-b border-stak-gray">
                <Button
                  variant={activeTab === "profile" ? "default" : "ghost"}
                  onClick={() => setActiveTab("profile")}
                  className={activeTab === "profile" ? "bg-stak-copper text-stak-black" : "text-stak-light-gray hover:text-stak-white"}
                >
                  Profile Information
                </Button>
                <Button
                  variant={activeTab === "privacy" ? "default" : "ghost"}
                  onClick={() => setActiveTab("privacy")}
                  className={activeTab === "privacy" ? "bg-stak-copper text-stak-black" : "text-stak-light-gray hover:text-stak-white"}
                >
                  Privacy & Settings
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {activeTab === "profile" && (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="focus:border-navy" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} className="focus:border-navy" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Professional Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Co-Founder & CEO" className="focus:border-navy" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., InnovateTech Solutions" className="focus:border-navy" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Professional Bio</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="Tell your professional story. What makes you unique? What are your goals?"
                                className="focus:border-navy min-h-[100px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Location</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., San Francisco, CA" className="focus:border-navy" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Separator />

                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-charcoal">Social Links</h4>
                        
                        <FormField
                          control={form.control}
                          name="linkedinUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>LinkedIn URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://linkedin.com/in/yourprofile" className="focus:border-navy" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="twitterUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Twitter URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://twitter.com/yourhandle" className="focus:border-navy" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="websiteUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Website URL</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://yourwebsite.com" className="focus:border-navy" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <FormField
                        control={form.control}
                        name="networkingGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Networking Goal</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Seeking Series A funding, Looking for co-founder" className="focus:border-navy" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="meetingPreference"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Meeting Preference</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Coffee meetings, Lunch discussions, Virtual first" className="focus:border-navy" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  {activeTab === "privacy" && (
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-charcoal">Privacy Settings</h4>
                        
                        <FormField
                          control={form.control}
                          name="profileVisible"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Profile Visibility</FormLabel>
                                <p className="text-sm text-gray-600">Allow others to discover your profile</p>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="showOnlineStatus"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Show Online Status</FormLabel>
                                <p className="text-sm text-gray-600">Let others see when you're online</p>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between">
                              <div>
                                <FormLabel>Email Notifications</FormLabel>
                                <p className="text-sm text-gray-600">Receive updates about matches and messages</p>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-center mb-2">
                          <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                          <h5 className="font-semibold text-red-800">Report Inappropriate Behavior</h5>
                        </div>
                        <p className="text-sm text-red-700 mb-3">
                          If you encounter inappropriate behavior or safety concerns, please report it immediately.
                        </p>
                        <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
                          Report Issue
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4 pt-6">
                    <Button type="button" variant="outline" className="border-stak-gray text-stak-light-gray hover:bg-stak-gray">
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                      disabled={updateProfileMutation.isPending}
                    >
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="bg-stak-black border border-stak-gray">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stak-white">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 bg-stak-gray rounded-lg">
                    <div className="w-8 h-8 bg-stak-copper rounded-full flex items-center justify-center">
                      <activity.icon className="w-4 h-4 text-stak-black" />
                    </div>
                    <div className="flex-1">
                      <span className="text-stak-white">{activity.description}</span>
                      <span className="text-xs text-stak-light-gray ml-auto block">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Profile Completion */}
          <Card className="bg-stak-black border border-stak-gray">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stak-white">Profile Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stak-light-gray">Basic Info</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stak-light-gray">Professional Photo</span>
                  {user.profileImageUrl ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stak-light-gray">LinkedIn Integration</span>
                  {user.linkedinUrl ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stak-light-gray">Networking Goals</span>
                  {user.networkingGoal ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <CircleAlert className="w-5 h-5 text-stak-copper" />
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-stak-light-gray">Industry Preferences</span>
                  {user.industries?.length ? (
                    <CheckCircle className="w-5 h-5 text-green-400" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-stak-gray rounded-full h-2">
                  <div 
                    className="bg-stak-copper h-2 rounded-full transition-all" 
                    style={{ width: `${getProfileCompletion()}%` }}
                  ></div>
                </div>
                <p className="text-sm text-stak-light-gray mt-2">{getProfileCompletion()}% Complete</p>
              </div>
            </CardContent>
          </Card>

          {/* AI Profile Analysis */}
          <Card className="bg-stak-black border border-stak-gray">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stak-white">AI Profile Enhancement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-stak-light-gray">
                Analyze your profile with AI to improve match quality and discover networking opportunities.
              </p>
              <Button 
                onClick={() => analyzeProfileMutation.mutate()}
                disabled={analyzeProfileMutation.isPending}
                className="w-full bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium"
              >
                {analyzeProfileMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analyze My Profile
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Account Actions */}
          <Card className="bg-stak-black border border-stak-gray">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stak-white">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button 
                variant="outline" 
                className="w-full justify-start border-stak-gray text-stak-light-gray hover:bg-stak-gray"
                onClick={() => window.location.href = "/api/logout"}
              >
                Sign Out
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Drill-Down Dialog */}
      <Dialog open={drillDownDialog} onOpenChange={setDrillDownDialog}>
        <DialogContent className="bg-stak-black border-stak-gray max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-stak-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-stak-copper" />
              {drillDownType} - Detailed Records
            </DialogTitle>
            <DialogDescription className="text-stak-light-gray">
              Detailed information about your {drillDownType.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stak-light-gray">{drillDownData.length} records found</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-stak-gray text-stak-light-gray">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="border-stak-gray text-stak-light-gray">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </div>
            </div>

            <div className="border border-stak-gray rounded-lg overflow-hidden">
              <div className="bg-stak-gray px-4 py-3 border-b border-stak-gray">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-stak-light-gray">
                  <div>Name/Title</div>
                  <div>Type/Status</div>
                  <div>Date/Time</div>
                  <div>Action</div>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {drillDownData.length > 0 ? (
                  drillDownData.map((record: any, index: number) => (
                    <div key={record.id || index} className="px-4 py-3 border-b border-stak-gray hover:bg-stak-gray/30 transition-colors">
                      <div className="grid grid-cols-4 gap-4 items-center text-sm">
                        <div className="text-stak-white font-medium">
                          {record.name || record.title || record.email || `Record ${index + 1}`}
                        </div>
                        <div className="text-stak-light-gray">
                          {record.type || record.status || record.category || 'N/A'}
                        </div>
                        <div className="text-stak-light-gray">
                          {record.createdAt || record.timestamp || record.date || 'N/A'}
                        </div>
                        <div>
                          <Button size="sm" variant="outline" className="border-stak-gray text-stak-light-gray hover:bg-stak-gray">
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-stak-light-gray">
                    No detailed records available for this metric
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
