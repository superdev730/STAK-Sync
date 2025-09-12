import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ChevronLeft, ChevronRight, Target, Clock, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

const GOALS = [
  { value: "raise_capital", label: "Raise capital", icon: "💰" },
  { value: "invest_capital", label: "Invest capital", icon: "📈" },
  { value: "hire", label: "Hire talent", icon: "👥" },
  { value: "find_cofounder", label: "Find co-founder", icon: "🤝" },
  { value: "find_customers", label: "Find customers", icon: "🎯" },
  { value: "get_mentor", label: "Get mentorship", icon: "🧠" },
  { value: "find_advisors", label: "Find advisors", icon: "💡" },
  { value: "find_service_providers", label: "Find service providers", icon: "🔧" },
  { value: "join_startup", label: "Join a startup", icon: "🚀" },
  { value: "partnership_bd", label: "Partnership & BD", icon: "🏢" },
  { value: "speaking_pr", label: "Speaking & PR", icon: "🎤" },
  { value: "find_space", label: "Find office space", icon: "🏠" },
  { value: "community_events", label: "Community & events", icon: "🎉" },
  { value: "other", label: "Other", icon: "✨" },
];

const TIMELINE_OPTIONS = [
  { value: "now", label: "Immediately", description: "Within the next 30 days" },
  { value: "30-60d", label: "Soon", description: "30-60 days" },
  { value: "60-180d", label: "This quarter", description: "60-180 days" },
  { value: "exploratory", label: "Exploratory", description: "Just exploring options" },
];

const stage3Schema = z.object({
  goalStatement: z.string()
    .min(20, "Please provide a meaningful goal statement (min 20 characters)")
    .max(500, "Goal statement is too long (max 500 characters)"),
  selectedGoals: z.array(z.string())
    .min(1, "Please select at least one goal")
    .max(3, "Please select up to 3 goals"),
  timelineUrgency: z.enum(["now", "30-60d", "60-180d", "exploratory"], {
    required_error: "Please select your timeline",
  }),
});

type Stage3Data = z.infer<typeof stage3Schema>;

interface Stage3GoalsProps {
  onNext: (data: Stage3Data) => void;
  onBack?: () => void;
  initialData?: Partial<Stage3Data>;
  showBackButton?: boolean;
  isLastStage?: boolean;
}

export default function Stage3Goals({
  onNext,
  onBack,
  initialData,
  showBackButton = false,
  isLastStage = false,
}: Stage3GoalsProps) {
  const form = useForm<Stage3Data>({
    resolver: zodResolver(stage3Schema),
    defaultValues: {
      goalStatement: initialData?.goalStatement || "",
      selectedGoals: initialData?.selectedGoals || [],
      timelineUrgency: initialData?.timelineUrgency || undefined,
    },
  });

  const selectedGoals = form.watch("selectedGoals");

  const handleGoalToggle = (goal: string, checked: boolean) => {
    const currentGoals = form.getValues("selectedGoals");
    if (checked && currentGoals.length >= 3) {
      form.setError("selectedGoals", {
        message: "You can select up to 3 goals",
      });
      return;
    }
    
    const newGoals = checked
      ? [...currentGoals, goal]
      : currentGoals.filter(g => g !== goal);
    
    form.setValue("selectedGoals", newGoals);
    form.clearErrors("selectedGoals");
  };

  const handleSubmit = (data: Stage3Data) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stak-black">Your Goals & Timeline</h2>
          <p className="text-gray-600">
            Tell us what you're looking to achieve through STAK Sync
          </p>
        </div>

        {/* Goal Statement */}
        <FormField
          control={form.control}
          name="goalStatement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>What brings you to STAK Sync? *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Example: I'm raising a Series A for my fintech startup and looking to connect with VCs who have experience in payments infrastructure..."
                  className="min-h-[100px]"
                  data-testid="textarea-goal-statement"
                />
              </FormControl>
              <FormDescription>
                Be specific about what you're looking for (20-500 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Goal Selection */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="selectedGoals"
            render={() => (
              <FormItem>
                <div className="flex items-center justify-between mb-3">
                  <FormLabel>Select Your Goals (Max 3) *</FormLabel>
                  <span className="text-sm text-gray-600">
                    {selectedGoals.length}/3 selected
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {GOALS.map((goal) => (
                    <Card
                      key={goal.value}
                      className={`cursor-pointer transition-all ${
                        selectedGoals.includes(goal.value)
                          ? "border-stak-copper bg-stak-copper/5"
                          : "border-gray-200 hover:border-stak-copper/50"
                      } ${
                        !selectedGoals.includes(goal.value) && selectedGoals.length >= 3
                          ? "opacity-50 cursor-not-allowed"
                          : ""
                      }`}
                      onClick={() => {
                        if (selectedGoals.includes(goal.value) || selectedGoals.length < 3) {
                          const isChecked = selectedGoals.includes(goal.value);
                          handleGoalToggle(goal.value, !isChecked);
                        }
                      }}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{goal.icon}</span>
                          <Checkbox
                            checked={selectedGoals.includes(goal.value)}
                            onCheckedChange={(checked) => 
                              handleGoalToggle(goal.value, checked as boolean)
                            }
                            disabled={!selectedGoals.includes(goal.value) && selectedGoals.length >= 3}
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`checkbox-goal-${goal.value}`}
                          />
                          <Label className="flex-1 cursor-pointer">
                            {goal.label}
                          </Label>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Timeline Urgency */}
        <Card className="border-stak-copper/20">
          <CardContent className="pt-6">
            <FormField
              control={form.control}
              name="timelineUrgency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 mb-4">
                    <Clock className="w-4 h-4 text-stak-copper" />
                    What's your timeline? *
                  </FormLabel>
                  <FormControl>
                    <RadioGroup
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <div className="space-y-3">
                        {TIMELINE_OPTIONS.map((option) => (
                          <div key={option.value} className="flex items-center space-x-3">
                            <RadioGroupItem 
                              value={option.value} 
                              id={`timeline-${option.value}`}
                              data-testid={`radio-timeline-${option.value}`}
                            />
                            <Label
                              htmlFor={`timeline-${option.value}`}
                              className="flex-1 cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-medium">{option.label}</span>
                                  <span className="text-sm text-gray-600 ml-2">
                                    - {option.description}
                                  </span>
                                </div>
                              </div>
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
          </CardContent>
        </Card>

        {/* Selected Goals Summary */}
        {selectedGoals.length > 0 && (
          <Alert>
            <Target className="h-4 w-4" />
            <AlertDescription>
              <strong>Your selected goals:</strong>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedGoals.map((goalValue) => {
                  const goal = GOALS.find(g => g.value === goalValue);
                  return (
                    <span
                      key={goalValue}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-stak-copper/20 text-stak-black"
                    >
                      <span>{goal?.icon}</span>
                      {goal?.label}
                    </span>
                  );
                })}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          {showBackButton && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="border-stak-copper text-stak-copper"
              data-testid="button-back"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            type="submit"
            className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium ml-auto"
            data-testid="button-next"
          >
            {isLastStage ? "Complete Interview" : "Continue"}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );
}