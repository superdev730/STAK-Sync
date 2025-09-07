import { useState, useEffect } from 'react';
import { Clock, Users, Calendar, Zap, Trophy, TrendingUp, Timer, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Link } from 'wouter';
import { useIsMobile } from '@/hooks/use-mobile';

interface LiveEvent {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  location: string;
  isVirtual: boolean;
  eventType: string;
  attendeeCount?: number;
  imageUrl?: string;
  registrationCount?: number;
}

interface EventStats {
  totalMatches: number;
  topMatchScore: number;
  activeConnections: number;
  highQualityMatches: number; // matches above 80%
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function LiveEventBanner() {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining | null>(null);
  const [isEventStarted, setIsEventStarted] = useState(false);
  const [isEventActive, setIsEventActive] = useState(false);
  const isMobile = useIsMobile();

  // Fetch today's live events
  const { data: liveEvent } = useQuery<LiveEvent>({
    queryKey: ['/api/events/live-today'],
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch event stats if event is live
  const { data: eventStats } = useQuery<EventStats>({
    queryKey: ['/api/events', liveEvent?.id, 'stats'],
    enabled: !!liveEvent?.id && isEventActive,
    refetchInterval: 10000, // Refetch every 10 seconds for real-time stats
  });

  // Start AI matchmaking mutation
  const startMatchmakingMutation = useMutation({
    mutationFn: async () => {
      if (!liveEvent?.id) throw new Error('No live event available');
      return apiRequest(`/api/events/${liveEvent.id}/start-matchmaking`, 'POST');
    },
  });

  useEffect(() => {
    if (!liveEvent || !liveEvent.startDate) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const eventStart = new Date(liveEvent.startDate).getTime();
      const eventEnd = new Date(liveEvent.endDate).getTime();
      
      if (now >= eventEnd) {
        // Event has ended
        setTimeRemaining(null);
        setIsEventStarted(false);
        setIsEventActive(false);
        return;
      }

      if (now >= eventStart) {
        // Event has started and is active
        setIsEventStarted(true);
        setIsEventActive(true);
        setTimeRemaining(null);
        return;
      }

      // Event hasn't started yet - show countdown
      setIsEventActive(false);
      const timeDiff = eventStart - now;
      
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

      setTimeRemaining({ days, hours, minutes, seconds });
      setIsEventStarted(false);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [liveEvent]);

  // Don't show banner if no live event today
  if (!liveEvent) return null;

  const handleJoinEvent = () => {
    // Navigate to live event page
    if (liveEvent) {
      window.location.href = `/events/live/${liveEvent.id}`;
    }
  };

  if (isMobile) {
    return (
      <div className="w-full bg-gradient-to-r from-black to-gray-900 border-b-2 border-stak-copper shadow-2xl mt-2 mb-4" style={{
        boxShadow: '0 0 25px rgba(205, 133, 63, 0.4), 0 0 50px rgba(205, 133, 63, 0.2), inset 0 1px 0 rgba(205, 133, 63, 0.3), 0 2px 10px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="max-w-7xl mx-auto px-3 py-4">
          {/* Mobile: Event Title and Image - First Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {liveEvent.imageUrl && (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-700 flex-shrink-0">
                  <img
                    src={liveEvent.imageUrl}
                    alt={liveEvent.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Calendar className="h-4 w-4 text-[#CD853F] flex-shrink-0" />
                <span className="text-white font-semibold text-base truncate">{liveEvent.title}</span>
              </div>
            </div>
            
            {/* Mobile: Main Action Button */}
            <Button 
              onClick={handleJoinEvent}
              size="sm"
              className="bg-[#CD853F] text-black hover:bg-[#CD853F]/80 font-semibold px-4 py-2 flex-shrink-0"
            >
              {isEventStarted ? 'Join' : 'Enter'}
            </Button>
          </div>

          {/* Mobile: Countdown Timer or Live Status - Second Row */}
          {isEventStarted ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white font-medium text-sm">Live now</span>
                {liveEvent.attendeeCount && (
                  <div className="flex items-center gap-1 text-gray-300">
                    <Users className="h-3 w-3" />
                    <span className="text-sm">{liveEvent.attendeeCount}</span>
                  </div>
                )}
              </div>
              
              {/* AI Matchmaking for Mobile */}
              {isEventActive && (
                <Button
                  onClick={() => startMatchmakingMutation.mutate()}
                  disabled={startMatchmakingMutation.isPending}
                  size="sm"
                  className="bg-gradient-to-r from-[#CD853F] to-[#B8860B] text-black hover:from-[#CD853F]/90 hover:to-[#B8860B]/90 font-semibold px-3 py-2 flex items-center gap-2"
                >
                  <Zap className="h-3 w-3" />
                  AI Match
                </Button>
              )}
            </div>
          ) : timeRemaining ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#CD853F]" />
                <span className="text-white font-medium text-sm">Starts in:</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                {timeRemaining.days > 0 && (
                  <>
                    <div className="text-center">
                      <div className="text-[#CD853F] font-bold text-lg">{timeRemaining.days}</div>
                      <div className="text-gray-400 text-xs">DAYS</div>
                    </div>
                    <div className="text-white">:</div>
                  </>
                )}
                <div className="text-center">
                  <div className="text-[#CD853F] font-bold text-lg">{timeRemaining.hours.toString().padStart(2, '0')}</div>
                  <div className="text-gray-400 text-xs">HRS</div>
                </div>
                <div className="text-white">:</div>
                <div className="text-center">
                  <div className="text-[#CD853F] font-bold text-lg">{timeRemaining.minutes.toString().padStart(2, '0')}</div>
                  <div className="text-gray-400 text-xs">MIN</div>
                </div>
                <div className="text-white">:</div>
                <div className="text-center">
                  <div className="text-[#CD853F] font-bold text-lg">{timeRemaining.seconds.toString().padStart(2, '0')}</div>
                  <div className="text-gray-400 text-xs">SEC</div>
                </div>
              </div>
              
              {/* Event Prep Button for Mobile */}
              {!isEventStarted && (
                <div className="flex justify-center pt-2">
                  <Button 
                    asChild
                    size="sm"
                    className="bg-[#CD853F]/20 text-[#CD853F] border border-[#CD853F]/30 hover:bg-[#CD853F]/30 font-semibold"
                  >
                    <Link href={`/events/live/${liveEvent.id}/preparation`}>
                      <Target className="w-3 h-3 mr-2" />
                      Event Prep
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gradient-to-r from-black to-gray-900 border-b-2 border-stak-copper shadow-2xl mt-2 mb-6" style={{
      boxShadow: '0 0 30px rgba(205, 133, 63, 0.5), 0 0 60px rgba(205, 133, 63, 0.2), inset 0 1px 0 rgba(205, 133, 63, 0.4), 0 4px 15px rgba(0, 0, 0, 0.4)'
    }}>
      <div className="max-w-7xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Event Cover Image */}
            {liveEvent.imageUrl && (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-700">
                <img
                  src={liveEvent.imageUrl}
                  alt={liveEvent.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#CD853F]" />
              <span className="text-white font-semibold text-lg">{liveEvent.title}</span>
            </div>
            
            {isEventStarted ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <span className="text-white font-medium">Live networking event in progress</span>
                {liveEvent.attendeeCount && (
                  <div className="flex items-center gap-1 text-gray-300">
                    <Users className="h-4 w-4" />
                    <span>{liveEvent.attendeeCount} attendees online</span>
                  </div>
                )}
              </div>
            ) : timeRemaining ? (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[#CD853F]" />
                  <span className="text-white font-medium">Starts in:</span>
                </div>
                <div className="flex items-center gap-3">
                  {timeRemaining.days > 0 && (
                    <div className="text-center">
                      <div className="text-[#CD853F] font-bold text-xl">{timeRemaining.days}</div>
                      <div className="text-gray-400 text-xs">DAYS</div>
                    </div>
                  )}
                  <div className="text-center">
                    <div className="text-[#CD853F] font-bold text-xl">{timeRemaining.hours.toString().padStart(2, '0')}</div>
                    <div className="text-gray-400 text-xs">HRS</div>
                  </div>
                  <div className="text-white">:</div>
                  <div className="text-center">
                    <div className="text-[#CD853F] font-bold text-xl">{timeRemaining.minutes.toString().padStart(2, '0')}</div>
                    <div className="text-gray-400 text-xs">MIN</div>
                  </div>
                  <div className="text-white">:</div>
                  <div className="text-center">
                    <div className="text-[#CD853F] font-bold text-xl">{timeRemaining.seconds.toString().padStart(2, '0')}</div>
                    <div className="text-gray-400 text-xs">SEC</div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Event Statistics and Actions */}
          <div className="flex items-center gap-4">
            {/* Live Event Statistics Scoreboard */}
            {isEventActive && eventStats && (
              <div className="flex items-center gap-4 mr-4">
                <div className="flex items-center gap-3 bg-black/40 rounded-lg px-3 py-2 border border-gray-700">
                  <div className="flex items-center gap-1">
                    <Trophy className="h-4 w-4 text-[#CD853F]" />
                    <div className="text-center">
                      <div className="text-white font-bold text-sm">{eventStats.topMatchScore}%</div>
                      <div className="text-gray-400 text-xs">Top Match</div>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-gray-600" />
                  <div className="flex items-center gap-1">
                    <Zap className="h-4 w-4 text-green-400" />
                    <div className="text-center">
                      <div className="text-white font-bold text-sm">{eventStats.highQualityMatches}</div>
                      <div className="text-gray-400 text-xs">Quality Matches</div>
                    </div>
                  </div>
                  <div className="w-px h-6 bg-gray-600" />
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                    <div className="text-center">
                      <div className="text-white font-bold text-sm">{eventStats.activeConnections}</div>
                      <div className="text-gray-400 text-xs">Connections</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Matchmaking CTA */}
            {isEventActive && (
              <Button
                onClick={() => startMatchmakingMutation.mutate()}
                disabled={startMatchmakingMutation.isPending}
                className="bg-gradient-to-r from-[#CD853F] to-[#B8860B] text-black hover:from-[#CD853F]/90 hover:to-[#B8860B]/90 font-semibold px-4 py-2 flex items-center gap-2"
              >
                <Zap className="h-4 w-4" />
                {startMatchmakingMutation.isPending ? 'Starting...' : 'AI Matchmaking'}
              </Button>
            )}

            {/* Event Preparation Button */}
            {!isEventStarted && (
              <Button 
                asChild
                className="bg-[#CD853F] text-black hover:bg-[#CD853F]/80 font-semibold px-6 py-2"
              >
                <Link href={`/events/live/${liveEvent.id}/preparation`}>
                  <Target className="w-4 h-4 mr-2" />
                  Event Prep
                </Link>
              </Button>
            )}
            
            {/* Join Event Button */}
            <Button 
              onClick={handleJoinEvent}
              className="bg-[#CD853F] text-black hover:bg-[#CD853F]/80 font-semibold px-6 py-2"
            >
              {isEventStarted ? 'Join Live Event' : 'Enter Early'}
            </Button>
          </div>
        </div>

        {/* Additional Event Information Bar for Live Events */}
        {isEventActive && (
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Badge variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2" />
                  LIVE NOW
                </Badge>
                
                {liveEvent.registrationCount && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{liveEvent.registrationCount} registered</span>
                  </div>
                )}
                
                {eventStats && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <Timer className="h-4 w-4" />
                    <span className="font-medium">{eventStats.totalMatches} total matches generated</span>
                  </div>
                )}
              </div>
              
              <div className="text-gray-400 text-sm">
                Real-time networking • AI-powered matching
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}