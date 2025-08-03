import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronLeft, ChevronRight, Brain, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { QuestionnaireResponse } from "@shared/schema";

// Question schemas for each step
const step1Schema = z.object({
  networkingGoal: z.string().min(1, "Please select your primary networking goal"),
});

const step2Schema = z.object({
  industries: z.array(z.string()).min(1, "Please select at least one industry").max(3, "Please select up to 3 industries"),
});

const step3Schema = z.object({
  meetingStyle: z.string().min(1, "Please select your preferred meeting style"),
});

const step4Schema = z.object({
  fundingStage: z.string().optional(),
  investmentRange: z.string().optional(),
  geographicFocus: z.array(z.string()).optional(),
});

const step5Schema = z.object({
  communicationStyle: z.string().min(1, "Please select your communication style"),
  availability: z.string().min(1, "Please select your availability"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;
type Step4Data = z.infer<typeof step4Schema>;
type Step5Data = z.infer<typeof step5Schema>;

interface Question {
  id: string;
  title: string;
  description: string;
  type: "radio" | "checkbox" | "multi-radio";
  options: { value: string; label: string; description?: string }[];
  maxSelections?: number;
}

const questions: Record<number, Question> = {
  1: {
    id: "networkingGoal",
    title: "What's your primary networking goal for the next 6 months?",
    description: "This helps us match you with people who align with your objectives.",
    type: "radio",
    options: [
      {
        value: "raise_funding",
        label: "Raise funding for my startup",
        description: "Connect with VCs and angel investors"
      },
      {
        value: "find_investments",
        label: "Find investment opportunities",
        description: "Discover promising startups to invest in"
      },
      {
        value: "strategic_partnerships",
        label: "Explore strategic partnerships",
        description: "Find collaboration opportunities"
      },
      {
        value: "learn_expertise",
        label: "Learn from industry experts",
        description: "Gain insights and mentorship"
      },
    ],
  },
  2: {
    id: "industries",
    title: "Which industries interest you most?",
    description: "Select up to 3 industries that align with your expertise or interests.",
    type: "checkbox",
    maxSelections: 3,
    options: [
      { value: "fintech", label: "FinTech" },
      { value: "ai_ml", label: "AI/Machine Learning" },
      { value: "healthtech", label: "Healthcare Tech" },
      { value: "saas", label: "SaaS/Enterprise" },
      { value: "ecommerce", label: "E-commerce" },
      { value: "climatetech", label: "Climate Tech" },
      { value: "edtech", label: "EdTech" },
      { value: "biotech", label: "BioTech" },
    ],
  },
  3: {
    id: "meetingStyle",
    title: "What's your preferred meeting style?",
    description: "This helps us suggest the right format for your connections.",
    type: "radio",
    options: [
      {
        value: "coffee_30min",
        label: "Coffee meetings (30 mins)",
        description: "Quick, casual conversations"
      },
      {
        value: "lunch_1hour",
        label: "Lunch meetings (1 hour)",
        description: "More substantial discussions"
      },
      {
        value: "event_networking",
        label: "Event-based networking",
        description: "Meet at conferences and events"
      },
      {
        value: "virtual_first",
        label: "Virtual meetings first",
        description: "Start with video calls"
      },
    ],
  },
  4: {
    id: "additionalPreferences",
    title: "Additional Preferences",
    description: "Help us fine-tune your matches with these optional preferences.",
    type: "multi-radio",
    options: [
      { value: "seed", label: "Seed Stage" },
      { value: "series_a", label: "Series A" },
      { value: "series_b", label: "Series B+" },
      { value: "growth", label: "Growth Stage" },
    ],
  },
  5: {
    id: "communicationPreferences",
    title: "Communication & Availability",
    description: "Let us know how and when you prefer to connect.",
    type: "multi-radio",
    options: [
      { value: "direct", label: "Direct and to-the-point" },
      { value: "collaborative", label: "Collaborative and detailed" },
      { value: "casual", label: "Casual and friendly" },
      { value: "formal", label: "Professional and formal" },
    ],
  },
};

export default function Questionnaire() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const totalSteps = Object.keys(questions).length;
  const progress = (currentStep / totalSteps) * 100;

  // Check for existing questionnaire response
  const { data: existingResponse } = useQuery<QuestionnaireResponse>({
    queryKey: ["/api/questionnaire"],
    enabled: !!user,
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, authLoading, toast]);

  // Load existing responses if available
  useEffect(() => {
    if (existingResponse?.responses) {
      setFormData(existingResponse.responses as Record<string, any>);
    }
  }, [existingResponse]);

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: { networkingGoal: formData.networkingGoal || "" },
  });

  const step2Form = useForm<Step2Data>({
    resolver: zodResolver(step2Schema),
    defaultValues: { industries: formData.industries || [] },
  });

  const step3Form = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { meetingStyle: formData.meetingStyle || "" },
  });

  const step4Form = useForm<Step4Data>({
    resolver: zodResolver(step4Schema),
    defaultValues: {
      fundingStage: formData.fundingStage || "",
      investmentRange: formData.investmentRange || "",
      geographicFocus: formData.geographicFocus || [],
    },
  });

  const step5Form = useForm<Step5Data>({
    resolver: zodResolver(step5Schema),
    defaultValues: {
      communicationStyle: formData.communicationStyle || "",
      availability: formData.availability || "",
    },
  });

  const saveResponseMutation = useMutation({
    mutationFn: async (responses: Record<string, any>) => {
      return apiRequest("POST", "/api/questionnaire", responses);
    },
    onSuccess: () => {
      toast({
        title: "Questionnaire Completed!",
        description: "Your responses will help us provide better matches.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/questionnaire"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save your responses. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getCurrentForm = () => {
    switch (currentStep) {
      case 1: return step1Form;
      case 2: return step2Form;
      case 3: return step3Form;
      case 4: return step4Form;
      case 5: return step5Form;
      default: return step1Form;
    }
  };

  const handleNext = async () => {
    const form = getCurrentForm();
    const isValid = await form.trigger();
    
    if (isValid) {
      const currentData = form.getValues();
      const updatedFormData = { ...formData, ...currentData };
      setFormData(updatedFormData);

      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      } else {
        // Final step - save all responses
        await saveResponseMutation.mutateAsync(updatedFormData);
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (authLoading) {
    return (
      <div className="space-y-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
        <div className="max-w-4xl mx-auto">
          <div className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const currentQuestion = questions[currentStep];
  const form = getCurrentForm();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-playfair font-bold text-navy mb-4">Improve Your Matches</h1>
        <p className="text-xl text-charcoal">Help our AI understand your networking goals better</p>
      </div>

      {/* Questionnaire */}
      <div className="max-w-4xl mx-auto">
        <Card className="luxury-card">
          <CardHeader>
            <div className="flex items-center justify-between mb-6">
              <CardTitle className="text-2xl font-playfair font-semibold text-navy">
                Matching Questionnaire
              </CardTitle>
              <div className="flex items-center space-x-4">
                <div className="w-48 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gold h-2 rounded-full transition-all" 
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600">{currentStep} of {totalSteps}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {currentStep <= totalSteps ? (
              <Form {...form}>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-semibold text-charcoal mb-2">
                      {currentQuestion.title}
                    </h3>
                    <p className="text-gray-600 mb-6">{currentQuestion.description}</p>

                    {/* Step 1: Networking Goal */}
                    {currentStep === 1 && (
                      <FormField
                        control={step1Form.control}
                        name="networkingGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup value={field.value} onValueChange={field.onChange}>
                                <div className="space-y-3">
                                  {currentQuestion.options.map((option) => (
                                    <div key={option.value} className="flex items-center space-x-3">
                                      <RadioGroupItem value={option.value} id={option.value} />
                                      <Label 
                                        htmlFor={option.value}
                                        className="flex-1 p-4 border border-gray-200 rounded-lg hover:border-gold transition-colors cursor-pointer"
                                      >
                                        <div className="font-medium text-charcoal">{option.label}</div>
                                        {option.description && (
                                          <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                                        )}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Step 2: Industries */}
                    {currentStep === 2 && (
                      <FormField
                        control={step2Form.control}
                        name="industries"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <div className="grid grid-cols-2 gap-3">
                                {currentQuestion.options.map((option) => (
                                  <div key={option.value} className="flex items-center space-x-3">
                                    <Checkbox
                                      checked={field.value?.includes(option.value)}
                                      onCheckedChange={(checked) => {
                                        const updatedValue = checked
                                          ? [...(field.value || []), option.value]
                                          : field.value?.filter((v) => v !== option.value) || [];
                                        
                                        if (updatedValue.length <= 3) {
                                          field.onChange(updatedValue);
                                        }
                                      }}
                                    />
                                    <Label className="flex-1 p-3 border border-gray-200 rounded-lg hover:border-gold transition-colors cursor-pointer">
                                      {option.label}
                                    </Label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Step 3: Meeting Style */}
                    {currentStep === 3 && (
                      <FormField
                        control={step3Form.control}
                        name="meetingStyle"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <RadioGroup value={field.value} onValueChange={field.onChange}>
                                <div className="space-y-3">
                                  {currentQuestion.options.map((option) => (
                                    <div key={option.value} className="flex items-center space-x-3">
                                      <RadioGroupItem value={option.value} id={option.value} />
                                      <Label 
                                        htmlFor={option.value}
                                        className="flex-1 p-4 border border-gray-200 rounded-lg hover:border-gold transition-colors cursor-pointer"
                                      >
                                        <div className="font-medium text-charcoal">{option.label}</div>
                                        {option.description && (
                                          <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                                        )}
                                      </Label>
                                    </div>
                                  ))}
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Step 4: Additional Preferences */}
                    {currentStep === 4 && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium text-charcoal mb-3">Funding Stage Interest (Optional)</h4>
                          <FormField
                            control={step4Form.control}
                            name="fundingStage"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <RadioGroup value={field.value} onValueChange={field.onChange}>
                                    <div className="grid grid-cols-2 gap-3">
                                      {currentQuestion.options.map((option) => (
                                        <div key={option.value} className="flex items-center space-x-3">
                                          <RadioGroupItem value={option.value} id={option.value} />
                                          <Label 
                                            htmlFor={option.value}
                                            className="flex-1 p-3 border border-gray-200 rounded-lg hover:border-gold transition-colors cursor-pointer text-center"
                                          >
                                            {option.label}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    {/* Step 5: Communication Preferences */}
                    {currentStep === 5 && (
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-medium text-charcoal mb-3">Communication Style</h4>
                          <FormField
                            control={step5Form.control}
                            name="communicationStyle"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <RadioGroup value={field.value} onValueChange={field.onChange}>
                                    <div className="space-y-3">
                                      {questions[5].options.map((option) => (
                                        <div key={option.value} className="flex items-center space-x-3">
                                          <RadioGroupItem value={option.value} id={option.value} />
                                          <Label 
                                            htmlFor={option.value}
                                            className="flex-1 p-4 border border-gray-200 rounded-lg hover:border-gold transition-colors cursor-pointer"
                                          >
                                            {option.label}
                                          </Label>
                                        </div>
                                      ))}
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div>
                          <h4 className="font-medium text-charcoal mb-3">Availability</h4>
                          <FormField
                            control={step5Form.control}
                            name="availability"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <RadioGroup value={field.value} onValueChange={field.onChange}>
                                    <div className="space-y-3">
                                      <div className="flex items-center space-x-3">
                                        <RadioGroupItem value="weekdays" id="weekdays" />
                                        <Label htmlFor="weekdays" className="flex-1 p-4 border border-gray-200 rounded-lg hover:border-gold transition-colors cursor-pointer">
                                          Weekdays (9 AM - 6 PM)
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <RadioGroupItem value="flexible" id="flexible" />
                                        <Label htmlFor="flexible" className="flex-1 p-4 border border-gray-200 rounded-lg hover:border-gold transition-colors cursor-pointer">
                                          Flexible (Any time)
                                        </Label>
                                      </div>
                                      <div className="flex items-center space-x-3">
                                        <RadioGroupItem value="evenings" id="evenings" />
                                        <Label htmlFor="evenings" className="flex-1 p-4 border border-gray-200 rounded-lg hover:border-gold transition-colors cursor-pointer">
                                          Evenings & Weekends
                                        </Label>
                                      </div>
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevious}
                      disabled={currentStep === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNext}
                      className="bg-navy hover:bg-blue-800"
                      disabled={saveResponseMutation.isPending}
                    >
                      {currentStep === totalSteps ? (
                        saveResponseMutation.isPending ? (
                          "Saving..."
                        ) : (
                          "Complete"
                        )
                      ) : (
                        <>
                          Continue
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Form>
            ) : (
              /* Completion Screen */
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-prof-green rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-playfair font-bold text-navy mb-4">
                  Questionnaire Complete!
                </h3>
                <p className="text-charcoal mb-6 max-w-md mx-auto">
                  Thank you for completing the questionnaire. Your responses will help us provide more accurate matches and better networking opportunities.
                </p>
                <div className="flex justify-center space-x-4">
                  <Button asChild className="bg-navy hover:bg-blue-800">
                    <a href="/discover">View New Matches</a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="/">Return to Dashboard</a>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
