import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Clock, Users, Target, CheckCircle, AlertTriangle, Star, MapPin, Calendar,
  MessageSquare, UserPlus, TrendingUp, Award, Coffee, Handshake, Network,
  ArrowRight, Plus, Eye, BookOpen, Zap, Heart, Building, Briefcase, Send, Trophy
} from 'lucide-react';
import { Link } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import type { Match, User, Message } from '@shared/schema';

interface EventAttendee {
  id: string;
  firstName: string;
  lastName: string;
  title: string;
  company: string;
  profileImageUrl?: string;
  industries: string[];
  matchScore?: number;
  isContact?: boolean;
}

interface EventPreparationData {
  event: {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    location: string;
    description: string;
    isVirtual: boolean;
    attendeeCount: number;
  };
  attendees: EventAttendee[];
  preliminaryMatches: EventAttendee[];
  existingContacts: EventAttendee[];
  suggestedMeetings: {
    id: string;
    type: 'coffee' | 'lunch' | 'presentation' | 'workshop';
    title: string;
    description: string;
    suggestedTime: string;
    location?: string;
    attendees: string[];
  }[];
  programContent: {
    id: string;
    title: string;
    type: 'keynote' | 'panel' | 'workshop' | 'networking';
    time: string;
    speaker?: string;
    relevanceScore: number;
    matchedAttendees: number;
  }[];
}

interface CountdownTime {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function EventPreparation() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [countdown, setCountdown] = useState<CountdownTime | null>(null);
  const [preparationScore, setPreparationScore] = useState(0);

  // Mock event preparation data since API endpoint doesn't exist yet
  const eventData: EventPreparationData = {
    event: {
      id: eventId || 'mock-event',
      title: 'STAK Summit 2025',
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
      location: 'San Francisco, CA',
      description: 'Premier networking event for VCs and startup founders',
      isVirtual: false,
      attendeeCount: 250,
    },
    attendees: [
      {
        id: 'demo-sarah',
        firstName: 'Sarah',
        lastName: 'Chen',
        title: 'VP of Engineering',
        company: 'TechCorp',
        industries: ['AI/ML', 'Enterprise Software'],
        isContact: true,
      },
      {
        id: 'demo-michael',
        firstName: 'Michael',
        lastName: 'Rodriguez',
        title: 'Partner',
        company: 'Venture Capital Partners',
        industries: ['Fintech', 'Series A Investments'],
        matchScore: 89,
      },
      // Add more mock attendees
    ],
    preliminaryMatches: [
      {
        id: 'demo-michael',
        firstName: 'Michael',
        lastName: 'Rodriguez',
        title: 'Partner',
        company: 'Venture Capital Partners',
        industries: ['Fintech', 'Series A Investments'],
        matchScore: 89,
      },
      {
        id: 'demo-jessica',
        firstName: 'Jessica',
        lastName: 'Park',
        title: 'Founder & CEO',
        company: 'InnovateLab',
        industries: ['Healthcare', 'B2B SaaS'],
        matchScore: 94,
      },
    ],
    existingContacts: [
      {
        id: 'demo-sarah',
        firstName: 'Sarah',
        lastName: 'Chen',
        title: 'VP of Engineering',
        company: 'TechCorp',
        industries: ['AI/ML', 'Enterprise Software'],
        isContact: true,
      },
    ],
    suggestedMeetings: [
      {
        id: 'coffee-1',
        type: 'coffee',
        title: 'Coffee with Michael Rodriguez',
        description: 'Discuss Series A funding opportunities',
        suggestedTime: '10:00 AM - Day 1',
        attendees: ['demo-michael'],
      },
    ],
    programContent: [
      {
        id: 'keynote-1',
        title: 'Future of AI in Enterprise',
        type: 'keynote',
        time: '9:00 AM - Day 1',
        speaker: 'John Smith, CEO of AI Corp',
        relevanceScore: 92,
        matchedAttendees: 15,
      },
      {
        id: 'panel-1',
        title: 'Series A Funding Landscape',
        type: 'panel',
        time: '2:00 PM - Day 1',
        relevanceScore: 87,
        matchedAttendees: 8,
      },
    ],
  };

  const isLoading = false;

  const { data: userMatches } = useQuery<(Match & { matchedUser: User })[]>({
    queryKey: ["/api/matches"],
  });

  const { data: conversations } = useQuery<(Message & { sender: User; receiver: User })[]>({
    queryKey: ["/api/conversations"],
  });

  // Update countdown timer
  useEffect(() => {
    if (!eventData?.event.startDate) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const eventStart = new Date(eventData.event.startDate).getTime();
      const timeDiff = eventStart - now;

      if (timeDiff <= 0) {
        setCountdown(null);
        return;
      }

      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [eventData]);

  // Calculate STAK Sync Score - engagement-focused scoring
  useEffect(() => {
    if (!eventData || !user) return;

    let score = 0;
    const maxScore = 100;

    // Base profile completeness (15 points max) - realistic for new users
    const profileFields = [user.bio, user.title, user.company, user.location, user.profileImageUrl, user.networkingGoal];
    const filledFields = profileFields.filter(field => field && field.trim?.().length > 0).length;
    score += (filledFields / profileFields.length) * 15;

    // Event-specific actions (20 points) - things users can actually do
    let eventActions = 0;
    // Check if user has reviewed attendees (simulated by checking if they've spent time here)
    if (localStorage.getItem(`reviewed_attendees_${eventData.event.id}`)) eventActions += 5;
    // Check if user has sent connection requests (simulated)
    const connectionRequests = parseInt(localStorage.getItem(`connection_requests_${eventData.event.id}`) || '0');
    eventActions += Math.min(connectionRequests * 2, 10); // 2 points per request, max 10
    // Check if user has reviewed program content
    if (localStorage.getItem(`reviewed_program_${eventData.event.id}`)) eventActions += 5;
    score += eventActions;

    // Active networking (35 points) - real user engagement
    let networkingScore = 0;
    // Conversation activity (based on actual API data)
    const activeConversations = conversations?.filter(conv => 
      (conv.senderId === user.id || conv.receiverId === user.id) && 
      conv.createdAt && new Date(conv.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    )?.length || 0;
    networkingScore += Math.min(activeConversations * 3, 15); // 3 points per conversation, max 15
    
    // Connection activity (based on preliminary matches - simulated)
    const connectedMatches = eventData.preliminaryMatches?.filter(m => m.isContact)?.length || 0;
    networkingScore += Math.min(connectedMatches * 2, 8); // 2 points per connection, max 8
    
    // Interactive engagement with matches (new scoring for Connect/Schedule/Pass actions)
    const engagementInteractions = parseInt(localStorage.getItem('engagement_interactions') || '0');
    networkingScore += Math.min(engagementInteractions * 2, 12); // 2 points per interaction, max 12
    
    score += networkingScore;

    // Event preparation tasks (25 points) - actionable items
    let preparationTasks = 0;
    if (localStorage.getItem(`meeting_scheduled_${eventData.event.id}`)) preparationTasks += 8;
    if (localStorage.getItem(`outreach_sent_${eventData.event.id}`)) preparationTasks += 8;
    if (localStorage.getItem(`goals_set_${eventData.event.id}`)) preparationTasks += 9;
    score += preparationTasks;

    // Engagement multiplier (15 points) - recent activity bonus
    let engagementBonus = 0;
    const recentActivity = localStorage.getItem('last_activity_timestamp');
    if (recentActivity && new Date().getTime() - new Date(recentActivity).getTime() < 24 * 60 * 60 * 1000) {
      engagementBonus = 15; // Full bonus for daily usage
    } else if (recentActivity && new Date().getTime() - new Date(recentActivity).getTime() < 7 * 24 * 60 * 60 * 1000) {
      engagementBonus = 8; // Partial bonus for weekly usage
    }
    score += engagementBonus;

    // Cap score and ensure new users start low
    const finalScore = Math.min(Math.round(score), maxScore);
    // New users (less than 20% profile) should start very low to encourage engagement
    const profileCompleteness = (filledFields / profileFields.length) * 100;
    if (profileCompleteness < 20 && finalScore > 25) {
      setPreparationScore(Math.min(finalScore, 25));
    } else {
      setPreparationScore(finalScore);
    }
  }, [eventData, user, conversations?.length, eventData?.event?.id, eventData?.preliminaryMatches?.length, localStorage.getItem('engagement_interactions')]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-stak-copper border-t-transparent rounded-full" />
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

  const { event, attendees, preliminaryMatches, existingContacts, suggestedMeetings, programContent } = eventData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Event Header with Countdown */}
      <div className="bg-gradient-to-r from-stak-black to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
            <p className="text-lg text-gray-300 mb-6">Event Preparation Dashboard</p>
            
            {/* Countdown Timer */}
            {countdown && (
              <div className="flex justify-center items-center gap-6 mb-6">
                <div className="text-center">
                  <div className="text-4xl font-bold text-stak-copper">{countdown.days}</div>
                  <div className="text-sm text-gray-400">DAYS</div>
                </div>
                <div className="text-stak-copper text-2xl">:</div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-stak-copper">{countdown.hours.toString().padStart(2, '0')}</div>
                  <div className="text-sm text-gray-400">HRS</div>
                </div>
                <div className="text-stak-copper text-2xl">:</div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-stak-copper">{countdown.minutes.toString().padStart(2, '0')}</div>
                  <div className="text-sm text-gray-400">MIN</div>
                </div>
                <div className="text-stak-copper text-2xl">:</div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-stak-copper">{countdown.seconds.toString().padStart(2, '0')}</div>
                  <div className="text-sm text-gray-400">SEC</div>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center text-gray-300">
                <Calendar className="w-4 h-4 mr-2" />
                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
              </div>
              <div className="flex items-center text-gray-300">
                <MapPin className="w-4 h-4 mr-2" />
                {event.location}
              </div>
              <div className="flex items-center text-gray-300">
                <Users className="w-4 h-4 mr-2" />
                {event.attendeeCount} attendees
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* STAK Sync Score */}
        <Card className="mb-8 border-stak-copper/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trophy className="w-5 h-5 text-stak-copper mr-2" />
              Your STAK Sync Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-3xl font-bold text-stak-copper">{preparationScore}%</div>
                <div className="text-sm text-gray-700 font-medium">
                  {preparationScore >= 80 ? 'Networking Champion! 🏆' : 
                   preparationScore >= 60 ? 'Great Momentum! ⚡' : 
                   preparationScore >= 30 ? 'Getting Started 📈' : 'Ready to Sync? 🚀'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Track your engagement and connections
                </div>
              </div>
              <div className="w-32">
                <Progress value={preparationScore} className="h-3" />
              </div>
            </div>
            
            {preparationScore < 60 && (
              <div className="space-y-3">
                <div className="flex items-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <TrendingUp className="w-4 h-4 text-blue-600 mr-2 flex-shrink-0" />
                  <div className="text-sm text-blue-800">
                    <strong>Boost your Sync Score:</strong> Connect with attendees, set meetings, and engage actively!
                  </div>
                </div>
                
                {/* Quick Action Items */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2 bg-gray-50 rounded border text-center">
                    <div className="text-xs font-medium text-gray-700">Connect</div>
                    <div className="text-lg font-bold text-stak-copper">+10pts</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border text-center">
                    <div className="text-xs font-medium text-gray-700">Schedule</div>
                    <div className="text-lg font-bold text-stak-copper">+8pts</div>
                  </div>
                  <div className="p-2 bg-gray-50 rounded border text-center">
                    <div className="text-xs font-medium text-gray-700">Engage</div>
                    <div className="text-lg font-bold text-stak-copper">+15pts</div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Activity Navigation */}
        <Card className="mb-8">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
              <Button asChild variant="outline" size="sm" className="flex items-center gap-2">
                <Link href="/profile">
                  <Briefcase className="w-4 h-4" />
                  Profile
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex items-center gap-2">
                <Link href="/messages">
                  <MessageSquare className="w-4 h-4" />
                  Messages
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex items-center gap-2">
                <Link href="/discover">
                  <Heart className="w-4 h-4" />
                  Find Matches
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex items-center gap-2">
                <Link href={`/events/live/${event.id}`}>
                  <Calendar className="w-4 h-4" />
                  Event Details
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="flex items-center gap-2">
                <Link href="/contacts">
                  <Network className="w-4 h-4" />
                  My Network
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Pre-Event Planning - MOVED TO TOP */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-stak-copper mr-2" />
                  Pre-Event Planning Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button asChild className="w-full bg-stak-copper hover:bg-stak-dark-copper text-stak-black">
                      <Link href="/profile">
                        <Briefcase className="w-4 h-4 mr-2" />
                        Complete Profile
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-stak-black">
                      <Link href="/discover">
                        <Heart className="w-4 h-4 mr-2" />
                        Review Matches
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-stak-black">
                      <Link href="/messages">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Connect with Attendees
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-stak-black">
                      <Link href="/contacts">
                        <Network className="w-4 h-4 mr-2" />
                        Review Your Network
                      </Link>
                    </Button>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Event Readiness Progress:</span>
                      <span className="font-semibold text-stak-copper">{preparationScore}% Complete</span>
                    </div>
                    <Progress value={preparationScore} className="h-2 mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Engagement Boost Tasks */}
            <Card className="border-stak-copper/20">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-stak-copper mr-2" />
                  Boost Your Sync Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Networking Goal Setting */}
                  <div className="p-4 border rounded-lg hover:border-stak-copper/40 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Zap className="w-4 h-4 text-stak-copper mr-2" />
                        <span className="font-medium text-gray-900">Set Your Networking Goal</span>
                      </div>
                      <Badge className="bg-stak-copper/10 text-stak-copper border border-stak-copper/30">+9 points</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Define what you want to achieve at this event</p>
                    {localStorage.getItem(`goals_set_${event.id}`) ? (
                      <div className="flex items-center text-green-700 bg-green-50 p-2 rounded border border-green-200">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Goal Set! ✨</span>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                        onClick={() => {
                          localStorage.setItem(`goals_set_${event.id}`, 'true');
                          localStorage.setItem('last_activity_timestamp', new Date().toISOString());
                          window.location.reload();
                        }}
                      >
                        <Target className="w-3 h-3 mr-1" />
                        Set Goal
                      </Button>
                    )}
                  </div>

                  {/* Attendee Review */}
                  <div className="p-4 border rounded-lg hover:border-stak-copper/40 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Eye className="w-4 h-4 text-stak-copper mr-2" />
                        <span className="font-medium text-gray-900">Review Fellow Attendees</span>
                      </div>
                      <Badge className="bg-stak-copper/10 text-stak-copper border border-stak-copper/30">+5 points</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Browse profiles to identify potential connections</p>
                    {localStorage.getItem(`reviewed_attendees_${event.id}`) ? (
                      <div className="flex items-center text-green-700 bg-green-50 p-2 rounded border border-green-200">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Attendees Reviewed! 👥</span>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                        onClick={() => {
                          localStorage.setItem(`reviewed_attendees_${event.id}`, 'true');
                          localStorage.setItem('last_activity_timestamp', new Date().toISOString());
                          window.location.reload();
                        }}
                      >
                        <Users className="w-3 h-3 mr-1" />
                        Start Reviewing
                      </Button>
                    )}
                  </div>

                  {/* Program Review */}
                  <div className="p-4 border rounded-lg hover:border-stak-copper/40 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 text-stak-copper mr-2" />
                        <span className="font-medium text-gray-900">Plan Your Schedule</span>
                      </div>
                      <Badge className="bg-stak-copper/10 text-stak-copper border border-stak-copper/30">+5 points</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Review sessions and identify networking opportunities</p>
                    {localStorage.getItem(`reviewed_program_${event.id}`) ? (
                      <div className="flex items-center text-green-700 bg-green-50 p-2 rounded border border-green-200">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Schedule Planned! 📅</span>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                        onClick={() => {
                          localStorage.setItem(`reviewed_program_${event.id}`, 'true');
                          localStorage.setItem('last_activity_timestamp', new Date().toISOString());
                          window.location.reload();
                        }}
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Plan Schedule
                      </Button>
                    )}
                  </div>

                  {/* Connection Outreach */}
                  <div className="p-4 border rounded-lg hover:border-stak-copper/40 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Send className="w-4 h-4 text-stak-copper mr-2" />
                        <span className="font-medium text-gray-900">Send Connection Requests</span>
                      </div>
                      <Badge className="bg-stak-copper/10 text-stak-copper border border-stak-copper/30">+2 pts each</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Reach out to potential matches before the event</p>
                    {parseInt(localStorage.getItem(`connection_requests_${event.id}`) || '0') > 0 ? (
                      <div className="flex items-center text-green-700 bg-green-50 p-2 rounded border border-green-200">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">{localStorage.getItem(`connection_requests_${event.id}`)} Requests Sent! 🤝</span>
                      </div>
                    ) : (
                      <Button 
                        asChild
                        size="sm" 
                        className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                      >
                        <Link href="/discover">
                          <Heart className="w-3 h-3 mr-1" />
                          Find Connections
                        </Link>
                      </Button>
                    )}
                  </div>

                  {/* Meeting Scheduling */}
                  <div className="p-4 border rounded-lg hover:border-stak-copper/40 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <Coffee className="w-4 h-4 text-stak-copper mr-2" />
                        <span className="font-medium text-gray-900">Schedule Pre-Event Meeting</span>
                      </div>
                      <Badge className="bg-stak-copper/10 text-stak-copper border border-stak-copper/30">+8 points</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Set up coffee chats or calls before the event</p>
                    {localStorage.getItem(`meeting_scheduled_${event.id}`) ? (
                      <div className="flex items-center text-green-700 bg-green-50 p-2 rounded border border-green-200">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">Meeting Scheduled! ☕</span>
                      </div>
                    ) : (
                      <Button 
                        size="sm" 
                        className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                        onClick={() => {
                          localStorage.setItem(`meeting_scheduled_${event.id}`, 'true');
                          localStorage.setItem('last_activity_timestamp', new Date().toISOString());
                          window.location.reload();
                        }}
                      >
                        <Calendar className="w-3 h-3 mr-1" />
                        Schedule Meeting
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mt-6 p-3 bg-stak-copper/10 border border-stak-copper/20 rounded-lg">
                  <div className="flex items-center text-stak-copper">
                    <Trophy className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Complete all tasks to maximize your networking success!</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preliminary Matches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Heart className="w-5 h-5 text-stak-copper mr-2" />
                    Preliminary Matches ({preliminaryMatches.length})
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href="/discover">Find More</Link>
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {preliminaryMatches.slice(0, 6).map((match) => (
                    <div key={match.id} className="p-4 border border-gray-200 rounded-lg hover:border-stak-copper transition-colors">
                      <div className="flex items-center space-x-3 mb-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src={match.profileImageUrl || ""} alt={match.firstName} />
                          <AvatarFallback className="bg-stak-copper/20 text-stak-copper">
                            {match.firstName[0]}{match.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">{match.firstName} {match.lastName}</p>
                          <p className="text-sm text-gray-600">{match.title}</p>
                          <p className="text-sm text-gray-500">{match.company}</p>
                        </div>
                        <Badge variant="outline" className="text-stak-copper border-stak-copper">
                          {match.matchScore}% Match
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {match.industries.slice(0, 2).map((industry, idx) => (
                          <Badge key={idx} className="text-xs bg-gray-100 text-gray-800 border border-gray-300">{industry}</Badge>
                        ))}
                      </div>
                      {!localStorage.getItem(`interacted_${match.id}_${event.id}`) ? (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1 bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                            onClick={() => {
                              localStorage.setItem(`interacted_${match.id}_${event.id}`, 'connect');
                              localStorage.setItem(`connection_requests_${event.id}`, 
                                (parseInt(localStorage.getItem(`connection_requests_${event.id}`) || '0') + 1).toString()
                              );
                              localStorage.setItem('last_activity_timestamp', new Date().toISOString());
                              window.location.reload();
                            }}
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Connect
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                            onClick={() => {
                              localStorage.setItem(`interacted_${match.id}_${event.id}`, 'schedule');
                              localStorage.setItem(`meeting_scheduled_${event.id}`, 'true');
                              localStorage.setItem('last_activity_timestamp', new Date().toISOString());
                              window.location.reload();
                            }}
                          >
                            <Calendar className="w-3 h-3 mr-1" />
                            Schedule
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-gray-600 hover:text-gray-800 border-gray-300"
                            onClick={() => {
                              localStorage.setItem(`interacted_${match.id}_${event.id}`, 'pass');
                              // Award engagement points even for passing
                              const engagementCount = parseInt(localStorage.getItem('engagement_interactions') || '0') + 1;
                              localStorage.setItem('engagement_interactions', engagementCount.toString());
                              localStorage.setItem('last_activity_timestamp', new Date().toISOString());
                              window.location.reload();
                            }}
                          >
                            Pass
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-2 bg-green-50 border border-green-200 rounded text-green-700">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          <span className="text-sm font-medium">
                            {localStorage.getItem(`interacted_${match.id}_${event.id}`) === 'connect' ? 'Connected!' :
                             localStorage.getItem(`interacted_${match.id}_${event.id}`) === 'schedule' ? 'Meeting Scheduled!' :
                             'Reviewed'} 
                            {localStorage.getItem(`interacted_${match.id}_${event.id}`) !== 'pass' && ' +5 pts'}
                            {localStorage.getItem(`interacted_${match.id}_${event.id}`) === 'pass' && ' +2 pts'}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Event Attendees */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 text-stak-copper mr-2" />
                  All Attendees ({attendees.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {attendees.slice(0, 18).map((attendee) => (
                    <div key={attendee.id} className="text-center">
                      <Avatar className="w-16 h-16 mx-auto mb-2">
                        <AvatarImage src={attendee.profileImageUrl || ""} alt={attendee.firstName} />
                        <AvatarFallback className="bg-gray-200 text-gray-600">
                          {attendee.firstName[0]}{attendee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-sm font-medium text-gray-900 truncate">{attendee.firstName} {attendee.lastName}</p>
                      <p className="text-xs text-gray-500 truncate">{attendee.company}</p>
                      {attendee.isContact && (
                        <Badge className="text-xs mt-1 bg-green-100 text-green-800 border border-green-300">Connected</Badge>
                      )}
                    </div>
                  ))}
                  {attendees.length > 18 && (
                    <div className="text-center flex items-center justify-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-500">+{attendees.length - 18}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Program Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="w-5 h-5 text-stak-copper mr-2" />
                  Recommended Program Content
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {programContent.slice(0, 5).map((content) => (
                    <div key={content.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{content.title}</h3>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <div className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {content.time}
                            </div>
                            {content.speaker && (
                              <div className="flex items-center">
                                <Users className="w-3 h-3 mr-1" />
                                {content.speaker}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            content.relevanceScore >= 80 ? "bg-green-100 text-green-800 border border-green-600" : 
                            content.relevanceScore >= 60 ? "bg-yellow-100 text-yellow-800 border border-yellow-600" : 
                            "bg-gray-100 text-gray-800 border border-gray-600"
                          }>
                            {content.relevanceScore}% relevant
                          </Badge>
                          {content.matchedAttendees > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {content.matchedAttendees} matches attending
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {content.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Existing Contacts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Network className="w-5 h-5 text-stak-copper mr-2" />
                  Your Contacts Attending ({existingContacts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {existingContacts.slice(0, 5).map((contact) => (
                    <div key={contact.id} className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={contact.profileImageUrl || ""} alt={contact.firstName} />
                        <AvatarFallback className="bg-stak-copper/20 text-stak-copper text-xs">
                          {contact.firstName[0]}{contact.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{contact.firstName} {contact.lastName}</p>
                        <p className="text-xs text-gray-600">{contact.company}</p>
                      </div>
                      <Button asChild size="sm" variant="ghost">
                        <Link href={`/messages?userId=${contact.id}`}>
                          <MessageSquare className="w-3 h-3" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Suggested Meetings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Coffee className="w-5 h-5 text-stak-copper mr-2" />
                  Suggested Meetings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {suggestedMeetings.slice(0, 3).map((meeting) => (
                    <div key={meeting.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                        <Badge variant="secondary" className="capitalize">
                          {meeting.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{meeting.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-500">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {meeting.suggestedTime}
                        </div>
                        <Button size="sm" variant="outline">
                          Schedule
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 text-stak-copper mr-2" />
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button asChild variant="outline" className="w-full">
                    <Link href={`/events/live/${event.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Event Details
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/admin">
                      <Building className="w-4 h-4 mr-2" />
                      Event Analytics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}