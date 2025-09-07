import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { CalendarDays, MapPin, Users, Building, Clock, Star, TrendingUp, Target, CheckCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";

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

interface EventCompositeCard {
  event: EventStats;
  you: PersonalizationForMember;
}

export default function EventSignup() {
  const { eventId } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);

  // Fetch event summary data
  const { data: eventData, isLoading } = useQuery<EventCompositeCard>({
    queryKey: ['/api/events', eventId, 'summary'],
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: () => apiRequest(`/api/events/${eventId}/register`, 'POST'),
    onSuccess: () => {
      toast({
        title: "Registration successful!",
        description: "You're all set for the event. Check your email for details.",
      });
      // Invalidate cache and navigate to prep page
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      navigate(`/events/${eventId}/prep`);
    },
    onError: (error: any) => {
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleRegister = () => {
    setIsRegistering(true);
    registerMutation.mutate();
  };

  if (isLoading || !eventData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
              <div className="space-y-4">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-48 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { event, you } = eventData || { event: {} as EventStats, you: {} as PersonalizationForMember };

  // Calculate urgency factors
  const daysUntilEvent = Math.max(0, Math.ceil(event.countdown_seconds / (1000 * 60 * 60 * 24)));
  const isUrgent = daysUntilEvent <= 7 || event.percent_full >= 80;
  const timeLeft = event.countdown_seconds > 0 ? formatDistanceToNow(new Date(Date.now() + event.countdown_seconds)) : "Started";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with urgency signals */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={isUrgent ? "destructive" : "secondary"}>
              {isUrgent ? "Almost Full" : "Open Registration"}
            </Badge>
            <Badge variant="outline">
              <TrendingUp className="w-3 h-3 mr-1" />
              +{event.weekly_signup_delta} this week
            </Badge>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {event.title}
          </h1>
          <div className="flex items-center gap-6 text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              {format(new Date(event.start_iso), "EEEE, MMMM d, yyyy")}
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              {event.venue}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Starts in {timeLeft}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-copper" />
                  Why You'll Love This Event
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-copper">{you.high_value_matches_count}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">High-value matches attending</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{you.your_industry_count}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">People in your industry</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{you.your_role_count}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Similar roles attending</div>
                  </div>
                </div>

                {/* Your Top Matches */}
                {you.top_matches.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3">People You Should Meet</h4>
                    <div className="space-y-3">
                      {you.top_matches.slice(0, 3).map((match: any, index: number) => (
                        <div key={match.member_id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback>{match.name.split(' ').map((n: string) => n[0]).join('')}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium">{match.name}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-300">{match.company}</div>
                            <div className="text-xs text-copper">{match.reason}</div>
                          </div>
                          <Star className="w-4 h-4 text-yellow-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Event Perks */}
                <div>
                  <h4 className="font-semibold mb-3">What's Included</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {event.perks.map((perk: string, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Proof */}
            <Card>
              <CardHeader>
                <CardTitle>Who's Attending</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Companies */}
                <div>
                  <h4 className="font-semibold mb-3">Companies ({event.companies.length})</h4>
                  <div className="flex flex-wrap gap-3">
                    {event.companies.slice(0, 12).map((company: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg">
                        <img 
                          src={company.logo_url} 
                          alt={company.name}
                          className="w-6 h-6 rounded"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <Building className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium">{company.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Industries */}
                <div>
                  <h4 className="font-semibold mb-3">Top Industries</h4>
                  <div className="flex flex-wrap gap-2">
                    {event.industries_breakdown.slice(0, 8).map((industry: any, index: number) => (
                      <Badge key={index} variant="outline">
                        {industry.industry} ({industry.count})
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Roles */}
                <div>
                  <h4 className="font-semibold mb-3">Attendee Roles</h4>
                  <div className="flex flex-wrap gap-2">
                    {event.roles_breakdown.slice(0, 6).map((role: any, index: number) => (
                      <Badge key={index} variant="secondary">
                        {role.role} ({role.count})
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Previous Event Outcomes */}
            <Card>
              <CardHeader>
                <CardTitle>From Our Last Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{event.last_event_outcomes.intros}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">New connections made</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{event.last_event_outcomes.deals_started}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Business deals initiated</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{event.last_event_outcomes.hires}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">People hired</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Registration Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-center">Secure Your Spot</CardTitle>
                {/* Capacity Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{event.attending_count} attending</span>
                    <span>{event.capacity - event.attending_count} spots left</span>
                  </div>
                  <Progress value={event.percent_full} className="h-2" />
                  <div className="text-center text-sm text-gray-600 dark:text-gray-300">
                    {event.percent_full}% full
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleRegister}
                  disabled={isRegistering || registerMutation.isPending}
                  className="w-full h-12 text-lg"
                  data-testid="button-register-event"
                >
                  {isRegistering || registerMutation.isPending ? (
                    "Registering..."
                  ) : you.is_waitlisted ? (
                    "Join Waitlist"
                  ) : (
                    "Register Now"
                  )}
                </Button>

                <div className="text-xs text-gray-500 text-center">
                  Free registration • No credit card required
                </div>

                <Separator />

                {/* Event Details */}
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Date</span>
                    <span className="font-medium">{format(new Date(event.start_iso), "MMM d, yyyy")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Time</span>
                    <span className="font-medium">{format(new Date(event.start_iso), "h:mm a")}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Location</span>
                    <span className="font-medium">{event.city}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Watching</span>
                    <span className="font-medium">{event.watching_count} interested</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FOMO Signals */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  🔥 {event.weekly_signup_delta} people registered this week
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  ⚡ {Math.floor(Math.random() * 15 + 5)} people viewing now
                </div>
                {isUrgent && (
                  <div className="text-sm text-red-600 dark:text-red-400 font-medium">
                    ⏰ Registration closes soon!
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Sponsors */}
            {event.sponsors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Event Sponsors</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {event.sponsors.map((sponsor: any, index: number) => (
                      <div key={index} className="flex items-center gap-2">
                        <img src={sponsor.logo} alt={sponsor.name} className="w-8 h-8 rounded" />
                        <span className="text-sm">{sponsor.name}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}