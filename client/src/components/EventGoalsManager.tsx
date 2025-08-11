import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Plus, Target, Users, Lightbulb, Handshake, GraduationCap, Briefcase, DollarSign, Check, X, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { EventAttendeeGoal, InsertEventAttendeeGoal } from "@shared/schema";

interface EventGoalsManagerProps {
  eventId: string;
  onGoalsUpdate?: () => void;
}

const goalTypeIcons = {
  networking: Users,
  learning: GraduationCap,
  partnership: Handshake,
  investment: DollarSign,
  hiring: Briefcase,
  selling: Target,
};

const goalTypeLabels = {
  networking: "Networking",
  learning: "Learning",
  partnership: "Partnership",
  investment: "Investment",
  hiring: "Hiring",
  selling: "Selling",
};

const priorityColors = {
  high: "bg-red-100 text-red-800 border-red-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  low: "bg-green-100 text-green-800 border-green-200",
};

export function EventGoalsManager({ eventId, onGoalsUpdate }: EventGoalsManagerProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing goals
  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'goals'],
    queryFn: () => apiRequest('GET', `/api/events/${eventId}/goals`).then(res => res.json()),
  });

  // Fetch AI suggestions
  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useQuery({
    queryKey: ['/api/events', eventId, 'goals', 'suggestions'],
    queryFn: () => apiRequest('POST', `/api/events/${eventId}/goals/suggestions`).then(res => res.json()),
    enabled: false, // Only fetch when requested
  });

  // Create goal mutation
  const createGoalMutation = useMutation({
    mutationFn: (goalData: InsertEventAttendeeGoal) =>
      apiRequest('POST', `/api/events/${eventId}/goals`, goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'goals'] });
      toast({ title: "Goal created successfully!" });
      onGoalsUpdate?.();
    },
    onError: () => {
      toast({ title: "Failed to create goal", variant: "destructive" });
    },
  });

  // Update goal mutation
  const updateGoalMutation = useMutation({
    mutationFn: ({ goalId, updates }: { goalId: string; updates: Partial<EventAttendeeGoal> }) =>
      apiRequest('PUT', `/api/events/${eventId}/goals/${goalId}`, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'goals'] });
      toast({ title: "Goal updated successfully!" });
      onGoalsUpdate?.();
    },
    onError: () => {
      toast({ title: "Failed to update goal", variant: "destructive" });
    },
  });

  // Delete goal mutation
  const deleteGoalMutation = useMutation({
    mutationFn: (goalId: string) =>
      apiRequest('DELETE', `/api/events/${eventId}/goals/${goalId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'goals'] });
      toast({ title: "Goal deleted successfully!" });
      onGoalsUpdate?.();
    },
    onError: () => {
      toast({ title: "Failed to delete goal", variant: "destructive" });
    },
  });

  const handleAcceptSuggestion = (suggestion: InsertEventAttendeeGoal) => {
    createGoalMutation.mutate({
      ...suggestion,
      userAccepted: true,
    });
  };

  const handleDeclineSuggestion = (index: number) => {
    // Remove suggestion from local state
    const newSuggestions = suggestions.filter((_: any, i: number) => i !== index);
    queryClient.setQueryData(['/api/events', eventId, 'goals', 'suggestions'], newSuggestions);
  };

  const loadSuggestions = () => {
    queryClient.refetchQueries({ queryKey: ['/api/events', eventId, 'goals', 'suggestions'] });
    setShowSuggestions(true);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Target className="w-6 h-6 text-stak-copper" />
            Your Event Goals & Missions
          </h2>
          <p className="text-gray-600 mt-1">
            Set your networking objectives to enhance AI matching during the event
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={loadSuggestions}
            variant="outline"
            className="border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-white"
            disabled={isLoadingSuggestions}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            {isLoadingSuggestions ? "Loading..." : "Get AI Suggestions"}
          </Button>
          <Dialog open={showCreateGoal} onOpenChange={setShowCreateGoal}>
            <DialogTrigger asChild>
              <Button className="bg-stak-copper hover:bg-stak-copper/90">
                <Plus className="w-4 h-4 mr-2" />
                Add Custom Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Custom Goal</DialogTitle>
                <DialogDescription>
                  Define a specific networking objective for this event
                </DialogDescription>
              </DialogHeader>
              <CreateGoalForm
                onSubmit={(goalData) => {
                  createGoalMutation.mutate(goalData);
                  setShowCreateGoal(false);
                }}
                onCancel={() => setShowCreateGoal(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* AI Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              AI-Suggested Goals
            </CardTitle>
            <CardDescription>
              Based on your profile and the event details, here are some recommended goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {suggestions.map((suggestion: InsertEventAttendeeGoal, index: number) => {
                const IconComponent = goalTypeIcons[suggestion.goalType as keyof typeof goalTypeIcons];
                return (
                  <div key={index} className="bg-white p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <IconComponent className="w-4 h-4 text-stak-copper" />
                          <span className="font-medium text-gray-900">
                            {goalTypeLabels[suggestion.goalType as keyof typeof goalTypeLabels]}
                          </span>
                          <Badge variant="outline" className={priorityColors[suggestion.priority as keyof typeof priorityColors]}>
                            {suggestion.priority}
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-3">{suggestion.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {suggestion.specificInterests?.map((interest, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => handleAcceptSuggestion(suggestion)}
                          className="bg-green-600 hover:bg-green-700"
                          disabled={createGoalMutation.isPending}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDeclineSuggestion(index)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Goals */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Your Current Goals</h3>
        {goals.length === 0 ? (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="py-8 text-center">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500 text-lg">No goals set yet</p>
              <p className="text-gray-400 text-sm mt-1">
                Add goals to help the AI suggest better matches during the event
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {goals.map((goal: EventAttendeeGoal) => {
              const IconComponent = goalTypeIcons[goal.goalType as keyof typeof goalTypeIcons];
              return (
                <Card key={goal.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <IconComponent className="w-4 h-4 text-stak-copper" />
                          <span className="font-medium text-gray-900">
                            {goalTypeLabels[goal.goalType as keyof typeof goalTypeLabels]}
                          </span>
                          <Badge variant="outline" className={priorityColors[goal.priority as keyof typeof priorityColors]}>
                            {goal.priority}
                          </Badge>
                          {goal.aiSuggested && goal.userAccepted && (
                            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              AI Suggested
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-700 mb-3">{goal.description}</p>
                        {goal.specificInterests && goal.specificInterests.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {goal.specificInterests.map((interest, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {interest}
                              </Badge>
                            ))}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 space-y-1">
                          {goal.targetAudience && (
                            <div>Target: {goal.targetAudience}</div>
                          )}
                          {goal.targetCompanySize && (
                            <div>Company Size: {goal.targetCompanySize}</div>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteGoalMutation.mutate(goal.id)}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        disabled={deleteGoalMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

interface CreateGoalFormProps {
  onSubmit: (goalData: InsertEventAttendeeGoal) => void;
  onCancel: () => void;
}

function CreateGoalForm({ onSubmit, onCancel }: CreateGoalFormProps) {
  const [formData, setFormData] = useState({
    goalType: "networking" as const,
    priority: "medium" as const,
    description: "",
    specificInterests: "",
    targetAudience: "",
    targetCompanySize: "",
    targetIndustries: "",
    targetRoles: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const goalData: InsertEventAttendeeGoal = {
      goalType: formData.goalType,
      priority: formData.priority,
      description: formData.description,
      specificInterests: formData.specificInterests ? formData.specificInterests.split(',').map(s => s.trim()) : [],
      targetAudience: formData.targetAudience || undefined,
      targetCompanySize: formData.targetCompanySize || undefined,
      targetIndustries: formData.targetIndustries ? formData.targetIndustries.split(',').map(s => s.trim()) : [],
      targetRoles: formData.targetRoles ? formData.targetRoles.split(',').map(s => s.trim()) : [],
      aiSuggested: false,
      userAccepted: true,
    };

    onSubmit(goalData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="goalType">Goal Type</Label>
          <Select value={formData.goalType} onValueChange={(value) => setFormData(prev => ({ ...prev, goalType: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(goalTypeLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Priority</Label>
          <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value as any }))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Goal Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          placeholder="Describe your networking objective for this event..."
          className="min-h-[80px]"
          required
        />
      </div>

      <div>
        <Label htmlFor="specificInterests">Specific Interests (comma-separated)</Label>
        <Input
          id="specificInterests"
          value={formData.specificInterests}
          onChange={(e) => setFormData(prev => ({ ...prev, specificInterests: e.target.value }))}
          placeholder="AI, Machine Learning, Startup Funding, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Select value={formData.targetAudience} onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select audience" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="founders">Founders</SelectItem>
              <SelectItem value="investors">Investors</SelectItem>
              <SelectItem value="enterprise">Enterprise</SelectItem>
              <SelectItem value="startups">Startups</SelectItem>
              <SelectItem value="professionals">Professionals</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="targetCompanySize">Target Company Size</Label>
          <Select value={formData.targetCompanySize} onValueChange={(value) => setFormData(prev => ({ ...prev, targetCompanySize: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="startup">Startup (1-50)</SelectItem>
              <SelectItem value="scale-up">Scale-up (51-200)</SelectItem>
              <SelectItem value="enterprise">Enterprise (200+)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="targetIndustries">Target Industries (comma-separated)</Label>
        <Input
          id="targetIndustries"
          value={formData.targetIndustries}
          onChange={(e) => setFormData(prev => ({ ...prev, targetIndustries: e.target.value }))}
          placeholder="Technology, Healthcare, Finance, etc."
        />
      </div>

      <div>
        <Label htmlFor="targetRoles">Target Roles (comma-separated)</Label>
        <Input
          id="targetRoles"
          value={formData.targetRoles}
          onChange={(e) => setFormData(prev => ({ ...prev, targetRoles: e.target.value }))}
          placeholder="CEO, CTO, VP Engineering, etc."
        />
      </div>

      <Separator />

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-stak-copper hover:bg-stak-copper/90">
          Create Goal
        </Button>
      </div>
    </form>
  );
}