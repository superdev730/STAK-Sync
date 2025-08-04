import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Sparkles, 
  Edit, 
  Save, 
  X, 
  MapPin, 
  Briefcase, 
  Globe, 
  Mail, 
  Phone,
  Linkedin,
  Twitter,
  Github,
  Link,
  Award,
  Target,
  Users,
  TrendingUp,
  Zap,
  Brain
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  company: string | null;
  position: string | null;
  location: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
  websiteUrls: string[] | null;
  skills: string[] | null;
  industries: string[] | null;
  networkingGoals: string | null;
  investmentStage: string | null;
  fundingRange: string | null;
  privacySettings: any | null;
  createdAt: string;
  updatedAt: string;
}

interface ProfileStats {
  completionPercentage: number;
  signalScore: number;
  connections: number;
  meetingRequestsCount: number;
  profileViews: number;
}

export default function Profile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("basic");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [tempValues, setTempValues] = useState<Record<string, any>>({});
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({});
  const [showGuide, setShowGuide] = useState(false);
  const [guideMessages, setGuideMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [userInput, setUserInput] = useState("");
  const [guideLoading, setGuideLoading] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/profile"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ProfileStats>({
    queryKey: ["/api/profile/stats"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      return await apiRequest("PATCH", "/api/profile", updates);
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/profile/stats"] });
      setEditingSection(null);
      setTempValues({});
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const aiEnhanceMutation = useMutation({
    mutationFn: async ({ field, currentValue, context }: { field: string; currentValue: string; context?: string }) => {
      return await apiRequest("POST", "/api/ai/enhance", { 
        field, 
        currentValue, 
        context: context || "",
        profileData: profile 
      });
    },
    onSuccess: (data, variables) => {
      const { field } = variables;
      setTempValues(prev => ({
        ...prev,
        [field]: data.enhancedValue
      }));
      setAiLoading(prev => ({
        ...prev,
        [field]: false
      }));
      toast({
        title: "AI Enhancement Complete",
        description: `Your ${field.replace(/([A-Z])/g, ' $1').toLowerCase()} has been enhanced!`,
      });
    },
    onError: (error: any, variables) => {
      const { field } = variables;
      setAiLoading(prev => ({
        ...prev,
        [field]: false
      }));
      toast({
        title: "AI Enhancement Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const guideQueryMutation = useMutation({
    mutationFn: async (message: string) => {
      return await apiRequest("POST", "/api/ai/guide", { 
        message, 
        profileData: profile,
        conversationHistory: guideMessages
      });
    },
    onSuccess: (data) => {
      setGuideMessages(prev => [
        ...prev,
        { role: 'user', content: userInput },
        { role: 'assistant', content: data.response }
      ]);
      setUserInput("");
      setGuideLoading(false);
      
      // If the AI suggests profile updates, apply them
      if (data.profileUpdates) {
        setTempValues(prev => ({ ...prev, ...data.profileUpdates }));
        toast({
          title: "Profile Suggestions Applied",
          description: "The AI guide has suggested some profile improvements. Review and save when ready!",
        });
      }
    },
    onError: (error: any) => {
      setGuideLoading(false);
      toast({
        title: "Guide Error",
        description: error.message || "Something went wrong with the AI guide",
        variant: "destructive",
      });
    },
  });

  const handleGuideSubmit = () => {
    if (!userInput.trim()) return;
    setGuideLoading(true);
    guideQueryMutation.mutate(userInput);
  };

  const startGuide = () => {
    setShowGuide(true);
    setGuideMessages([
      {
        role: 'assistant',
        content: `Hi ${profile?.firstName || 'there'}! I'm your STAK Signal profile guide. I'll help you create a compelling profile that maximizes your networking potential.

Let's start with some questions:
1. What's your main goal with STAK Signal? (e.g., finding investors, connecting with founders, expanding your network)
2. What industry/sector are you most focused on?
3. What makes you unique in your field?

Answer any of these questions, or ask me anything about optimizing your profile!`
      }
    ]);
  };

  const handleEdit = (section: string) => {
    setEditingSection(section);
    // Initialize temp values with current profile data
    if (profile) {
      const sectionFields = getSectionFields(section);
      const initialValues: Record<string, any> = {};
      sectionFields.forEach(field => {
        initialValues[field] = profile[field as keyof UserProfile] || "";
      });
      setTempValues(initialValues);
    }
  };

  const handleSave = () => {
    if (Object.keys(tempValues).length > 0) {
      updateProfileMutation.mutate(tempValues);
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setTempValues({});
  };

  const handleAiEnhance = async (field: string, currentValue: string, context?: string) => {
    setAiLoading(prev => ({ ...prev, [field]: true }));
    aiEnhanceMutation.mutate({ field, currentValue, context });
  };

  const getSectionFields = (section: string): string[] => {
    switch (section) {
      case "basic":
        return ["firstName", "lastName", "company", "position", "location", "bio"];
      case "contact":
        return ["email", "linkedinUrl", "twitterUrl", "githubUrl", "websiteUrls"];
      case "professional":
        return ["skills", "industries", "networkingGoals"];
      case "investment":
        return ["investmentStage", "fundingRange"];
      default:
        return [];
    }
  };

  const getCompletionPercentage = () => {
    if (!profile) return 0;
    const requiredFields = [
      "firstName", "lastName", "company", "position", "location", "bio",
      "linkedinUrl", "skills", "industries", "networkingGoals"
    ];
    const completed = requiredFields.filter(field => {
      const value = profile[field as keyof UserProfile];
      return value && (Array.isArray(value) ? value.length > 0 : String(value).trim() !== "");
    });
    return Math.round((completed.length / requiredFields.length) * 100);
  };

  const renderField = (field: string, label: string, type: "input" | "textarea" | "array" = "input", aiEnhanced = false) => {
    const isEditing = editingSection && getSectionFields(editingSection).includes(field);
    const currentValue = isEditing ? tempValues[field] : profile?.[field as keyof UserProfile];
    const isAiLoading = aiLoading[field];

    if (type === "array") {
      const arrayValue = Array.isArray(currentValue) ? currentValue : [];
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-stak-white">{label}</Label>
            {aiEnhanced && isEditing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleAiEnhance(field, arrayValue.join(", "), `Generate relevant ${label.toLowerCase()} for ${profile?.company || 'technology professional'}`)}
                disabled={isAiLoading}
                className="text-stak-copper hover:text-stak-dark-copper"
              >
                {isAiLoading ? <Zap className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                AI Enhance
              </Button>
            )}
          </div>
          {isEditing ? (
            <Textarea
              value={Array.isArray(tempValues[field]) ? tempValues[field].join(", ") : tempValues[field] || ""}
              onChange={(e) => setTempValues(prev => ({
                ...prev,
                [field]: e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean)
              }))}
              placeholder={`Enter ${label.toLowerCase()}, separated by commas`}
              className="bg-stak-gray border-stak-gray text-stak-white"
            />
          ) : (
            <div className="flex flex-wrap gap-1">
              {arrayValue.length > 0 ? arrayValue.map((item: string, index: number) => (
                <Badge key={index} variant="outline" className="border-stak-copper text-stak-copper">
                  {item}
                </Badge>
              )) : (
                <span className="text-stak-light-gray italic">Not specified</span>
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-stak-white">{label}</Label>
          {aiEnhanced && isEditing && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleAiEnhance(field, String(currentValue || ""), getAiContext(field))}
              disabled={isAiLoading}
              className="text-stak-copper hover:text-stak-dark-copper"
            >
              {isAiLoading ? <Zap className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
              AI Enhance
            </Button>
          )}
        </div>
        {isEditing ? (
          type === "textarea" ? (
            <Textarea
              value={tempValues[field] || ""}
              onChange={(e) => setTempValues(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={`Enter your ${label.toLowerCase()}`}
              className="bg-stak-gray border-stak-gray text-stak-white"
              rows={4}
            />
          ) : (
            <Input
              value={tempValues[field] || ""}
              onChange={(e) => setTempValues(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={`Enter your ${label.toLowerCase()}`}
              className="bg-stak-gray border-stak-gray text-stak-white"
            />
          )
        ) : (
          <p className="text-stak-white">
            {currentValue || <span className="italic text-stak-light-gray">Not specified</span>}
          </p>
        )}
      </div>
    );
  };

  const getAiContext = (field: string): string => {
    switch (field) {
      case "bio":
        return `Professional bio for ${profile?.firstName} ${profile?.lastName} at ${profile?.company}`;
      case "networkingGoals":
        return `Networking goals for ${profile?.position} in ${profile?.industries?.join(", ") || "technology"}`;
      default:
        return `Professional ${field} enhancement`;
    }
  };

  if (profileLoading || statsLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-stak-gray rounded w-1/3"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="h-96 bg-stak-gray rounded"></div>
            <div className="lg:col-span-2 h-96 bg-stak-gray rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const completionPercentage = getCompletionPercentage();
  const signalScore = stats?.signalScore || 0;

  return (
    <div className="container mx-auto py-8 space-y-6 bg-background text-foreground">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-playfair text-stak-white">Profile Management</h1>
          <p className="text-stak-light-gray">Complete your profile to maximize your networking potential</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-stak-light-gray">Signal Score</div>
            <div className="text-2xl font-bold text-stak-copper">{signalScore}/1000</div>
          </div>
          <Sparkles className="h-8 w-8 text-stak-copper" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-stak-gray border-stak-gray">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stak-light-gray">Profile Complete</p>
                <p className="text-2xl font-bold text-stak-white">{completionPercentage}%</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
            <Progress value={completionPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card className="bg-stak-gray border-stak-gray">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stak-light-gray">Connections</p>
                <p className="text-2xl font-bold text-stak-white">{stats?.connections || 0}</p>
              </div>
              <Users className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stak-gray border-stak-gray">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stak-light-gray">Profile Views</p>
                <p className="text-2xl font-bold text-stak-white">{stats?.profileViews || 0}</p>
              </div>
              <Award className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-stak-gray border-stak-gray">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stak-light-gray">Meeting Requests</p>
                <p className="text-2xl font-bold text-stak-white">{stats?.meetingRequestsCount || 0}</p>
              </div>
              <Target className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card className="bg-stak-gray border-stak-gray sticky top-6">
            <CardHeader>
              <CardTitle className="text-stak-white">Profile Sections</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { id: "basic", label: "Basic Information", icon: User },
                { id: "contact", label: "Contact & Social", icon: Mail },
                { id: "professional", label: "Professional Info", icon: Briefcase },
                { id: "investment", label: "Investment Details", icon: TrendingUp },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === id
                      ? "bg-stak-copper text-stak-black"
                      : "text-stak-light-gray hover:bg-stak-black hover:text-stak-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
          <Card className="bg-stak-gray border-stak-gray">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-stak-white">
                  {activeTab === "basic" && "Basic Information"}
                  {activeTab === "contact" && "Contact & Social Links"}
                  {activeTab === "professional" && "Professional Information"}
                  {activeTab === "investment" && "Investment Details"}
                </CardTitle>
                {editingSection === activeTab ? (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCancel}
                      className="text-stak-light-gray hover:text-stak-white"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={updateProfileMutation.isPending}
                      className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {updateProfileMutation.isPending ? "Saving..." : "Save"}
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(activeTab)}
                    className="text-stak-copper hover:text-stak-dark-copper"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Information */}
              {activeTab === "basic" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderField("firstName", "First Name")}
                    {renderField("lastName", "Last Name")}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderField("company", "Company")}
                    {renderField("position", "Position")}
                  </div>
                  
                  {renderField("location", "Location")}
                  {renderField("bio", "Professional Bio", "textarea", true)}
                </div>
              )}

              {/* Contact & Social */}
              {activeTab === "contact" && (
                <div className="space-y-6">
                  {renderField("email", "Email Address")}
                  
                  <Separator />
                  
                  <h3 className="text-lg font-semibold text-stak-white">Social Links</h3>
                  {renderField("linkedinUrl", "LinkedIn URL")}
                  {renderField("twitterUrl", "Twitter URL")}
                  {renderField("githubUrl", "GitHub URL")}
                  {renderField("websiteUrls", "Website URLs", "array")}
                </div>
              )}

              {/* Professional */}
              {activeTab === "professional" && (
                <div className="space-y-6">
                  {/* AI Guide Button */}
                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={startGuide}
                      className="bg-gradient-to-r from-stak-copper to-stak-dark-copper text-stak-black hover:from-stak-dark-copper hover:to-stak-copper"
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      AI Profile Guide
                    </Button>
                  </div>
                  
                  {renderField("skills", "Skills & Expertise", "array", true)}
                  {renderField("industries", "Industries", "array", true)}
                  {renderField("networkingGoals", "Networking Goals", "textarea", true)}
                </div>
              )}

              {/* Investment */}
              {activeTab === "investment" && (
                <div className="space-y-6">
                  {renderField("investmentStage", "Investment Stage")}
                  {renderField("fundingRange", "Funding Range")}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-stak-gray border-stak-gray rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-stak-gray">
              <h2 className="text-xl font-bold text-stak-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-stak-copper" />
                AI Profile Guide
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowGuide(false)}
                className="text-stak-light-gray hover:text-stak-white"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {guideMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-stak-copper text-stak-black'
                        : 'bg-stak-black text-stak-white'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              {guideLoading && (
                <div className="flex justify-start">
                  <div className="bg-stak-black text-stak-white rounded-lg p-3 flex items-center gap-2">
                    <Zap className="h-4 w-4 animate-spin" />
                    Thinking...
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-stak-gray">
              <div className="flex gap-2">
                <Input
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="Ask me anything about your profile..."
                  className="bg-stak-black border-stak-gray text-stak-white"
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleGuideSubmit()}
                  disabled={guideLoading}
                />
                <Button
                  onClick={handleGuideSubmit}
                  disabled={!userInput.trim() || guideLoading}
                  className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                >
                  Send
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}