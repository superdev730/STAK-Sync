import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Clock, Sparkles, Plus, Upload, Activity } from "lucide-react";
import { CSVImportModal } from "@/components/CSVImportModal";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  maxAttendees: number;
  registrationCount: number;
  eventType: string;
  status: string;
  tags: string[];
  organizer: {
    firstName: string;
    lastName: string;
    title: string;
    company: string;
  };
  rooms: Array<{
    id: string;
    name: string;
    description: string;
    maxParticipants: number;
    participantCount: number;
    roomType: string;
  }>;
}

interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  registeredAt: string;
  interests: string[];
  networkingGoals: string[];
  event: Event;
}

export default function Events() {
  const [selectedEventType, setSelectedEventType] = useState<string>("all");
  
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const { data: userEvents = [] } = useQuery<EventRegistration[]>({
    queryKey: ["/api/user/events"],
  });

  const seedEventsMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/seed-events', 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ eventId, interests, networkingGoals }: { 
      eventId: string; 
      interests: string[]; 
      networkingGoals: string[] 
    }) => {
      return apiRequest(`/api/events/${eventId}/register`, 'POST', { interests, networkingGoals });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/events"] });
    },
  });

  const unregisterMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest(`/api/events/${eventId}/register`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/events"] });
    },
  });

  const isRegistered = (eventId: string) => {
    return userEvents.some(reg => reg.eventId === eventId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredEvents = events.filter(event => 
    selectedEventType === "all" || event.eventType === selectedEventType
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-80 bg-muted/20 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
              STAK Signal Events
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Exclusive networking opportunities for the STAK ecosystem. Connect with fellow founders, investors, and innovators.
          </p>
          
          {/* Event Type Filters */}
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            {["all", "networking", "roundtable", "summit", "leadership"].map((type) => (
              <Button
                key={type}
                variant={selectedEventType === type ? "default" : "outline"}
                onClick={() => setSelectedEventType(type)}
                className="capitalize"
              >
                {type === "all" ? "All Events" : type.replace("-", " ")}
              </Button>
            ))}
          </div>

          {/* Seed Events Button (for demo) */}
          {events.length === 0 && (
            <div className="mt-6">
              <Button
                onClick={() => seedEventsMutation.mutate()}
                disabled={seedEventsMutation.isPending}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                {seedEventsMutation.isPending ? "Creating Sample Events..." : "Create Sample Events"}
              </Button>
            </div>
          )}
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="group hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="space-y-4">
                <div className="flex items-start justify-between">
                  <Badge variant={event.eventType === "summit" ? "default" : "secondary"} className="text-xs">
                    {event.eventType.replace("-", " ").toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {event.status.toUpperCase()}
                  </Badge>
                </div>
                
                <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                  {event.title}
                </CardTitle>
                
                <CardDescription className="line-clamp-3 text-sm leading-relaxed">
                  {event.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Event Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{formatTime(event.startDate)} - {formatTime(event.endDate)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4 text-primary" />
                    <span>{event.registrationCount} / {event.maxAttendees} registered</span>
                  </div>
                </div>

                {/* Organizer */}
                <div className="pt-2 border-t border-border/50">
                  <p className="text-xs text-muted-foreground">
                    Organized by{" "}
                    <span className="font-medium text-foreground">
                      {event.organizer?.firstName || "STAK"} {event.organizer?.lastName || "Team"}
                    </span>
                    {event.organizer?.title && (
                      <span>, {event.organizer.title}</span>
                    )}
                  </p>
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {event.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs py-1 px-2">
                        {tag}
                      </Badge>
                    ))}
                    {event.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs py-1 px-2">
                        +{event.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Networking Rooms */}
                {event.rooms && event.rooms.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Networking Rooms</h4>
                    <div className="space-y-1">
                      {event.rooms.slice(0, 2).map((room) => (
                        <div key={room.id} className="text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                          <div className="font-medium text-foreground">{room.name}</div>
                          <div className="line-clamp-1">{room.description}</div>
                          <div className="mt-1 text-xs">
                            {room.participantCount || 0} / {room.maxParticipants} participants
                          </div>
                        </div>
                      ))}
                      {event.rooms.length > 2 && (
                        <div className="text-xs text-muted-foreground text-center py-1">
                          +{event.rooms.length - 2} more rooms
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 space-y-2">
                  {isRegistered(event.id) ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => unregisterMutation.mutate(event.id)}
                      disabled={unregisterMutation.isPending}
                    >
                      {unregisterMutation.isPending ? "Canceling..." : "Cancel Registration"}
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-primary hover:bg-primary/90"
                      onClick={() => registerMutation.mutate({ 
                        eventId: event.id, 
                        interests: [], 
                        networkingGoals: [] 
                      })}
                      disabled={registerMutation.isPending || event.registrationCount >= event.maxAttendees}
                    >
                      {registerMutation.isPending ? "Registering..." : 
                       event.registrationCount >= event.maxAttendees ? "Event Full" : "Register"}
                    </Button>
                  )}
                  
                  {/* Live Dashboard Button - for registered attendees */}
                  {isRegistered(event.id) && (
                    <Button
                      variant="outline"
                      className="w-full border-primary text-primary hover:bg-primary/10"
                      onClick={() => window.location.href = `/live-dashboard?eventId=${event.id}`}
                    >
                      <Activity className="h-4 w-4 mr-2" />
                      Live Dashboard
                    </Button>
                  )}
                  
                  {/* CSV Import Button for Event Organizers */}
                  <CSVImportModal eventId={event.id}>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Attendees
                    </Button>
                  </CSVImportModal>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEvents.length === 0 && events.length > 0 && (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No events found</h3>
            <p className="text-muted-foreground">
              No {selectedEventType.replace("-", " ")} events are currently available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}