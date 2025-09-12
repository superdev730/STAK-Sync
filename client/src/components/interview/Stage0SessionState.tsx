import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, RefreshCw } from "lucide-react";

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