import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  AlertTriangle, Calendar, MapPin, Users, Clock, Star, Building, 
  Award, TrendingUp, ExternalLink, Target
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { MissionBoard } from '@/components/MissionBoard';
import { format } from 'date-fns';

interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  cta_label: string;
  cta_url: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'locked';
  category: string;
}

interface Progress {
  points_earned: number;
  points_total: number;
  missions_completed: number;
  missions_total: number;
}

interface MissionResponse {
  event_id: string;
  member_id: string;
  missions: Mission[];
  progress: Progress;
}

interface EventPrepData {
  event: {
    event_id: string;
    title: string;
    start_iso: string;
    end_iso: string;
    venue: string;
    city: string;
    capacity: number;
    attending_count: number;
    watching_count: number;
    companies: { name: string; logo_url: string }[];
    sponsors: any[];
    countdown_seconds: number;
  };
  you: {
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
  };
  agenda: {
    time: string;
    title: string;
    speakers: string[];
    track: string;
  }[];
  missions: string[];
  sponsors: any[];
}

export default function EventPreparation() {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [selectedMission, setSelectedMission] = useState<string | null>(null);

  // Get event missions
  const { data: missionsData, isLoading: missionsLoading } = useQuery<MissionResponse>({
    queryKey: [`/api/events/${eventId}/missions`],
    enabled: !!eventId,
    refetchInterval: 2 * 60 * 1000, // Refresh every 2 minutes
  });

  // Get event preparation data for sidebar info
  const { data: eventPrepData, isLoading: prepLoading } = useQuery<EventPrepData>({
    queryKey: [`/api/events/${eventId}/prep`],
    enabled: !!eventId,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
  });

  const handleMissionStart = (missionId: string) => {
    setSelectedMission(missionId);
    // Scroll to the mission or handle navigation
    const element = document.getElementById(missionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSidebarLinkClick = (missionId: string) => {
    setSelectedMission(missionId);
    // Find and expand the mission in the mission board
    const element = document.querySelector(`[data-testid="button-mission-${missionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      (element as HTMLElement).click();
    }
  };

  if (missionsLoading || prepLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#CD853F] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!missionsData || !eventPrepData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Event Not Found</h2>
            <p className="text-gray-600 dark:text-gray-300">This event could not be found or you may not be registered.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { event, you } = eventPrepData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Event Header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {event.title}
          </h1>
          <h2 className="text-lg text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
            <Target className="h-5 w-5 text-[#CD853F]" />
            Mission Control Center
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Mission Board */}
          <div className="lg:col-span-2">
            <MissionBoard
              eventId={eventId || ''}
              missions={missionsData.missions}
              progress={missionsData.progress}
              onMissionStart={handleMissionStart}
            />
          </div>

          {/* Enhanced Sidebar - Quick Links to Missions */}
          <div className="space-y-6">
            {/* Quick Mission Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => handleSidebarLinkClick('connect_matches')}
                  data-testid="sidebar-link-matches"
                >
                  <Star className="w-4 h-4 mr-2 text-yellow-500" />
                  Connect with {you.high_value_matches_count} Top Matches
                </Button>
                <Button
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => handleSidebarLinkClick('speak_to_speaker')}
                  data-testid="sidebar-link-speaker"
                >
                  <Calendar className="w-4 h-4 mr-2 text-blue-500" />
                  Message Event Speakers
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start" 
                  onClick={() => handleSidebarLinkClick('visit_sponsors')}
                  data-testid="sidebar-link-sponsors"
                >
                  <Building className="w-4 h-4 mr-2 text-purple-500" />
                  Explore Sponsor Booths
                </Button>
              </CardContent>
            </Card>

            {/* Your Top Matches Preview */}
            {you.top_matches.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Top Matches Preview
                    </div>
                    <Badge 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-[#CD853F] hover:text-white"
                      onClick={() => handleSidebarLinkClick('high_value_matches')}
                    >
                      {you.high_value_matches_count}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {you.top_matches.slice(0, 3).map((match: any, index: number) => (
                      <div 
                        key={match.member_id} 
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        onClick={() => handleSidebarLinkClick('connect_matches')}
                      >
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="text-xs">
                            {match.name.split(' ').map((n: string) => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{match.name}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-300 truncate">
                            {match.company}
                          </div>
                        </div>
                        <ExternalLink className="w-3 h-3 text-gray-400" />
                      </div>
                    ))}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleSidebarLinkClick('high_value_matches')}
                    >
                      View All Matches
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Companies Attending */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building className="h-5 w-5 text-blue-500" />
                  Companies ({event.companies.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {event.companies.slice(0, 6).map((company: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                      <img 
                        src={company.logo_url} 
                        alt={company.name}
                        className="w-5 h-5 rounded"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      <Building className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{company.name}</span>
                    </div>
                  ))}
                  {event.companies.length > 6 && (
                    <div className="text-xs text-gray-500 mt-2">
                      +{event.companies.length - 6} more companies
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={() => handleSidebarLinkClick('meet_attendees')}
                  >
                    Explore All Attendees
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Event Sponsors */}
            {event.sponsors.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Award className="h-5 w-5 text-purple-500" />
                    Event Sponsors
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {event.sponsors.map((sponsor: any, index: number) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <img src={sponsor.logo} alt={sponsor.name} className="w-6 h-6 rounded" />
                        <span>{sponsor.name}</span>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => handleSidebarLinkClick('visit_sponsors')}
                    >
                      Visit Sponsor Booths
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Your Alignment Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your Event Fit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Industry matches</span>
                  <Badge variant="outline">{you.your_industry_count}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Similar roles</span>
                  <Badge variant="outline">{you.your_role_count}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">High-value matches</span>
                  <Badge variant="outline" className="text-[#CD853F] border-[#CD853F]/30">
                    {you.high_value_matches_count}
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleSidebarLinkClick('set_networking_goals')}
                >
                  Optimize My Experience
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}