import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, 
  Linkedin, 
  Twitter, 
  Github, 
  Plus, 
  Loader2, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Trash2,
  RefreshCw
} from "lucide-react";

interface SocialMediaSectionProps {
  profile: any;
  isOwnProfile: boolean;
  updateProfile: (data: { field: string, value: any }) => void;
  isUpdating: boolean;
}

interface SocialProfile {
  platform: string;
  url: string;
  status: 'idle' | 'analyzing' | 'success' | 'error';
  data?: any;
  error?: string;
}

export function SocialMediaSection({ profile, isOwnProfile, updateProfile, isUpdating }: SocialMediaSectionProps) {
  const { toast } = useToast();
  const [socialProfiles, setSocialProfiles] = useState<SocialProfile[]>([]);
  const [showAnalysisDialog, setShowAnalysisDialog] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  // Social media field management
  const [socialFields, setSocialFields] = useState({
    linkedinUrl: profile.linkedinUrl || '',
    twitterUrl: profile.twitterUrl || '',
    githubUrl: profile.githubUrl || '',
    websiteUrls: profile.websiteUrls || []
  });

  // Handle field updates with auto-save and analysis
  const handleFieldUpdate = async (field: string, value: string) => {
    setSocialFields(prev => ({
      ...prev,
      [field]: value
    }));

    // Update profile immediately
    updateProfile({ field, value });

    // Auto-analyze if URL looks complete
    if (value && isValidUrl(value)) {
      // Small delay to allow user to finish typing
      setTimeout(() => {
        if (value === socialFields[field as keyof typeof socialFields]) {
          analyzeUrl(value, field);
        }
      }, 1000);
    }
  };

  // Handle website URLs array updates  
  const handleWebsiteUrlUpdate = (index: number, value: string) => {
    const newUrls = [...socialFields.websiteUrls];
    newUrls[index] = value;
    
    setSocialFields(prev => ({
      ...prev,
      websiteUrls: newUrls
    }));

    updateProfile({ field: 'websiteUrls', value: newUrls });

    // Auto-analyze if URL looks complete
    if (value && isValidUrl(value)) {
      setTimeout(() => {
        if (newUrls[index] === value) {
          analyzeUrl(value, 'website');
        }
      }, 1000);
    }
  };

  // Add new website URL field
  const addWebsiteField = () => {
    const newUrls = [...socialFields.websiteUrls, ''];
    setSocialFields(prev => ({
      ...prev,
      websiteUrls: newUrls
    }));
    updateProfile({ field: 'websiteUrls', value: newUrls });
    
    toast({
      title: "Website Field Added",
      description: "Enter your website URL to enable AI analysis"
    });
  };

  // Remove website URL field
  const removeWebsiteField = (index: number) => {
    const newUrls = socialFields.websiteUrls.filter((_: string, i: number) => i !== index);
    setSocialFields(prev => ({
      ...prev,
      websiteUrls: newUrls
    }));
    updateProfile({ field: 'websiteUrls', value: newUrls });
  };

  // URL validation
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return url.length > 10; // Basic length check
    } catch {
      return false;
    }
  };

  // Analyze single URL
  const analyzeUrl = async (url: string, type: string) => {
    const profileIndex = socialProfiles.findIndex(p => p.url === url);
    
    if (profileIndex >= 0) {
      // Update existing profile
      setSocialProfiles(prev => prev.map((p, i) => 
        i === profileIndex ? { ...p, status: 'analyzing' } : p
      ));
    } else {
      // Add new profile
      setSocialProfiles(prev => [...prev, {
        platform: detectPlatform(url),
        url,
        status: 'analyzing'
      }]);
    }

    try {
      const response = await apiRequest('POST', '/api/social/analyze', { url, type });
      const data = await response.json();

      if (data.success) {
        setSocialProfiles(prev => prev.map(p => 
          p.url === url ? { ...p, status: 'success', data: data.profile } : p
        ));

        toast({
          title: "Profile Analyzed!",
          description: `Successfully extracted data from ${data.profile.platform} profile`
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setSocialProfiles(prev => prev.map(p => 
        p.url === url ? { ...p, status: 'error', error: (error as Error).message } : p
      ));

      toast({
        title: "Analysis Failed",
        description: `Could not analyze ${detectPlatform(url)} profile: ${(error as Error).message}`,
        variant: "destructive"
      });
    }
  };

  // Detect platform from URL
  const detectPlatform = (url: string): string => {
    const lowercaseUrl = url.toLowerCase();
    
    if (lowercaseUrl.includes('linkedin.com')) return 'LinkedIn';
    if (lowercaseUrl.includes('twitter.com') || lowercaseUrl.includes('x.com')) return 'Twitter';
    if (lowercaseUrl.includes('github.com')) return 'GitHub';
    
    return 'Website';
  };

  // Comprehensive profile analysis
  const comprehensiveAnalysisMutation = useMutation({
    mutationFn: async () => {
      const urls = [
        socialFields.linkedinUrl,
        socialFields.twitterUrl,
        socialFields.githubUrl,
        ...socialFields.websiteUrls
      ].filter(url => url && isValidUrl(url));

      if (urls.length === 0) {
        throw new Error('No valid URLs found for analysis');
      }

      const response = await apiRequest('POST', '/api/social/comprehensive-analysis', {
        urls,
        currentProfile: {
          bio: profile.bio,
          firstName: profile.firstName,
          lastName: profile.lastName,
          company: profile.company,
          position: profile.position,
          skills: profile.skills,
          industries: profile.industries
        }
      });

      return response.json();
    },
    onSuccess: (data) => {
      setAnalysisResults(data);
      setShowAnalysisDialog(true);
      
      toast({
        title: "Comprehensive Analysis Complete!",
        description: `Generated ${data.enhancements.improvements.length} profile improvements`
      });
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Apply suggested improvements
  const applyImprovements = (improvements: any) => {
    if (improvements.enhancedBio) {
      updateProfile({ field: 'bio', value: improvements.enhancedBio });
    }
    
    if (improvements.extractedSkills?.length > 0) {
      const currentSkills = profile.skills || [];
      const newSkills = Array.from(new Set([...currentSkills, ...improvements.extractedSkills]));
      updateProfile({ field: 'skills', value: newSkills });
    }
    
    if (improvements.suggestedIndustries?.length > 0) {
      const currentIndustries = profile.industries || [];
      const newIndustries = Array.from(new Set([...currentIndustries, ...improvements.suggestedIndustries]));
      updateProfile({ field: 'industries', value: newIndustries });
    }

    setShowAnalysisDialog(false);
    
    toast({
      title: "Profile Enhanced!",
      description: "Applied AI-generated improvements to your profile"
    });
  };

  // Get status icon for a URL
  const getStatusIcon = (url: string) => {
    if (!url || !isValidUrl(url)) return null;
    
    const profile = socialProfiles.find(p => p.url === url);
    const status = profile?.status || 'idle';
    
    switch (status) {
      case 'analyzing':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Social & Web Presence
          </div>
          {isOwnProfile && (
            <div className="flex items-center gap-2">
              {socialProfiles.length > 0 && (
                <Badge variant="outline">
                  {socialProfiles.filter(p => p.status === 'success').length}/{socialProfiles.length} analyzed
                </Badge>
              )}
              <Button
                size="sm"
                onClick={() => comprehensiveAnalysisMutation.mutate()}
                disabled={comprehensiveAnalysisMutation.isPending}
                className="bg-stak-copper hover:bg-stak-copper/90"
              >
                {comprehensiveAnalysisMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                AI Enhance Profile
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* LinkedIn Field */}
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
          <Linkedin className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div className="flex-grow">
            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                <Input
                  value={socialFields.linkedinUrl}
                  onChange={(e) => handleFieldUpdate('linkedinUrl', e.target.value)}
                  placeholder="LinkedIn profile URL"
                  className="border-none shadow-none focus-visible:ring-0"
                  data-testid="input-linkedin-url"
                />
                {getStatusIcon(socialFields.linkedinUrl)}
              </div>
            ) : (
              socialFields.linkedinUrl ? (
                <a 
                  href={socialFields.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                  data-testid="link-linkedin"
                >
                  LinkedIn Profile
                </a>
              ) : (
                <span className="text-gray-500">LinkedIn not provided</span>
              )
            )}
          </div>
        </div>

        {/* Twitter Field */}
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
          <Twitter className="w-5 h-5 text-sky-500 flex-shrink-0" />
          <div className="flex-grow">
            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                <Input
                  value={socialFields.twitterUrl}
                  onChange={(e) => handleFieldUpdate('twitterUrl', e.target.value)}
                  placeholder="Twitter/X profile URL"
                  className="border-none shadow-none focus-visible:ring-0"
                  data-testid="input-twitter-url"
                />
                {getStatusIcon(socialFields.twitterUrl)}
              </div>
            ) : (
              socialFields.twitterUrl ? (
                <a 
                  href={socialFields.twitterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-500 hover:underline"
                  data-testid="link-twitter"
                >
                  Twitter Profile
                </a>
              ) : (
                <span className="text-gray-500">Twitter not provided</span>
              )
            )}
          </div>
        </div>

        {/* GitHub Field */}
        <div className="flex items-center gap-3 p-3 border rounded-lg bg-white">
          <Github className="w-5 h-5 text-gray-800 flex-shrink-0" />
          <div className="flex-grow">
            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                <Input
                  value={socialFields.githubUrl}
                  onChange={(e) => handleFieldUpdate('githubUrl', e.target.value)}
                  placeholder="GitHub profile URL"
                  className="border-none shadow-none focus-visible:ring-0"
                  data-testid="input-github-url"
                />
                {getStatusIcon(socialFields.githubUrl)}
              </div>
            ) : (
              socialFields.githubUrl ? (
                <a 
                  href={socialFields.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-800 hover:underline"
                  data-testid="link-github"
                >
                  GitHub Profile
                </a>
              ) : (
                <span className="text-gray-500">GitHub not provided</span>
              )
            )}
          </div>
        </div>

        {/* Website URLs */}
        {socialFields.websiteUrls.map((url: string, index: number) => (
          <div key={index} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
            <Globe className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <div className="flex-grow">
              {isOwnProfile ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={url}
                    onChange={(e) => handleWebsiteUrlUpdate(index, e.target.value)}
                    placeholder="Website or portfolio URL"
                    className="border-none shadow-none focus-visible:ring-0"
                    data-testid={`input-website-url-${index}`}
                  />
                  {getStatusIcon(url)}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeWebsiteField(index)}
                    className="p-1 h-auto text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                url ? (
                  <a 
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-600 hover:underline"
                    data-testid={`link-website-${index}`}
                  >
                    Website
                  </a>
                ) : (
                  <span className="text-gray-500">Website not provided</span>
                )
              )}
            </div>
          </div>
        ))}

        {/* Add Website Button */}
        {isOwnProfile && (
          <Button
            variant="outline"
            onClick={addWebsiteField}
            className="w-full border-dashed"
            data-testid="button-add-website"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Website
          </Button>
        )}

        {/* Analysis Progress */}
        {socialProfiles.length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Profile Analysis Progress</span>
              <span className="text-sm text-gray-600">
                {socialProfiles.filter(p => p.status === 'success').length}/{socialProfiles.length}
              </span>
            </div>
            <Progress 
              value={(socialProfiles.filter(p => p.status === 'success').length / socialProfiles.length) * 100}
              className="h-2"
            />
            <div className="mt-2 space-y-1">
              {socialProfiles.map((profile, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <span>{profile.platform}</span>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(profile.status)}
                    <span className="capitalize">{profile.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {/* Analysis Results Dialog */}
      <Dialog open={showAnalysisDialog} onOpenChange={setShowAnalysisDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-stak-copper" />
              AI Profile Enhancement Results
            </DialogTitle>
          </DialogHeader>
          
          {analysisResults && (
            <div className="space-y-4">
              {/* Enhanced Bio */}
              {analysisResults.enhancements.enhancedBio && (
                <div>
                  <h4 className="font-semibold mb-2">Enhanced Bio</h4>
                  <Textarea
                    value={analysisResults.enhancements.enhancedBio}
                    readOnly
                    className="min-h-[100px]"
                  />
                </div>
              )}

              {/* Extracted Skills */}
              {analysisResults.enhancements.extractedSkills?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Discovered Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResults.enhancements.extractedSkills.map((skill: string, index: number) => (
                      <Badge key={index} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Networking Recommendations */}
              {analysisResults.enhancements.networkingRecommendations?.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">STAK Networking Recommendations</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {analysisResults.enhancements.networkingRecommendations.map((rec: string, index: number) => (
                      <li key={index} className="text-sm text-gray-700">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvements Applied */}
              <div>
                <h4 className="font-semibold mb-2">Analysis Summary</h4>
                <ul className="list-disc list-inside space-y-1">
                  {analysisResults.enhancements.improvements.map((improvement: string, index: number) => (
                    <li key={index} className="text-sm text-gray-700">{improvement}</li>
                  ))}
                </ul>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setShowAnalysisDialog(false)}
                >
                  Close
                </Button>
                <Button 
                  onClick={() => applyImprovements(analysisResults.enhancements)}
                  className="bg-stak-copper hover:bg-stak-copper/90"
                >
                  Apply Improvements
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}