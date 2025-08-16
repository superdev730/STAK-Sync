import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Wand2, 
  User, 
  Building2, 
  MapPin, 
  Target, 
  Linkedin, 
  Twitter, 
  Github, 
  Globe, 
  CheckCircle, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Camera,
  Plus,
  Trash2,
  ArrowRight,
  AlertCircle,
  Loader2
} from "lucide-react";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  component: React.ReactNode;
  isComplete: boolean;
}

interface UserProfile {
  firstName?: string;
  lastName?: string;
  title?: string;
  company?: string;
  location?: string;
  bio?: string;
  networkingGoal?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  githubUrl?: string;
  websiteUrls?: string[];
  skills?: string[];
  industries?: string[];
  profileImageUrl?: string;
}

interface SocialSource {
  platform: string;
  url: string;
  isValid: boolean;
  isAnalyzing: boolean;
  hasData: boolean;
  error?: string;
}

interface OnboardingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: UserProfile;
}

export default function OnboardingWizard({ isOpen, onClose, profile }: OnboardingWizardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [profileData, setProfileData] = useState<UserProfile>({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    title: profile?.title || '',
    company: profile?.company || '',
    location: profile?.location || '',
    bio: profile?.bio || '',
    networkingGoal: profile?.networkingGoal || '',
    linkedinUrl: profile?.linkedinUrl || '',
    twitterUrl: profile?.twitterUrl || '',
    githubUrl: profile?.githubUrl || '',
    websiteUrls: profile?.websiteUrls || [],
    skills: profile?.skills || [],
    industries: profile?.industries || [],
    profileImageUrl: profile?.profileImageUrl || ''
  });
  
  const [socialSources, setSocialSources] = useState<SocialSource[]>([]);
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [useAI, setUseAI] = useState(false);
  const [aiContext, setAiContext] = useState('');

  // Profile update mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<UserProfile>) => {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} ${errorText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
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

  // AI Profile building mutation with automatic URL parsing
  const buildProfileMutation = useMutation({
    mutationFn: async ({ sources, context }: { sources: SocialSource[], context?: string }) => {
      const cleanSources = sources.map(s => ({ platform: s.platform, url: s.url }));
      
      const response = await fetch("/api/profile/ai/build-complete", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          socialSources: cleanSources,
          additionalContext: context,
          currentProfile: profileData
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to build profile with AI');
      }

      return response.json();
    },
    onSuccess: (data) => {
      if (data.profile) {
        // Auto-populate all profile fields from AI analysis
        const aiProfile = data.profile;
        setProfileData(prev => ({
          ...prev,
          firstName: aiProfile.firstName || prev.firstName,
          lastName: aiProfile.lastName || prev.lastName,
          title: aiProfile.title || prev.title,
          company: aiProfile.company || prev.company,
          location: aiProfile.location || prev.location,
          bio: aiProfile.bio || prev.bio,
          networkingGoal: aiProfile.networkingGoal || prev.networkingGoal,
          linkedinUrl: aiProfile.linkedinUrl || prev.linkedinUrl,
          twitterUrl: aiProfile.twitterUrl || prev.twitterUrl,
          githubUrl: aiProfile.githubUrl || prev.githubUrl,
          websiteUrls: aiProfile.websiteUrls || prev.websiteUrls,
          skills: aiProfile.skills || prev.skills,
          industries: aiProfile.industries || prev.industries,
        }));
        
        toast({
          title: "AI Profile Built",
          description: "Your profile has been enhanced with AI-generated content.",
        });
        // Move to review step
        setCurrentStep(steps.length - 1);
      }
    },
    onError: (error: any) => {
      toast({
        title: "AI Build Failed",
        description: error.message || "Failed to build profile with AI assistance.",
        variant: "destructive",
      });
    },
  });

  const addSocialSource = () => {
    if (!newSocialUrl.trim()) return;

    // Enhanced URL parsing with automatic platform detection
    const url = newSocialUrl.trim().toLowerCase();
    let platform = 'Website';
    let cleanUrl = newSocialUrl.trim();
    
    // Auto-detect and clean URLs
    if (url.includes('linkedin.com') || url.includes('linkedin')) {
      platform = 'LinkedIn';
      // Ensure proper LinkedIn URL format
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = `https://linkedin.com/in/${cleanUrl.replace(/.*\/in\//, '')}`;
      }
    } else if (url.includes('twitter.com') || url.includes('x.com') || url.includes('@')) {
      platform = 'Twitter';
      // Handle Twitter/X URLs and @handles
      if (cleanUrl.startsWith('@')) {
        cleanUrl = `https://x.com/${cleanUrl.substring(1)}`;
      } else if (!cleanUrl.startsWith('http')) {
        cleanUrl = `https://x.com/${cleanUrl}`;
      }
    } else if (url.includes('github.com') || url.includes('github')) {
      platform = 'GitHub';
      // Ensure proper GitHub URL format
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = `https://github.com/${cleanUrl.replace(/.*github\.com\//, '')}`;
      }
    } else if (!cleanUrl.startsWith('http')) {
      // Add https:// to any website URL without protocol
      cleanUrl = `https://${cleanUrl}`;
    }

    const newSource: SocialSource = {
      platform,
      url: cleanUrl,
      isValid: true,
      isAnalyzing: false,
      hasData: false
    };

    setSocialSources(prev => [...prev, newSource]);
    setNewSocialUrl('');

    // Auto-populate profile URLs
    const updates: Partial<UserProfile> = {};
    switch (platform) {
      case 'LinkedIn':
        updates.linkedinUrl = cleanUrl;
        break;
      case 'Twitter':
        updates.twitterUrl = cleanUrl;
        break;
      case 'GitHub':
        updates.githubUrl = cleanUrl;
        break;
      default:
        updates.websiteUrls = [...(profileData.websiteUrls || []), cleanUrl];
    }
    
    setProfileData(prev => ({ ...prev, ...updates }));
    
    // Show helpful toast
    toast({
      title: `${platform} Added`,
      description: `Added ${platform} profile for AI analysis`,
    });
  };

  const removeSocialSource = (index: number) => {
    setSocialSources(prev => prev.filter((_, i) => i !== index));
  };

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'LinkedIn': return <Linkedin className="h-4 w-4" />;
      case 'Twitter': return <Twitter className="h-4 w-4" />;
      case 'GitHub': return <Github className="h-4 w-4" />;
      default: return <Globe className="h-4 w-4" />;
    }
  };

  const updateProfileData = (field: string, value: any) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleAIBuild = () => {
    if (socialSources.length === 0 && !aiContext.trim()) {
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
      context: aiContext
    });
  };

  const completeOnboarding = async () => {
    try {
      await updateProfileMutation.mutateAsync(profileData);
      toast({
        title: "Welcome to STAK Sync!",
        description: "Your profile has been created successfully. You can start connecting with others.",
      });
      onClose();
    } catch (error) {
      // Error handled by mutation
    }
  };

  // Define onboarding steps
  const steps: OnboardingStep[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Tell us about yourself',
      isComplete: !!(profileData.firstName && profileData.lastName && profileData.title),
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Welcome to STAK Sync!</h3>
            <p className="text-gray-600">Let's start by getting some basic information about you.</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">First Name</label>
              <Input
                value={profileData.firstName}
                onChange={(e) => updateProfileData('firstName', e.target.value)}
                placeholder="Your first name"
                data-testid="input-first-name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Last Name</label>
              <Input
                value={profileData.lastName}
                onChange={(e) => updateProfileData('lastName', e.target.value)}
                placeholder="Your last name"
                data-testid="input-last-name"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Job Title</label>
            <Input
              value={profileData.title}
              onChange={(e) => updateProfileData('title', e.target.value)}
              placeholder="e.g., Founder & CEO, Product Manager, Software Engineer"
              data-testid="input-job-title"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Company</label>
              <Input
                value={profileData.company}
                onChange={(e) => updateProfileData('company', e.target.value)}
                placeholder="Your company name"
                data-testid="input-company"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <Input
                value={profileData.location}
                onChange={(e) => updateProfileData('location', e.target.value)}
                placeholder="City, State or Country"
                data-testid="input-location"
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'ai-choice',
      title: 'Profile Creation Method',
      description: 'Choose how to build your profile',
      isComplete: useAI !== undefined,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">How would you like to create your profile?</h3>
            <p className="text-gray-600">Choose the method that works best for you.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card 
              className={`cursor-pointer border-2 transition-colors ${useAI === true ? 'border-stak-copper bg-stak-copper/5' : 'border-gray-200 hover:border-stak-copper/50'}`}
              onClick={() => setUseAI(true)}
            >
              <CardContent className="p-6 text-center">
                <Wand2 className="h-12 w-12 text-stak-copper mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">AI-Powered Builder</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Let AI analyze your social media profiles and online presence to build a comprehensive profile instantly.
                </p>
                <div className="flex items-center justify-center gap-2 text-stak-copper font-medium">
                  <Sparkles className="h-4 w-4" />
                  <span>Recommended</span>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer border-2 transition-colors ${useAI === false ? 'border-stak-copper bg-stak-copper/5' : 'border-gray-200 hover:border-stak-copper/50'}`}
              onClick={() => setUseAI(false)}
            >
              <CardContent className="p-6 text-center">
                <User className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">Manual Entry</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Prefer to fill out your profile manually? You'll have complete control over every detail.
                </p>
                <div className="flex items-center justify-center gap-2 text-gray-600 font-medium">
                  <CheckCircle className="h-4 w-4" />
                  <span>Traditional</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    },
    // AI Sources step (only shown if useAI is true)
    ...(useAI ? [{
      id: 'ai-sources',
      title: 'Add Your Sources',
      description: 'Connect your online profiles',
      isComplete: socialSources.length > 0 || aiContext.trim().length > 0,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Add Your Online Profiles</h3>
            <p className="text-gray-600">Add your social media profiles and websites for AI to analyze.</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Social Media & Online Profiles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSocialSource();
                    }
                  }}
                  placeholder="Paste any URL or username (e.g. linkedin.com/in/yourname, @twitter, github/username)"
                  className="flex-grow"
                />
                <Button onClick={addSocialSource} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 mt-1">
                <p>You can paste:</p>
                <ul className="ml-4 space-y-1">
                  <li>• Full URLs: https://linkedin.com/in/yourname</li>
                  <li>• Partial URLs: linkedin.com/in/yourname</li>
                  <li>• Social handles: @yourhandle</li>
                  <li>• Just usernames: We'll auto-detect the platform</li>
                </ul>
              </div>

              {socialSources.length > 0 && (
                <div className="space-y-2">
                  {socialSources.map((source, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-2">
                        {getSocialIcon(source.platform)}
                        <span className="font-medium">{source.platform}</span>
                        <span className="text-sm text-gray-500 truncate max-w-xs">{source.url}</span>
                        {source.isAnalyzing && <Loader2 className="h-4 w-4 animate-spin text-blue-500" />}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSocialSource(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Context</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={aiContext}
                onChange={(e) => setAiContext(e.target.value)}
                placeholder="Any specific achievements, experiences, or information you'd like to highlight..."
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              onClick={handleAIBuild}
              disabled={buildProfileMutation.isPending}
              className="bg-stak-copper hover:bg-stak-copper/90"
              size="lg"
            >
              {buildProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Building Profile...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Build My Profile with AI
                </>
              )}
            </Button>
          </div>
        </div>
      )
    }] : []),
    // Manual entry steps (only shown if useAI is false)
    ...(useAI === false ? [
      {
        id: 'manual-bio',
        title: 'About You',
        description: 'Tell others about yourself',
        isComplete: !!(profileData.bio && profileData.networkingGoal),
        component: (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Tell Us About Yourself</h3>
              <p className="text-gray-600">Share your background and networking goals.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Bio</label>
              <Textarea
                value={profileData.bio}
                onChange={(e) => updateProfileData('bio', e.target.value)}
                placeholder="Write a brief bio about yourself, your experience, and what you're passionate about..."
                rows={4}
                data-testid="textarea-bio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Networking Goals</label>
              <Textarea
                value={profileData.networkingGoal}
                onChange={(e) => updateProfileData('networkingGoal', e.target.value)}
                placeholder="What are you looking to achieve through networking? Who would you like to meet?"
                rows={3}
                data-testid="textarea-networking-goals"
              />
            </div>
          </div>
        )
      },
      {
        id: 'manual-social',
        title: 'Social Links',
        description: 'Add your online presence',
        isComplete: !!(profileData.linkedinUrl || profileData.twitterUrl || profileData.githubUrl),
        component: (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-2">Connect Your Online Profiles</h3>
              <p className="text-gray-600">Add your social media and website links (optional).</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Linkedin className="h-4 w-4" />
                  LinkedIn Profile
                </label>
                <Input
                  value={profileData.linkedinUrl}
                  onChange={(e) => updateProfileData('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  data-testid="input-linkedin"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Twitter className="h-4 w-4" />
                  Twitter/X Profile
                </label>
                <Input
                  value={profileData.twitterUrl}
                  onChange={(e) => updateProfileData('twitterUrl', e.target.value)}
                  placeholder="https://x.com/yourusername"
                  data-testid="input-twitter"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Github className="h-4 w-4" />
                  GitHub Profile
                </label>
                <Input
                  value={profileData.githubUrl}
                  onChange={(e) => updateProfileData('githubUrl', e.target.value)}
                  placeholder="https://github.com/yourusername"
                  data-testid="input-github"
                />
              </div>
            </div>
          </div>
        )
      }
    ] : []),
    {
      id: 'review',
      title: 'Review & Complete',
      description: 'Review your profile',
      isComplete: true,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2">Review Your Profile</h3>
            <p className="text-gray-600">Everything looks good? Let's complete your setup!</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Profile Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-lg">
                  {profileData.firstName} {profileData.lastName}
                </h4>
                <p className="text-gray-600">{profileData.title}</p>
                {profileData.company && (
                  <div className="flex items-center gap-1 mt-1">
                    <Building2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{profileData.company}</span>
                  </div>
                )}
                {profileData.location && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">{profileData.location}</span>
                  </div>
                )}
              </div>

              {profileData.bio && (
                <div>
                  <h5 className="font-medium mb-2">About</h5>
                  <p className="text-sm text-gray-700">{profileData.bio}</p>
                </div>
              )}

              {profileData.networkingGoal && (
                <div>
                  <h5 className="font-medium mb-2">Networking Goals</h5>
                  <p className="text-sm text-gray-700">{profileData.networkingGoal}</p>
                </div>
              )}

              {profileData.skills && profileData.skills.length > 0 && (
                <div>
                  <h5 className="font-medium mb-2">Skills</h5>
                  <div className="flex flex-wrap gap-2">
                    {profileData.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="text-center">
            <Button
              onClick={completeOnboarding}
              disabled={updateProfileMutation.isPending}
              className="bg-stak-copper hover:bg-stak-copper/90"
              size="lg"
            >
              {updateProfileMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Onboarding
                </>
              )}
            </Button>
          </div>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  const canGoNext = () => {
    const step = steps[currentStep];
    if (step.id === 'ai-choice') return useAI !== undefined;
    return step.isComplete;
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1 && canGoNext()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-stak-copper" />
            Profile Setup Wizard
          </DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {steps.length}: {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress bar */}
          <div>
            <Progress value={progress} className="h-2" />
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>Step {currentStep + 1}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
          </div>

          {/* Step content */}
          <div className="min-h-[400px]">
            {currentStepData.component}
          </div>

          {/* Navigation buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext()}
                  className="bg-stak-copper hover:bg-stak-copper/90"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={completeOnboarding}
                  disabled={updateProfileMutation.isPending}
                  className="bg-stak-copper hover:bg-stak-copper/90"
                >
                  {updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Complete Setup
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}