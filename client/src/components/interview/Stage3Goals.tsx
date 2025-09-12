import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ChevronLeft, ChevronRight, Target, Clock } from "lucide-react";
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
  { value: "now", label: "Now", description: "Within the next 30 days" },
  { value: "30-60d", label: "30-60d", description: "30-60 days" },
  { value: "60-180d", label: "60-180d", description: "60-180 days" },
  { value: "exploratory", label: "Exploratory", description: "Just exploring options" },
];

const stage3Schema = z.object({
  goalStatement: z.string()
    .min(20, "Please provide a meaningful intent statement (min 20 characters)")
    .max(500, "Intent statement is too long (max 500 characters)"),
  selectedGoals: z.array(z.string())
    .min(1, "Please select at least 1 goal")
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
  const timelineUrgency = form.watch("timelineUrgency");

  const handleGoalChange = (value: string[]) => {
    if (value.length <= 3) {
      form.setValue("selectedGoals", value);
      form.clearErrors("selectedGoals");
    }
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

        {/* Goal Statement - renamed to One-sentence intent */}
        <FormField
          control={form.control}
          name="goalStatement"
          render={({ field }) => (
            <FormItem>
              <FormLabel>One-sentence intent *</FormLabel>
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

        {/* Goal Selection - Chip-based multi-select */}
        <FormField
          control={form.control}
          name="selectedGoals"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <div className="flex items-center justify-between">
                <FormLabel>Select Your Goals (1-3 required) *</FormLabel>
                <span className="text-sm text-gray-600">
                  {selectedGoals.length}/3 selected
                </span>
              </div>
              <FormDescription>
                Choose 1-3 goals that best describe what you're looking for
              </FormDescription>
              <FormControl>
                <ToggleGroup
                  type="multiple"
                  value={field.value}
                  onValueChange={handleGoalChange}
                  className="flex flex-wrap gap-2 justify-start"
                >
                  {GOALS.map((goal) => (
                    <ToggleGroupItem
                      key={goal.value}
                      value={goal.value}
                      disabled={!field.value.includes(goal.value) && field.value.length >= 3}
                      className="data-[state=on]:bg-stak-copper data-[state=on]:text-white border-stak-copper/30 hover:bg-stak-copper/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid={`chip-goal-${goal.value}`}
                    >
                      <span className="mr-1">{goal.icon}</span>
                      {goal.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Timeline Urgency - Chip-based single select */}
        <FormField
          control={form.control}
          name="timelineUrgency"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-stak-copper" />
                What's your timeline? *
              </FormLabel>
              <FormDescription>
                Select when you need to achieve your goals
              </FormDescription>
              <FormControl>
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-wrap gap-2 justify-start"
                >
                  {TIMELINE_OPTIONS.map((option) => (
                    <ToggleGroupItem
                      key={option.value}
                      value={option.value}
                      className="data-[state=on]:bg-stak-copper data-[state=on]:text-white border-stak-copper/30 hover:bg-stak-copper/10"
                      data-testid={`chip-timeline-${option.value}`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs opacity-80">{option.description}</span>
                      </div>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Selected Summary */}
        {(selectedGoals.length > 0 || timelineUrgency) && (
          <Card className="border-stak-copper/30 bg-stak-copper/5">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-stak-black mb-3">Your Selection Summary</h3>
              
              {selectedGoals.length > 0 && (
                <div className="mb-3">
                  <span className="text-xs font-medium text-gray-600">Goals:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedGoals.map((goalValue) => {
                      const goal = GOALS.find(g => g.value === goalValue);
                      return (
                        <span
                          key={goalValue}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-stak-copper text-white"
                        >
                          <span>{goal?.icon}</span>
                          {goal?.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {timelineUrgency && (
                <div>
                  <span className="text-xs font-medium text-gray-600">Timeline:</span>
                  <div className="mt-1">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-stak-copper/20 text-stak-black">
                      {TIMELINE_OPTIONS.find(t => t.value === timelineUrgency)?.label} - {TIMELINE_OPTIONS.find(t => t.value === timelineUrgency)?.description}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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