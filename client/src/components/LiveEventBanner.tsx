import { useState, useEffect } from 'react';
import { Clock, Users, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';

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

  // Fetch today's live events
  const { data: liveEvent } = useQuery<LiveEvent>({
    queryKey: ['/api/events/live-today'],
    refetchInterval: 30000, // Refetch every 30 seconds
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
        return;
      }

      if (now >= eventStart) {
        // Event has started
        setIsEventStarted(true);
        setTimeRemaining(null);
        return;
      }

      // Event hasn't started yet - show countdown
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

  return (
    <div className="w-full bg-gradient-to-r from-black to-gray-900 border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
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

          <Button 
            onClick={handleJoinEvent}
            className="bg-[#CD853F] text-black hover:bg-[#CD853F]/80 font-semibold px-6 py-2"
          >
            {isEventStarted ? 'Join Live Event' : 'Enter Early'}
          </Button>
        </div>
      </div>
    </div>
  );
}