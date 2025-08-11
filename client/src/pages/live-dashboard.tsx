import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Zap, 
  MapPin, 
  Clock, 
  MessageCircle, 
  Video,
  UserPlus,
  Activity,
  Sparkles,
  Target,
  ChevronRight,
  RefreshCw,
  Settings
} from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location: string;
  isVirtual: boolean;
  status: string;
  imageUrl?: string;
}

interface EventPresence {
  id: string;
  eventId: string;
  userId: string;
  status: string; // online, away, busy, offline
  location?: string;
  lastSeen: string;
  joinedAt: string;
  isLive: boolean;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
    bio?: string;
    role?: string;
    company?: string;
  };
}

interface LiveMatch {
  id: string;
  suggestedUserId: string;
  matchScore: number;
  matchReasons: any;
  suggestedLocation?: string;
  suggestedTime?: string;
  status: string;
  expiresAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string;
    bio?: string;
    role?: string;
    company?: string;
  };
}

interface EventRoom {
  id: string;
  name: string;
  description: string;
  roomType: string;
  maxParticipants: number;
  participants: Array<{
    id: string;
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profileImageUrl?: string;
    };
  }>;
  participantCount: number;
}

export default function LiveDashboard() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const eventId = new URLSearchParams(location.split('?')[1] || '').get('eventId');
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  
  if (!eventId) {
    navigate('/events');
    return null;
  }

  // WebSocket connection for real-time updates
  const { sendMessage, isConnected } = useWebSocket();

  // Queries
  const { data: event } = useQuery<Event>({
    queryKey: [`/api/events/${eventId}`],
  });

  const { data: liveAttendees = [], refetch: refetchAttendees } = useQuery<EventPresence[]>({
    queryKey: [`/api/events/${eventId}/live-attendees`],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: liveMatches = [], refetch: refetchMatches } = useQuery<LiveMatch[]>({
    queryKey: [`/api/events/${eventId}/live-matches`],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: eventRooms = [] } = useQuery<EventRoom[]>({
    queryKey: [`/api/events/${eventId}/rooms`],
  });

  // Mutations
  const updatePresenceMutation = useMutation({
    mutationFn: async ({ status, location }: { status: string; location?: string }) => {
      return apiRequest(`/api/events/${eventId}/presence`, 'POST', { status, location });
    },
    onSuccess: () => {
      refetchAttendees();
    },
  });

  const startMatchmakingMutation = useMutation({
    mutationFn: async (criteria: any) => {
      return apiRequest(`/api/events/${eventId}/start-matchmaking`, 'POST', criteria);
    },
    onSuccess: () => {
      setIsMatchmaking(true);
      refetchMatches();
    },
  });

  const respondToMatchMutation = useMutation({
    mutationFn: async ({ matchId, response }: { matchId: string; response: 'accept' | 'decline' }) => {
      return apiRequest(`/api/live-matches/${matchId}/respond`, 'POST', { response });
    },
    onSuccess: () => {
      refetchMatches();
    },
  });

  const joinRoomMutation = useMutation({
    mutationFn: async (roomId: string) => {
      return apiRequest(`/api/rooms/${roomId}/join`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/rooms`] });
    },
  });

  // Effects
  useEffect(() => {
    // Update presence when component mounts
    updatePresenceMutation.mutate({ status: 'online', location: 'dashboard' });

    // Set up presence heartbeat
    const heartbeat = setInterval(() => {
      updatePresenceMutation.mutate({ status: 'online', location: 'dashboard' });
    }, 30000); // Every 30 seconds

    return () => clearInterval(heartbeat);
  }, [eventId]);

  // Set up WebSocket listeners for real-time updates
  useEffect(() => {
    if (isConnected) {
      // Send presence updates via WebSocket
      sendMessage({
        type: 'presence_update',
        eventId,
        userId: user?.id,
        status: 'online'
      });
    }
  }, [isConnected, eventId, user?.id]);

  const onlineAttendees = liveAttendees.filter(a => a.status === 'online');
  const totalAttendees = liveAttendees.length;

  const getUserInitials = (user: any) => {
    return `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatMatchScore = (score: number) => {
    return `${Math.round(score)}%`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Event Cover Image */}
            {event?.imageUrl && (
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-300 shadow-md">
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Activity className="h-8 w-8 text-primary" />
                <h1 className="text-3xl font-bold text-foreground">Live Dashboard</h1>
                <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              </div>
              <p className="text-muted-foreground">
                {event?.title} • {onlineAttendees.length} of {totalAttendees} attendees online
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => refetchAttendees()}
              disabled={updatePresenceMutation.isPending}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Zap className="h-4 w-4 mr-2" />
                  Start Matchmaking
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-card">
                <DialogHeader>
                  <DialogTitle>AI-Powered Live Matchmaking</DialogTitle>
                  <DialogDescription>
                    Find perfect connections at this event based on your interests and goals
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Button
                    onClick={() => startMatchmakingMutation.mutate({
                      urgency: 'normal',
                      maxMatches: 5,
                      matchingCriteria: {
                        interests: ['networking', 'ai', 'startups'],
                        goals: ['investment', 'partnerships', 'hiring']
                      }
                    })}
                    disabled={startMatchmakingMutation.isPending}
                    className="w-full bg-primary hover:bg-primary/90"
                  >
                    {startMatchmakingMutation.isPending ? 'Starting...' : 'Find My Matches'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Live Attendees */}
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Live Attendees ({onlineAttendees.length})
                </CardTitle>
                <CardDescription>
                  People currently at the event
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {onlineAttendees.map((attendee) => (
                  <div key={attendee.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={attendee.user.profileImageUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getUserInitials(attendee.user)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-background ${getStatusColor(attendee.status)}`} />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground">
                        {attendee.user.firstName} {attendee.user.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {attendee.user.role} {attendee.user.company && `at ${attendee.user.company}`}
                      </p>
                      {attendee.location && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3" />
                          {attendee.location}
                        </div>
                      )}
                    </div>
                    
                    <Button size="sm" variant="outline" className="shrink-0">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                
                {onlineAttendees.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p>No attendees online yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Rooms */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Networking Rooms
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {eventRooms.map((room) => (
                  <div key={room.id} className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-foreground">{room.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {room.participantCount}/{room.maxParticipants}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {room.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-2">
                        {room.participants.slice(0, 3).map((participant) => (
                          <Avatar key={participant.id} className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={participant.user.profileImageUrl} />
                            <AvatarFallback className="text-xs bg-primary/10">
                              {getUserInitials(participant.user)}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {room.participants.length > 3 && (
                          <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                            <span className="text-xs font-medium">+{room.participants.length - 3}</span>
                          </div>
                        )}
                      </div>
                      
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => joinRoomMutation.mutate(room.id)}
                        disabled={joinRoomMutation.isPending}
                      >
                        Join
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Live Matches */}
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Live Matches
                  {isMatchmaking && <Badge className="bg-primary">Active</Badge>}
                </CardTitle>
                <CardDescription>
                  AI-powered connections happening now
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {liveMatches.map((match) => (
                  <Card key={match.id} className="bg-muted/30 border-border/30">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={match.user.profileImageUrl} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {getUserInitials(match.user)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-foreground">
                              {match.user.firstName} {match.user.lastName}
                            </h4>
                            <Badge variant="secondary" className="text-xs">
                              {formatMatchScore(match.matchScore)} match
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-2">
                            {match.user.role} {match.user.company && `at ${match.user.company}`}
                          </p>
                          
                          {match.matchReasons && (
                            <div className="space-y-1 mb-3">
                              {match.matchReasons.slice(0, 2).map((reason: string, idx: number) => (
                                <p key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Target className="h-3 w-3 text-primary" />
                                  {reason}
                                </p>
                              ))}
                            </div>
                          )}
                          
                          {match.suggestedLocation && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                              <MapPin className="h-3 w-3" />
                              Meet at: {match.suggestedLocation}
                            </p>
                          )}
                          
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => respondToMatchMutation.mutate({ 
                                matchId: match.id, 
                                response: 'accept' 
                              })}
                              disabled={respondToMatchMutation.isPending}
                              className="bg-primary hover:bg-primary/90"
                            >
                              Connect
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => respondToMatchMutation.mutate({ 
                                matchId: match.id, 
                                response: 'decline' 
                              })}
                              disabled={respondToMatchMutation.isPending}
                            >
                              Pass
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {liveMatches.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Sparkles className="h-12 w-12 mx-auto mb-4 opacity-30" />
                    <p className="mb-2">No live matches yet</p>
                    <p className="text-sm">Start matchmaking to find connections</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activity Feed & Stats */}
          <div className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Event Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <div className="text-2xl font-bold text-primary">{onlineAttendees.length}</div>
                    <div className="text-xs text-muted-foreground">Online Now</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <div className="text-2xl font-bold text-primary">{liveMatches.length}</div>
                    <div className="text-xs text-muted-foreground">Live Matches</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <div className="text-2xl font-bold text-primary">{eventRooms.length}</div>
                    <div className="text-xs text-muted-foreground">Active Rooms</div>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-muted/30">
                    <div className="text-2xl font-bold text-primary">{totalAttendees}</div>
                    <div className="text-xs text-muted-foreground">Total Registered</div>
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">Activity Level</h4>
                  <Progress value={(onlineAttendees.length / totalAttendees) * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    {Math.round((onlineAttendees.length / totalAttendees) * 100)}% attendance rate
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-primary" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => updatePresenceMutation.mutate({ status: 'away' })}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Set Status to Away
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/messages')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Open Messages
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => navigate('/events')}
                >
                  <ChevronRight className="h-4 w-4 mr-2" />
                  Back to Events
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}