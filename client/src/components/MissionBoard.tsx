import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  CheckCircle, 
  Clock, 
  Play, 
  Trophy, 
  Target, 
  Mic,
  Network,
  Users,
  Calendar,
  Star,
  Building,
  Share,
  MessageSquare,
  UserPlus,
  MessageCircle,
  Zap,
  Award
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

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

interface MissionBoardProps {
  eventId: string;
  missions: Mission[];
  progress: Progress;
  onMissionStart: (missionId: string) => void;
}

const MISSION_ICONS = {
  'speak_to_speaker': Mic,
  'set_networking_goals': Network,
  'meet_attendees': Users,
  'see_program_content': Calendar,
  'connect_matches': Star,
  'visit_sponsors': Building,
  'share_insights': Share,
  'schedule_sync': MessageSquare,
  'contribute_crowd_intel': UserPlus,
  'post_event_feedback': MessageCircle
};

const CATEGORY_COLORS = {
  'engagement': 'bg-blue-500',
  'strategy': 'bg-purple-500',
  'networking': 'bg-green-500',
  'preparation': 'bg-orange-500',
  'exploration': 'bg-cyan-500',
  'community': 'bg-pink-500',
  'feedback': 'bg-gray-500'
};

export function MissionBoard({ eventId, missions, progress, onMissionStart }: MissionBoardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [expandedMission, setExpandedMission] = useState<string | null>(null);
  const [missionInputs, setMissionInputs] = useState<Record<string, any>>({});

  // Update mission status mutation
  const updateMissionMutation = useMutation({
    mutationFn: async ({ missionId, status }: { missionId: string; status: string }) => {
      return apiRequest(`/api/events/${eventId}/missions/${missionId}`, 'PATCH', { status });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Success!",
        description: data.message,
      });
      // Refresh missions data
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/missions`] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update mission status.",
        variant: "destructive",
      });
    }
  });

  const handleMissionAction = (mission: Mission) => {
    if (mission.status === 'completed') {
      return; // Already completed
    }

    if (mission.status === 'not_started') {
      // Start the mission
      setExpandedMission(mission.id);
      updateMissionMutation.mutate({ missionId: mission.id, status: 'in_progress' });
      onMissionStart(mission.id);
    } else {
      // Mission is in progress, show expanded view
      setExpandedMission(expandedMission === mission.id ? null : mission.id);
    }
  };

  const handleMissionComplete = (missionId: string) => {
    updateMissionMutation.mutate({ missionId, status: 'completed' });
    setExpandedMission(null);
  };

  const renderMissionContent = (mission: Mission) => {
    const isExpanded = expandedMission === mission.id;
    
    if (!isExpanded) return null;

    // Render different content based on mission type
    switch (mission.id) {
      case 'speak_to_speaker':
        return (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Textarea
              placeholder="What would you like to ask or tell the speakers? (e.g., questions about their topic, suggestions for content focus...)"
              className="mb-3"
              value={missionInputs[mission.id] || ''}
              onChange={(e) => setMissionInputs(prev => ({ ...prev, [mission.id]: e.target.value }))}
              data-testid="input-speaker-message-mission"
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleMissionComplete(mission.id)}
                disabled={!missionInputs[mission.id]?.trim()}
                data-testid="button-complete-speaker-mission"
              >
                <Mic className="w-4 h-4 mr-2" />
                Send to Speakers
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setExpandedMission(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        );

      case 'set_networking_goals':
        return (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <Textarea
              placeholder="What do you want to achieve at this event? (e.g., find co-founders, raise funding, hire talent, learn about AI trends...)"
              className="mb-3"
              value={missionInputs[mission.id] || ''}
              onChange={(e) => setMissionInputs(prev => ({ ...prev, [mission.id]: e.target.value }))}
              data-testid="input-networking-goal-mission"
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleMissionComplete(mission.id)}
                disabled={!missionInputs[mission.id]?.trim()}
                data-testid="button-complete-networking-mission"
              >
                <Zap className="w-4 h-4 mr-2" />
                Analyze Goals
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setExpandedMission(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        );

      case 'program_content':
        return (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Checkbox 
                  id="agenda-reviewed" 
                  onCheckedChange={(checked) => {
                    if (checked) handleMissionComplete(mission.id);
                  }}
                />
                <label htmlFor="agenda-reviewed" className="text-sm">
                  I've reviewed the event agenda and identified sessions of interest
                </label>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
              Complete this mission to earn {mission.points} Sync Points
            </p>
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={() => handleMissionComplete(mission.id)}
                data-testid={`button-complete-${mission.id}`}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setExpandedMission(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        );
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'locked':
        return <Clock className="w-4 h-4 text-gray-400" />;
      default:
        return <Play className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'locked':
        return 'Locked';
      default:
        return 'Not Started';
    }
  };

  const getBadgeColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'locked':
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Overview */}
      <Card className="bg-gradient-to-r from-[#CD853F]/10 to-green-500/10 border-[#CD853F]/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#CD853F]" />
            Mission Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-[#CD853F]">
                  {progress.points_earned} / {progress.points_total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Sync Points Earned
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">
                  {progress.missions_completed} / {progress.missions_total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Missions Complete
                </div>
              </div>
            </div>
            <Progress 
              value={Math.round((progress.points_earned / progress.points_total) * 100)} 
              className="h-3 bg-gray-200 dark:bg-gray-700"
            />
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
              <span>Progress: {Math.round((progress.points_earned / progress.points_total) * 100)}%</span>
              {progress.missions_completed === progress.missions_total ? (
                <span className="text-green-600 font-medium">🎉 All missions complete!</span>
              ) : progress.missions_completed >= progress.missions_total * 0.75 ? (
                <span className="text-yellow-600">Almost there!</span>
              ) : (
                <span>Keep going!</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mission List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Your Event Missions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {missions.map((mission) => {
            const IconComponent = MISSION_ICONS[mission.id as keyof typeof MISSION_ICONS] || Target;
            const categoryColor = CATEGORY_COLORS[mission.category as keyof typeof CATEGORY_COLORS] || 'bg-gray-500';
            const isExpanded = expandedMission === mission.id;
            
            return (
              <div key={mission.id} className={`border rounded-lg p-4 transition-all ${
                isExpanded ? 'border-[#CD853F]/50 bg-[#CD853F]/5' : 'border-gray-200 dark:border-gray-700'
              }`}>
                <div className="flex items-center gap-3">
                  {/* Mission Icon */}
                  <div className={`w-10 h-10 rounded-full ${categoryColor} flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  
                  {/* Mission Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{mission.title}</h3>
                      <Badge 
                        className={`text-xs ${getBadgeColor(mission.status)}`}
                        data-testid={`badge-${mission.id}-status`}
                      >
                        {getStatusText(mission.status)}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {mission.description}
                    </p>
                  </div>

                  {/* Points & Status */}
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[#CD853F] border-[#CD853F]/30">
                      +{mission.points} pts
                    </Badge>
                    {getStatusIcon(mission.status)}
                    <Button
                      size="sm"
                      onClick={() => handleMissionAction(mission)}
                      disabled={mission.status === 'completed' || mission.status === 'locked'}
                      className={mission.status === 'completed' ? 'bg-green-600' : mission.status === 'locked' ? 'opacity-50 cursor-not-allowed' : ''}
                      data-testid={`button-mission-${mission.id}`}
                    >
                      {mission.status === 'completed' ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Done
                        </>
                      ) : mission.status === 'locked' ? (
                        <>
                          <Clock className="w-4 h-4 mr-2" />
                          {mission.cta_label}
                        </>
                      ) : mission.status === 'in_progress' ? (
                        isExpanded ? 'Collapse' : 'Continue'
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          {mission.cta_label}
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Expanded Mission Content */}
                {renderMissionContent(mission)}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Achievement Badges */}
      {progress.points_earned > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-yellow-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {progress.missions_completed >= 1 && (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  🚀 First Mission Complete
                </Badge>
              )}
              {progress.missions_completed >= 3 && (
                <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                  🎯 Triple Threat
                </Badge>
              )}
              {Math.round((progress.points_earned / progress.points_total) * 100) >= 50 && (
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                  ⚡ Halfway Hero
                </Badge>
              )}
              {progress.missions_completed === progress.missions_total && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  🏆 Mission Master
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}