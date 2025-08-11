import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Search, Calendar, MapPin, Users, Clock, ExternalLink, Star, Sparkles, Plus, DollarSign, Building, Shield, Award, Zap, Info, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { EventGoalsManager } from "@/components/EventGoalsManager";
import { EventMatchmakingDashboard } from "@/components/EventMatchmakingDashboard";

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
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header with Create Event CTA */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h1 className="text-4xl font-bold text-stak-black mb-2">Events & Meetups</h1>
              <p className="text-gray-600 text-lg">Connect, learn, and grow with the STAK community</p>
            </div>
            
            {/* Enhanced Create Event Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-semibold px-6 py-3 flex items-center space-x-2 shadow-lg">
                  <Plus className="h-5 w-5" />
                  <span>Host Your Event</span>
                  <Sparkles className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl bg-white">
                <DialogHeader>
                  <DialogTitle className="text-2xl font-bold text-stak-black flex items-center space-x-2">
                    <Building className="h-6 w-6 text-stak-copper" />
                    <span>Host Your Event at STAK</span>
                  </DialogTitle>
                  <DialogDescription className="text-lg text-gray-600">
                    Create professional networking events and monetize your expertise through STAK's premium venue and member network.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Key Benefits */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Users className="h-5 w-5 text-stak-copper mt-1" />
                      <div>
                        <h3 className="font-semibold text-stak-black">Curated Audience</h3>
                        <p className="text-sm text-gray-600">Access to STAK's premium member network of VCs, founders, and industry leaders</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Building className="h-5 w-5 text-stak-copper mt-1" />
                      <div>
                        <h3 className="font-semibold text-stak-black">Premium Venues</h3>
                        <p className="text-sm text-gray-600">Professional spaces with state-of-the-art AV and networking facilities</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <DollarSign className="h-5 w-5 text-stak-copper mt-1" />
                      <div>
                        <h3 className="font-semibold text-stak-black">Revenue Sharing</h3>
                        <p className="text-sm text-gray-600">Earn from ticket sales with competitive revenue sharing on paid events</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                      <Award className="h-5 w-5 text-stak-copper mt-1" />
                      <div>
                        <h3 className="font-semibold text-stak-black">Professional Support</h3>
                        <p className="text-sm text-gray-600">Event planning assistance and marketing support from STAK team</p>
                      </div>
                    </div>
                  </div>

                  {/* Process Overview */}
                  <Alert className="border-stak-copper bg-stak-copper/5">
                    <Info className="h-4 w-4" />
                    <AlertTitle className="text-stak-black">Event Approval Process</AlertTitle>
                    <AlertDescription className="text-gray-700">
                      All member-hosted events require STAK team approval to ensure quality and alignment with our community standards. 
                      Venue fees may apply for premium spaces. Revenue sharing terms vary by event type and ticket pricing.
                    </AlertDescription>
                  </Alert>

                  {/* Pricing Tiers */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-stak-black">Event Hosting Tiers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card className="border-gray-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold text-stak-black">Community</CardTitle>
                          <div className="text-2xl font-bold text-stak-black">Free</div>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-xs space-y-1 text-gray-600">
                            <li>• Up to 25 attendees</li>
                            <li>• Basic meeting rooms</li>
                            <li>• No venue fee</li>
                            <li>• Free events only</li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-stak-copper ring-2 ring-stak-copper/20">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold text-stak-copper">Professional</CardTitle>
                          <div className="text-2xl font-bold text-stak-black">$200</div>
                          <div className="text-xs text-gray-500">venue fee</div>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-xs space-y-1 text-gray-600">
                            <li>• Up to 75 attendees</li>
                            <li>• Premium event spaces</li>
                            <li>• AV equipment included</li>
                            <li>• 70% revenue share</li>
                          </ul>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-gray-200">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold text-stak-black">Enterprise</CardTitle>
                          <div className="text-2xl font-bold text-stak-black">$500</div>
                          <div className="text-xs text-gray-500">venue fee</div>
                        </CardHeader>
                        <CardContent>
                          <ul className="text-xs space-y-1 text-gray-600">
                            <li>• Up to 200 attendees</li>
                            <li>• Full venue access</li>
                            <li>• Catering options</li>
                            <li>• 80% revenue share</li>
                          </ul>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      className="flex-1 bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-semibold"
                      onClick={() => window.open('/events/create', '_blank')}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Event Proposal
                    </Button>
                    <Button 
                      variant="outline" 
                      className="border-gray-300 text-stak-black hover:bg-gray-50"
                      onClick={() => window.open('mailto:events@stakventures.com?subject=Event Hosting Inquiry', '_blank')}
                    >
                      Contact Events Team
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Enhanced Revenue Opportunities Banner */}
        <Alert className="mb-6 border-stak-copper bg-gradient-to-r from-stak-copper/10 to-gray-50">
          <Zap className="h-4 w-4" />
          <AlertTitle className="text-stak-black font-semibold">Monetize Your Expertise</AlertTitle>
          <AlertDescription className="text-gray-700">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
              <div>
                Turn your knowledge into revenue through premium workshops, masterclasses, and networking events. 
                STAK provides the venue, audience, and infrastructure - you bring the expertise.
              </div>
              <Button size="sm" variant="outline" className="border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-white">
                Learn More
              </Button>
            </div>
          </AlertDescription>
        </Alert>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-300 text-stak-black"
            />
          </div>
          <Tabs value={selectedFilter} onValueChange={setSelectedFilter} className="w-auto">
            <TabsList className="bg-gray-100">
              <TabsTrigger value="all" className="text-gray-700 data-[state=active]:bg-stak-copper data-[state=active]:text-stak-black">All Events</TabsTrigger>
              <TabsTrigger value="upcoming" className="text-gray-700 data-[state=active]:bg-stak-copper data-[state=active]:text-stak-black">Upcoming</TabsTrigger>
              <TabsTrigger value="registered" className="text-gray-700 data-[state=active]:bg-stak-copper data-[state=active]:text-stak-black">My Events</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Featured Event Types for Members */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-stak-black mb-4">Popular Event Types</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-gray-200">
              <div className="text-center">
                <DollarSign className="h-8 w-8 text-stak-copper mx-auto mb-2" />
                <h3 className="font-semibold text-sm text-stak-black">Workshops</h3>
                <p className="text-xs text-gray-600">$50-200/ticket</p>
              </div>
            </Card>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-gray-200">
              <div className="text-center">
                <Users className="h-8 w-8 text-stak-copper mx-auto mb-2" />
                <h3 className="font-semibold text-sm text-stak-black">Networking</h3>
                <p className="text-xs text-gray-600">$25-75/ticket</p>
              </div>
            </Card>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-gray-200">
              <div className="text-center">
                <Award className="h-8 w-8 text-stak-copper mx-auto mb-2" />
                <h3 className="font-semibold text-sm text-stak-black">Masterclass</h3>
                <p className="text-xs text-gray-600">$100-500/ticket</p>
              </div>
            </Card>
            <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer border-gray-200">
              <div className="text-center">
                <Building className="h-8 w-8 text-stak-copper mx-auto mb-2" />
                <h3 className="font-semibold text-sm text-stak-black">Conferences</h3>
                <p className="text-xs text-gray-600">$200-1000/ticket</p>
              </div>
            </Card>
          </div>
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
                <div className="space-y-2 pt-2">
                  <div className="flex gap-2">
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
                            className="px-2 text-gray-600 hover:text-stak-copper"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                        {event.eventbriteUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(event.eventbriteUrl, '_blank')}
                            className="px-2 text-gray-600 hover:text-stak-copper"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Enhanced Features for Registered Users */}
                  {event.isUserRegistered && (
                    <div className="space-y-2">
                      {/* Event Goals */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-white">
                            <Target className="w-4 h-4 mr-2" />
                            Set Event Goals
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Event Goals & Missions</DialogTitle>
                            <DialogDescription>
                              Set your networking objectives for {event.title} to enhance AI matching
                            </DialogDescription>
                          </DialogHeader>
                          <EventGoalsManager eventId={event.id} />
                        </DialogContent>
                      </Dialog>

                      {/* AI Matchmaking Dashboard */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" className="w-full border-green-500 text-green-700 hover:bg-green-50">
                            <Zap className="w-4 h-4 mr-2" />
                            AI Matchmaking Dashboard
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>AI Matchmaking Dashboard</DialogTitle>
                            <DialogDescription>
                              Your personalized networking insights and AI-powered match recommendations
                            </DialogDescription>
                          </DialogHeader>
                          <EventMatchmakingDashboard eventId={event.id} eventTitle={event.title} />
                        </DialogContent>
                      </Dialog>

                      {/* Event Status Card */}
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-green-800">
                          <Award className="w-4 h-4" />
                          <span className="text-sm font-medium">You're Registered!</span>
                        </div>
                        <p className="text-xs text-green-600 mt-1">
                          Access exclusive pre-event networking features and AI-powered matching
                        </p>
                      </div>
                    </div>
                  )}
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
    </div>
  );
}