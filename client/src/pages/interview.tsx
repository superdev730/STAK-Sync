import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronLeft, ChevronRight, User, Briefcase, Target, Building } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

import Stage0SessionState from "@/components/interview/Stage0SessionState";
import Stage1Identity from "@/components/interview/Stage1Identity";
import Stage2Persona from "@/components/interview/Stage2Persona";
import Stage3Goals from "@/components/interview/Stage3Goals";
import Stage4VCProfile from "@/components/interview/Stage4VCProfile";
import Stage4FounderProfile from "@/components/interview/Stage4FounderProfile";
import Stage4OperatorProfile from "@/components/interview/Stage4OperatorProfile";
import Stage4GeneralProfile from "@/components/interview/Stage4GeneralProfile";

interface InterviewStatus {
  profileStatus: "new" | "incomplete" | "complete";
  currentStage: number;
  completedStages: string[];
  selectedPersonas?: string[];
  primaryPersona?: string;
}

// Define Stage 4 personas mapping
const VC_PERSONAS = ["VC", "Angel", "Family Office"];
const FOUNDER_PERSONAS = ["Founder", "Co-Founder", "CEO"];
const OPERATOR_PERSONAS = ["Operator", "Engineer", "Designer", "Product Manager", "Sales", "Marketing"];

const STAGES = [
  { id: 0, name: "Welcome", icon: User, component: Stage0SessionState },
  { id: 1, name: "Identity", icon: User, component: Stage1Identity },
  { id: 2, name: "Persona", icon: Briefcase, component: Stage2Persona },
  { id: 3, name: "Goals", icon: Target, component: Stage3Goals },
  { id: 4, name: "Deep Dive", icon: Building, component: null, conditional: true }, // Component determined dynamically
];

export default function Interview() {
  const [currentStage, setCurrentStage] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [showStage4, setShowStage4] = useState(false);
  const [stage4Type, setStage4Type] = useState<"vc" | "founder" | "operator" | "general" | null>(null);
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch interview status
  const { data: interviewStatus, isLoading: statusLoading } = useQuery<InterviewStatus>({
    queryKey: ["/api/interview/status"],
    enabled: !!user,
    retry: 1,
  });

  // Set initial stage based on status
  useEffect(() => {
    if (interviewStatus) {
      if (interviewStatus.profileStatus === "new") {
        setCurrentStage(1);
      } else if (interviewStatus.profileStatus === "incomplete") {
        setCurrentStage(interviewStatus.currentStage || 1);
      } else if (interviewStatus.profileStatus === "complete") {
        setCurrentStage(0);
      }
      
      // Determine which Stage 4 profile to show based on personas
      const personas = interviewStatus.selectedPersonas || [];
      const primaryPersona = interviewStatus.primaryPersona || personas[0];
      
      if (primaryPersona) {
        setShowStage4(true);
        
        if (VC_PERSONAS.includes(primaryPersona)) {
          setStage4Type("vc");
        } else if (FOUNDER_PERSONAS.includes(primaryPersona)) {
          setStage4Type("founder");
        } else if (OPERATOR_PERSONAS.includes(primaryPersona)) {
          setStage4Type("operator");
        } else {
          setStage4Type("general");
        }
      } else {
        setShowStage4(false);
        setStage4Type(null);
      }
    }
  }, [interviewStatus]);

  // Save stage data mutation
  const saveStageData = useMutation({
    mutationFn: async ({ stage, data }: { stage: number; data: any }) => {
      let endpoint = `/api/interview/stage${stage}`;
      
      // Use persona-specific endpoint for Stage 4
      if (stage === 4 && stage4Type) {
        endpoint = `/api/interview/stage4/${stage4Type}`;
      }
      
      const response = await apiRequest(endpoint, "POST", data);
      return response.json();
    },
    onSuccess: (data, variables) => {
      toast({
        title: "Progress Saved",
        description: "Your information has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/interview/status"] });
      
      // Check if we need to show Stage 4 after persona selection
      if (variables.stage === 2) {
        const personas = variables.data.selectedPersonas || [];
        const primaryPersona = variables.data.primaryPersona || personas[0];
        
        if (primaryPersona) {
          setShowStage4(true);
          
          if (VC_PERSONAS.includes(primaryPersona)) {
            setStage4Type("vc");
          } else if (FOUNDER_PERSONAS.includes(primaryPersona)) {
            setStage4Type("founder");
          } else if (OPERATOR_PERSONAS.includes(primaryPersona)) {
            setStage4Type("operator");
          } else {
            setStage4Type("general");
          }
        } else {
          setShowStage4(false);
          setStage4Type(null);
        }
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save your progress. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStageComplete = async (data: any) => {
    // Save current stage data
    setFormData(prev => ({ ...prev, [`stage${currentStage}`]: data }));
    
    // Save to backend
    await saveStageData.mutateAsync({ stage: currentStage, data });
    
    // Move to next stage
    if (currentStage === 3 && !showStage4) {
      // If no Stage 4 needed, complete the interview
      handleComplete();
    } else if (currentStage === 4) {
      // Stage 4 is the last stage
      handleComplete();
    } else if (currentStage < 3) {
      setCurrentStage(currentStage + 1);
    } else if (currentStage === 3 && showStage4) {
      setCurrentStage(4);
    }
  };

  const handleBack = () => {
    if (currentStage > 1) {
      setCurrentStage(currentStage - 1);
    }
  };

  const handleComplete = () => {
    toast({
      title: "Interview Complete!",
      description: "Thank you for completing your profile. Redirecting to home...",
    });
    setTimeout(() => {
      setLocation("/");
    }, 2000);
  };

  const handleResumeInterview = () => {
    if (interviewStatus?.currentStage) {
      setCurrentStage(interviewStatus.currentStage);
    }
  };

  const handleUpdateProfile = () => {
    setCurrentStage(1);
  };

  if (authLoading || statusLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stak-copper mx-auto mb-4"></div>
          <p className="text-stak-black">Loading interview...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Please log in</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to complete the interview.</p>
            <Button onClick={() => setLocation("/login")} className="bg-stak-copper hover:bg-stak-dark-copper">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeStages = STAGES.filter(stage => 
    !stage.conditional || (stage.id === 4 && showStage4) || stage.id !== 4
  );
  
  // Determine which Stage 4 component to use
  let CurrentStageComponent = STAGES[currentStage]?.component;
  if (currentStage === 4 && stage4Type) {
    switch (stage4Type) {
      case "vc":
        CurrentStageComponent = Stage4VCProfile;
        break;
      case "founder":
        CurrentStageComponent = Stage4FounderProfile;
        break;
      case "operator":
        CurrentStageComponent = Stage4OperatorProfile;
        break;
      case "general":
        CurrentStageComponent = Stage4GeneralProfile;
        break;
    }
  }
  
  const progress = currentStage === 0 ? 0 : ((currentStage) / (showStage4 ? 4 : 3)) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-stak-black mb-2">
            STAK Sync Profile Interview
          </h1>
          <p className="text-gray-600">
            Help us understand you better to create meaningful connections
          </p>
        </div>

        {/* Progress Bar */}
        {currentStage > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Step {currentStage} of {showStage4 ? 4 : 3}
              </span>
              <span className="text-sm font-medium text-stak-copper">
                {Math.round(progress)}% Complete
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            
            {/* Stage indicators */}
            <div className="flex justify-between mt-4">
              {activeStages.slice(1).map((stage) => {
                const isActive = currentStage === stage.id;
                const isCompleted = currentStage > stage.id;
                const Icon = stage.icon;
                
                return (
                  <div
                    key={stage.id}
                    className={`flex flex-col items-center ${
                      stage.id <= currentStage ? 'text-stak-copper' : 'text-gray-400'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                        isActive
                          ? 'bg-stak-copper text-white'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-xs font-medium">{stage.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Main Content */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            {CurrentStageComponent && (
              <CurrentStageComponent
                onNext={handleStageComplete}
                onBack={handleBack}
                initialData={formData[`stage${currentStage}`]}
                interviewStatus={interviewStatus}
                onResume={handleResumeInterview}
                onUpdate={handleUpdateProfile}
                showBackButton={currentStage > 1}
                isLastStage={
                  (currentStage === 3 && !showStage4) || 
                  (currentStage === 4)
                }
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}