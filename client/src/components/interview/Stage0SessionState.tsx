import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Stage0SessionStateProps {
  onNext: () => void;
  interviewStatus?: {
    profileStatus: "new" | "returning_incomplete" | "returning_complete";
    nextStep: string;
    completionPercentage: number;
    completedSections: {
      stage1: boolean;
      stage2: boolean;
      stage3: boolean;
      stage4: boolean;
    };
    profileSummary?: {
      name: string;
      primaryPersona: string;
      mainGoal: string;
    } | null;
  };
  onResume?: () => void;
  onUpdate?: () => void;
  onSkipUpdate?: () => void;
}

export default function Stage0SessionState({
  onNext,
  interviewStatus,
  onResume,
  onUpdate,
  onSkipUpdate,
}: Stage0SessionStateProps) {
  const [consentToEnrich, setConsentToEnrich] = useState(false);
  const [showEnrichOption, setShowEnrichOption] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mutation for triggering enrichment
  const enrichmentMutation = useMutation({
    mutationFn: async () => {
      if (!consentToEnrich) {
        throw new Error("Consent required for enrichment");
      }
      
      // First update consent in the profile
      await apiRequest('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          consent: { enrich_public_sources: 'yes' }
        })
      });
      
      // Then trigger enrichment
      return await apiRequest('/api/interview/enrich', {
        method: 'POST'
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Enriched!",
        description: `Successfully enriched ${data.enrichedFields?.length || 0} fields from public sources.`,
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      queryClient.invalidateQueries({ queryKey: ['/api/interview/status'] });
      
      // Hide enrichment option after successful enrichment
      setShowEnrichOption(false);
    },
    onError: (error: any) => {
      toast({
        title: "Enrichment Failed",
        description: error.message || "Failed to enrich profile. Please try again.",
        variant: "destructive"
      });
    }
  });
  if (!interviewStatus) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stak-copper mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your profile status...</p>
      </div>
    );
  }

  if (interviewStatus.profileStatus === "new") {
    return (
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-stak-black">
            Welcome to STAK Sync!
          </h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            Welcome! I'll ask a few quick questions to personalize matches.
          </p>
        </div>

        <div className="grid gap-4 max-w-md mx-auto">
          <Card className="border-stak-copper/20 bg-stak-copper/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-stak-copper mt-0.5" />
                <div className="text-left">
                  <p className="font-medium text-stak-black">Quick & Easy</p>
                  <p className="text-sm text-gray-600">Complete in just 5 minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stak-copper/20 bg-stak-copper/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-stak-copper mt-0.5" />
                <div className="text-left">
                  <p className="font-medium text-stak-black">AI-Powered Matching</p>
                  <p className="text-sm text-gray-600">Get connected with relevant people</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stak-copper/20 bg-stak-copper/5">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-stak-copper mt-0.5" />
                <div className="text-left">
                  <p className="font-medium text-stak-black">Privacy First</p>
                  <p className="text-sm text-gray-600">Control what information you share</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Button
          onClick={onNext}
          size="lg"
          className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium"
          data-testid="button-start-interview"
        >
          Get Started
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  if (interviewStatus.profileStatus === "returning_incomplete") {
    return (
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-stak-black">
            Welcome back!
          </h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            Welcome back—let's pick up where you left off.
          </p>
        </div>

        <div className="bg-stak-copper/10 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-stak-black">Progress</span>
            <span className="text-sm text-gray-600">
              {interviewStatus.completionPercentage}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-stak-copper h-2 rounded-full transition-all"
              style={{
                width: `${interviewStatus.completionPercentage}%`,
              }}
            />
          </div>
        </div>

        <Button
          onClick={onResume}
          size="lg"
          className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium"
          data-testid="button-resume-interview"
        >
          Continue Where You Left Off
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    );
  }

  if (interviewStatus.profileStatus === "returning_complete") {
    return (
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-stak-black">
            Welcome back, {interviewStatus.profileSummary?.name || 'there'}!
          </h2>
          
          {/* Profile Summary - 3 lines */}
          {interviewStatus.profileSummary && (
            <div className="bg-gray-50 rounded-lg p-4 max-w-md mx-auto text-left">
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-gray-600">Name:</span>
                  <span className="text-sm text-stak-black">{interviewStatus.profileSummary.name}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-gray-600">Role:</span>
                  <span className="text-sm text-stak-black">{interviewStatus.profileSummary.primaryPersona}</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm font-medium text-gray-600">Goal:</span>
                  <span className="text-sm text-stak-black">{interviewStatus.profileSummary.mainGoal}</span>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-gray-600 max-w-lg mx-auto">
            Update anything?
          </p>
        </div>

        {/* Enrichment Option Card */}
        {!showEnrichOption && (
          <Card className="max-w-md mx-auto border-stak-copper/20 bg-gradient-to-br from-stak-copper/5 to-stak-copper/10">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-stak-copper mt-0.5" />
                <div className="flex-1 text-left">
                  <p className="font-medium text-stak-black mb-1">AI Profile Enhancement</p>
                  <p className="text-sm text-gray-600 mb-3">
                    Let AI enrich your profile with public data from your LinkedIn, GitHub, and other profiles.
                  </p>
                  <Button
                    onClick={() => setShowEnrichOption(true)}
                    size="sm"
                    variant="outline"
                    className="border-stak-copper text-stak-copper hover:bg-stak-copper/10"
                    data-testid="button-enhance-profile"
                  >
                    Enhance My Profile
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Enrichment Consent Modal */}
        {showEnrichOption && (
          <Card className="max-w-md mx-auto border-stak-copper/20">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-stak-black flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-stak-copper" />
                  AI Profile Enhancement
                </h3>
                <p className="text-sm text-gray-600">
                  We'll use your public profiles to enhance your STAK Sync profile with:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Professional achievements and projects</li>
                  <li>Skills and expertise</li>
                  <li>Company and role information</li>
                  <li>Portfolio items and contributions</li>
                </ul>
              </div>
              
              <div className="flex items-start gap-2">
                <Checkbox
                  id="consent"
                  checked={consentToEnrich}
                  onCheckedChange={(checked) => setConsentToEnrich(checked as boolean)}
                  className="mt-0.5"
                />
                <label
                  htmlFor="consent"
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  I consent to STAK Sync extracting public data from my linked profiles to enhance my profile
                </label>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => enrichmentMutation.mutate()}
                  disabled={!consentToEnrich || enrichmentMutation.isPending}
                  className="flex-1 bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium"
                  data-testid="button-start-enrichment"
                >
                  {enrichmentMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Enriching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Start Enhancement
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => {
                    setShowEnrichOption(false);
                    setConsentToEnrich(false);
                  }}
                  variant="outline"
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  data-testid="button-cancel-enrichment"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex gap-4 justify-center">
          <Button
            onClick={onUpdate}
            size="lg"
            className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium"
            data-testid="button-yes-update"
          >
            Yes
          </Button>
          <Button
            onClick={onSkipUpdate}
            variant="outline"
            size="lg"
            className="border-gray-300 text-gray-700 hover:bg-gray-50"
            data-testid="button-no-skip"
          >
            No
          </Button>
        </div>
      </div>
    );
  }

  return null;
}