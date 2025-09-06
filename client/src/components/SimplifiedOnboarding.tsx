import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { 
  Sparkles, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  Globe,
  Linkedin,
  Twitter,
  Github,
  AlertCircle,
  Users,
  Target,
  Award
} from "lucide-react";

interface ProfileOutput {
  person: {
    name: { value: string | null; confidence: number; source_urls: string[] };
    email: { value: string | null; confidence: number; source_urls: string[] };
    current_role: {
      title: { value: string | null; confidence: number; source_urls: string[] };
      company: { value: string | null; confidence: number; source_urls: string[] };
    };
    bio: { value: string | null; confidence: number; source_urls: string[] };
    links: {
      linkedin: string | null;
      github: string | null;
      x: string | null;
      website: string | null;
    };
    industries: string[];
    skills_keywords: string[];
    interests_topics: string[];
  };
  stak_recos: {
    goal_suggestions: string[];
    mission_pack: string[];
  };
}

interface SimplifiedOnboardingProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export default function SimplifiedOnboarding({ isOpen, onClose, userEmail }: SimplifiedOnboardingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState(userEmail || user?.email || '');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [socialUrls, setSocialUrls] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [manualContext, setManualContext] = useState('');
  const [isBuilding, setIsBuilding] = useState(false);
  const [profileResult, setProfileResult] = useState<ProfileOutput | null>(null);

  // Profile building mutation using new simplified endpoint
  const buildProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/profile/build-simplified", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.profile) {
        setProfileResult(data.profile);
        setStep(3); // Move to results step
        toast({
          title: "Profile Built Successfully",
          description: "AI has analyzed your sources with confidence tracking.",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Profile Building Failed",
        description: error.message || "Failed to build profile.",
        variant: "destructive",
      });
      setIsBuilding(false);
    },
  });

  const addUrl = () => {
    if (!newUrl.trim() || socialUrls.includes(newUrl.trim())) return;
    setSocialUrls(prev => [...prev, newUrl.trim()]);
    setNewUrl('');
  };

  const removeUrl = (index: number) => {
    setSocialUrls(prev => prev.filter((_, i) => i !== index));
  };

  const buildProfile = () => {
    setIsBuilding(true);
    
    const urls = [];
    if (linkedinUrl.trim()) urls.push(linkedinUrl.trim());
    urls.push(...socialUrls);

    buildProfileMutation.mutate({
      email: email.trim() || undefined,
      linkedin_url: linkedinUrl.trim() || undefined,
      social_urls: urls.length > 0 ? urls : undefined,
      manual_context: manualContext.trim() || undefined
    });
  };

  const getUrlIcon = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.includes('linkedin.com')) return <Linkedin className="h-4 w-4 text-blue-600" />;
    if (lower.includes('twitter.com') || lower.includes('x.com')) return <Twitter className="h-4 w-4 text-blue-400" />;
    if (lower.includes('github.com')) return <Github className="h-4 w-4 text-gray-800" />;
    return <Globe className="h-4 w-4 text-gray-600" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-stak-copper" />
            Simplified Profile Builder
          </DialogTitle>
          <DialogDescription>
            Build your professional profile using public resources and AI analysis with confidence tracking.
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Email Address</label>
                  <Input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    type="email"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used for domain-based web search and verification
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium">LinkedIn Profile (Optional)</label>
                  <Input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="https://linkedin.com/in/yourname"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Additional Online Profiles</CardTitle>
                <p className="text-sm text-gray-600">
                  Add any websites, social profiles, or online presence URLs
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    placeholder="https://github.com/yourname, https://yourcompany.com, etc."
                    className="flex-grow"
                  />
                  <Button onClick={addUrl} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {socialUrls.length > 0 && (
                  <div className="space-y-2">
                    {socialUrls.map((url, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          {getUrlIcon(url)}
                          <span className="text-sm truncate flex-1">{url}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeUrl(index)}
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
                <CardTitle>Manual Context (Optional)</CardTitle>
                <p className="text-sm text-gray-600">
                  Add any specific achievements, context, or information you'd like included
                </p>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={manualContext}
                  onChange={(e) => setManualContext(e.target.value)}
                  placeholder="e.g., Led Series A funding round, Published research on AI ethics, Built engineering team from 2 to 50..."
                  rows={4}
                />
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={buildProfile} disabled={isBuilding || (!email.trim() && !linkedinUrl.trim() && socialUrls.length === 0)}>
                {isBuilding ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Building Profile...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Build Profile
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && profileResult && (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Profile Built Successfully!</h3>
              <p className="text-gray-600">Review your profile data with confidence scores below.</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileResult.person.name.value && (
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <p className="text-sm">{profileResult.person.name.value}</p>
                    </div>
                    <Badge variant="outline" className={getConfidenceColor(profileResult.person.name.confidence)}>
                      {getConfidenceLabel(profileResult.person.name.confidence)} ({Math.round(profileResult.person.name.confidence * 100)}%)
                    </Badge>
                  </div>
                )}

                {profileResult.person.current_role.title.value && (
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-sm font-medium">Title</label>
                      <p className="text-sm">{profileResult.person.current_role.title.value}</p>
                    </div>
                    <Badge variant="outline" className={getConfidenceColor(profileResult.person.current_role.title.confidence)}>
                      {getConfidenceLabel(profileResult.person.current_role.title.confidence)} ({Math.round(profileResult.person.current_role.title.confidence * 100)}%)
                    </Badge>
                  </div>
                )}

                {profileResult.person.current_role.company.value && (
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="text-sm font-medium">Company</label>
                      <p className="text-sm">{profileResult.person.current_role.company.value}</p>
                    </div>
                    <Badge variant="outline" className={getConfidenceColor(profileResult.person.current_role.company.confidence)}>
                      {getConfidenceLabel(profileResult.person.current_role.company.confidence)} ({Math.round(profileResult.person.current_role.company.confidence * 100)}%)
                    </Badge>
                  </div>
                )}

                {profileResult.person.bio.value && (
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <label className="text-sm font-medium">Bio</label>
                      <Badge variant="outline" className={getConfidenceColor(profileResult.person.bio.confidence)}>
                        {getConfidenceLabel(profileResult.person.bio.confidence)} ({Math.round(profileResult.person.bio.confidence * 100)}%)
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700">{profileResult.person.bio.value}</p>
                  </div>
                )}

                {profileResult.person.skills_keywords.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Skills</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profileResult.person.skills_keywords.map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {profileResult.person.industries.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Industries</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {profileResult.person.industries.map((industry, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {industry}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  STAK Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {profileResult.stak_recos.goal_suggestions.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Networking Goals</label>
                    <ul className="text-sm text-gray-700 space-y-1 mt-1">
                      {profileResult.stak_recos.goal_suggestions.map((goal, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-stak-copper">•</span>
                          {goal}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {profileResult.stak_recos.mission_pack.length > 0 && (
                  <div>
                    <label className="text-sm font-medium">Mission Pack</label>
                    <ul className="text-sm text-gray-700 space-y-1 mt-1">
                      {profileResult.stak_recos.mission_pack.map((mission, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <Award className="h-3 w-3 mt-0.5 text-stak-copper flex-shrink-0" />
                          {mission}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                Build Another
              </Button>
              <Button onClick={onClose} className="bg-stak-copper hover:bg-stak-copper/90">
                Complete Setup
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}