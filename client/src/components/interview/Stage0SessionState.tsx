import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, RefreshCw } from "lucide-react";

interface Stage0SessionStateProps {
  onNext: () => void;
  interviewStatus?: {
    profileStatus: "new" | "incomplete" | "complete";
    currentStage: number;
    completedStages: string[];
  };
  onResume?: () => void;
  onUpdate?: () => void;
}

export default function Stage0SessionState({
  onNext,
  interviewStatus,
  onResume,
  onUpdate,
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
            Let's build your professional profile to connect you with the right people in the STAK ecosystem.
            This will only take about 5 minutes.
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

  if (interviewStatus.profileStatus === "incomplete") {
    return (
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-stak-black">
            Welcome back!
          </h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            Let's finish setting up your profile. You're almost done!
          </p>
        </div>

        <div className="bg-stak-copper/10 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-stak-black">Progress</span>
            <span className="text-sm text-gray-600">
              Stage {interviewStatus.currentStage} of 4
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-stak-copper h-2 rounded-full transition-all"
              style={{
                width: `${(interviewStatus.currentStage / 4) * 100}%`,
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

  if (interviewStatus.profileStatus === "complete") {
    return (
      <div className="text-center space-y-6">
        <div className="space-y-3">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-stak-black">
            Your profile is complete!
          </h2>
          <p className="text-gray-600 max-w-lg mx-auto">
            Great job! Your profile is all set up. Would you like to review or update any information?
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Button
            onClick={onUpdate}
            variant="outline"
            size="lg"
            className="border-stak-copper text-stak-copper hover:bg-stak-copper/10"
            data-testid="button-update-profile"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Update Profile
          </Button>
        </div>

        <div className="pt-4">
          <p className="text-sm text-gray-500">
            You can also update your profile anytime from the Profile tab.
          </p>
        </div>
      </div>
    );
  }

  return null;
}