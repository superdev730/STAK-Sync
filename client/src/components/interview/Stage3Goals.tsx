import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ChevronLeft, ChevronRight, Target, Clock, Info, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

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

// Maximum allowed goals (backend requirement)
const MAX_GOALS = 3;

const stage3Schema = z.object({
  goalStatement: z.string()
    .min(20, "Your intent statement needs at least 20 characters. Please add more detail about what you're looking for.")
    .max(500, "Your intent statement is too long (maximum 500 characters). Please shorten it to be more concise."),
  selectedChipGoals: z.array(z.string())
    .max(3, "You can only select up to 3 goals from the suggestions. Please deselect some goals."),
  customGoalsInput: z.string().optional(),
  goals: z.array(z.string()), // This will be the combined array sent to backend
  timelineUrgency: z.enum(["now", "30-60d", "60-180d", "exploratory"], {
    required_error: "Please select when you need to achieve your goals by clicking one of the timeline options.",
  }),
}).refine((data) => {
  // Parse custom goals
  const customGoals = data.customGoalsInput
    ? data.customGoalsInput.split(',').map((g: string) => g.trim()).filter((g: string) => g.length > 0)
    : [];
  
  // Combine selected chips and custom goals
  const totalGoals = Array.from(new Set([...data.selectedChipGoals, ...customGoals]));
  
  // Check minimum requirement
  return totalGoals.length >= 1;
}, {
  message: "You need at least 1 goal to continue. Please select a goal from the suggestions or enter your own custom goal.",
  path: ["goals"],
}).refine((data) => {
  // Parse custom goals
  const customGoals = data.customGoalsInput
    ? data.customGoalsInput.split(',').map((g: string) => g.trim()).filter((g: string) => g.length > 0)
    : [];
  
  // Combine selected chips and custom goals
  const totalGoals = Array.from(new Set([...data.selectedChipGoals, ...customGoals]));
  
  // Check maximum limit (backend requirement)
  return totalGoals.length <= MAX_GOALS;
}, (data) => {
  const customGoals = data.customGoalsInput
    ? data.customGoalsInput.split(',').map((g: string) => g.trim()).filter((g: string) => g.length > 0)
    : [];
  const totalGoals = Array.from(new Set([...data.selectedChipGoals, ...customGoals]));
  const excess = totalGoals.length - MAX_GOALS;
  return {
    message: `You have selected ${totalGoals.length} goals but the maximum is ${MAX_GOALS}. Please remove ${excess} goal${excess > 1 ? 's' : ''} to continue.`,
    path: ["goals"],
  };
});

type Stage3Data = z.infer<typeof stage3Schema>;

interface Stage3GoalsProps {
  onNext: (data: Omit<Stage3Data, 'selectedChipGoals' | 'customGoalsInput'>) => void;
  onBack?: () => void;
  initialData?: Partial<Omit<Stage3Data, 'selectedChipGoals' | 'customGoalsInput'>>;
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
  const { toast } = useToast();
  const [totalGoalsCount, setTotalGoalsCount] = useState(0);
  const [isAtMaxLimit, setIsAtMaxLimit] = useState(false);
  const [goalStatementLength, setGoalStatementLength] = useState(0);
  
  // Handle initial data - separate predefined goals from custom ones
  const initialChipGoals = initialData?.goals?.filter(g => 
    GOALS.some(goal => goal.value === g)
  ) || [];
  
  const initialCustomGoals = initialData?.goals?.filter(g => 
    !GOALS.some(goal => goal.value === g)
  ).join(", ") || "";
  
  const form = useForm<Stage3Data>({
    resolver: zodResolver(stage3Schema),
    defaultValues: {
      goalStatement: initialData?.goalStatement || "",
      selectedChipGoals: initialChipGoals,
      customGoalsInput: initialCustomGoals,
      goals: initialData?.goals || [],
      timelineUrgency: initialData?.timelineUrgency || undefined,
    },
  });

  const selectedChipGoals = form.watch("selectedChipGoals");
  const customGoalsInput = form.watch("customGoalsInput");
  const timelineUrgency = form.watch("timelineUrgency");
  const goalStatement = form.watch("goalStatement");

  // Update goal statement length
  useEffect(() => {
    setGoalStatementLength(goalStatement?.length || 0);
  }, [goalStatement]);

  // Update total goals count whenever selections change
  useEffect(() => {
    const customGoals = customGoalsInput
      ? customGoalsInput.split(',').map(g => g.trim()).filter(g => g.length > 0)
      : [];
    
    const totalGoals = Array.from(new Set([...selectedChipGoals, ...customGoals]));
    const count = totalGoals.length;
    
    setTotalGoalsCount(count);
    setIsAtMaxLimit(count >= MAX_GOALS);
    
    // Log current state for debugging
    console.log('[Stage3Goals] Current goal state:', {
      selectedChipGoals,
      customGoals,
      totalGoals,
      count,
      isAtMaxLimit: count >= MAX_GOALS
    });
    
    // Show warning when at limit
    if (count > MAX_GOALS) {
      const excess = count - MAX_GOALS;
      toast({
        title: "Too many goals selected",
        description: `You have ${count} goals but the maximum is ${MAX_GOALS}. Please remove ${excess} goal${excess > 1 ? 's' : ''} to continue.`,
        variant: "destructive",
      });
    }
  }, [selectedChipGoals, customGoalsInput, toast]);

  const handleGoalChange = (value: string[]) => {
    // Get current custom goals
    const customGoals = customGoalsInput
      ? customGoalsInput.split(',').map(g => g.trim()).filter(g => g.length > 0)
      : [];
    
    // Check if total would exceed limit
    const totalWithCustom = value.length + customGoals.length;
    
    console.log('[Stage3Goals] handleGoalChange:', {
      newChipGoals: value,
      customGoals,
      totalWithCustom,
      maxAllowed: MAX_GOALS
    });
    
    if (totalWithCustom > MAX_GOALS) {
      const canSelectMore = MAX_GOALS - customGoals.length;
      toast({
        title: "Cannot add more goals",
        description: `You already have ${customGoals.length} custom goal${customGoals.length !== 1 ? 's' : ''}. You can only select ${canSelectMore} more goal${canSelectMore !== 1 ? 's' : ''} from the suggestions (maximum ${MAX_GOALS} total).`,
        variant: "destructive",
      });
      return;
    }
    
    form.setValue("selectedChipGoals", value);
    form.clearErrors("goals");
  };

  const handleSubmit = (data: Stage3Data) => {
    try {
      // Parse custom goals
      const customGoals = data.customGoalsInput
        ? data.customGoalsInput.split(',').map(g => g.trim()).filter(g => g.length > 0)
        : [];
      
      // Combine selected chips and custom goals, remove duplicates
      const allGoals = Array.from(new Set([...data.selectedChipGoals, ...customGoals]));
      
      // Log submission data for debugging
      console.log('[Stage3Goals] Submitting data:', {
        goalStatement: data.goalStatement,
        selectedChipGoals: data.selectedChipGoals,
        customGoalsInput: data.customGoalsInput,
        customGoals,
        allGoals,
        allGoalsCount: allGoals.length,
        timelineUrgency: data.timelineUrgency,
        maxAllowed: MAX_GOALS
      });
      
      // Final validation check
      if (allGoals.length > MAX_GOALS) {
        const excess = allGoals.length - MAX_GOALS;
        console.error('[Stage3Goals] Validation error: Too many goals');
        toast({
          title: "Too many goals selected",
          description: `You have ${allGoals.length} goals but the maximum is ${MAX_GOALS}. Please remove ${excess} goal${excess > 1 ? 's' : ''} before continuing.`,
          variant: "destructive",
        });
        return;
      }
      
      if (allGoals.length === 0) {
        console.error('[Stage3Goals] Validation error: No goals selected');
        toast({
          title: "No goals selected",
          description: "You need at least 1 goal to continue. Please select a goal from the suggestions or type your own custom goal.",
          variant: "destructive",
        });
        return;
      }
      
      // Submit with the combined goals array
      const submissionData = {
        goalStatement: data.goalStatement,
        goals: allGoals, // Use 'goals' field name for backend compatibility
        timelineUrgency: data.timelineUrgency,
      };
      
      console.log('[Stage3Goals] Final submission data:', submissionData);
      onNext(submissionData);
      
    } catch (error) {
      console.error('[Stage3Goals] Submit error:', error);
      
      // Parse backend error if available
      let errorMessage = "Unable to save your goals. Please check your connection and try again.";
      
      if (error instanceof Error) {
        // Check for specific field errors
        if (error.message.includes('goalStatement')) {
          errorMessage = "There's an issue with your intent statement. Please ensure it's between 20-500 characters.";
        } else if (error.message.includes('goals')) {
          errorMessage = "There's an issue with your selected goals. Please ensure you have 1-3 goals selected.";
        } else if (error.message.includes('timeline')) {
          errorMessage = "Please select your timeline before continuing.";
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = "Connection error. Please check your internet and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Could not save your goals",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Get list of all goals for display
  const getAllGoals = () => {
    const customGoals = customGoalsInput
      ? customGoalsInput.split(',').map(g => g.trim()).filter(g => g.length > 0)
      : [];
    
    return Array.from(new Set([...selectedChipGoals, ...customGoals]));
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
              <FormDescription className="flex justify-between">
                <span>Be specific about what you're looking for (20-500 characters)</span>
                <span className={`text-sm font-medium ${
                  goalStatementLength < 20 ? 'text-orange-500' : 
                  goalStatementLength > 500 ? 'text-red-500' : 
                  'text-green-600'
                }`}>
                  {goalStatementLength}/500 characters
                </span>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Goal Selection - Now optional with custom input */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Your Goals *</FormLabel>
            <span className={`text-sm font-medium ${isAtMaxLimit ? 'text-red-500' : 'text-stak-copper'}`}>
              {totalGoalsCount}/{MAX_GOALS} {totalGoalsCount === 1 ? 'goal' : 'goals'} selected
              {isAtMaxLimit && ' (limit reached)'}
            </span>
          </div>
          
          <Alert className={isAtMaxLimit ? "border-red-500/30 bg-red-50" : "border-stak-copper/30 bg-stak-copper/5"}>
            {isAtMaxLimit ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <Info className="h-4 w-4 text-stak-copper" />
            )}
            <AlertDescription>
              {isAtMaxLimit ? (
                <span className="text-red-600">
                  Maximum reached: You have {totalGoalsCount} goals selected. To add different goals, please remove existing ones first.
                </span>
              ) : (
                <span>
                  Select from suggestions below or type your own custom goals. 
                  <strong>You need 1-{MAX_GOALS} goals total</strong> to continue.
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Chip Selection - Now optional */}
          <FormField
            control={form.control}
            name="selectedChipGoals"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-600">Suggested Goals (select up to 3)</FormLabel>
                <FormControl>
                  <ToggleGroup
                    type="multiple"
                    value={field.value}
                    onValueChange={handleGoalChange}
                    className="flex flex-wrap gap-2 justify-start"
                  >
                    {GOALS.map((goal) => {
                      // Check if this chip can be selected
                      const customGoals = customGoalsInput
                        ? customGoalsInput.split(',').map(g => g.trim()).filter(g => g.length > 0)
                        : [];
                      const isSelected = field.value.includes(goal.value);
                      const wouldExceedLimit = !isSelected && (field.value.length + customGoals.length >= MAX_GOALS);
                      
                      return (
                        <ToggleGroupItem
                          key={goal.value}
                          value={goal.value}
                          disabled={wouldExceedLimit}
                          className="data-[state=on]:bg-stak-copper data-[state=on]:text-white border-stak-copper/30 hover:bg-stak-copper/10 disabled:opacity-50 disabled:cursor-not-allowed"
                          data-testid={`chip-goal-${goal.value}`}
                          title={wouldExceedLimit ? `Cannot select: Maximum ${MAX_GOALS} goals allowed` : undefined}
                        >
                          <span className="mr-1">{goal.icon}</span>
                          {goal.label}
                        </ToggleGroupItem>
                      );
                    })}
                  </ToggleGroup>
                </FormControl>
              </FormItem>
            )}
          />

          {/* Custom Goals Input - New field */}
          <FormField
            control={form.control}
            name="customGoalsInput"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm text-gray-600">Custom Goals (optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Enter your own goals, separated by commas (e.g., Find strategic partners, Build community, Launch in new markets)"
                    className="w-full"
                    disabled={selectedChipGoals.length >= MAX_GOALS}
                    data-testid="input-custom-goals"
                    onChange={(e) => {
                      field.onChange(e);
                      // Validate on change
                      const newCustomGoals = e.target.value
                        ? e.target.value.split(',').map(g => g.trim()).filter(g => g.length > 0)
                        : [];
                      const totalWithChips = selectedChipGoals.length + newCustomGoals.length;
                      if (totalWithChips > MAX_GOALS) {
                        const excess = totalWithChips - MAX_GOALS;
                        form.setError("goals", {
                          type: "manual",
                          message: `You have ${totalWithChips} goals (${selectedChipGoals.length} selected + ${newCustomGoals.length} custom) but the maximum is ${MAX_GOALS}. Please remove ${excess} goal${excess > 1 ? 's' : ''}.`
                        });
                      } else {
                        form.clearErrors("goals");
                      }
                    }}
                  />
                </FormControl>
                <FormDescription>
                  {selectedChipGoals.length >= MAX_GOALS ? (
                    <span className="text-red-500">
                      Cannot add custom goals: You already have {MAX_GOALS} goals selected. Remove some selections to add custom goals.
                    </span>
                  ) : (
                    <span>
                      Enter specific goals not listed above, separated by commas. 
                      {selectedChipGoals.length > 0 && (
                        <strong className="text-stak-copper"> You can add {MAX_GOALS - selectedChipGoals.length} more goal{MAX_GOALS - selectedChipGoals.length !== 1 ? 's' : ''}</strong>
                      )}
                    </span>
                  )}
                </FormDescription>
              </FormItem>
            )}
          />

          {/* Combined goals validation error */}
          <FormField
            control={form.control}
            name="goals"
            render={() => (
              <FormItem>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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

        {/* Selected Summary - Shows all goals including custom ones */}
        {(getAllGoals().length > 0 || timelineUrgency) && (
          <Card className={getAllGoals().length > MAX_GOALS ? "border-red-500/30 bg-red-50" : "border-stak-copper/30 bg-stak-copper/5"}>
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-stak-black mb-3">Your Selection Summary</h3>
              
              {getAllGoals().length > 0 && (
                <div className="mb-3">
                  <span className={`text-xs font-medium ${getAllGoals().length > MAX_GOALS ? 'text-red-600' : 'text-gray-600'}`}>
                    Goals ({getAllGoals().length}/{MAX_GOALS}):
                    {getAllGoals().length > MAX_GOALS && ' ⚠️ EXCEEDS LIMIT'}
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {getAllGoals().map((goalValue, index) => {
                      const predefinedGoal = GOALS.find(g => g.value === goalValue);
                      const isCustom = !predefinedGoal;
                      
                      return (
                        <span
                          key={`${goalValue}-${index}`}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                            getAllGoals().length > MAX_GOALS
                              ? 'bg-red-500 text-white'
                              : isCustom 
                                ? 'bg-purple-500 text-white' 
                                : 'bg-stak-copper text-white'
                          }`}
                        >
                          {!isCustom && <span>{predefinedGoal.icon}</span>}
                          {isCustom ? goalValue : predefinedGoal.label}
                          {isCustom && <span className="text-xs ml-1">(custom)</span>}
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
            disabled={getAllGoals().length > MAX_GOALS || getAllGoals().length === 0}
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