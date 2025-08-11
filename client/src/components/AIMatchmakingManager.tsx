import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Brain, Users, Clock, Target, Mail, Play, CheckCircle, AlertCircle, Calendar } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Event {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  registrationCount: number;
}

interface MatchmakingRun {
  id: string;
  eventId: string;
  runType: string;
  status: string;
  totalAttendees: number;
  matchesGenerated: number;
  avgMatchScore: string;
  executionTimeMs: number;
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

interface PreEventMatch {
  id: string;
  user1Id: string;
  user2Id: string;
  matchScore: string;
  recommendedMeetingType: string;
  suggestedTopics: string[];
  priorityLevel: string;
  matchReasoning: string;
  compatibilityFactors: any;
}

interface AIMatchmakingManagerProps {
  eventId: string;
  event: Event;
}

export function AIMatchmakingManager({ eventId, event }: AIMatchmakingManagerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isSchedulingNotifications, setIsSchedulingNotifications] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch matchmaking status
  const { data: matchmakingStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'matchmaking/status'],
    queryFn: () => apiRequest('GET', `/api/events/${eventId}/matchmaking/status`).then(res => res.json()),
  });

  // Fetch pre-event matches
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'pre-matches'],
    queryFn: () => apiRequest('GET', `/api/events/${eventId}/pre-matches`).then(res => res.json()),
  });

  // Fetch users without goals
  const { data: usersWithoutGoals, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'users-without-goals'],
    queryFn: () => apiRequest('GET', `/api/events/${eventId}/users-without-goals`).then(res => res.json()),
  });

  // Run AI matchmaking mutation
  const runMatchmakingMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/events/${eventId}/matchmaking/run`).then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: "AI Matchmaking Complete",
        description: `Generated ${data.matchesGenerated} matches with average score of ${data.avgScore.toFixed(1)}%`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
      setIsRunning(false);
    },
    onError: (error: any) => {
      toast({
        title: "Matchmaking Failed",
        description: error.message || "Failed to run AI matchmaking",
        variant: "destructive",
      });
      setIsRunning(false);
    },
  });

  // Schedule notifications mutation
  const scheduleNotificationsMutation = useMutation({
    mutationFn: () => apiRequest('POST', `/api/events/${eventId}/notifications/schedule`).then(res => res.json()),
    onSuccess: (data) => {
      toast({
        title: "Notifications Scheduled",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId] });
      setIsSchedulingNotifications(false);
    },
    onError: (error: any) => {
      toast({
        title: "Scheduling Failed",
        description: error.message || "Failed to schedule notifications",
        variant: "destructive",
      });
      setIsSchedulingNotifications(false);
    },
  });

  const handleRunMatchmaking = () => {
    setIsRunning(true);
    runMatchmakingMutation.mutate();
  };

  const handleScheduleNotifications = () => {
    setIsSchedulingNotifications(true);
    scheduleNotificationsMutation.mutate();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-yellow-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">AI Matchmaking Manager</h2>
          <p className="text-gray-600">Manage AI-powered pre-event networking for {event.title}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-500">Event Date</p>
            <p className="font-medium">{formatDate(event.startDate)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Registered</p>
            <p className="font-medium">{event.registrationCount} attendees</p>
          </div>
        </div>
      </div>

      {/* Matchmaking Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Matchmaking Status
          </CardTitle>
          <CardDescription>
            Latest AI matchmaking run results and performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-purple-600 border-t-transparent rounded-full" />
            </div>
          ) : matchmakingStatus ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className={`${getStatusColor(matchmakingStatus.status)} text-white`}>
                    {matchmakingStatus.status.toUpperCase()}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    Started {formatDate(matchmakingStatus.startedAt)}
                  </span>
                </div>
                <Button
                  onClick={handleRunMatchmaking}
                  disabled={isRunning || matchmakingStatus.status === 'running'}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isRunning ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                      Running...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run New Matchmaking
                    </>
                  )}
                </Button>
              </div>

              {matchmakingStatus.status === 'completed' && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900">Attendees</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">{matchmakingStatus.totalAttendees}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-900">Matches</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600">{matchmakingStatus.matchesGenerated}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-purple-600" />
                      <span className="text-sm font-medium text-purple-900">Avg Score</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-600">{Math.round(parseFloat(matchmakingStatus.avgMatchScore || '0'))}%</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-900">Runtime</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">{(matchmakingStatus.executionTimeMs / 1000).toFixed(1)}s</p>
                  </div>
                </div>
              )}

              {matchmakingStatus.status === 'failed' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-900">Error:</span>
                  </div>
                  <p className="text-red-700 mt-1">{matchmakingStatus.errorMessage}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Matchmaking Runs Yet</h3>
              <p className="text-gray-500 mb-4">Run AI matchmaking to generate personalized matches for attendees</p>
              <Button
                onClick={handleRunMatchmaking}
                disabled={isRunning}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isRunning ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run First Matchmaking
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Goal Reminder Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            Goal Reminder Notifications
          </CardTitle>
          <CardDescription>
            Send automated reminders to attendees who haven't set their networking goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">
                    {usersWithoutGoals?.length || 0} attendees without goals
                  </p>
                  <p className="text-sm text-gray-500">
                    Reminders will be sent 1 day and 1 hour before the event
                  </p>
                </div>
                <Button
                  onClick={handleScheduleNotifications}
                  disabled={isSchedulingNotifications || !usersWithoutGoals?.length}
                  variant="outline"
                  className="border-blue-600 text-blue-600 hover:bg-blue-50"
                >
                  {isSchedulingNotifications ? (
                    <>
                      <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2" />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Reminders
                    </>
                  )}
                </Button>
              </div>

              {usersWithoutGoals?.length === 0 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">All Set!</span>
                  </div>
                  <p className="text-green-700 mt-1">All registered attendees have set their networking goals.</p>
                </div>
              )}

              {usersWithoutGoals && usersWithoutGoals.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <span className="font-medium text-amber-900">Action Needed</span>
                  </div>
                  <p className="text-amber-700 mt-1">
                    {usersWithoutGoals.length} attendees haven't set their goals yet. Schedule reminders to improve matchmaking quality.
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Matches Preview */}
      {matches && matches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Generated Matches ({matches.length})
            </CardTitle>
            <CardDescription>
              Preview of AI-generated pre-event matches for attendees
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {matches.slice(0, 10).map((match: PreEventMatch) => (
                <div key={match.id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Badge className={getPriorityColor(match.priorityLevel)}>
                        {match.priorityLevel.toUpperCase()}
                      </Badge>
                      <span className="font-medium text-gray-900">
                        {parseInt(match.matchScore)}% Match Score
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {match.recommendedMeetingType.replace('_', ' ')}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-700 mb-2">{match.matchReasoning}</p>
                  
                  {match.suggestedTopics && match.suggestedTopics.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {match.suggestedTopics.slice(0, 3).map((topic, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              
              {matches.length > 10 && (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">
                    Showing 10 of {matches.length} matches. All matches will be available to attendees in their event dashboard.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}