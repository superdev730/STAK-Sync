import React, { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
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
  BarChart3,
  Linkedin,
  Twitter,
  Globe,
  Github,
  Wand2,
  Sparkles,
  Target,
  Trophy,
  LogOut,
  Settings,
  Shield,
  Bell,
  Loader2
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
  githubUrl: z.string().url().optional().or(z.literal("")),
  networkingGoal: z.string().optional(),
  industries: z.array(z.string()).optional(),
  skills: z.array(z.string()).optional(),
  meetingPreference: z.string().optional(),
  profileVisible: z.boolean().optional(),
  showOnlineStatus: z.boolean().optional(),
  emailNotifications: z.boolean().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Enhanced Input Component with AI Enhancement Icon
interface EnhancedInputProps {
  label: string;
  name: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  multiline?: boolean;
  onEnhance?: () => void;
  isEnhancing?: boolean;
}

const EnhancedInput: React.FC<EnhancedInputProps> = ({
  label,
  name,
  placeholder,
  value,
  onChange,
  multiline = false,
  onEnhance,
  isEnhancing = false
}) => {
  return (
    <div className="relative">
      <Label htmlFor={name} className="text-sm font-medium text-gray-700 mb-2 block">
        {label}
      </Label>
      <div className="relative">
        {multiline ? (
          <Textarea
            id={name}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="pr-12 border-gray-300 focus:border-copper-500 focus:ring-copper-500"
            rows={4}
          />
        ) : (
          <Input
            id={name}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="pr-12 border-gray-300 focus:border-copper-500 focus:ring-copper-500"
          />
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={onEnhance}
          disabled={isEnhancing}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8 text-copper-600 hover:text-copper-700 hover:bg-copper-50"
        >
          {isEnhancing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  );
};

// Profile Settings Component
const ProfileSettings: React.FC<{ user: UserType }> = ({ user }) => {
  const { toast } = useToast();

  const handleLogout = () => {
    toast({
      title: "Logging out...",
      description: "Redirecting to logout",
    });
    setTimeout(() => {
      window.location.href = "/api/logout";
    }, 500);
  };

  return (
    <Card className="bg-white border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-gray-900 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Account Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Admin Badge */}
        {user.adminRole && (
          <div className="p-4 bg-gradient-to-r from-copper-50 to-amber-50 border border-copper-200 rounded-lg">
            <div className="flex items-center">
              <Shield className="w-5 h-5 text-copper-600 mr-2" />
              <div>
                <h3 className="font-semibold text-copper-800">STAK Team Member</h3>
                <p className="text-sm text-copper-600">Admin Role: {user.adminRole?.replace('_', ' ').toUpperCase()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Privacy Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Privacy Settings</h3>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Eye className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Profile Visibility</p>
                <p className="text-sm text-gray-600">Show your profile to other members</p>
              </div>
            </div>
            <Switch defaultChecked={user.profileVisible} />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Users className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Online Status</p>
                <p className="text-sm text-gray-600">Show when you're active</p>
              </div>
            </div>
            <Switch defaultChecked={user.showOnlineStatus} />
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <Bell className="w-5 h-5 text-gray-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">Email Notifications</p>
                <p className="text-sm text-gray-600">Receive updates via email</p>
              </div>
            </div>
            <Switch defaultChecked={user.emailNotifications} />
          </div>
        </div>

        {/* Account Actions */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Account Actions</h3>
          
          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>

        {/* Account Info */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Member since:</span>
              <span className="text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Account ID:</span>
              <span className="text-gray-900 font-mono text-xs">{user.id}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="text-gray-900">{user.email}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default function Profile() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"profile" | "privacy" | "ai-enhance" | "settings">("profile");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [isEnhancingProfile, setIsEnhancingProfile] = useState(false);
  const [showLinkedinDialog, setShowLinkedinDialog] = useState(false);
  const [showEnhancementDialog, setShowEnhancementDialog] = useState(false);
  const [enhancementResult, setEnhancementResult] = useState<any>(null);
  const [currentEnhancingField, setCurrentEnhancingField] = useState<string>("");

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
      githubUrl: "",
      networkingGoal: "",
      profileVisible: true,
      showOnlineStatus: true,
      emailNotifications: true,
    },
  });

  // Reset form when user data changes
  React.useEffect(() => {
    if (user) {
      form.reset({
        firstName: (user as any)?.firstName || "",
        lastName: (user as any)?.lastName || "",
        title: (user as any)?.title || "",
        company: (user as any)?.company || "",
        bio: (user as any)?.bio || "",
        location: (user as any)?.location || "",
        linkedinUrl: (user as any)?.linkedinUrl || "",
        twitterUrl: (user as any)?.twitterUrl || "",
        websiteUrl: (user as any)?.websiteUrl || "",
        githubUrl: (user as any)?.githubUrl || "",
        networkingGoal: (user as any)?.networkingGoal || "",
        profileVisible: (user as any)?.profileVisible ?? true,
        showOnlineStatus: (user as any)?.showOnlineStatus ?? true,
        emailNotifications: (user as any)?.emailNotifications ?? true,
      });
    }
  }, [user, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return await apiRequest("PUT", "/api/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
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

  const enhanceFieldMutation = useMutation({
    mutationFn: async ({ fieldName, currentValue }: { fieldName: string; currentValue: string }) => {
      return await apiRequest("POST", "/api/profile/enhance-field", { fieldName, currentValue });
    },
    onSuccess: (data: any) => {
      setEnhancementResult(data);
      setShowEnhancementDialog(true);
    },
    onError: (error) => {
      toast({
        title: "Enhancement Failed",
        description: "Could not enhance field. Please try again.",
        variant: "destructive",
      });
    },
  });

  const enhanceProfileMutation = useMutation({
    mutationFn: async (linkedinUrl: string) => {
      return await apiRequest("POST", "/api/profile/enhance-from-linkedin", { linkedinUrl });
    },
    onSuccess: (data: any) => {
      toast({
        title: "LinkedIn URL Saved",
        description: data.message,
      });
      setShowLinkedinDialog(false);
      setIsEnhancingProfile(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Enhancement Failed",
        description: "Could not save LinkedIn URL. Please try again.",
        variant: "destructive",
      });
      setIsEnhancingProfile(false);
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfileMutation.mutateAsync(data);
    } catch (error) {
      console.error("Profile update error:", error);
    }
  };

  const handleLinkedinEnhancement = async () => {
    if (!linkedinUrl) {
      toast({
        title: "LinkedIn URL Required",
        description: "Please enter your LinkedIn profile URL.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsEnhancingProfile(true);
      await enhanceProfileMutation.mutateAsync(linkedinUrl);
    } catch (error) {
      console.error("LinkedIn enhancement error:", error);
    }
  };

  const handleFieldEnhancement = (fieldName: string, currentValue: string) => {
    setCurrentEnhancingField(fieldName);
    enhanceFieldMutation.mutate({ fieldName, currentValue });
  };

  const applyEnhancement = () => {
    if (enhancementResult && currentEnhancingField) {
      form.setValue(currentEnhancingField as any, enhancementResult.enhancedValue);
      setShowEnhancementDialog(false);
      setEnhancementResult(null);
      setCurrentEnhancingField("");
      toast({
        title: "Enhancement Applied",
        description: `Your ${currentEnhancingField} has been enhanced with AI insights.`,
      });
    }
  };

  // Calculate profile completeness
  const calculateCompleteness = () => {
    const fields = form.getValues();
    const requiredFields = ['firstName', 'lastName', 'title', 'company', 'bio', 'location'];
    const optionalFields = ['linkedinUrl', 'networkingGoal'];
    
    const requiredFilled = requiredFields.filter(field => fields[field as keyof ProfileFormData]).length;
    const optionalFilled = optionalFields.filter(field => fields[field as keyof ProfileFormData]).length;
    
    const totalScore = (requiredFilled / requiredFields.length) * 80 + (optionalFilled / optionalFields.length) * 20;
    return Math.round(totalScore);
  };

  const completenessScore = calculateCompleteness();

  if (authLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Your STAK Profile</h1>
          <p className="text-lg text-gray-600">Build connections that matter in the STAK ecosystem</p>
        </div>

        {/* Profile Completeness Card */}
        <Card className="bg-white border-0 shadow-lg">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-gray-900">Profile Strength</CardTitle>
                <p className="text-gray-600">Complete your profile to maximize networking opportunities</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-blue-600">{completenessScore}%</div>
                <div className="text-sm text-gray-500">Complete</div>
              </div>
            </div>
            <Progress value={completenessScore} className="h-3 mt-4" />
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
          <TabsList className="grid grid-cols-4 w-full bg-white border shadow-sm">
            <TabsTrigger value="profile" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <User className="w-4 h-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="ai-enhance" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Wand2 className="w-4 h-4 mr-2" />
              AI Enhancement
            </TabsTrigger>
            <TabsTrigger value="privacy" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Eye className="w-4 h-4 mr-2" />
              Privacy
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Personal Information</CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">First Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900" />
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
                            <FormLabel className="text-gray-700">Last Name</FormLabel>
                            <FormControl>
                              <Input {...field} className="bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700">Professional Title</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., CEO, Founder, Investor" className="bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900" />
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
                            <FormLabel className="text-gray-700">Company</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Your company or organization" className="bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <EnhancedInput
                              label="Professional Bio"
                              name="bio"
                              placeholder="Tell the STAK community about your expertise, interests, and what you're looking to achieve..."
                              value={field.value}
                              onChange={field.onChange}
                              multiline={true}
                              onEnhance={() => handleFieldEnhancement('bio', field.value || '')}
                              isEnhancing={enhanceFieldMutation.isPending && currentEnhancingField === 'bio'}
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
                          <FormLabel className="text-gray-700">Location</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="City, State/Country" className="bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator className="my-6" />

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Professional Links</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="linkedinUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 flex items-center">
                                <Linkedin className="w-4 h-4 mr-2 text-blue-600" />
                                LinkedIn
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://linkedin.com/in/yourprofile" className="bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900" />
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
                              <FormLabel className="text-gray-700 flex items-center">
                                <Twitter className="w-4 h-4 mr-2 text-blue-400" />
                                Twitter
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://twitter.com/yourusername" className="bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="websiteUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 flex items-center">
                                <Globe className="w-4 h-4 mr-2 text-green-600" />
                                Website
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://yourwebsite.com" className="bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="githubUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-gray-700 flex items-center">
                                <Github className="w-4 h-4 mr-2 text-gray-800" />
                                GitHub
                              </FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="https://github.com/yourusername" className="bg-gray-50 border-gray-200 focus:border-blue-500 text-gray-900" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator className="my-6" />

                    <FormField
                      control={form.control}
                      name="networkingGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <EnhancedInput
                              label="Networking Goals"
                              name="networkingGoal"
                              placeholder="What are you hoping to achieve through networking in the STAK community?"
                              value={field.value}
                              onChange={field.onChange}
                              multiline={true}
                              onEnhance={() => handleFieldEnhancement('networkingGoal', field.value || '')}
                              isEnhancing={enhanceFieldMutation.isPending && currentEnhancingField === 'networkingGoal'}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end pt-4">
                      <Button 
                        type="submit" 
                        disabled={updateProfileMutation.isPending}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                      >
                        {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Enhancement Tab */}
          <TabsContent value="ai-enhance" className="space-y-6">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-blue-600" />
                  AI-Powered Profile Enhancement
                </CardTitle>
                <p className="text-gray-600">
                  Link your professional profiles and let AI create a compelling STAK profile that highlights your strengths and networking potential.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* LinkedIn Enhancement */}
                <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center">
                      <Linkedin className="w-6 h-6 text-blue-600 mr-3" />
                      <div>
                        <h3 className="font-semibold text-gray-900">LinkedIn Profile Import</h3>
                        <p className="text-sm text-gray-600">Automatically enhance your profile with LinkedIn data</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <Input
                        placeholder="https://linkedin.com/in/yourprofile"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="flex-1 bg-white border-gray-200 text-gray-900"
                      />
                      <Button 
                        onClick={handleLinkedinEnhancement}
                        disabled={isEnhancingProfile || !linkedinUrl}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isEnhancingProfile ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Enhancing...
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4 mr-2" />
                            Enhance
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="text-xs text-gray-500">
                      <p>• AI will analyze your LinkedIn profile for professional achievements</p>
                      <p>• Generate an optimized bio highlighting your expertise</p>
                      <p>• Suggest networking goals based on your experience</p>
                      <p>• Identify key skills and industry connections</p>
                    </div>
                  </div>
                </div>

                {/* Other Enhancement Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <Globe className="w-5 h-5 text-green-600 mr-2" />
                      <h3 className="font-semibold text-gray-900">Website Analysis</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Import achievements and expertise from your personal website or company page</p>
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      Coming Soon
                    </Button>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center mb-2">
                      <Github className="w-5 h-5 text-gray-800 mr-2" />
                      <h3 className="font-semibold text-gray-900">GitHub Integration</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Showcase your technical contributions and open source involvement</p>
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      Coming Soon
                    </Button>
                  </div>
                </div>

                {/* Success Metrics */}
                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Trophy className="w-5 h-5 text-green-600 mr-2" />
                    Profile Optimization Tips
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700">
                    <div className="flex items-center">
                      <Target className="w-4 h-4 text-green-600 mr-2" />
                      <span>Complete profiles get 3x more connection requests</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 text-green-600 mr-2" />
                      <span>Rich bios increase match quality by 40%</span>
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="w-4 h-4 text-green-600 mr-2" />
                      <span>Clear networking goals lead to better conversations</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Privacy Tab */}
          <TabsContent value="privacy" className="space-y-6">
            <Card className="bg-white border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-gray-900">Privacy Settings</CardTitle>
                <p className="text-gray-600">Control how your profile appears to other STAK members</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium text-gray-900">Profile Visibility</Label>
                      <p className="text-sm text-gray-600">Allow other members to discover and view your profile</p>
                    </div>
                    <Switch 
                      checked={form.watch("profileVisible")}
                      onCheckedChange={(checked) => form.setValue("profileVisible", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium text-gray-900">Show Online Status</Label>
                      <p className="text-sm text-gray-600">Let others see when you're active on the platform</p>
                    </div>
                    <Switch 
                      checked={form.watch("showOnlineStatus")}
                      onCheckedChange={(checked) => form.setValue("showOnlineStatus", checked)}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base font-medium text-gray-900">Email Notifications</Label>
                      <p className="text-sm text-gray-600">Receive notifications about matches, messages, and events</p>
                    </div>
                    <Switch 
                      checked={form.watch("emailNotifications")}
                      onCheckedChange={(checked) => form.setValue("emailNotifications", checked)}
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={form.handleSubmit(onSubmit)}
                    disabled={updateProfileMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {updateProfileMutation.isPending ? "Saving..." : "Save Privacy Settings"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            {user && <ProfileSettings user={user} />}
          </TabsContent>
        </Tabs>

        {/* Enhancement Result Dialog */}
        <Dialog open={showEnhancementDialog} onOpenChange={setShowEnhancementDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-copper-600" />
                AI Enhancement Results
              </DialogTitle>
              <DialogDescription>
                Review the AI-generated enhancement for your {currentEnhancingField} field.
              </DialogDescription>
            </DialogHeader>
            
            {enhancementResult && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">Enhanced Content:</h4>
                  <p className="text-slate-700 whitespace-pre-wrap">{enhancementResult.enhancedValue}</p>
                </div>
                
                {enhancementResult.sources && enhancementResult.sources.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Sources Used:</h4>
                    {enhancementResult.sources.map((source: string, index: number) => (
                      <div key={index} className="text-sm text-blue-700 flex items-center">
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {source}
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowEnhancementDialog(false)}
                  >
                    Keep Original
                  </Button>
                  <Button
                    onClick={applyEnhancement}
                    className="bg-copper-600 hover:bg-copper-700 text-white"
                  >
                    Apply Enhancement
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