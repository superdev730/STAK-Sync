import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Loader2, 
  Copy, 
  CheckCircle2, 
  BookOpen,
  Target,
  Users,
  TrendingUp,
  Lightbulb,
  Award,
  MessageSquare,
  Share2
} from "lucide-react";

interface BrandStorytellingGeneratorProps {
  profile: any;
  updateProfile: (data: { field: string, value: any }) => void;
}

interface BrandStory {
  elevatorPitch: string;
  professionalSummary: string;
  originStory: string;
  visionStatement: string;
  valueProposition: string;
  keyAchievements: string[];
  personalBrand: string;
  networkingIntro: string;
  linkedInHeadline: string;
  twitterBio: string;
  speakerBio: string;
  investorPitch: string;
}

interface StoryVariations {
  concise: BrandStory;
  detailed: BrandStory;
  technical: BrandStory;
  executive: BrandStory;
}

export function BrandStorytellingGenerator({ profile, updateProfile }: BrandStorytellingGeneratorProps) {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [generatedStories, setGeneratedStories] = useState<StoryVariations | null>(null);
  const [selectedVariation, setSelectedVariation] = useState<keyof StoryVariations>('concise');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Generate brand storytelling
  const generateStoryMutation = useMutation({
    mutationFn: async () => {
      setGenerationProgress(0);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        const response = await apiRequest('POST', '/api/profile/generate-brand-story', {
          profileData: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            bio: profile.bio,
            title: profile.title,
            company: profile.company,
            position: profile.position,
            skills: profile.skills,
            industries: profile.industries,
            experience: profile.experience,
            education: profile.education,
            networkingGoals: profile.networkingGoals,
            linkedinUrl: profile.linkedinUrl,
            twitterUrl: profile.twitterUrl,
            githubUrl: profile.githubUrl,
            websiteUrls: profile.websiteUrls
          }
        });

        const data = await response.json();
        
        clearInterval(progressInterval);
        setGenerationProgress(100);
        
        return data;
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data) => {
      setGeneratedStories(data.stories);
      setShowDialog(true);
      
      toast({
        title: "Brand Stories Generated!",
        description: "Created professional storytelling variations for different contexts"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
      setGenerationProgress(0);
    }
  });

  // Copy text to clipboard
  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(label);
      
      toast({
        title: "Copied!",
        description: `${label} copied to clipboard`
      });
      
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Could not copy to clipboard",
        variant: "destructive"
      });
    }
  };

  // Apply story to profile
  const applyStoryToProfile = (story: BrandStory) => {
    if (story.professionalSummary) {
      updateProfile({ field: 'bio', value: story.professionalSummary });
    }
    
    toast({
      title: "Story Applied!",
      description: "Updated your profile with the generated brand story"
    });
    
    setShowDialog(false);
  };

  const getCurrentStory = (): BrandStory | null => {
    return generatedStories ? generatedStories[selectedVariation] : null;
  };

  const getVariationDescription = (variation: keyof StoryVariations): string => {
    const descriptions = {
      concise: "Brief and impactful for quick networking introductions",
      detailed: "Comprehensive storytelling for in-depth presentations",
      technical: "Technical focus for developer and engineering audiences", 
      executive: "Leadership-focused for C-level and investor conversations"
    };
    return descriptions[variation];
  };

  const getVariationIcon = (variation: keyof StoryVariations) => {
    const icons = {
      concise: <MessageSquare className="w-4 h-4" />,
      detailed: <BookOpen className="w-4 h-4" />,
      technical: <Lightbulb className="w-4 h-4" />,
      executive: <Award className="w-4 h-4" />
    };
    return icons[variation];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-stak-copper" />
            Professional Brand Storytelling
          </div>
          <Button
            onClick={() => generateStoryMutation.mutate()}
            disabled={generateStoryMutation.isPending}
            className="bg-stak-copper hover:bg-stak-copper/90"
          >
            {generateStoryMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Generate Brand Story
          </Button>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="text-center py-8">
          <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold mb-2">AI-Powered Brand Storytelling</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Transform your profile into compelling professional narratives. Generate elevator pitches, 
            LinkedIn headlines, speaker bios, and investor presentations tailored to your unique story.
          </p>
          
          {generateStoryMutation.isPending && (
            <div className="mb-4">
              <Progress value={generationProgress} className="h-2 mb-2" />
              <p className="text-sm text-gray-500">
                Analyzing your profile and generating personalized brand stories...
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
            <div className="flex flex-col items-center gap-1">
              <Target className="w-6 h-6" />
              <span>Elevator Pitch</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Users className="w-6 h-6" />
              <span>Networking Intro</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <TrendingUp className="w-6 h-6" />
              <span>Investor Pitch</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Award className="w-6 h-6" />
              <span>Speaker Bio</span>
            </div>
          </div>
        </div>
      </CardContent>

      {/* Brand Story Results Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-stak-copper" />
              Your Professional Brand Stories
            </DialogTitle>
          </DialogHeader>
          
          {generatedStories && (
            <div className="space-y-6">
              {/* Variation Selector */}
              <Tabs value={selectedVariation} onValueChange={(value) => setSelectedVariation(value as keyof StoryVariations)}>
                <TabsList className="grid w-full grid-cols-4">
                  {Object.keys(generatedStories).map((variation) => (
                    <TabsTrigger key={variation} value={variation} className="flex items-center gap-1">
                      {getVariationIcon(variation as keyof StoryVariations)}
                      <span className="capitalize">{variation}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>

                {Object.entries(generatedStories).map(([variation, story]) => (
                  <TabsContent key={variation} value={variation} className="space-y-4">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-600">
                        {getVariationDescription(variation as keyof StoryVariations)}
                      </p>
                    </div>

                    <div className="grid gap-4">
                      {/* Elevator Pitch */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Elevator Pitch (30 seconds)
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(story.elevatorPitch, 'Elevator Pitch')}
                          >
                            {copiedText === 'Elevator Pitch' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <Textarea
                          value={story.elevatorPitch}
                          readOnly
                          className="min-h-[80px] bg-white"
                        />
                      </div>

                      {/* Professional Summary */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            <BookOpen className="w-4 h-4" />
                            Professional Summary
                          </h4>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(story.professionalSummary, 'Professional Summary')}
                            >
                              {copiedText === 'Professional Summary' ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateProfile({ field: 'bio', value: story.professionalSummary })}
                              className="text-stak-copper border-stak-copper hover:bg-stak-copper hover:text-white"
                            >
                              Apply to Profile
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          value={story.professionalSummary}
                          readOnly
                          className="min-h-[120px] bg-white"
                        />
                      </div>

                      {/* LinkedIn Headline */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Share2 className="w-4 h-4" />
                            LinkedIn Headline
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(story.linkedInHeadline, 'LinkedIn Headline')}
                          >
                            {copiedText === 'LinkedIn Headline' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <Textarea
                          value={story.linkedInHeadline}
                          readOnly
                          className="min-h-[60px] bg-white"
                        />
                      </div>

                      {/* Value Proposition */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            Value Proposition
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(story.valueProposition, 'Value Proposition')}
                          >
                            {copiedText === 'Value Proposition' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <Textarea
                          value={story.valueProposition}
                          readOnly
                          className="min-h-[80px] bg-white"
                        />
                      </div>

                      {/* Key Achievements */}
                      <div>
                        <h4 className="font-semibold flex items-center gap-2 mb-2">
                          <Award className="w-4 h-4" />
                          Key Achievements
                        </h4>
                        <div className="space-y-2">
                          {story.keyAchievements.map((achievement: string, index: number) => (
                            <div key={index} className="flex items-start gap-2 p-3 bg-white border rounded-lg">
                              <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-sm">{achievement}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(achievement, `Achievement ${index + 1}`)}
                                className="ml-auto p-1 h-auto"
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Networking Introduction */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            STAK Networking Introduction
                          </h4>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(story.networkingIntro, 'Networking Introduction')}
                          >
                            {copiedText === 'Networking Introduction' ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                        <Textarea
                          value={story.networkingIntro}
                          readOnly
                          className="min-h-[80px] bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDialog(false)}
                      >
                        Close
                      </Button>
                      <Button 
                        onClick={() => applyStoryToProfile(story)}
                        className="bg-stak-copper hover:bg-stak-copper/90"
                      >
                        Apply All to Profile
                      </Button>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}