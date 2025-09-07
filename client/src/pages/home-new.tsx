import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { 
  Brain, MessageSquare, Calendar, Users, TrendingUp, Award, 
  AlertCircle, Clock, Target, Sparkles, CheckCircle, UserPlus,
  Star, MapPin, ExternalLink, ChevronRight, Plus, Zap
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface ProfileCompletion {
  completionPercentage: number;
  isComplete: boolean;
  missingFields: string[];
  suggestions: string[];
}

interface ActivityScore {
  score: number;
  level: string;
  badge: string;
  progressToNext: number;
  breakdown: {
    connections: number;
    meetings: number;
    messages: number;
    events: number;
  };
}

interface EventWithStats {
  id: string;
  title: string;
  startDate: string;
  location: string;
  attendeeCount: number;
  watchingCount: number;
  percentFull: number;
  weeklySignupDelta: number;
  highValueMatches: number;
  urgencyLevel: 'high' | 'medium' | 'low';
  socialProof: 'high' | 'medium' | 'low';
}

interface MatchSuggestion {
  id: string;
  matchedUser: {
    firstName: string;
    lastName: string;
    title?: string;
    company?: string;
    profileImageUrl?: string;
  };
  matchScore: number;
  matchReason: string;
  connectionPotential: string;
}

export default function Home() {
  const { user } = useAuth();

  // Fetch profile completion
  const { data: profileCompletion } = useQuery({
    queryKey: ['/api/user/profile-completion'],
    enabled: !!user
  });

  // Fetch user's registered events
  const { data: registeredEvents } = useQuery({
    queryKey: ['/api/user/registered-events'],
    enabled: !!user
  });

  // Fetch event discovery (if no registered events)
  const { data: discoveryEvents } = useQuery({
    queryKey: ['/api/events/discovery'],
    enabled: !!user && (!registeredEvents || registeredEvents.length === 0)
  });

  // Fetch match suggestions
  const { data: matchSuggestions } = useQuery({
    queryKey: ['/api/user/match-suggestions'],
    enabled: !!user
  });

  // Fetch activity score
  const { data: activityScore } = useQuery({
    queryKey: ['/api/user/activity-score'],
    enabled: !!user
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <div className="text-lg font-semibold text-gray-900 mb-2">Please log in to continue</div>
            <p className="text-gray-600">Access your STAK Sync networking dashboard</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Header with Activity Score Badge */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user.firstName}
            </h1>
            <p className="text-gray-600 mt-1">Your networking command center</p>
          </div>
          
          {/* Activity Score Badge */}
          {activityScore && (
            <div className="flex items-center space-x-3">
              <Badge className="bg-[#CD853F] text-black px-4 py-2 text-sm font-medium">
                {activityScore.badge}
              </Badge>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#CD853F]">{activityScore.score}</div>
                <div className="text-xs text-gray-500">Activity Score</div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
          
          {/* Priority 1: Profile Completion - Only show if under 90% */}
          {profileCompletion && !profileCompletion.isComplete && (
            <Card className="border-l-4 border-l-red-500 bg-red-50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-red-600" />
                    <span className="text-red-900">Complete Your Profile</span>
                  </div>
                  <Badge className="bg-red-600 text-white">
                    {profileCompletion.completionPercentage}% Complete
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-red-800">
                    Get to 90%+ completion to unlock AI-powered high-quality matches and better networking opportunities.
                  </p>
                  <Button asChild className="bg-red-600 hover:bg-red-700 text-white">
                    <Link href="/profile">
                      <Target className="w-4 h-4 mr-2" />
                      Complete Profile
                    </Link>
                  </Button>
                </div>
                <Progress 
                  value={profileCompletion.completionPercentage} 
                  className="h-3"
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {profileCompletion.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-red-700">
                      <CheckCircle className="w-4 h-4" />
                      {suggestion}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Priority 2: Active Events (if user has registered events) */}
          {registeredEvents && registeredEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-[#CD853F]" />
                  Your Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {registeredEvents.slice(0, 3).map((item: any) => (
                    <div key={item.event.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#CD853F] rounded-lg flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{item.event.title}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(item.event.startDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {item.event.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {item.attendeeCount} attending
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button asChild variant="outline">
                        <Link href={`/events/${item.event.id}/preparation`}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Prepare
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
                {registeredEvents.length > 3 && (
                  <div className="mt-4 text-center">
                    <Button asChild variant="outline">
                      <Link href="/events">
                        View All Events
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Priority 3: Event Discovery (if no registered events or fewer than 3) */}
          {(!registeredEvents || registeredEvents.length < 3) && discoveryEvents && discoveryEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-[#CD853F]" />
                  Discover High-Value Events
                </CardTitle>
                <p className="text-gray-600 mt-1">AI-curated events with your ideal networking matches</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6">
                  {discoveryEvents.slice(0, 3).map((event: EventWithStats) => (
                    <div key={event.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-900 mb-2">{event.title}</h4>
                          <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {new Date(event.startDate).toLocaleDateString()}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {event.location}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          {event.urgencyLevel === 'high' && (
                            <Badge className="bg-red-100 text-red-800 mb-2">
                              {event.percentFull}% Full - Limited Spots
                            </Badge>
                          )}
                          {event.urgencyLevel === 'medium' && (
                            <Badge className="bg-yellow-100 text-yellow-800 mb-2">
                              Filling Up - {event.percentFull}% Full
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Motivating Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{event.attendeeCount}</div>
                          <div className="text-xs text-blue-600">Attending</div>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{event.highValueMatches}</div>
                          <div className="text-xs text-green-600">Your Matches</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <div className="text-2xl font-bold text-purple-600">+{event.weeklySignupDelta}</div>
                          <div className="text-xs text-purple-600">This Week</div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <div className="text-2xl font-bold text-orange-600">{event.watchingCount}</div>
                          <div className="text-xs text-orange-600">Watching</div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <Badge className="bg-[#CD853F] text-black">
                            {event.highValueMatches} High-Value Matches
                          </Badge>
                          {event.socialProof === 'high' && (
                            <Badge variant="secondary">
                              High Interest
                            </Badge>
                          )}
                        </div>
                        <Button asChild className="bg-[#CD853F] hover:bg-[#CD853F]/80 text-black">
                          <Link href={`/events/${event.id}`}>
                            <Plus className="w-4 h-4 mr-2" />
                            Join Event
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {discoveryEvents.length > 3 && (
                  <div className="mt-6 text-center">
                    <Button asChild variant="outline">
                      <Link href="/events">
                        Discover More Events
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Priority 4: Match Suggestions */}
          {matchSuggestions && matchSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-6 w-6 text-[#CD853F]" />
                  AI-Recommended Connections
                </CardTitle>
                <p className="text-gray-600 mt-1">High-compatibility professionals ready to connect</p>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {matchSuggestions.slice(0, 5).map((suggestion: MatchSuggestion) => (
                    <div key={suggestion.id} className="flex items-center justify-between p-4 border rounded-lg hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          {suggestion.matchedUser.profileImageUrl ? (
                            <img 
                              src={suggestion.matchedUser.profileImageUrl} 
                              alt="Profile" 
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-lg font-semibold text-gray-600">
                              {suggestion.matchedUser.firstName[0]}{suggestion.matchedUser.lastName[0]}
                            </span>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            {suggestion.matchedUser.firstName} {suggestion.matchedUser.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {suggestion.matchedUser.title}{suggestion.matchedUser.company ? ` at ${suggestion.matchedUser.company}` : ''}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{suggestion.matchReason}</p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-green-100 text-green-800 mb-1">
                            {suggestion.matchScore}% Match
                          </Badge>
                          <div className="text-xs text-gray-500 capitalize">
                            {suggestion.connectionPotential} potential
                          </div>
                        </div>
                      </div>
                      <Button className="bg-[#CD853F] hover:bg-[#CD853F]/80 text-black">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Connect
                      </Button>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <Button asChild variant="outline">
                    <Link href="/discover">
                      Discover More Matches
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Secondary Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageSquare className="h-5 w-5 text-[#CD853F]" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <div className="text-2xl font-bold text-gray-900 mb-2">5</div>
                  <p className="text-gray-600 mb-4">Unread conversations</p>
                  <Button asChild className="w-full">
                    <Link href="/messages">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      View Messages
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Brain className="h-5 w-5 text-[#CD853F]" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Your networking activity is trending upward this week!
                  </div>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/analytics">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      View Analytics
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Award className="h-5 w-5 text-[#CD853F]" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <Link href="/profile">
                      <Target className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm" className="w-full justify-start">
                    <Link href="/calendar">
                      <Calendar className="w-4 h-4 mr-2" />
                      Schedule Meeting
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