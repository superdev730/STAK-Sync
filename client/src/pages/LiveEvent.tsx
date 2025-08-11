import { useState, useEffect } from 'react';
import { useParams } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Clock, Users, AlertCircle, Ticket, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface LiveEventData {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  isVirtual: boolean;
  eventType: string;
  coverImageUrl?: string;
  attendeeCount?: number;
  hasUserTicket?: boolean;
  isMatchmakingActive?: boolean;
}

export default function LiveEvent() {
  const { eventId } = useParams();
  const [currentTime, setCurrentTime] = useState(new Date());

  const { data: event, isLoading } = useQuery<LiveEventData>({
    queryKey: ['/api/events/live', eventId],
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
  });

  const { data: userProfile } = useQuery({
    queryKey: ['/api/auth/user'],
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#CD853F] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Event Not Found</h2>
            <p className="text-gray-600">This live event could not be found or may have ended.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const eventStart = new Date(event.startDate);
  const eventEnd = new Date(event.endDate);
  const isEventActive = currentTime >= eventStart && currentTime <= eventEnd;
  const isEventStarted = currentTime >= eventStart;
  const hasEnded = currentTime > eventEnd;

  const getEventStatus = () => {
    if (hasEnded) return { text: 'Event Ended', color: 'bg-gray-500' };
    if (isEventActive) return { text: 'Live Now', color: 'bg-red-500 animate-pulse' };
    return { text: 'Starting Soon', color: 'bg-[#CD853F]' };
  };

  const status = getEventStatus();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-black to-gray-900 text-white relative">
        {/* Event Cover Image Background */}
        {event.coverImageUrl && (
          <div className="absolute inset-0">
            <img
              src={event.coverImageUrl}
              alt={event.title}
              className="w-full h-full object-cover opacity-30"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-gray-900/80" />
          </div>
        )}
        
        <div className="max-w-7xl mx-auto px-4 py-12 relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Badge className={`${status.color} text-white`}>
                {status.text}
              </Badge>
              {isEventActive && event.attendeeCount && (
                <div className="flex items-center gap-2 text-gray-300">
                  <Users className="h-4 w-4" />
                  <span>{event.attendeeCount} attendees online</span>
                </div>
              )}
            </div>
            <div className="text-right text-gray-300">
              <div className="text-sm">
                {eventStart.toLocaleDateString()} • {eventStart.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit', 
                  hour12: true 
                })}
              </div>
              <div className="text-xs">{event.location}</div>
            </div>
          </div>
          
          <h1 className="text-4xl font-bold mb-4">{event.title}</h1>
          <p className="text-xl text-gray-300 max-w-3xl">{event.description}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Access Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5 text-[#CD853F]" />
                  Event Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!userProfile ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Please log in to access this live event.
                    </AlertDescription>
                  </Alert>
                ) : !event.hasUserTicket ? (
                  <Alert>
                    <Lock className="h-4 w-4" />
                    <AlertDescription>
                      You need a ticket to access the matchmaking features of this live event. 
                      You can still view the event content, but networking features are restricted to ticket holders.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-green-600">
                      <Ticket className="h-4 w-4" />
                      <span className="font-medium">You have access to this event</span>
                    </div>
                    
                    {isEventStarted && event.isMatchmakingActive ? (
                      <Button className="w-full bg-[#CD853F] text-black hover:bg-[#CD853F]/80">
                        Join Live Matchmaking
                      </Button>
                    ) : isEventStarted ? (
                      <div className="text-center py-4">
                        <p className="text-gray-600 mb-2">Live matchmaking will begin shortly</p>
                        <Button variant="outline" disabled>
                          Waiting for Matchmaking to Start
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-gray-600 mb-2">
                          Live matchmaking will be available when the event starts
                        </p>
                        <p className="text-sm text-gray-500">
                          Event starts at {eventStart.toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit', 
                            hour12: true 
                          })}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Event Details */}
            <Card>
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Description</h4>
                    <p className="text-gray-600">{event.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Start Time</h4>
                      <p className="text-gray-600">
                        {eventStart.toLocaleDateString()} at {eventStart.toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit', 
                          hour12: true 
                        })}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">Duration</h4>
                      <p className="text-gray-600">
                        {Math.round((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60))} minutes
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Countdown */}
            {!isEventStarted && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-[#CD853F]" />
                    Event Countdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <EventCountdown targetDate={eventStart} />
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">
                  View Event Details
                </Button>
                <Button variant="outline" className="w-full">
                  Share Event
                </Button>
                {event.hasUserTicket && (
                  <Button variant="outline" className="w-full">
                    Download Calendar Reminder
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventCountdown({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const now = new Date().getTime();
    const target = targetDate.getTime();
    const difference = target - now;

    if (difference > 0) {
      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((difference % (1000 * 60)) / 1000)
      };
    }
    return null;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <div className="text-center">
        <p className="text-lg font-semibold text-[#CD853F]">Event is starting!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 text-center">
      {timeLeft.days > 0 && (
        <div>
          <div className="text-2xl font-bold text-[#CD853F]">{timeLeft.days}</div>
          <div className="text-xs text-gray-500">DAYS</div>
        </div>
      )}
      <div>
        <div className="text-2xl font-bold text-[#CD853F]">{timeLeft.hours}</div>
        <div className="text-xs text-gray-500">HOURS</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-[#CD853F]">{timeLeft.minutes}</div>
        <div className="text-xs text-gray-500">MINUTES</div>
      </div>
      <div>
        <div className="text-2xl font-bold text-[#CD853F]">{timeLeft.seconds}</div>
        <div className="text-xs text-gray-500">SECONDS</div>
      </div>
    </div>
  );
}