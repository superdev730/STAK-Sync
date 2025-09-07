import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Mic, Target, Users, Calendar, Trophy, Clock, Star, CheckCircle, 
  AlertTriangle, MessageSquare, TrendingUp, ArrowRight, Settings,
  Network, Coffee, Handshake, Eye, UserPlus, Send, Award, Zap
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SpeakerMessageModal } from '@/components/SpeakerMessageModal';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface EventData {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  description: string;
  isVirtual: boolean;
  attendeeCount: number;
}

interface EventPrepStats {
  speakerMessages: number;
  hasNetworkingGoal: boolean;
  incomingConnectionRequests: number;
  highQualityMatches: number;
  mediumQualityMatches: number;
  networkingGoal?: any;
}

interface ConnectionRequest {
  id: string;
  fromUserId: string;
  message: string;
  matchScore: number;
  aiRecommendationReason: string;
  status: string;
  createdAt: string;
  fromUser: {
    id: string;
    firstName: string;
    lastName: string;
    profileImageUrl?: string;
  };
}

interface ConnectionRequestsData {
  incoming: ConnectionRequest[];
  outgoing: ConnectionRequest[];
  incomingCount: number;
  outgoingCount: number;
}

export default function EventPreparation() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [speakerModalOpen, setSpeakerModalOpen] = useState(false);
  const [showNetworkingGoalForm, setShowNetworkingGoalForm] = useState(false);
  const [networkingGoalData, setNetworkingGoalData] = useState({
    primaryGoal: '',
    specificObjectives: [] as string[],
    targetCompanyTypes: [] as string[],
    targetRoles: [] as string[],
    targetIndustries: [] as string[],
    communicationStyle: 'balanced',
    meetingPreference: 'mixed',
    aiModerationInstructions: ''
  });

  // New inline functionality state
  const [speakerMessage, setSpeakerMessage] = useState('');
  const [networkingGoalText, setNetworkingGoalText] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasSentSpeakerMessage, setHasSentSpeakerMessage] = useState(false);
  const [hasSetNetworkingGoal, setHasSetNetworkingGoal] = useState(false);

  // Sample speakers for the event
  const eventSpeakers = [
    {
      name: "Dr. Sarah Chen",
      title: "VP of AI Research",
      sessionTitle: "AI in Healthcare: Future Innovations"
    },
    {
      name: "Michael Rodriguez", 
      title: "Serial Entrepreneur",
      sessionTitle: "Building Scalable Startup Teams"
    },
    {
      name: "Lisa Wang",
      title: "Partner at Sequoia Capital", 
      sessionTitle: "VC Trends for 2025"
    }
  ];

  // Get event data
  const { data: eventData, isLoading: eventLoading } = useQuery<EventData>({
    queryKey: [`/api/events/${eventId}`],
    enabled: !!eventId,
  });

  // Get event preparation stats
  const { data: prepStats, isLoading: statsLoading } = useQuery<EventPrepStats>({
    queryKey: [`/api/events/${eventId}/prep-stats`],
    enabled: !!eventId,
  });

  // Get connection requests
  const { data: connectionRequests, isLoading: requestsLoading } = useQuery<ConnectionRequestsData>({
    queryKey: [`/api/events/${eventId}/connection-requests`],
    enabled: !!eventId,
  });

  // Get networking goal
  const { data: existingGoal } = useQuery({
    queryKey: [`/api/events/${eventId}/networking-goal`],
    enabled: !!eventId,
  });

  // Create networking goal mutation
  const createGoalMutation = useMutation({
    mutationFn: async (goalData: any) => {
      return apiRequest(`/api/events/${eventId}/networking-goal`, 'POST', goalData);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Your networking goal has been set (+10 Sync Points)",
      });
      setShowNetworkingGoalForm(false);
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/prep-stats`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/networking-goal`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: "Failed to set networking goal. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Respond to connection request mutation
  const respondToRequestMutation = useMutation({
    mutationFn: async ({ requestId, status, responseMessage }: { requestId: string; status: string; responseMessage?: string }) => {
      return apiRequest(`/api/connection-requests/${requestId}/respond`, 'POST', { status, responseMessage });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success!",
        description: `Connection request ${data.status}. (+${data.syncPointsAwarded} Sync Points)`,
      });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/connection-requests`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/prep-stats`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to respond to connection request.",
        variant: "destructive",
      });
    }
  });

  // Send speaker message mutation
  const sendSpeakerMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      return apiRequest(`/api/events/${eventId}/speaker-messages`, 'POST', messageData);
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Message sent to speaker! (+5 Sync Points)",
      });
      setSpeakerMessage('');
      setHasSentSpeakerMessage(true);
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/prep-stats`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message to speaker.",
        variant: "destructive",
      });
    }
  });

  // Send networking goal mutation  
  const sendNetworkingGoalMutation = useMutation({
    mutationFn: async (goalText: string) => {
      return apiRequest(`/api/events/${eventId}/networking-goal`, 'POST', {
        primaryGoal: 'ai_analyzed',
        aiModerationInstructions: goalText,
        communicationStyle: 'balanced'
      });
    },
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Networking goal analyzed and set! (+10 Sync Points)",
      });
      setNetworkingGoalText('');
      setHasSetNetworkingGoal(true);
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/prep-stats`] });
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/networking-goal`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze networking goal.",
        variant: "destructive",
      });
    }
  });

  // Calculate overall preparation score
  const calculatePrepScore = () => {
    if (!prepStats) return 0;
    
    let score = 0;
    
    // Speaker engagement (20 points max)
    score += Math.min(prepStats.speakerMessages * 5, 20);
    
    // Networking goal (15 points)
    if (prepStats.hasNetworkingGoal) score += 15;
    
    // Connection management (25 points max)
    score += Math.min(prepStats.incomingConnectionRequests * 5, 25);
    
    // High-quality matches review (20 points)
    if (prepStats.highQualityMatches > 0) score += 20;
    
    // Pre-event meetings scheduled (20 points)
    // This would be tracked separately - for now simulate
    
    return Math.min(score, 100);
  };

  const prepScore = calculatePrepScore();

  if (eventLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#CD853F] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
            <p className="text-gray-600">This event could not be found or may not be available.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Event Header and Sync Score */}
        <div className="mb-8 space-y-4">
          {/* Event Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {eventData?.title || 'Loading Event...'}
            </h1>
            <h2 className="text-lg text-gray-600 flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5 text-[#CD853F]" />
              Event Preparation
            </h2>
            <div className="flex items-center justify-center gap-6 mt-3 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {eventData?.startDate ? new Date(eventData.startDate).toLocaleDateString() : 'TBD'}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {eventData?.attendeeCount || 0} attendees
              </span>
            </div>
          </div>

          {/* Event Sync Score Bar */}
          <Card className="max-w-md mx-auto">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 mb-1">Event Sync Score</div>
                  <div className={`text-xl font-bold ${
                    prepScore >= 80 ? 'text-green-600' :
                    prepScore >= 60 ? 'text-yellow-600' :
                    prepScore >= 40 ? 'text-orange-600' :
                    'text-red-600'
                  }`}>
                    {prepScore}%
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-24">
                    <Progress 
                      value={prepScore} 
                      className={`h-3 ${
                        prepScore >= 80 ? '[&>div]:bg-green-600' :
                        prepScore >= 60 ? '[&>div]:bg-yellow-600' :
                        prepScore >= 40 ? '[&>div]:bg-orange-600' :
                        '[&>div]:bg-red-600'
                      }`}
                    />
                  </div>
                  <Trophy className={`h-5 w-5 ${
                    prepScore >= 80 ? 'text-green-600' :
                    prepScore >= 60 ? 'text-yellow-600' :
                    prepScore >= 40 ? 'text-orange-600' :
                    'text-red-600'
                  }`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Priority Actions Grid */}
        <div className="space-y-6">
          
          {/* Priority 1: Speak to the Speaker */}
          <Card className="border-l-4 border-l-[#CD853F]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#CD853F] text-white flex items-center justify-center font-bold text-sm">1</div>
                  <Mic className="h-5 w-5 text-[#CD853F]" />
                  Speak to the Speaker
                </div>
                <Badge className="bg-[#CD853F]/10 text-[#CD853F] border border-[#CD853F]/30">
                  +5 pts first message
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Send voice notes, text messages, or questions to speakers. Our AI compiles all messages and delivers a summary to help speakers tailor their content.
              </p>
              
              {hasSentSpeakerMessage || (prepStats?.speakerMessages && prepStats.speakerMessages > 0) ? (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                  <CheckCircle className="w-5 h-5" />
                  <div>
                    <span className="text-sm font-medium">Great! Your messages are helping shape the content.</span>
                    <div className="text-xs text-green-600 mt-1">You can send additional messages anytime</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="What would you like to ask or tell the speaker? (e.g., questions about their topic, suggestions for content focus, expectations...)"
                      value={speakerMessage}
                      onChange={(e) => setSpeakerMessage(e.target.value)}
                      className="flex-1 min-h-[80px]"
                      data-testid="input-speaker-message"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="px-3 text-[#CD853F] border-[#CD853F] hover:bg-[#CD853F]/10"
                      onClick={() => {
                        if (!isRecording) {
                          setIsRecording(true);
                          // Voice recording would be implemented here
                          toast({
                            title: "Voice Recording",
                            description: "Voice recording feature coming soon. Please use text for now.",
                          });
                          setIsRecording(false);
                        }
                      }}
                      data-testid="button-voice-record"
                    >
                      <Mic className={`w-4 h-4 ${isRecording ? 'animate-pulse text-red-500' : ''}`} />
                    </Button>
                  </div>
                  <Button
                    onClick={() => {
                      if (speakerMessage.trim()) {
                        sendSpeakerMessageMutation.mutate({
                          speakerName: eventSpeakers[0]?.name || 'Event Speaker',
                          messageType: 'question',
                          messageContent: speakerMessage,
                          isIncludedInSummary: true
                        });
                      }
                    }}
                    disabled={!speakerMessage.trim() || sendSpeakerMessageMutation.isPending}
                    className="w-full bg-[#CD853F] hover:bg-[#CD853F]/80 text-black"
                    data-testid="button-send-speaker-message"
                  >
                    {sendSpeakerMessageMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        Sending...
                      </div>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Message to Speaker
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Priority 2: Set Networking Goals */}
          <Card className="border-l-4 border-l-[#CD853F]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#CD853F] text-white flex items-center justify-center font-bold text-sm">2</div>
                  <Target className="h-5 w-5 text-[#CD853F]" />
                  Set Your Networking Goal
                </div>
                <Badge className="bg-[#CD853F]/10 text-[#CD853F] border border-[#CD853F]/30">
                  +10 pts
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Tell our AI your networking objectives. This helps personalize suggestions, optimize matches, and adjust event moderation for all attendees.
              </p>
              
              {hasSetNetworkingGoal || prepStats?.hasNetworkingGoal || existingGoal ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-4 rounded-lg border border-green-200">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <span className="text-sm font-medium">Networking goal analyzed! AI is optimized for your objectives.</span>
                      {existingGoal && typeof existingGoal === 'object' && (existingGoal as any).aiModerationInstructions && (
                        <div className="text-xs text-green-600 mt-1">
                          AI Instructions: "{(existingGoal as any).aiModerationInstructions}"
                        </div>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setHasSetNetworkingGoal(false);
                      if (existingGoal && typeof existingGoal === 'object' && (existingGoal as any).aiModerationInstructions) {
                        setNetworkingGoalText((existingGoal as any).aiModerationInstructions);
                      }
                    }}
                    className="text-[#CD853F] border-[#CD853F] hover:bg-[#CD853F]/10"
                    data-testid="button-edit-networking-goal"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Update Goal
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Describe your networking goals for this event... (e.g., 'Looking for Series A funding for my healthcare startup', 'Want to meet CTOs at companies with 100+ engineers', 'Seeking partnerships with enterprise clients')"
                    value={networkingGoalText}
                    onChange={(e) => setNetworkingGoalText(e.target.value)}
                    className="min-h-[100px]"
                    data-testid="input-networking-goal"
                  />
                  <div className="text-xs text-gray-500 mb-2">
                    Our AI will analyze your goal to enhance profile matching, suggest relevant connections, and personalize event recommendations.
                  </div>
                  <Button
                    onClick={() => {
                      if (networkingGoalText.trim()) {
                        sendNetworkingGoalMutation.mutate(networkingGoalText);
                      }
                    }}
                    disabled={!networkingGoalText.trim() || sendNetworkingGoalMutation.isPending}
                    className="w-full bg-[#CD853F] hover:bg-[#CD853F]/80 text-black"
                    data-testid="button-submit-networking-goal"
                  >
                    {sendNetworkingGoalMutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                        AI Analyzing...
                      </div>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        Analyze & Set Goal
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Priority 3: Connection Requests */}
          <Card className="border-l-4 border-l-[#CD853F]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#CD853F] text-white flex items-center justify-center font-bold text-sm">3</div>
                  <UserPlus className="h-5 w-5 text-[#CD853F]" />
                  Connection Requests
                </div>
                <Badge className="bg-[#CD853F]/10 text-[#CD853F] border border-[#CD853F]/30">
                  +5-15 pts
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-gray-600">
                    Manage incoming requests and discover AI-recommended connections.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowRecommendations(!showRecommendations)}
                    className="text-[#CD853F] border-[#CD853F] hover:bg-[#CD853F]/10"
                    data-testid="button-show-recommendations"
                  >
                    <Star className="w-4 h-4 mr-2" />
                    {showRecommendations ? 'Hide' : 'Show'} Recommendations
                  </Button>
                </div>

                {/* AI Recommendations Section */}
                {showRecommendations && (
                  <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      AI Recommended Connections
                    </h4>
                    {prepStats?.highQualityMatches && prepStats.highQualityMatches > 0 ? (
                      <div className="space-y-3">
                        {/* Mock high-quality recommendations */}
                        {Array.from({ length: Math.min(5, prepStats.highQualityMatches) }, (_, i) => (
                          <div key={i} className="flex items-center justify-between p-3 bg-white rounded border">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>AI</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="text-sm font-medium">High-Quality Match #{i + 1}</div>
                                <div className="text-xs text-gray-500">Match Score: {95 - i}%</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                className="bg-[#CD853F] hover:bg-[#CD853F]/80 text-black"
                                data-testid={`button-connect-recommendation-${i}`}
                              >
                                Connect
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                data-testid={`button-view-recommendation-${i}`}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-4 bg-yellow-50 rounded border border-yellow-200">
                        <AlertTriangle className="w-6 h-6 mx-auto text-yellow-600 mb-2" />
                        <div className="text-sm text-yellow-800 font-medium">No High-Quality Matches Found</div>
                        <div className="text-xs text-yellow-700 mt-1">
                          Consider improving your profile for better AI recommendations
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="mt-3 text-yellow-700 border-yellow-400 hover:bg-yellow-100"
                          data-testid="button-improve-profile"
                        >
                          Improve Profile
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Incoming Requests */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">Pending Requests</h4>
                    <Badge variant="secondary">{prepStats?.incomingConnectionRequests || 0}</Badge>
                  </div>
                  
                  {connectionRequests?.incoming && connectionRequests.incoming.length > 0 ? (
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {connectionRequests.incoming.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarImage src={request.fromUser.profileImageUrl} />
                              <AvatarFallback>{request.fromUser.firstName[0]}{request.fromUser.lastName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{request.fromUser.firstName} {request.fromUser.lastName}</div>
                              <div className="text-xs text-gray-500">Match: {request.matchScore}% • {request.aiRecommendationReason}</div>
                              {request.message && (
                                <div className="text-xs text-gray-600 mt-1 italic">"{request.message}"</div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => respondToRequestMutation.mutate({ 
                                requestId: request.id, 
                                status: 'accepted' 
                              })}
                              disabled={respondToRequestMutation.isPending}
                              data-testid={`button-accept-${request.id}`}
                            >
                              Accept
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => respondToRequestMutation.mutate({ 
                                requestId: request.id, 
                                status: 'declined' 
                              })}
                              disabled={respondToRequestMutation.isPending}
                              data-testid={`button-decline-${request.id}`}
                            >
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center p-6 bg-gray-50 rounded-lg border">
                      <Network className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                      <div className="text-sm text-gray-600">No pending requests</div>
                      <div className="text-xs text-gray-500 mt-1">AI is working to promote your profile to matches</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Priority 4: Meet the Attendees */}
          <Card className="border-l-4 border-l-[#CD853F]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#CD853F] text-white flex items-center justify-center font-bold text-sm">4</div>
                  <Users className="h-5 w-5 text-[#CD853F]" />
                  Meet the Attendees
                </div>
                <Badge className="bg-[#CD853F]/10 text-[#CD853F] border border-[#CD853F]/30">
                  +2 pts per view
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-gray-600">
                  Discover and connect with high-match attendees. Focus on 90%+ matches for the highest quality networking opportunities.
                </p>
                
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">High-Quality Matches</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-green-600">90%+ compatibility</span>
                    <Badge className="bg-green-600 text-white">{prepStats?.highQualityMatches || 0}</Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Profiles viewed:</span>
                      <span className="font-semibold">{prepStats?.attendeeProfileViews || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Total attendees:</span>
                      <span className="font-semibold">{eventData?.attendeeCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Sync Points earned:</span>
                      <span className="font-semibold text-[#CD853F]">{(prepStats?.attendeeProfileViews || 0) * 2}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Link href={`/events/${eventId}/attendees?filter=high-match`}>
                      <Button className="w-full bg-[#CD853F] hover:bg-[#CD853F]/80 text-black" size="sm" data-testid="button-view-high-matches">
                        <Star className="w-4 h-4 mr-2" />
                        View High Matches (90%+)
                      </Button>
                    </Link>
                    <Link href={`/events/${eventId}/attendees`}>
                      <Button variant="outline" className="w-full" size="sm" data-testid="button-view-all-attendees">
                        <Users className="w-4 h-4 mr-2" />
                        Browse All Attendees
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="text-xs text-gray-500 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-900">Smart Tip</div>
                      <div className="text-blue-700">Focus on 90%+ matches for the highest quality connections and networking ROI.</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Priority 5: Schedule Pre-Event Meetings */}
          <Card className="border-l-4 border-l-[#CD853F]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#CD853F] text-white flex items-center justify-center font-bold text-sm">5</div>
                  <Coffee className="h-5 w-5 text-[#CD853F]" />
                  Schedule Pre-Event Meetings
                </div>
                <Badge className="bg-[#CD853F]/10 text-[#CD853F] border border-[#CD853F]/30">
                  +20 pts
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 mb-4">
                    Schedule coffee chats or meetings with high-quality matches before the event starts. Maximize your networking ROI.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span>Available high-quality matches:</span>
                      <span className="font-semibold">{prepStats?.highQualityMatches || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Meetings scheduled:</span>
                      <span className="font-semibold">0</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Button 
                    className="w-full bg-[#CD853F] hover:bg-[#CD853F]/80 text-black"
                    disabled={!prepStats?.highQualityMatches || prepStats.highQualityMatches === 0}
                    data-testid="button-schedule-meetings"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meetings
                  </Button>
                  <p className="text-xs text-gray-500 mt-2">
                    Feature available with 90%+ matches
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Networking Goal Form Modal */}
        {showNetworkingGoalForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Set Your Networking Goal</h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="primaryGoal">Primary Goal</Label>
                    <Select value={networkingGoalData.primaryGoal} onValueChange={(value) => 
                      setNetworkingGoalData(prev => ({ ...prev, primaryGoal: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your main objective" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="funding">Funding</SelectItem>
                        <SelectItem value="partnerships">Partnerships</SelectItem>
                        <SelectItem value="hiring">Hiring</SelectItem>
                        <SelectItem value="learning">Learning</SelectItem>
                        <SelectItem value="selling">Selling</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="specificObjectives">Specific Objectives (one per line)</Label>
                    <Textarea 
                      placeholder="e.g., Series A funding&#10;CTO hire&#10;Partnership with enterprise clients"
                      value={networkingGoalData.specificObjectives.join('\n')}
                      onChange={(e) => setNetworkingGoalData(prev => ({ 
                        ...prev, 
                        specificObjectives: e.target.value.split('\n').filter(line => line.trim()) 
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="targetRoles">Target Roles (one per line)</Label>
                    <Textarea 
                      placeholder="e.g., CEO&#10;CTO&#10;VP Engineering"
                      value={networkingGoalData.targetRoles.join('\n')}
                      onChange={(e) => setNetworkingGoalData(prev => ({ 
                        ...prev, 
                        targetRoles: e.target.value.split('\n').filter(line => line.trim()) 
                      }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="communicationStyle">Communication Style</Label>
                    <Select value={networkingGoalData.communicationStyle} onValueChange={(value) => 
                      setNetworkingGoalData(prev => ({ ...prev, communicationStyle: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="direct">Direct</SelectItem>
                        <SelectItem value="casual">Casual</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="balanced">Balanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="aiInstructions">AI Moderation Instructions (Optional)</Label>
                    <Textarea 
                      placeholder="Custom instructions for how AI should help moderate your networking experience..."
                      value={networkingGoalData.aiModerationInstructions}
                      onChange={(e) => setNetworkingGoalData(prev => ({ 
                        ...prev, 
                        aiModerationInstructions: e.target.value 
                      }))}
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button 
                    onClick={() => createGoalMutation.mutate(networkingGoalData)}
                    disabled={!networkingGoalData.primaryGoal || createGoalMutation.isPending}
                    className="bg-[#CD853F] hover:bg-[#CD853F]/80 text-black"
                    data-testid="button-save-networking-goal"
                  >
                    {createGoalMutation.isPending ? 'Saving...' : 'Save Goal'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowNetworkingGoalForm(false)}
                    data-testid="button-cancel-networking-goal"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Speaker Message Modal */}
        <SpeakerMessageModal
          isOpen={speakerModalOpen}
          onClose={() => setSpeakerModalOpen(false)}
          eventId={eventId!}
          speakers={eventSpeakers}
        />
      </div>
    </div>
  );
}