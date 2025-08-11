import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Zap, 
  Users, 
  Target, 
  Calendar, 
  MessageSquare, 
  TrendingUp, 
  Award,
  Info,
  Settings,
  Brain
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EventMatchmakingDashboardProps {
  eventId: string;
  eventTitle: string;
}

interface EventMatch {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  title?: string;
  company?: string;
  matchScore: number;
  commonInterests: string[];
  networkingGoals: string[];
  isConnected?: boolean;
}

interface EventGoal {
  id: string;
  goal: string;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
}

export function EventMatchmakingDashboard({ eventId, eventTitle }: EventMatchmakingDashboardProps) {
  const [selectedTab, setSelectedTab] = useState("overview");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch event matches
  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'matches'],
  });

  // Fetch user's event goals
  const { data: goals = [], isLoading: goalsLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'goals'],
  });

  // Connection mutation
  const connectMutation = useMutation({
    mutationFn: async (targetUserId: string) => {
      return await apiRequest("POST", "/api/connections", { targetUserId });
    },
    onSuccess: () => {
      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'matches'] });
    },
    onError: (error: any) => {
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to send connection request",
        variant: "destructive",
      });
    },
  });

  const handleConnect = (userId: string) => {
    connectMutation.mutate(userId);
  };

  const completedGoals = Array.isArray(goals) ? goals.filter((goal: any) => goal.completed).length : 0;
  const matchesWithHighScore = Array.isArray(matches) ? matches.filter((match: any) => match.matchScore >= 75).length : 0;
  const connectionRate = Array.isArray(matches) && matches.length > 0 ? (matches.filter((m: any) => m.isConnected).length / matches.length) * 100 : 0;

  if (matchesLoading || goalsLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 text-stak-copper" />
          <h2 className="text-2xl font-bold text-black">AI Matchmaking Dashboard</h2>
        </div>
        <p className="text-gray-600">
          Your personalized networking insights for <span className="font-medium">{eventTitle}</span>
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-stak-copper/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Matches</CardTitle>
            <Zap className="h-4 w-4 text-stak-copper" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(matches) ? matches.length : 0}</div>
            <p className="text-xs text-gray-600">
              {matchesWithHighScore} high-score matches
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Goals Progress</CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedGoals}/{Array.isArray(goals) ? goals.length : 0}</div>
            <Progress 
              value={Array.isArray(goals) && goals.length > 0 ? (completedGoals / goals.length) * 100 : 0} 
              className="mt-2 h-2"
            />
          </CardContent>
        </Card>

        <Card className="border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(connectionRate)}%</div>
            <p className="text-xs text-gray-600">
              Success rate
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Networking Score</CardTitle>
            <Award className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(matches) && matches.length > 0 ? Math.round(matches.reduce((sum: any, m: any) => sum + m.matchScore, 0) / matches.length) : 0}
            </div>
            <p className="text-xs text-gray-600">
              Average match quality
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matches">AI Matches</TabsTrigger>
          <TabsTrigger value="goals">My Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-stak-copper" />
                  Event Readiness
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Profile Optimization</span>
                    <span className="text-stak-copper">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Networking Goals Set</span>
                    <span className="text-green-600">{Array.isArray(goals) && goals.length > 0 ? "Complete" : "Pending"}</span>
                  </div>
                  <Progress value={Array.isArray(goals) && goals.length > 0 ? 100 : 0} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>AI Matching Active</span>
                    <span className="text-green-600">Active</span>
                  </div>
                  <Progress value={100} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Pre-Event Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Review AI Matches</span>
                  <Badge className="bg-green-600 text-white">Ready</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">Send Connection Requests</span>
                  <Badge variant="outline">Optional</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium">Prepare Conversation Starters</span>
                  <Badge variant="outline">Recommended</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Your AI-powered match suggestions are continuously updated based on other attendees' profiles and goals. 
              Check back regularly for new connections!
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          {!Array.isArray(matches) || matches.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Matches Yet</h3>
                <p className="text-gray-600 mb-4">
                  AI matching is processing attendee profiles. Check back soon for personalized recommendations!
                </p>
                <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'matches'] })}>
                  Refresh Matches
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(matches as any[])?.slice(0, 6).map((match: any) => (
                <Card key={match.id} className="group hover:shadow-lg transition-shadow">
                  <CardHeader className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={match.profileImageUrl} alt={`${match.firstName} ${match.lastName}`} />
                        <AvatarFallback>
                          {match.firstName.charAt(0)}{match.lastName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-black truncate">
                          {match.firstName} {match.lastName}
                        </h3>
                        {match.title && (
                          <p className="text-sm text-gray-600 truncate">{match.title}</p>
                        )}
                        {match.company && (
                          <p className="text-xs text-gray-500 truncate">{match.company}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-stak-copper border-stak-copper">
                        {match.matchScore}% Match
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    {match.commonInterests.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-gray-700 mb-1">Common Interests</p>
                        <div className="flex flex-wrap gap-1">
                          {match.commonInterests?.slice(0, 3).map((interest: any, index: any) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {interest}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      {match.isConnected ? (
                        <Button variant="outline" size="sm" className="flex-1" disabled>
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Connected
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          className="flex-1 bg-stak-copper hover:bg-stak-copper/80 text-black"
                          onClick={() => handleConnect(match.userId)}
                          disabled={connectMutation.isPending}
                        >
                          <Users className="h-4 w-4 mr-2" />
                          Connect
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          {!Array.isArray(goals) || goals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Goals Set</h3>
                <p className="text-gray-600 mb-4">
                  Set networking goals to enhance your AI matching and make the most of this event.
                </p>
                <Button className="bg-stak-copper hover:bg-stak-copper/80 text-black">
                  <Target className="h-4 w-4 mr-2" />
                  Set Your Goals
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {(goals as any[])?.map((goal: any) => (
                <Card key={goal.id} className={`border-l-4 ${
                  goal.priority === 'high' ? 'border-l-red-500' :
                  goal.priority === 'medium' ? 'border-l-yellow-500' :
                  'border-l-green-500'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className={`font-medium ${goal.completed ? 'line-through text-gray-500' : 'text-black'}`}>
                          {goal.goal}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {goal.priority} priority
                          </Badge>
                          {goal.completed && (
                            <Badge className="bg-green-600 text-white text-xs">
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}