import { useState, useEffect } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { 
  Wand2, 
  Linkedin, 
  Twitter, 
  Github, 
  Globe, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Sparkles,
  Edit,
  Save,
  X,
  ExternalLink,
  TrendingUp,
  Database,
  FileText,
  Clock,
  MessageCircle,
  Send,
  Bot,
  User as UserIcon
} from "lucide-react";
import type { User } from "@shared/schema";

interface SocialSource {
  platform: string;
  url: string;
  isValid: boolean;
  isAnalyzing: boolean;
  hasData: boolean;
  error?: string;
}

interface ProfileFact {
  id: string;
  factType: string;
  title: string;
  description: string;
  org?: string;
  role?: string;
  valueNumber?: string;
  valueCurrency?: string;
  startDate?: string;
  endDate?: string;
  location?: string;
  sourceUrls: string[];
  evidenceQuote: string;
  confidence: number;
  sourceType: string;
  createdAt: string;
}

interface ProfileEnrichmentRun {
  id: string;
  status: 'running' | 'completed' | 'failed';
  startedAt: string;
  finishedAt?: string;
  factsFound: number;
  sourcesProcessed: number;
  errorMessage?: string;
}

interface ConversationMessage {
  role: 'assistant' | 'user';
  content: string;
  timestamp: Date;
}

interface ConversationalData {
  role?: string;
  currentProjects?: string;
  industriesOfInterest?: string[];
  eventGoals?: string;
  networkingGoals?: string;
  personalDetail?: string;
}

interface ConsolidatedAIProfileBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: User;
  onProfileUpdate: () => void;
}

export default function ConsolidatedAIProfileBuilder({
  isOpen,
  onClose,
  profile,
  onProfileUpdate
}: ConsolidatedAIProfileBuilderProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch profile facts
  const { data: profileFacts = [], refetch: refetchFacts } = useQuery({
    queryKey: ['/api/profile/facts'],
    enabled: isOpen && profile !== undefined,
  });

  // Fetch enrichment runs
  const { data: enrichmentRuns = [] } = useQuery({
    queryKey: ['/api/profile/enrichment-runs'],
    enabled: isOpen && profile !== undefined,
  });

  // Mutation to refresh facts
  const refreshFactsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/profile/facts:refresh', {
        method: 'POST',
      });
    },
    onSuccess: () => {
      toast({
        title: "Fact refresh started",
        description: "We're analyzing your sources for new facts. This may takes a few minutes.",
      });
      refetchFacts();
      queryClient.invalidateQueries({ queryKey: ['/api/profile/enrichment-runs'] });
    },
    onError: (error: any) => {
      toast({
        title: "Refresh failed",
        description: error.message || "Failed to start fact refresh",
        variant: "destructive",
      });
    },
  });

  // Conversational AI mutation
  const conversationMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await apiRequest('/api/ai/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationHistory: conversationMessages,
          step: conversationStep,
          extractedData: conversationalData
        }),
      });
      return response;
    },
    onSuccess: (data: any) => {
      // Add AI response to conversation
      setConversationMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        timestamp: new Date()
      }]);
      
      // Update extracted data if provided
      if (data.extractedData) {
        setConversationalData(prev => ({ ...prev, ...data.extractedData }));
      }
      
      // Update conversation step
      if (data.step !== undefined) {
        setConversationStep(data.step);
      }
      
      // Check if conversation is complete
      if (data.isComplete) {
        setIsConversationComplete(true);
        // Auto-apply conversational data to profile
        applyConversationalDataToProfile(data.finalData || conversationalData);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Conversation error",
        description: error.message || "Failed to process conversation",
        variant: "destructive",
      });
    },
  });
  
  // Helper to extract values from profile objects
  const getProfileValue = (field: any) => {
    if (typeof field === 'object' && field?.value !== undefined) {
      return field.value;
    }
    return field || '';
  };
  
  const [activeTab, setActiveTab] = useState<'sources' | 'facts' | 'interview' | 'preview' | 'edit'>('sources');
  const [socialSources, setSocialSources] = useState<SocialSource[]>([]);
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedProfile, setGeneratedProfile] = useState<Partial<User>>({});
  const [editingProfile, setEditingProfile] = useState<Partial<User>>({});
  const [networkingGoalSuggestions, setNetworkingGoalSuggestions] = useState<string[]>([]);
  const [manualSources, setManualSources] = useState<{
    linkedin?: string;
    twitter?: string;
    github?: string;
    website?: string;
    portfolio?: string;
    other?: string;
  }>({});
  
  // Conversational AI state
  const [conversationMessages, setConversationMessages] = useState<ConversationMessage[]>([]);
  const [currentUserMessage, setCurrentUserMessage] = useState('');
  const [conversationalData, setConversationalData] = useState<ConversationalData>({});
  const [conversationStep, setConversationStep] = useState(0);
  const [isConversationComplete, setIsConversationComplete] = useState(false);
  
  // Check for LinkedIn connection success
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('linkedin') === 'success') {
      toast({
        title: "LinkedIn Connected",
        description: "Your LinkedIn profile has been connected successfully!",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (urlParams.get('linkedin_error') === 'true') {
      toast({
        title: "LinkedIn Connection Failed",
        description: "There was an error connecting your LinkedIn profile. Please try again.",
        variant: "destructive",
      });
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [toast]);

  // Initialize social sources from existing profile
  useEffect(() => {
    if (profile && isOpen) {
      const sources: SocialSource[] = [];
      if (getProfileValue(profile.linkedinUrl)) {
        sources.push({
          platform: 'LinkedIn',
          url: getProfileValue(profile.linkedinUrl),
          isValid: true,
          isAnalyzing: false,
          hasData: true
        });
      }
      if (getProfileValue(profile.twitterUrl)) {
        sources.push({
          platform: 'Twitter', 
          url: getProfileValue(profile.twitterUrl),
          isValid: true,
          isAnalyzing: false,
          hasData: true
        });
      }
      if (getProfileValue(profile.githubUrl)) {
        sources.push({
          platform: 'GitHub',
          url: getProfileValue(profile.githubUrl),
          isValid: true,
          isAnalyzing: false,
          hasData: true
        });
      }
      const websiteUrls = getProfileValue(profile.websiteUrls);
      if (Array.isArray(websiteUrls) && websiteUrls.length) {
        websiteUrls.forEach((url: string) => {
          sources.push({
            platform: 'Website',
            url: url,
            isValid: true,
            isAnalyzing: false,
            hasData: true
          });
        });
      }
      setSocialSources(sources);
    }
  }, [profile, isOpen]);

  // AI Profile building mutation
  const buildProfileMutation = useMutation({
    mutationFn: async ({ sources, prompt }: { sources: SocialSource[], prompt?: string }) => {
      const cleanSources = sources.map(s => ({ platform: s.platform, url: s.url }));
      
      const response = await apiRequest("/api/profile/ai/build-complete", "POST", {
        socialSources: cleanSources,
        additionalContext: prompt,
        currentProfile: {
          firstName: getProfileValue(profile?.firstName) || null,
          lastName: getProfileValue(profile?.lastName) || null,
          email: profile?.email || null,
          company: getProfileValue(profile?.company) || null,
          title: getProfileValue(profile?.title) || null
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.profile) {
        // Store networking goal suggestions if provided
        if (data.profile && data.profile.networkingGoalSuggestions) {
          setNetworkingGoalSuggestions(data.profile.networkingGoalSuggestions);
        }
        
        // Remove suggestions from the profile data
        const { networkingGoalSuggestions, ...profileData } = data.profile;
        
        setGeneratedProfile(profileData);
        setEditingProfile(profileData);
        setActiveTab('preview');
        
        toast({
          title: "Profile Built Successfully",
          description: "AI has analyzed your sources and built a comprehensive profile.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Profile Building Failed",
        description: error.message || "Failed to build profile with AI assistance.",
        variant: "destructive",
      });
    },
  });

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      const response = await apiRequest('/api/profile', 'PUT', updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] });
      onProfileUpdate();
      onClose();
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const addSocialSource = () => {
    if (!newSocialUrl.trim()) return;

    let platform = 'Website';
    if (newSocialUrl.includes('linkedin.com')) platform = 'LinkedIn';
    else if (newSocialUrl.includes('twitter.com') || newSocialUrl.includes('x.com')) platform = 'Twitter';
    else if (newSocialUrl.includes('github.com')) platform = 'GitHub';

    const newSource: SocialSource = {
      platform,
      url: newSocialUrl.trim(),
      isValid: true,
      isAnalyzing: false,
      hasData: false
    };

    setSocialSources(prev => [...prev, newSource]);
    setNewSocialUrl('');
  };

  const removeSocialSource = (index: number) => {
    setSocialSources(prev => prev.filter((_, i) => i !== index));
  };

  // Initialize conversation
  const initializeConversation = () => {
    setConversationMessages([{
      role: 'assistant',
      content: `Hi! I'm STAK Sync's AI networking assistant. I'll help you build an amazing profile with just a few quick questions. This will only take 2-3 minutes and will help other members connect with you more effectively.

Ready to get started?`,
      timestamp: new Date()
    }]);
    setConversationStep(0);
    setConversationalData({});
    setIsConversationComplete(false);
  };

  // Handle sending user message
  const sendMessage = () => {
    if (!currentUserMessage.trim()) return;
    
    // Add user message to conversation
    const userMessage: ConversationMessage = {
      role: 'user',
      content: currentUserMessage,
      timestamp: new Date()
    };
    
    setConversationMessages(prev => [...prev, userMessage]);
    
    // Send to AI
    conversationMutation.mutate(currentUserMessage);
    
    // Clear input
    setCurrentUserMessage('');
  };

  // Apply conversational data to profile
  const applyConversationalDataToProfile = (data: ConversationalData) => {
    const updates: Partial<User> = {};
    
    if (data.role) updates.title = data.role;
    if (data.currentProjects) updates.bio = `${updates.bio || ''} Currently working on: ${data.currentProjects}.`.trim();
    if (data.industriesOfInterest) updates.industries = data.industriesOfInterest;
    if (data.networkingGoals) updates.networkingGoal = data.networkingGoals;
    if (data.eventGoals && data.personalDetail) {
      updates.bio = `${updates.bio || ''} ${data.personalDetail}`.trim();
    }
    
    setGeneratedProfile(prev => ({ ...prev, ...updates }));
    setEditingProfile(prev => ({ ...prev, ...updates }));
    
    toast({
      title: "Profile enhanced!",
      description: "Your conversational data has been integrated into your profile.",
    });
  };

  // Initialize conversation when tab is opened
  useEffect(() => {
    if (activeTab === 'interview' && conversationMessages.length === 0) {
      initializeConversation();
    }
  }, [activeTab]);

  const processManualSources = () => {
    const sourcesToAdd: SocialSource[] = [];
    
    Object.entries(manualSources).forEach(([platform, url]) => {
      if (url?.trim()) {
        let platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
        if (platform === 'twitter') platformName = 'X (Twitter)';
        
        sourcesToAdd.push({
          platform: platformName,
          url: url.trim(),
          isValid: true,
          isAnalyzing: false,
          hasData: false
        });
      }
    });
    
    setSocialSources(prev => [...prev, ...sourcesToAdd]);
    // Clear manual sources after processing
    setManualSources({});
  };

  const startAIProfileBuild = () => {
    if (socialSources.length === 0 && !aiPrompt.trim()) {
      toast({
        title: "Add Sources or Context",
        description: "Please add at least one social media profile or provide additional context.",
        variant: "destructive"
      });
      return;
    }

    setSocialSources(prev => prev.map(s => ({ ...s, isAnalyzing: true })));
    buildProfileMutation.mutate({
      sources: socialSources,
      prompt: aiPrompt
    });
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(editingProfile);
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'LinkedIn': return <Linkedin className="h-4 w-4 text-blue-600" />;
      case 'X (Twitter)': 
      case 'Twitter': 
        return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>;
      case 'GitHub': 
      case 'Github': 
        return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>;
      case 'Website':
      case 'Portfolio': 
        return <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-stak-copper" />
            AI Profile Builder
          </DialogTitle>
          <DialogDescription>
            Use AI to automatically build and enhance your professional profile from your social media and web presence.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="sources">Add Sources</TabsTrigger>
            <TabsTrigger value="facts">Facts</TabsTrigger>
            <TabsTrigger value="interview">AI Interview</TabsTrigger>
            <TabsTrigger value="preview" disabled={!generatedProfile.bio}>Preview & Edit</TabsTrigger>
            <TabsTrigger value="edit" disabled={!generatedProfile.bio}>Manual Edit</TabsTrigger>
          </TabsList>

          <TabsContent value="sources" className="mt-6 space-y-6">
            {/* LinkedIn OAuth Integration */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Linkedin className="h-5 w-5 text-blue-600" />
                  Connect with LinkedIn
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-8 w-8 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Import from LinkedIn</h3>
                      <p className="text-sm text-gray-600">Automatically import your professional profile, experience, and skills</p>
                    </div>
                  </div>
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/linkedin/auth');
                        const data = await response.json();
                        if (data.authUrl) {
                          window.open(data.authUrl, 'linkedin-oauth', 'width=600,height=700,scrollbars=yes,resizable=yes');
                        } else {
                          toast({
                            title: "LinkedIn Setup Required",
                            description: "LinkedIn OAuth is not properly configured. Please contact support.",
                            variant: "destructive",
                          });
                        }
                      } catch (error) {
                        toast({
                          title: "Connection Error",
                          description: "Failed to initiate LinkedIn connection. Please try again.",
                          variant: "destructive",
                        });
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    data-testid="button-connect-linkedin"
                  >
                    <Linkedin className="h-4 w-4 mr-2" />
                    Connect LinkedIn
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            {/* Manual Social Media Sources */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Manual Social Media & Web Links</CardTitle>
                <div className="text-sm text-gray-600">Add your professional social media profiles and website links</div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* LinkedIn Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Linkedin className="h-4 w-4 text-blue-600" />
                    LinkedIn Profile
                  </label>
                  <Input
                    value={manualSources.linkedin || ''}
                    onChange={(e) => setManualSources(prev => ({ ...prev, linkedin: e.target.value }))}
                    placeholder="https://linkedin.com/in/yourname"
                    data-testid="input-linkedin-url"
                  />
                </div>

                {/* X (Twitter) Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    X (Twitter)
                  </label>
                  <Input
                    value={manualSources.twitter || ''}
                    onChange={(e) => setManualSources(prev => ({ ...prev, twitter: e.target.value }))}
                    placeholder="https://x.com/yourusername"
                    data-testid="input-twitter-url"
                  />
                </div>

                {/* GitHub Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                    </svg>
                    GitHub Profile
                  </label>
                  <Input
                    value={manualSources.github || ''}
                    onChange={(e) => setManualSources(prev => ({ ...prev, github: e.target.value }))}
                    placeholder="https://github.com/yourusername"
                    data-testid="input-github-url"
                  />
                </div>

                {/* Personal Website Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M2 12h20"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    Personal Website
                  </label>
                  <Input
                    value={manualSources.website || ''}
                    onChange={(e) => setManualSources(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://yourwebsite.com"
                    data-testid="input-website-url"
                  />
                </div>

                {/* Portfolio/Blog Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10,9 9,9 8,9"/>
                    </svg>
                    Portfolio/Blog
                  </label>
                  <Input
                    value={manualSources.portfolio || ''}
                    onChange={(e) => setManualSources(prev => ({ ...prev, portfolio: e.target.value }))}
                    placeholder="https://yourportfolio.com or blog URL"
                    data-testid="input-portfolio-url"
                  />
                </div>

                {/* Other Platform Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Other Professional Link
                  </label>
                  <Input
                    value={manualSources.other || ''}
                    onChange={(e) => setManualSources(prev => ({ ...prev, other: e.target.value }))}
                    placeholder="Any other professional profile or website"
                    data-testid="input-other-url"
                  />
                </div>

                {/* Process Button */}
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={processManualSources}
                    disabled={!Object.values(manualSources).some(url => url?.trim())}
                    variant="outline"
                    size="sm"
                    data-testid="button-process-manual-sources"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Sources to Analysis
                  </Button>
                </div>

                {/* Display Added Sources */}
                {socialSources.length > 0 && (
                  <div className="space-y-2 mt-6">
                    <div className="text-sm font-medium text-gray-700">Sources Added for Analysis:</div>
                    {socialSources.map((source, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          {getSocialIcon(source.platform)}
                          <div>
                            <div className="font-medium">{source.platform}</div>
                            <div className="text-sm text-gray-600 truncate max-w-96">{source.url}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {source.isAnalyzing ? (
                            <Loader2 className="h-4 w-4 animate-spin text-stak-copper" />
                          ) : source.hasData ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                          <Button
                            onClick={() => removeSocialSource(index)}
                            size="sm"
                            variant="ghost"
                            data-testid={`button-remove-source-${index}`}
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

            {/* Additional Context */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Additional Context (Optional)</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Add any additional information about your goals, achievements, or specific areas you'd like highlighted in your profile..."
                  className="min-h-[100px]"
                  data-testid="textarea-ai-context"
                />
              </CardContent>
            </Card>

            {/* Build Profile Button */}
            <div className="flex justify-end">
              <Button
                onClick={startAIProfileBuild}
                disabled={buildProfileMutation.isPending || (socialSources.length === 0 && !aiPrompt.trim())}
                className="bg-stak-copper hover:bg-stak-copper/90"
                data-testid="button-build-profile"
              >
                {buildProfileMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Building Profile...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Build Profile with AI
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* Facts Tab - New fact-based profile system */}
          <TabsContent value="facts" className="mt-6 space-y-6">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
                  <Database className="h-5 w-5 text-stak-copper" />
                  Fact-Based Profile
                </h3>
                <p className="text-gray-600">Verified facts extracted from authoritative sources with citations.</p>
              </div>

              {/* Refresh Facts Button */}
              <div className="flex justify-between items-center">
                <Button
                  onClick={() => refreshFactsMutation.mutate()}
                  disabled={refreshFactsMutation.isPending}
                  variant="outline"
                  size="sm"
                  data-testid="button-refresh-facts"
                >
                  {refreshFactsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Analyzing Sources...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Refresh Facts
                    </>
                  )}
                </Button>
                
                <div className="text-sm text-gray-500">
                  {profileFacts.length} verified facts found
                </div>
              </div>

              {/* Enrichment Run Status */}
              {enrichmentRuns.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Recent Analysis Runs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {enrichmentRuns.slice(0, 3).map((run: ProfileEnrichmentRun) => (
                      <div key={run.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center gap-2">
                          {run.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-blue-500" />}
                          {run.status === 'completed' && <CheckCircle className="h-3 w-3 text-green-500" />}
                          {run.status === 'failed' && <AlertCircle className="h-3 w-3 text-red-500" />}
                          <span className="text-xs capitalize">{run.status}</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(run.startedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs">
                          {run.factsFound} facts
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Facts Display */}
              {profileFacts.length > 0 ? (
                <div className="space-y-4">
                  {profileFacts.map((fact: ProfileFact) => (
                    <Card key={fact.id} className="border-l-4 border-l-stak-copper">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-base">{fact.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {fact.factType.replace('_', ' ')}
                              </Badge>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Confidence:</span>
                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-yellow-500 to-green-500"
                                    style={{ width: `${Math.round(fact.confidence * 100)}%` }}
                                  />
                                </div>
                                <span className="text-xs font-medium">{Math.round(fact.confidence * 100)}%</span>
                              </div>
                            </div>
                          </div>
                          <Badge 
                            variant={
                              fact.sourceType === 'official_filings' ? 'default' :
                              fact.sourceType === 'reputable_media' ? 'secondary' : 'outline'
                            }
                            className="text-xs"
                          >
                            {fact.sourceType.replace('_', ' ')}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-gray-700">{fact.description}</p>
                        
                        {/* Additional Details */}
                        {(fact.org || fact.role || fact.valueNumber || fact.location || fact.startDate) && (
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {fact.org && (
                              <div>
                                <span className="font-medium text-gray-500">Organization:</span> {fact.org}
                              </div>
                            )}
                            {fact.role && (
                              <div>
                                <span className="font-medium text-gray-500">Role:</span> {fact.role}
                              </div>
                            )}
                            {fact.valueNumber && (
                              <div>
                                <span className="font-medium text-gray-500">Value:</span> 
                                {fact.valueCurrency && ` ${fact.valueCurrency}`} {fact.valueNumber}
                              </div>
                            )}
                            {fact.location && (
                              <div>
                                <span className="font-medium text-gray-500">Location:</span> {fact.location}
                              </div>
                            )}
                            {fact.startDate && (
                              <div>
                                <span className="font-medium text-gray-500">Date:</span> 
                                {fact.startDate}{fact.endDate && ` - ${fact.endDate}`}
                              </div>
                            )}
                          </div>
                        )}

                        <Separator />

                        {/* Evidence Quote */}
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-start gap-2">
                            <FileText className="h-4 w-4 text-gray-500 mt-0.5" />
                            <div>
                              <div className="text-xs font-medium text-gray-500 mb-1">Evidence:</div>
                              <p className="text-sm italic text-gray-700">"{fact.evidenceQuote}"</p>
                            </div>
                          </div>
                        </div>

                        {/* Source Citations */}
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-500 mb-2">Sources:</div>
                          <div className="space-y-1">
                            {fact.sourceUrls.map((url, index) => (
                              <div key={index} className="flex items-center gap-2 text-xs">
                                <ExternalLink className="h-3 w-3 text-gray-400" />
                                <a 
                                  href={url} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline truncate max-w-96"
                                  data-testid={`link-source-${index}`}
                                >
                                  {new URL(url).hostname}
                                </a>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Database className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 mb-4">No facts found yet</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Add your social media profiles and professional sources, then click "Refresh Facts" to extract verified information.
                    </p>
                    <Button
                      onClick={() => setActiveTab('sources')}
                      variant="outline"
                      size="sm"
                    >
                      Add Sources First
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* AI Interview Tab - Conversational profile enhancement */}
          <TabsContent value="interview" className="mt-6 space-y-6">
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2 flex items-center justify-center gap-2">
                  <MessageCircle className="h-5 w-5 text-stak-copper" />
                  AI Interview
                </h3>
                <p className="text-gray-600">Quick conversation to enhance your profile with additional details.</p>
              </div>

              <Card className="max-h-96 flex flex-col">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="h-4 w-4 text-stak-copper" />
                    Conversation
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden">
                  {/* Messages Container */}
                  <div className="h-64 overflow-y-auto space-y-3 mb-4 pr-2">
                    {conversationMessages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex gap-3 ${
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-stak-copper text-white ml-auto'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {message.role === 'assistant' && (
                              <Bot className="h-4 w-4 text-stak-copper mt-0.5 flex-shrink-0" />
                            )}
                            {message.role === 'user' && (
                              <UserIcon className="h-4 w-4 text-white mt-0.5 flex-shrink-0 order-2" />
                            )}
                            <div className={message.role === 'user' ? 'order-1' : ''}>
                              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                                {message.content}
                              </p>
                              <div 
                                className={`text-xs mt-1 opacity-70 ${
                                  message.role === 'user' ? 'text-white' : 'text-gray-500'
                                }`}
                              >
                                {message.timestamp.toLocaleTimeString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {conversationMutation.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 p-3 rounded-lg flex items-center gap-2">
                          <Bot className="h-4 w-4 text-stak-copper" />
                          <Loader2 className="h-4 w-4 animate-spin text-stak-copper" />
                          <span className="text-sm text-gray-600">AI is thinking...</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Message Input */}
                  {!isConversationComplete && (
                    <div className="flex gap-2">
                      <Input
                        value={currentUserMessage}
                        onChange={(e) => setCurrentUserMessage(e.target.value)}
                        placeholder="Type your response..."
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendMessage();
                          }
                        }}
                        disabled={conversationMutation.isPending}
                        data-testid="input-conversation-message"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!currentUserMessage.trim() || conversationMutation.isPending}
                        size="sm"
                        className="bg-stak-copper hover:bg-stak-copper/90"
                        data-testid="button-send-message"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}

                  {/* Conversation Complete State */}
                  {isConversationComplete && (
                    <div className="bg-green-50 p-4 rounded-lg text-center">
                      <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-green-800 font-medium">Interview Complete!</p>
                      <p className="text-xs text-green-600 mt-1">
                        Your responses have been integrated into your profile. Check the Preview tab to see the results.
                      </p>
                      <Button
                        onClick={() => setActiveTab('preview')}
                        variant="outline"
                        size="sm"
                        className="mt-3"
                      >
                        View Enhanced Profile
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Extracted Data Preview */}
              {(conversationalData.role || conversationalData.currentProjects || conversationalData.networkingGoals) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Information Captured
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {conversationalData.role && (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Role</Badge>
                        <span className="text-sm text-gray-700">{conversationalData.role}</span>
                      </div>
                    )}
                    {conversationalData.currentProjects && (
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs mt-1">Projects</Badge>
                        <span className="text-sm text-gray-700">{conversationalData.currentProjects}</span>
                      </div>
                    )}
                    {conversationalData.industriesOfInterest && conversationalData.industriesOfInterest.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs mt-1">Industries</Badge>
                        <div className="flex flex-wrap gap-1">
                          {conversationalData.industriesOfInterest.map((industry, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {industry}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {conversationalData.networkingGoals && (
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs mt-1">Networking Goals</Badge>
                        <span className="text-sm text-gray-700">{conversationalData.networkingGoals}</span>
                      </div>
                    )}
                    {conversationalData.personalDetail && (
                      <div className="flex items-start gap-2">
                        <Badge variant="outline" className="text-xs mt-1">Personal</Badge>
                        <span className="text-sm text-gray-700">{conversationalData.personalDetail}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Restart Conversation Button */}
              {isConversationComplete && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => {
                      initializeConversation();
                      setActiveTab('interview');
                    }}
                    variant="outline"
                    size="sm"
                    data-testid="button-restart-conversation"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Start New Interview
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-6 space-y-6">
            {generatedProfile.bio && (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold mb-2">Your AI-Generated Profile</h3>
                  <p className="text-gray-600">Review and customize your profile before saving.</p>
                </div>

                {/* Profile Preview Cards */}
                <div className="grid gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <h4 className="font-semibold mb-2">Professional Bio</h4>
                      <p className="text-gray-700">{generatedProfile.bio}</p>
                    </CardContent>
                  </Card>

                  {generatedProfile.skills && generatedProfile.skills.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Skills</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedProfile.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary">{skill}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {generatedProfile.industries && generatedProfile.industries.length > 0 && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Industries</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedProfile.industries.map((industry, index) => (
                            <Badge key={index} variant="outline">{industry}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {generatedProfile.networkingGoal && (
                    <Card>
                      <CardContent className="p-4">
                        <h4 className="font-semibold mb-2">Networking Goal</h4>
                        <p className="text-gray-700">{generatedProfile.networkingGoal}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setActiveTab('edit')}
                    data-testid="button-edit-profile"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Manually
                  </Button>
                  <Button
                    onClick={handleSaveProfile}
                    disabled={updateProfileMutation.isPending}
                    className="bg-stak-forest hover:bg-stak-forest/90"
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Profile
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="edit" className="mt-6 space-y-6">
            {/* Manual Edit Form */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Edit Your Profile</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Professional Bio</label>
                    <Textarea
                      value={editingProfile.bio || ''}
                      onChange={(e) => setEditingProfile(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder="Tell people about your professional background and goals..."
                      className="min-h-[120px] mt-1"
                      data-testid="textarea-edit-bio"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Networking Goal</label>
                    <Textarea
                      value={editingProfile.networkingGoal || ''}
                      onChange={(e) => setEditingProfile(prev => ({ ...prev, networkingGoal: e.target.value }))}
                      placeholder="What are you looking to achieve through networking?"
                      className="mt-1"
                      data-testid="textarea-edit-networking-goal"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Skills (comma-separated)</label>
                    <Input
                      value={editingProfile.skills?.join(', ') || ''}
                      onChange={(e) => setEditingProfile(prev => ({
                        ...prev,
                        skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                      placeholder="React, TypeScript, Leadership, etc."
                      className="mt-1"
                      data-testid="input-edit-skills"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">Industries (comma-separated)</label>
                    <Input
                      value={editingProfile.industries?.join(', ') || ''}
                      onChange={(e) => setEditingProfile(prev => ({
                        ...prev,
                        industries: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                      }))}
                      placeholder="Technology, Finance, Healthcare, etc."
                      className="mt-1"
                      data-testid="input-edit-industries"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="bg-stak-forest hover:bg-stak-forest/90"
                  data-testid="button-save-edited-profile"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Profile
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}