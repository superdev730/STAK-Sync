import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  X
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
  
  // Helper to extract values from profile objects
  const getProfileValue = (field: any) => {
    if (typeof field === 'object' && field?.value !== undefined) {
      return field.value;
    }
    return field || '';
  };
  
  const [activeTab, setActiveTab] = useState<'sources' | 'preview' | 'edit'>('sources');
  const [socialSources, setSocialSources] = useState<SocialSource[]>([]);
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const [generatedProfile, setGeneratedProfile] = useState<Partial<User>>({});
  const [editingProfile, setEditingProfile] = useState<Partial<User>>({});
  const [networkingGoalSuggestions, setNetworkingGoalSuggestions] = useState<string[]>([]);
  
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
      case 'LinkedIn': return <Linkedin className="h-4 w-4" />;
      case 'Twitter': return <Twitter className="h-4 w-4" />;
      case 'GitHub': return <Github className="h-4 w-4" />;
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sources">Add Sources</TabsTrigger>
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
                    onClick={() => window.open('/api/linkedin/auth', '_blank', 'width=600,height=700')}
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
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSocialUrl}
                    onChange={(e) => setNewSocialUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourname or any profile URL"
                    className="flex-1"
                    data-testid="input-social-url"
                  />
                  <Button onClick={addSocialSource} size="sm" data-testid="button-add-source">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

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