import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot,
  Users,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  Wand2,
  Send,
  Globe,
  Linkedin,
  Twitter,
  Github,
  Link,
  Eye,
  EyeOff,
  Search,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";

interface SimpleProfileAIAssistantProps {
  currentProfile: {
    bio?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    title?: string;
    skills?: string[];
    industries?: string[];
    networkingGoal?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    githubUrl?: string;
    websiteUrls?: string[];
  };
  onBioUpdate: (newBio: string) => void;
}

interface SocialMediaSource {
  platform: string;
  url: string;
  requiresAuth: boolean;
  authProvided: boolean;
  icon: React.ReactNode;
  status: 'pending' | 'analyzing' | 'completed' | 'error';
  extractedData?: any;
}

interface AuthCredentials {
  linkedin?: { username: string; password: string };
  twitter?: { username: string; password: string };
  github?: { token: string };
  custom?: { url: string; username?: string; password?: string };
}

export function SimpleProfileAIAssistant({ currentProfile, onBioUpdate }: SimpleProfileAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ai-help");
  const [aiPrompt, setAiPrompt] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const [socialSources, setSocialSources] = useState<SocialMediaSource[]>([]);
  const [authCredentials, setAuthCredentials] = useState<AuthCredentials>({});
  const [showPasswords, setShowPasswords] = useState<{[key: string]: boolean}>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  // Initialize social media sources from current profile
  useState(() => {
    const sources: SocialMediaSource[] = [];
    
    if (currentProfile.linkedinUrl) {
      sources.push({
        platform: 'LinkedIn',
        url: currentProfile.linkedinUrl,
        requiresAuth: true,
        authProvided: false,
        icon: <Linkedin className="h-4 w-4" />,
        status: 'pending'
      });
    }
    
    if (currentProfile.twitterUrl) {
      sources.push({
        platform: 'Twitter',
        url: currentProfile.twitterUrl,
        requiresAuth: true,
        authProvided: false,
        icon: <Twitter className="h-4 w-4" />,
        status: 'pending'
      });
    }
    
    if (currentProfile.githubUrl) {
      sources.push({
        platform: 'GitHub',
        url: currentProfile.githubUrl,
        requiresAuth: false,
        authProvided: true,
        icon: <Github className="h-4 w-4" />,
        status: 'pending'
      });
    }
    
    if (currentProfile.websiteUrls?.length) {
      currentProfile.websiteUrls.forEach((url, index) => {
        sources.push({
          platform: `Website ${index + 1}`,
          url,
          requiresAuth: false,
          authProvided: true,
          icon: <Globe className="h-4 w-4" />,
          status: 'pending'
        });
      });
    }
    
    setSocialSources(sources);
  });

  // AI Bio Generation with Social Media Integration
  const generateBioMutation = useMutation({
    mutationFn: async (data: { prompt: string; includeSocialData: boolean; authCredentials?: AuthCredentials }) => {
      const response = await apiRequest("/api/profile/ai/generate-bio", "POST", {
        prompt: data.prompt,
        currentProfile,
        includeSocialData: data.includeSocialData,
        socialSources: data.includeSocialData ? socialSources : [],
        authCredentials: data.authCredentials || {}
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.socialDataExtracted) {
        // Update social sources with extracted data
        setSocialSources(prev => prev.map(source => ({
          ...source,
          status: 'completed',
          extractedData: data.socialDataExtracted[source.platform]
        })));
      }
      
      toast({
        title: "AI Bio Generated",
        description: data.socialDataExtracted 
          ? "Your bio was created using data from your social media and online presence." 
          : "Your professional bio has been created with AI assistance.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate bio with AI",
        variant: "destructive",
      });
    },
  });

  // Social Media Analysis
  const analyzeSocialMediaMutation = useMutation({
    mutationFn: async (credentials: AuthCredentials) => {
      const response = await apiRequest("/api/profile/ai/analyze-social-media", "POST", {
        socialSources,
        authCredentials: credentials,
        currentProfile
      });
      return response.json();
    },
    onSuccess: (data) => {
      setSocialSources(prev => prev.map(source => ({
        ...source,
        status: 'completed',
        extractedData: data.extractedData[source.platform] || null
      })));
      
      toast({
        title: "Social Media Analysis Complete",
        description: `Successfully analyzed ${Object.keys(data.extractedData).length} sources.`,
      });
    },
    onError: (error: any) => {
      setSocialSources(prev => prev.map(source => ({
        ...source,
        status: source.status === 'analyzing' ? 'error' : source.status
      })));
      
      toast({
        title: "Analysis Failed",
        description: error.message || "Failed to analyze social media sources",
        variant: "destructive",
      });
    },
  });

  const handleAIGenerate = (includeSocialData: boolean = false) => {
    const prompt = aiPrompt || "Create a compelling professional bio that highlights my experience, skills, and networking goals";
    
    if (includeSocialData) {
      const missingAuth = socialSources.filter(s => s.requiresAuth && !s.authProvided);
      if (missingAuth.length > 0) {
        toast({
          title: "Authentication Required",
          description: `Please provide login credentials for: ${missingAuth.map(s => s.platform).join(', ')}`,
          variant: "destructive",
        });
        setActiveTab("social-integration");
        return;
      }
    }
    
    generateBioMutation.mutate({
      prompt,
      includeSocialData,
      authCredentials: includeSocialData ? authCredentials : undefined
    });
  };

  const handleAnalyzeSocialMedia = () => {
    const missingAuth = socialSources.filter(s => s.requiresAuth && !s.authProvided);
    if (missingAuth.length > 0) {
      toast({
        title: "Authentication Required",
        description: `Please provide login credentials for: ${missingAuth.map(s => s.platform).join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    setSocialSources(prev => prev.map(source => ({ ...source, status: 'analyzing' })));
    analyzeSocialMediaMutation.mutate(authCredentials);
  };

  const handleAuthChange = (platform: string, field: string, value: string) => {
    setAuthCredentials(prev => ({
      ...prev,
      [platform.toLowerCase()]: {
        ...prev[platform.toLowerCase() as keyof AuthCredentials],
        [field]: value
      }
    }));
    
    // Update auth status
    setSocialSources(prev => prev.map(source => 
      source.platform === platform 
        ? { ...source, authProvided: true }
        : source
    ));
  };

  const addCustomSource = (url: string) => {
    if (!url.trim()) return;
    
    const newSource: SocialMediaSource = {
      platform: 'Custom',
      url: url.trim(),
      requiresAuth: false,
      authProvided: true,
      icon: <Link className="h-4 w-4" />,
      status: 'pending'
    };
    
    setSocialSources(prev => [...prev, newSource]);
  };

  const togglePasswordVisibility = (key: string) => {
    setShowPasswords(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'analyzing': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'analyzing': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleRequestHelp = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Connection-based profile recommendations will be available soon. For now, you can use the AI assistant to enhance your bio.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-white">
          <Wand2 className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-stak-copper" />
            Profile AI Assistant
          </DialogTitle>
          <DialogDescription>
            Get AI help or request input from your connections to enhance your professional profile.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai-help" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Help
            </TabsTrigger>
            <TabsTrigger value="social-integration" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Social Media
            </TabsTrigger>
            <TabsTrigger value="crowdsource" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ask Connections
            </TabsTrigger>
          </TabsList>

          {/* AI Help Tab */}
          <TabsContent value="ai-help" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-stak-copper" />
                  AI Bio Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What would you like your bio to emphasize? (Optional)
                  </label>
                  <Textarea
                    placeholder="e.g., 'Focus on my AI expertise and startup experience' or 'Highlight my leadership in sustainable tech'"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {currentProfile.bio && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Current Bio:</h4>
                    <p className="text-sm text-gray-700">{currentProfile.bio}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    onClick={() => handleAIGenerate(false)}
                    disabled={generateBioMutation.isPending}
                    className="flex-1 bg-stak-copper hover:bg-stak-copper/90 text-white"
                  >
                    {generateBioMutation.isPending ? (
                      <>
                        <Bot className="h-4 w-4 mr-2 animate-pulse" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Bio
                      </>
                    )}
                  </Button>
                  
                  {socialSources.length > 0 && (
                    <Button
                      onClick={() => handleAIGenerate(true)}
                      disabled={generateBioMutation.isPending}
                      variant="outline"
                      className="flex-1 border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-white"
                    >
                      {generateBioMutation.isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4 mr-2" />
                          Use Social Data
                        </>
                      )}
                    </Button>
                  )}
                </div>

                {generateBioMutation.data && (
                  <div className="bg-blue-50 p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-stak-black">AI Generated Bio:</h4>
                      <Badge variant="secondary">
                        {Math.round(generateBioMutation.data.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-stak-black mb-3">{generateBioMutation.data.bio}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onBioUpdate(generateBioMutation.data.bio)}
                        size="sm"
                        className="bg-stak-forest hover:bg-stak-forest/90 text-white"
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Use This Bio
                      </Button>
                      <Button
                        onClick={handleAIGenerate}
                        size="sm"
                        variant="outline"
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Generate Another
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Media Integration Tab */}
          <TabsContent value="social-integration" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5 text-stak-copper" />
                  Social Media & Online Presence Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <Bot className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">AI-Powered Profile Analysis</h4>
                      <p className="text-blue-700 text-sm">
                        Our AI will navigate your social media profiles, websites, and online presence to extract professional information, achievements, and experience for your bio.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Connected Sources */}
                {socialSources.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3">Connected Sources</h4>
                    <div className="space-y-3">
                      {socialSources.map((source, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                          <div className="text-stak-copper">
                            {source.icon}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{source.platform}</div>
                            <div className="text-xs text-gray-600 truncate">{source.url}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(source.status)}>
                              {source.status}
                            </Badge>
                            {getStatusIcon(source.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Authentication Forms */}
                {socialSources.some(s => s.requiresAuth && !s.authProvided) && (
                  <div>
                    <h4 className="font-medium mb-3">Authentication Required</h4>
                    <div className="space-y-4">
                      {socialSources.filter(s => s.requiresAuth && !s.authProvided).map((source, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center gap-2 mb-3">
                            {source.icon}
                            <h5 className="font-medium">{source.platform} Login</h5>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`${source.platform}-username`}>
                                {source.platform === 'GitHub' ? 'Personal Access Token' : 'Username/Email'}
                              </Label>
                              <Input
                                id={`${source.platform}-username`}
                                type={source.platform === 'GitHub' ? 'password' : 'text'}
                                placeholder={source.platform === 'GitHub' ? 'ghp_xxxxxxxxxxxx' : 'Enter your username or email'}
                                onChange={(e) => handleAuthChange(source.platform, 
                                  source.platform === 'GitHub' ? 'token' : 'username', 
                                  e.target.value)}
                              />
                            </div>
                            
                            {source.platform !== 'GitHub' && (
                              <div>
                                <Label htmlFor={`${source.platform}-password`}>Password</Label>
                                <div className="relative">
                                  <Input
                                    id={`${source.platform}-password`}
                                    type={showPasswords[`${source.platform}-password`] ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    onChange={(e) => handleAuthChange(source.platform, 'password', e.target.value)}
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute right-0 top-0 h-full px-3"
                                    onClick={() => togglePasswordVisibility(`${source.platform}-password`)}
                                  >
                                    {showPasswords[`${source.platform}-password`] ? 
                                      <EyeOff className="h-4 w-4" /> : 
                                      <Eye className="h-4 w-4" />
                                    }
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-3 text-xs text-gray-600">
                            <p>🔒 Your credentials are used only for this session and are not stored.</p>
                            {source.platform === 'GitHub' && (
                              <p className="mt-1">
                                Create a Personal Access Token at: 
                                <a href="https://github.com/settings/tokens" target="_blank" rel="noopener" className="text-blue-600 hover:underline ml-1">
                                  GitHub Settings → Developer settings → Personal access tokens
                                </a>
                              </p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Custom Source */}
                <div>
                  <h4 className="font-medium mb-3">Add Custom Website or Profile</h4>
                  <div className="flex gap-2">
                    <Input
                      placeholder="https://your-website.com or https://portfolio.site.com"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addCustomSource((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                    />
                    <Button
                      variant="outline"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addCustomSource(input.value);
                        input.value = '';
                      }}
                    >
                      <Link className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    Add any public website, portfolio, or profile URL for AI analysis
                  </p>
                </div>

                {/* Analyze Button */}
                <Button
                  onClick={handleAnalyzeSocialMedia}
                  disabled={analyzeSocialMediaMutation.isPending || socialSources.length === 0}
                  className="w-full bg-stak-forest hover:bg-stak-forest/90 text-white"
                >
                  {analyzeSocialMediaMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing Social Media...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Analyze All Sources ({socialSources.length})
                    </>
                  )}
                </Button>

                {/* Extracted Data Preview */}
                {socialSources.some(s => s.extractedData) && (
                  <div>
                    <h4 className="font-medium mb-3">Extracted Information</h4>
                    <div className="space-y-3">
                      {socialSources.filter(s => s.extractedData).map((source, index) => (
                        <Card key={index} className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            {source.icon}
                            <h5 className="font-medium text-sm">{source.platform}</h5>
                          </div>
                          <div className="text-sm text-gray-700">
                            <p><strong>Profile:</strong> {source.extractedData?.profile || 'No profile data'}</p>
                            {source.extractedData?.achievements && (
                              <p><strong>Key Achievements:</strong> {source.extractedData.achievements}</p>
                            )}
                            {source.extractedData?.skills && (
                              <p><strong>Skills:</strong> {source.extractedData.skills}</p>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crowdsource Tab */}
          <TabsContent value="crowdsource" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-stak-copper" />
                  Request Help from Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Coming Soon</h4>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    We're building a feature that will let you request profile recommendations from your STAK connections. 
                    They'll be able to provide insights about your work together, achievements, and professional reputation.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    What specific help would you want from connections?
                  </label>
                  <Textarea
                    placeholder="e.g., 'Help me describe our work on the Series A funding round' or 'What would you say about my leadership style?'"
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    className="min-h-[80px]"
                    disabled
                  />
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">How this will work:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• AI will suggest your most active connections</li>
                    <li>• Send personalized requests for profile feedback</li>
                    <li>• Get recommendations about your work, deals, and abilities</li>
                    <li>• Choose which input to incorporate into your profile</li>
                  </ul>
                </div>

                <Button
                  onClick={handleRequestHelp}
                  disabled
                  className="w-full"
                  variant="outline"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Request Help (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}