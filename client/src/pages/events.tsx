import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search, Calendar, MapPin, Users, Clock, ExternalLink, Star, Sparkles } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Event {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  capacity: number;
  registered: number;
  isUserRegistered: boolean;
  tags: string[];
  imageUrl?: string;
  eventbriteUrl?: string;
  lumaUrl?: string;
  organizerId: string;
  createdAt: string;
}

export default function Events() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
  });

  const registerMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return await apiRequest("POST", `/api/events/${eventId}/register`, {});
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "You've been registered for this event!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  const filteredEvents = events.filter((event) => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedFilter === "registered") {
      return matchesSearch && event.isUserRegistered;
    }
    if (selectedFilter === "upcoming") {
      return matchesSearch && new Date(event.startDate) > new Date();
    }
    return matchesSearch;
  });

  const handleRegister = (eventId: string) => {
    registerMutation.mutate(eventId);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return '';
    }
  };

  const getEventStatusBadge = (event: Event) => {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (event.isUserRegistered) {
      return <Badge className="bg-green-600 text-white">Registered</Badge>;
    }
    if (event.registered >= event.capacity) {
      return <Badge variant="destructive">Full</Badge>;
    }
    if (startDate > now) {
      return <Badge className="bg-blue-600 text-white">Upcoming</Badge>;
    }
    if (startDate <= now && endDate >= now) {
      return <Badge className="bg-yellow-600 text-white">Live</Badge>;
    }
    return <Badge variant="secondary">Past</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-48 bg-gray-300 rounded-t-lg"></div>
              <CardHeader>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                <div className="h-3 bg-gray-300 rounded w-full"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8 bg-white text-gray-900">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="h-8 w-8 text-[#CD853F]" />
          <h1 className="text-4xl font-bold font-playfair text-black">Platform Events</h1>
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Manage your platform events and registrations
        </p>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-300 text-black"
          />
        </div>
        <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="w-auto">
          <TabsList className="bg-gray-100">
            <TabsTrigger value="all" className="text-gray-700 data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">All Events</TabsTrigger>
            <TabsTrigger value="upcoming" className="text-gray-700 data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">Upcoming</TabsTrigger>
            <TabsTrigger value="registered" className="text-gray-700 data-[state=active]:bg-[#CD853F] data-[state=active]:text-black">My Events</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-black">No Events Found</h3>
          <p className="text-gray-600">
            {searchQuery ? "Try adjusting your search terms" : "Check back soon for upcoming events"}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} className="group hover:shadow-lg transition-shadow duration-200 overflow-hidden bg-white border-gray-200">
              {/* Event Image */}
              {event.imageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute top-4 right-4">
                    {getEventStatusBadge(event)}
                  </div>
                </div>
              )}
              
              <CardHeader className="space-y-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl font-playfair line-clamp-2 flex-1 text-black">
                    {event.title}
                  </CardTitle>
                  {!event.imageUrl && (
                    <div className="ml-2">
                      {getEventStatusBadge(event)}
                    </div>
                  )}
                </div>
                <CardDescription className="line-clamp-3 text-gray-600">
                  {event.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Event Details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4 text-[#CD853F]" />
                    <span>{formatDate(event.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4 text-[#CD853F]" />
                    <span>{formatTime(event.startDate)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4 text-[#CD853F]" />
                    <span className="line-clamp-1">{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Users className="h-4 w-4 text-[#CD853F]" />
                    <span>{event.registered} / {event.capacity} registered</span>
                  </div>
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {event.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs border-gray-300 text-gray-600">
                        {tag}
                      </Badge>
                    ))}
                    {event.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs border-gray-300 text-gray-600">
                        +{event.tags.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {!event.isUserRegistered && event.registered < event.capacity && new Date(event.startDate) > new Date() ? (
                    <Button
                      onClick={() => handleRegister(event.id)}
                      disabled={registerMutation.isPending}
                      className="flex-1 bg-[#CD853F] hover:bg-[#CD853F]/80 text-black"
                    >
                      {registerMutation.isPending ? "Registering..." : "Register"}
                    </Button>
                  ) : (
                    <Button variant="outline" className="flex-1 border-gray-300 text-gray-600" disabled>
                      {event.isUserRegistered ? "Registered" : 
                       event.registered >= event.capacity ? "Full" : "Past Event"}
                    </Button>
                  )}

                  {/* External Links */}
                  {(event.lumaUrl || event.eventbriteUrl) && (
                    <div className="flex gap-1">
                      {event.lumaUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(event.lumaUrl, '_blank')}
                          className="px-2 text-gray-600 hover:text-[#CD853F]"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                      {event.eventbriteUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(event.eventbriteUrl, '_blank')}
                          className="px-2 text-gray-600 hover:text-[#CD853F]"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Registration Progress */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-gray-600">
                    <span>Registration</span>
                    <span>{Math.round((event.registered / event.capacity) * 100)}% full</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-[#CD853F] h-1.5 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((event.registered / event.capacity) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CTA Section */}
      <div className="text-center py-12 border-t border-gray-200">
        <h2 className="text-2xl font-bold font-playfair mb-4 text-black">Ready to Network?</h2>
        <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
          Join STAK Sync events to connect with vetted investors, successful founders, and industry experts. 
          Every connection is an opportunity to accelerate your journey.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Star className="h-5 w-5 text-[#CD853F]" />
          <span className="text-sm text-gray-600">
            Curated for STAK's exclusive membership community
          </span>
        </div>
      </div>
    </div>
  );
}