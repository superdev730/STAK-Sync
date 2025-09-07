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
  Network, Coffee, Handshake, Eye, UserPlus, Send, Award, Zap,
  MapPin, Building, ExternalLink
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { SpeakerMessageModal } from '@/components/SpeakerMessageModal';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface EventStats {
  event_id: string;
  title: string;
  start_iso: string;
  end_iso: string;
  venue: string;
  city: string;
  capacity: number;
  attending_count: number;
  watching_count: number;
  weekly_signup_delta: number;
  percent_full: number;
  roles_breakdown: { role: string; count: number }[];
  industries_breakdown: { industry: string; count: number }[];
  companies: { name: string; logo_url: string }[];
  sponsors: any[];
  perks: string[];
  last_event_outcomes: { intros: number; deals_started: number; hires: number };
  countdown_seconds: number;
}

interface PersonalizationForMember {
  member_id: string;
  event_id: string;
  high_value_matches_count: number;
  top_matches: {
    member_id: string;
    name: string;
    company: string;
    reason: string;
    overlap_tags: string[];
  }[];
  your_industry_count: number;
  your_role_count: number;
  your_goals_alignment: { goal: string; alignment_score: number }[];
  is_waitlisted: boolean;
}

interface AgendaItem {
  time: string;
  title: string;
  speakers: string[];
  track: string;
}

interface EventPrepData {
  event: EventStats;
  you: PersonalizationForMember;
  agenda: AgendaItem[];
  missions: string[];
  sponsors: any[];
}

export default function EventPreparation() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [speakerModalOpen, setSpeakerModalOpen] = useState(false);
  const [speakerMessage, setSpeakerMessage] = useState('');
  const [networkingGoalText, setNetworkingGoalText] = useState('');
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [hasSentSpeakerMessage, setHasSentSpeakerMessage] = useState(false);
  const [hasSetNetworkingGoal, setHasSetNetworkingGoal] = useState(false);
  const [completedMissions, setCompletedMissions] = useState<Set<number>>(new Set());

  // Get event preparation data from unified endpoint
  const { data: eventPrepData, isLoading } = useQuery<EventPrepData>({
    queryKey: [`/api/events/${eventId}/prep`],
    enabled: !!eventId,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
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
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze networking goal.",
        variant: "destructive",
      });
    }
  });

  // Calculate overall preparation score based on completed actions
  const calculatePrepScore = () => {
    let score = 0;
    
    // Speaker engagement (20 points)
    if (hasSentSpeakerMessage) score += 20;
    
    // Networking goal (15 points)
    if (hasSetNetworkingGoal) score += 15;
    
    // Mission completion (50 points max - 10 per mission)
    score += completedMissions.size * 10;
    
    // Match review (15 points)
    if (showRecommendations) score += 15;
    
    return Math.min(score, 100);
  };

  const prepScore = calculatePrepScore();

  const handleMissionToggle = (index: number) => {
    const newCompleted = new Set(completedMissions);
    if (newCompleted.has(index)) {
      newCompleted.delete(index);
    } else {
      newCompleted.add(index);
      toast({
        title: "Mission completed!",
        description: "+10 Sync Points",
      });
    }
    setCompletedMissions(newCompleted);
  };

  const handleSendSpeakerMessage = () => {
    if (!speakerMessage.trim()) return;
    
    sendSpeakerMessageMutation.mutate({
      message: speakerMessage,
      messageType: 'question',
      speakerName: 'Event Speakers'
    });
  };

  const handleSendNetworkingGoal = () => {
    if (!networkingGoalText.trim()) return;
    sendNetworkingGoalMutation.mutate(networkingGoalText);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#CD853F] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!eventPrepData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
            <p className="text-gray-600">This event could not be found or you may not be registered.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { event, you, agenda, missions, sponsors } = eventPrepData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Event Header and Sync Score */}
        <div className="mb-8 space-y-4">
          {/* Event Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {event.title}
            </h1>
            <h2 className="text-lg text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
              <Calendar className="h-5 w-5 text-[#CD853F]" />
              Event Preparation
            </h2>
            <div className="flex items-center justify-center gap-6 mt-3 text-sm text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {format(new Date(event.start_iso), "EEEE, MMMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {event.venue}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {event.attending_count} attending
              </span>
            </div>
          </div>

          {/* Event Sync Score Bar */}
          <Card className="max-w-md mx-auto">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">Event Sync Score</div>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Priority 1: Your Mission List */}
            <Card className="border-l-4 border-l-[#CD853F]">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#CD853F] text-white flex items-center justify-center font-bold text-sm">1</div>
                    <Target className="h-5 w-5 text-[#CD853F]" />
                    Your Event Missions
                  </div>
                  <Badge className="bg-[#CD853F]/10 text-[#CD853F] border border-[#CD853F]/30">
                    +10 pts each
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Complete these personalized missions to maximize your event value and networking success.
                </p>
                
                <div className="space-y-3">
                  {missions.map((mission: string, index: number) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Checkbox
                        checked={completedMissions.has(index)}
                        onCheckedChange={() => handleMissionToggle(index)}
                        data-testid={`checkbox-mission-${index}`}
                      />
                      <div className={`flex-1 ${completedMissions.has(index) ? 'line-through text-gray-500' : ''}`}>
                        {mission}
                      </div>
                      {completedMissions.has(index) && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Priority 2: Speak to the Speaker */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-sm">2</div>
                    <Mic className="h-5 w-5 text-blue-500" />
                    Speak to the Speaker
                  </div>
                  <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/30">
                    +20 pts
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Send questions or messages to speakers. Our AI compiles all messages and delivers insights to help speakers tailor their content.
                </p>
                
                {hasSentSpeakerMessage ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <span className="text-sm font-medium">Great! Your message is helping shape the content.</span>
                      <div className="text-xs text-green-600 mt-1">You can send additional messages anytime</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Textarea
                        placeholder="What would you like to ask or tell the speakers? (e.g., questions about their topic, suggestions for content focus, expectations...)"
                        value={speakerMessage}
                        onChange={(e) => setSpeakerMessage(e.target.value)}
                        className="flex-1 min-h-[80px]"
                        data-testid="input-speaker-message"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="px-3 text-blue-500 border-blue-500 hover:bg-blue-500/10"
                        onClick={() => {
                          if (!isRecording) {
                            setIsRecording(true);
                            toast({
                              title: "Voice Recording",
                              description: "Voice recording feature coming soon. Please use text for now.",
                            });
                            setTimeout(() => setIsRecording(false), 2000);
                          }
                        }}
                        data-testid="button-voice-record"
                      >
                        <Mic className={`h-4 w-4 ${isRecording ? 'text-red-500' : ''}`} />
                      </Button>
                    </div>
                    <Button
                      onClick={handleSendSpeakerMessage}
                      disabled={!speakerMessage.trim() || sendSpeakerMessageMutation.isPending}
                      className="w-full bg-blue-500 hover:bg-blue-600"
                      data-testid="button-send-speaker-message"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {sendSpeakerMessageMutation.isPending ? 'Sending...' : 'Send to Speakers'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Priority 3: Set Networking Goal */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm">3</div>
                    <Network className="h-5 w-5 text-green-500" />
                    Set Your Networking Goal
                  </div>
                  <Badge className="bg-green-500/10 text-green-500 border border-green-500/30">
                    +15 pts
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Tell our AI what you want to achieve at this event. We'll analyze your goals and suggest personalized networking strategies.
                </p>
                
                {hasSetNetworkingGoal ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="w-5 h-5" />
                    <div>
                      <span className="text-sm font-medium">Perfect! Your networking goal has been analyzed.</span>
                      <div className="text-xs text-green-600 mt-1">We'll help match you with relevant attendees</div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="What do you want to achieve at this event? (e.g., find co-founders, raise funding, hire talent, learn about AI trends, meet potential customers...)"
                      value={networkingGoalText}
                      onChange={(e) => setNetworkingGoalText(e.target.value)}
                      className="min-h-[80px]"
                      data-testid="input-networking-goal"
                    />
                    <Button
                      onClick={handleSendNetworkingGoal}
                      disabled={!networkingGoalText.trim() || sendNetworkingGoalMutation.isPending}
                      className="w-full bg-green-500 hover:bg-green-600"
                      data-testid="button-set-networking-goal"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      {sendNetworkingGoalMutation.isPending ? 'Analyzing...' : 'Analyze My Goals'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Agenda Highlights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Event Agenda Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agenda.map((item: AgendaItem, index: number) => (
                    <div key={index} className="flex gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="text-sm font-mono text-gray-500 min-w-[60px]">
                        {item.time}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 dark:text-white">{item.title}</div>
                        {item.speakers.length > 0 && (
                          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Speakers: {item.speakers.join(', ')}
                          </div>
                        )}
                        <Badge variant="outline" className="mt-2 text-xs">
                          {item.track}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Your High-Value Matches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Your Top Matches
                  </div>
                  <Badge variant="secondary">{you.high_value_matches_count}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {you.top_matches.length > 0 ? (
                  <div className="space-y-3">
                    {you.top_matches.slice(0, 5).map((match: any, index: number) => (
                      <div key={match.member_id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback>{match.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm">{match.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300">{match.company}</div>
                          <div className="text-xs text-[#CD853F] mt-1">{match.reason}</div>
                        </div>
                        <Button size="sm" variant="outline" className="text-xs">
                          Connect
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowRecommendations(!showRecommendations)}
                      data-testid="button-view-all-matches"
                    >
                      View All Matches
                    </Button>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-4">
                    <Users className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No high-value matches found yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Companies Attending */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5 text-blue-500" />
                  Companies Attending
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {event.companies.slice(0, 8).map((company: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <img 
                        src={company.logo_url} 
                        alt={company.name}
                        className="w-6 h-6 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <Building className="w-4 h-4 text-gray-400" />
                      <span>{company.name}</span>
                    </div>
                  ))}
                  {event.companies.length > 8 && (
                    <div className="text-xs text-gray-500 mt-2">
                      +{event.companies.length - 8} more companies
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Event Sponsors */}
            {sponsors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5 text-purple-500" />
                    Event Sponsors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sponsors.map((sponsor: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <img src={sponsor.logo} alt={sponsor.name} className="w-8 h-8 rounded" />
                        <span className="text-sm">{sponsor.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Industry Alignment */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Alignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Industry matches</span>
                  <span className="font-medium">{you.your_industry_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Similar roles</span>
                  <span className="font-medium">{you.your_role_count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">High-value matches</span>
                  <span className="font-medium">{you.high_value_matches_count}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Speaker Message Modal */}
        <SpeakerMessageModal
          isOpen={speakerModalOpen}
          onClose={() => setSpeakerModalOpen(false)}
          eventId={eventId || ''}
        />
      </div>
    </div>
  );
}