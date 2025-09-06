import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Brain, Users, MessageSquare, Calendar, Target, Sparkles, CheckCircle, 
  ArrowRight, Star, Globe, Linkedin, ExternalLink, Search, Wand2, 
  X, ChevronRight, Trophy, Gift, Zap, Info, AlertCircle, Clock,
  Building, MapPin, Mail, Phone, User, Briefcase
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface FirstTimeOnboardingProps {
  user: any;
  onComplete: () => void;
  onSkip: () => void;
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  priority: number;
}

export default function FirstTimeOnboarding({ user, onComplete, onSkip }: FirstTimeOnboardingProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [companyName, setCompanyName] = useState(user?.company || "");
  const [jobTitle, setJobTitle] = useState(user?.title || "");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Calculate current profile completeness
  const profileFields = [
    user?.firstName, user?.lastName, user?.email, user?.title, 
    user?.company, user?.bio, user?.location, user?.profileImageUrl,
    user?.linkedinUrl, user?.websiteUrls, user?.networkingGoal
  ];
  const filledFields = profileFields.filter(field => field && field.trim?.().length > 0).length;
  const profileCompleteness = Math.round((filledFields / profileFields.length) * 100);

  // Onboarding steps
  const [steps, setSteps] = useState<OnboardingStep[]>([
    {
      id: "welcome",
      title: "Welcome to STAK Sync!",
      description: "Your AI-powered professional networking platform",
      completed: false,
      priority: 1
    },
    {
      id: "linkedin",
      title: "Connect Your LinkedIn",
      description: "Import your professional information instantly",
      completed: !!user?.linkedinUrl,
      priority: 2
    },
    {
      id: "website", 
      title: "Add Your Company Website",
      description: "Help others understand your business",
      completed: !!user?.websiteUrls,
      priority: 3
    },
    {
      id: "ai_analysis",
      title: "AI Profile Enhancement", 
      description: "Let AI find and suggest profile improvements",
      completed: false,
      priority: 4
    }
  ]);

  // LinkedIn analysis mutation
  const linkedinMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("/api/ai/analyze-profile", "POST", {
        type: "linkedin",
        url: url,
        userId: user?.id
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "LinkedIn Profile Analyzed!",
        description: "We've enhanced your profile with LinkedIn data.",
      });
      setSteps(prev => prev.map(step => 
        step.id === "linkedin" ? { ...step, completed: true } : step
      ));
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "LinkedIn Analysis Failed",
        description: error.message || "Please check the URL and try again.",
        variant: "destructive",
      });
    }
  });

  // Website analysis mutation  
  const websiteMutation = useMutation({
    mutationFn: async (url: string) => {
      const response = await apiRequest("/api/ai/analyze-profile", "POST", {
        type: "website", 
        url: url,
        userId: user?.id
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Website Analyzed!",
        description: "We've extracted valuable information from your website.",
      });
      setSteps(prev => prev.map(step => 
        step.id === "website" ? { ...step, completed: true } : step
      ));
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error: any) => {
      toast({
        title: "Website Analysis Failed", 
        description: error.message || "Please check the URL and try again.",
        variant: "destructive",
      });
    }
  });

  // AI suggestions mutation
  const aiSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/ai/profile-suggestions", "POST", {
        userId: user?.id,
        currentProfile: {
          firstName: user?.firstName,
          lastName: user?.lastName,
          title: user?.title || jobTitle,
          company: user?.company || companyName,
          bio: user?.bio,
          location: user?.location,
          linkedinUrl: user?.linkedinUrl || linkedinUrl,
          websiteUrls: user?.websiteUrls || websiteUrl
        }
      });
      return response;
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
      setShowSuggestions(true);
      setSteps(prev => prev.map(step => 
        step.id === "ai_analysis" ? { ...step, completed: true } : step
      ));
      toast({
        title: "AI Analysis Complete!",
        description: `Found ${data.suggestions?.length || 0} ways to improve your profile.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "AI Analysis Failed",
        description: error.message || "Something went wrong with the AI analysis.",
        variant: "destructive",
      });
    }
  });

  const handleLinkedinSubmit = () => {
    if (!linkedinUrl.trim()) {
      toast({
        title: "LinkedIn URL Required",
        description: "Please enter your LinkedIn profile URL.",
        variant: "destructive",
      });
      return;
    }
    linkedinMutation.mutate(linkedinUrl);
  };

  const handleWebsiteSubmit = () => {
    if (!websiteUrl.trim()) {
      toast({
        title: "Website URL Required", 
        description: "Please enter your company website URL.",
        variant: "destructive",
      });
      return;
    }
    websiteMutation.mutate(websiteUrl);
  };

  const handleAiAnalysis = () => {
    setIsAnalyzing(true);
    aiSuggestionsMutation.mutate();
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const skipStep = () => {
    nextStep();
  };

  const completedSteps = steps.filter(step => step.completed).length;
  const overallProgress = Math.round((completedSteps / steps.length) * 100);

  const renderWelcomeStep = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-stak-copper/20 rounded-full flex items-center justify-center mx-auto">
        <Brain className="w-10 h-10 text-stak-copper" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-stak-black mb-3">
          Welcome to STAK Sync, {user?.firstName}!
        </h2>
        <p className="text-gray-600 text-lg leading-relaxed max-w-2xl mx-auto">
          You're now part of an exclusive AI-powered networking ecosystem designed for 
          entrepreneurs, investors, and industry leaders. Let's build your profile to 
          unlock meaningful connections.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
        <Card className="border-stak-copper/30 bg-gradient-to-b from-white to-stak-copper/5">
          <CardContent className="p-4 text-center">
            <Brain className="w-8 h-8 text-stak-copper mx-auto mb-3" />
            <h4 className="font-semibold text-stak-black mb-2">Smart Matching</h4>
            <p className="text-sm text-gray-600">AI finds your perfect connections based on goals, industry, and compatibility</p>
          </CardContent>
        </Card>
        
        <Card className="border-stak-copper/30 bg-gradient-to-b from-white to-stak-copper/5">
          <CardContent className="p-4 text-center">
            <Users className="w-8 h-8 text-stak-copper mx-auto mb-3" />
            <h4 className="font-semibold text-stak-black mb-2">Elite Network</h4>
            <p className="text-sm text-gray-600">Connect with verified entrepreneurs, VCs, and thought leaders</p>
          </CardContent>
        </Card>
        
        <Card className="border-stak-copper/30 bg-gradient-to-b from-white to-stak-copper/5">
          <CardContent className="p-4 text-center">
            <MessageSquare className="w-8 h-8 text-stak-copper mx-auto mb-3" />
            <h4 className="font-semibold text-stak-black mb-2">Meaningful Conversations</h4>
            <p className="text-sm text-gray-600">Skip the small talk with context-rich introductions</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderLinkedinStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <LinkedinIcon className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-stak-black mb-2">Connect Your LinkedIn</h3>
        <p className="text-gray-600 mb-6">
          Authorize LinkedIn access to automatically import your professional profile data
        </p>
      </div>

      <div className="space-y-4">
        <Button
          onClick={() => linkedinAnalysisMutation.mutate('')}
          disabled={linkedinAnalysisMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          {linkedinAnalysisMutation.isPending ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Connecting to LinkedIn...
            </>
          ) : (
            <>
              <LinkedinIcon className="w-5 h-5 mr-2" />
              Authorize LinkedIn Access
            </>
          )}
        </Button>

        {linkedinData && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-800 text-sm">
              {linkedinData.message || "LinkedIn profile imported successfully!"}
            </p>
          </div>
        )}

        <div className="text-center">
          <p className="text-xs text-gray-500 mb-2">or</p>
          <Button variant="ghost" onClick={skipStep} className="text-gray-600">
            Skip LinkedIn for now
          </Button>
        </div>
      </div>
    </div>
  );

  const renderWebsiteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Linkedin className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-stak-black mb-2">Connect Your LinkedIn Profile</h3>
        <p className="text-gray-600">
          Import your professional information instantly and enhance your networking profile
        </p>
      </div>

      <Card className="border-blue-500/30 bg-blue-50/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">Why connect LinkedIn?</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Auto-fill your title, company, and experience</li>
                <li>• Import your skills and endorsements</li> 
                <li>• Enhance AI matching accuracy</li>
                <li>• Build trust with verified professional info</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            LinkedIn Profile URL
          </label>
          <Input
            type="url"
            placeholder="https://www.linkedin.com/in/yourprofile"
            value={linkedinUrl}
            onChange={(e) => setLinkedinUrl(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-1">
            Copy and paste your LinkedIn profile URL here
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            onClick={handleLinkedinSubmit}
            disabled={linkedinMutation.isPending || !linkedinUrl.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
          >
            {linkedinMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing LinkedIn...
              </>
            ) : (
              <>
                <Linkedin className="w-4 h-4 mr-2" />
                Connect LinkedIn
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={skipStep}
            className="px-6"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );

  const renderWebsiteStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Globe className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-bold text-stak-black mb-2">Add Your Company Website</h3>
        <p className="text-gray-600">
          Help others understand your business and showcase your expertise
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Company Name
          </label>
          <Input
            placeholder="Your Company Name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>
        
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Your Job Title
          </label>
          <Input
            placeholder="CEO, Founder, Partner, etc."
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Website URL
          </label>
          <Input
            type="url"
            placeholder="https://www.yourcompany.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            className="w-full"
          />
        </div>

        <Card className="border-green-500/30 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-green-900 mb-1">AI Enhancement</h4>
                <p className="text-sm text-green-800">
                  Our AI will analyze your website to extract company information, 
                  services, and industry focus to improve your profile automatically.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button
            onClick={handleWebsiteSubmit}
            disabled={websiteMutation.isPending || !websiteUrl.trim()}
            className="bg-green-600 hover:bg-green-700 text-white flex-1"
          >
            {websiteMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Analyzing Website...
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Analyze Website
              </>
            )}
          </Button>
          
          <Button 
            variant="outline" 
            onClick={skipStep}
            className="px-6"
          >
            Skip for now
          </Button>
        </div>
      </div>
    </div>
  );

  const renderAiAnalysisStep = () => (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Wand2 className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-xl font-bold text-stak-black mb-2">AI Profile Enhancement</h3>
        <p className="text-gray-600">
          Let our AI analyze your information and suggest improvements to maximize your networking potential
        </p>
      </div>

      <Card className="border-purple-500/30 bg-purple-50/50">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <Brain className="w-12 h-12 text-purple-600 mx-auto" />
            <div>
              <h4 className="font-semibold text-purple-900 mb-2">What our AI will do:</h4>
              <ul className="text-sm text-purple-800 space-y-2 text-left max-w-md mx-auto">
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  Generate an optimized professional bio
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  Suggest relevant skills and industries
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  Recommend networking goals
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-purple-600" />
                  Find potential connections
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {showSuggestions && suggestions.length > 0 && (
        <Card className="border-stak-copper/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-stak-black">
              <Sparkles className="w-5 h-5 text-stak-copper" />
              AI Suggestions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-48">
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <Card key={index} className="p-3 bg-gray-50">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-stak-copper/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-stak-copper">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <h5 className="font-medium text-stak-black mb-1">{suggestion.title}</h5>
                        <p className="text-sm text-gray-600">{suggestion.description}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handleAiAnalysis}
          disabled={aiSuggestionsMutation.isPending}
          className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
        >
          {aiSuggestionsMutation.isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              AI Analyzing...
            </>
          ) : (
            <>
              <Wand2 className="w-4 h-4 mr-2" />
              Start AI Analysis
            </>
          )}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={skipStep}
          className="px-6"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );

  const currentStepData = steps[currentStep];

  return (
    <Dialog open={true} onOpenChange={() => {}}>
      <DialogContent className="max-w-4xl max-h-[95vh] p-0 gap-0 mx-2 sm:mx-4">
        <DialogHeader className="p-4 sm:p-6 pb-3 sm:pb-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
              <div className="w-6 h-6 sm:w-8 sm:h-8 bg-stak-copper/20 rounded-full flex items-center justify-center">
                <Brain className="w-3 h-3 sm:w-4 sm:h-4 text-stak-copper" />
              </div>
              <span className="hidden sm:inline">Profile Setup - Step {currentStep + 1} of {steps.length}</span>
              <span className="sm:hidden">Step {currentStep + 1}/{steps.length}</span>
            </DialogTitle>
            
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right">
                <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">Profile Complete</div>
                <div className="text-lg sm:text-xl font-bold text-stak-copper">{profileCompleteness}%</div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onSkip}
                className="text-gray-500 hover:text-gray-700 p-1"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 sm:p-6 overflow-auto max-h-[60vh]">
          {currentStep === 0 && renderWelcomeStep()}
          {currentStep === 1 && renderLinkedinStep()}
          {currentStep === 2 && renderWebsiteStep()}
          {currentStep === 3 && renderAiAnalysisStep()}
        </div>

        <div className="p-4 sm:p-6 pt-3 sm:pt-4 border-t bg-gray-50">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Simplified progress indicator */}
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <span className="text-xs sm:text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</span>
              <div className="flex items-center gap-1">
                {steps.map((step, index) => (
                  <div key={step.id} className={`w-2 h-2 rounded-full ${
                    step.completed 
                      ? 'bg-green-500' 
                      : index === currentStep 
                        ? 'bg-stak-copper' 
                        : 'bg-gray-300'
                  }`} />
                ))}
              </div>
            </div>
            
            {/* Single clear CTA */}
            <div className="order-1 sm:order-2 w-full sm:w-auto">
              {currentStep === 0 && (
                <Button 
                  onClick={nextStep} 
                  className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black w-full sm:w-auto"
                  size="lg"
                >
                  Let's Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              
              {currentStep > 0 && currentStep < steps.length - 1 && (
                <Button 
                  onClick={nextStep} 
                  className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black w-full sm:w-auto"
                  size="lg"
                >
                  Continue Profile Building
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
              
              {currentStep === steps.length - 1 && (
                <Button 
                  onClick={onComplete} 
                  className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black w-full sm:w-auto"
                  size="lg"
                >
                  <Trophy className="w-4 h-4 mr-2" />
                  Complete Setup & Start Networking
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}