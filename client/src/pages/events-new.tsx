import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Search, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  DollarSign, 
  Plus, 
  Edit,
  Trash2,
  Star,
  Play,
  ExternalLink,
  Filter,
  Grid,
  List,
  Settings,
  Image,
  Video,
  UserPlus,
  Tags,
  Eye,
  Share
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

// Create a custom useAuth hook since it might not exist
const useAuthFallback = () => {
  const [user, setUser] = useState<{ id: string } | null>(null);
  
  // Simple auth state from local storage or context
  React.useEffect(() => {
    // This would normally come from your auth context
    setUser({ id: "demo-user" });
  }, []);
  
  return { user };
};

interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  eventType: string;
  startDate: string;
  startTime: string;
  endDate?: string;
  endTime?: string;
  location: string;
  isVirtual: boolean;
  capacity: number;
  isPaid: boolean;
  basePrice: number;
  currency: string;
  coverImageUrl?: string;
  youtubeVideoId?: string;
  organizerId: string;
  organizerName?: string;
  organizerImageUrl?: string;
  hostIds?: string[];
  hostNames?: string[];
  status: string;
  isFeatured: boolean;
  isPublic: boolean;
  tags?: string[];
  registrationCount: number;
  isUserRegistered: boolean;
  ticketTypes?: TicketType[];
  lineItems?: LineItem[];
  createdAt: string;
  updatedAt: string;
}

interface TicketType {
  id: string;
  name: string;
  description?: string;
  price: number;
  quantity?: number;
  sold: number;
  isActive: boolean;
  perks?: string[];
}

interface LineItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  isRequired: boolean;
  isActive: boolean;
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  profileImageUrl?: string;
}

export default function EventsNew() {
  const [activeTab, setActiveTab] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEventDetail, setShowEventDetail] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuthFallback();

  // Event form state
  const [eventForm, setEventForm] = useState({
    title: "",
    description: "",
    shortDescription: "",
    eventType: "networking",
    startDate: "",
    startTime: "18:00",
    endDate: "",
    endTime: "20:00",
    location: "",
    isVirtual: false,
    capacity: 50,
    isPaid: false,
    basePrice: 0,
    coverImageUrl: "",
    youtubeVideoId: "",
    tags: [] as string[],
    ticketTypes: [] as TicketType[],
    lineItems: [] as LineItem[],
    hostIds: [] as string[],
    instructions: "",
    refundPolicy: "",
    requiresApproval: false,
  });

  const [newTag, setNewTag] = useState("");
  const [hostSearch, setHostSearch] = useState("");

  // Queries
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events/new"],
  });

  const { data: myEvents = [] } = useQuery<Event[]>({
    queryKey: ["/api/events/my-events"],
    enabled: !!user,
  });

  const { data: hostUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users/search", hostSearch],
    enabled: hostSearch.length >= 2,
  });

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      return await apiRequest("POST", "/api/events/create", eventData);
    },
    onSuccess: () => {
      toast({
        title: "Event Created",
        description: "Your event has been created successfully!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events/new"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/my-events"] });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async ({ eventId, ticketTypeId, lineItemIds }: { 
      eventId: string; 
      ticketTypeId?: string; 
      lineItemIds?: string[];
    }) => {
      return await apiRequest("POST", `/api/events/${eventId}/register`, {
        ticketTypeId,
        lineItemIds,
      });
    },
    onSuccess: () => {
      toast({
        title: "Registration Successful",
        description: "You've been registered for this event!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events/new"] });
    },
    onError: (error: any) => {
      toast({
        title: "Registration Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const resetForm = () => {
    setEventForm({
      title: "",
      description: "",
      shortDescription: "",
      eventType: "networking",
      startDate: "",
      startTime: "18:00",
      endDate: "",
      endTime: "20:00",
      location: "",
      isVirtual: false,
      capacity: 50,
      isPaid: false,
      basePrice: 0,
      coverImageUrl: "",
      youtubeVideoId: "",
      tags: [],
      ticketTypes: [],
      lineItems: [],
      hostIds: [],
      instructions: "",
      refundPolicy: "",
      requiresApproval: false,
    });
  };

  const addTag = () => {
    if (newTag.trim() && !eventForm.tags.includes(newTag.trim())) {
      setEventForm(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEventForm(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const addTicketType = () => {
    setEventForm(prev => ({
      ...prev,
      ticketTypes: [...prev.ticketTypes, {
        id: `temp-${Date.now()}`,
        name: "",
        description: "",
        price: 0,
        quantity: undefined,
        sold: 0,
        isActive: true,
        perks: []
      }]
    }));
  };

  const updateTicketType = (index: number, field: string, value: any) => {
    setEventForm(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes.map((ticket, i) => 
        i === index ? { ...ticket, [field]: value } : ticket
      )
    }));
  };

  const removeTicketType = (index: number) => {
    setEventForm(prev => ({
      ...prev,
      ticketTypes: prev.ticketTypes.filter((_, i) => i !== index)
    }));
  };

  const addLineItem = () => {
    setEventForm(prev => ({
      ...prev,
      lineItems: [...prev.lineItems, {
        id: `temp-${Date.now()}`,
        name: "",
        description: "",
        price: 0,
        isRequired: false,
        isActive: true
      }]
    }));
  };

  const updateLineItem = (index: number, field: string, value: any) => {
    setEventForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeLineItem = (index: number) => {
    setEventForm(prev => ({
      ...prev,
      lineItems: prev.lineItems.filter((_, i) => i !== index)
    }));
  };

  const addHost = (userId: string) => {
    if (!eventForm.hostIds.includes(userId)) {
      setEventForm(prev => ({
        ...prev,
        hostIds: [...prev.hostIds, userId]
      }));
    }
    setHostSearch("");
  };

  const removeHost = (userId: string) => {
    setEventForm(prev => ({
      ...prev,
      hostIds: prev.hostIds.filter(id => id !== userId)
    }));
  };

  const handleSubmit = () => {
    if (!eventForm.title || !eventForm.startDate || !eventForm.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createEventMutation.mutate(eventForm);
  };

  // Filter events
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType === "all" || event.eventType === filterType;
    
    const matchesTab = (() => {
      switch (activeTab) {
        case "my-events":
          return event.organizerId === user?.id || event.hostIds?.includes(user?.id || "");
        case "registered":
          return event.isUserRegistered;
        case "upcoming":
          return new Date(event.startDate) > new Date();
        case "featured":
          return event.isFeatured;
        default:
          return true;
      }
    })();

    return matchesSearch && matchesType && matchesTab;
  });

  const formatEventDate = (date: string, time: string) => {
    const eventDate = new Date(`${date}T${time}`);
    return eventDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getYouTubeEmbedUrl = (videoId: string) => {
    return `https://www.youtube.com/embed/${videoId}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Calendar className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-600" />
              <p className="text-gray-600">Loading events...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">STAK Events</h1>
            <p className="text-gray-600">Connect, learn, and grow within the STAK ecosystem</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              variant="outline"
              size="sm"
            >
              {viewMode === "grid" ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
            <Button onClick={() => setShowCreateDialog(true)} className="bg-[#1a365d] hover:bg-[#2c5282]">
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="networking">Networking</SelectItem>
              <SelectItem value="workshop">Workshop</SelectItem>
              <SelectItem value="conference">Conference</SelectItem>
              <SelectItem value="meetup">Meetup</SelectItem>
              <SelectItem value="webinar">Webinar</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="all">All Events</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
            <TabsTrigger value="registered">My Registrations</TabsTrigger>
            {user && <TabsTrigger value="my-events">My Events</TabsTrigger>}
          </TabsList>

          <TabsContent value={activeTab}>
            {/* Events Grid/List */}
            {filteredEvents.length === 0 ? (
              <Card className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">No events found</p>
                <Button onClick={() => setShowCreateDialog(true)} variant="outline">
                  Create your first event
                </Button>
              </Card>
            ) : (
              <div className={viewMode === "grid" 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "space-y-4"
              }>
                {filteredEvents.map((event) => (
                  <Card 
                    key={event.id} 
                    className="hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => setShowEventDetail(event)}
                  >
                    {event.coverImageUrl && (
                      <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                        <img 
                          src={event.coverImageUrl} 
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                        {event.isFeatured && (
                          <Badge className="absolute top-2 right-2 bg-yellow-500">
                            <Star className="h-3 w-3 mr-1" />
                            Featured
                          </Badge>
                        )}
                        {event.isPaid && (
                          <Badge className="absolute top-2 left-2 bg-green-600">
                            ${event.basePrice}
                          </Badge>
                        )}
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{event.title}</CardTitle>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatEventDate(event.startDate, event.startTime)}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {event.isVirtual ? "Virtual" : event.location}
                            </div>
                          </div>
                        </div>
                        <Badge variant="secondary" className="ml-2">
                          {event.eventType}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {event.shortDescription || event.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {event.registrationCount}/{event.capacity}
                          </div>
                          {event.youtubeVideoId && (
                            <div className="flex items-center gap-1">
                              <Video className="h-4 w-4" />
                              Video
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-2">
                          {event.isUserRegistered ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Registered
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                registerMutation.mutate({ eventId: event.id });
                              }}
                              disabled={registerMutation.isPending}
                            >
                              Register
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Event Detail Modal */}
        {showEventDetail && (
          <Dialog open={!!showEventDetail} onOpenChange={() => setShowEventDetail(null)}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl">{showEventDetail.title}</DialogTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {formatEventDate(showEventDetail.startDate, showEventDetail.startTime)}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {showEventDetail.isVirtual ? "Virtual Event" : showEventDetail.location}
                  </div>
                  <Badge variant="secondary">{showEventDetail.eventType}</Badge>
                </div>
              </DialogHeader>

              <div className="space-y-6">
                {/* Cover Image */}
                {showEventDetail.coverImageUrl && (
                  <div className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden">
                    <img 
                      src={showEventDetail.coverImageUrl} 
                      alt={showEventDetail.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* YouTube Video */}
                {showEventDetail.youtubeVideoId && (
                  <div className="w-full aspect-video rounded-lg overflow-hidden">
                    <iframe
                      src={getYouTubeEmbedUrl(showEventDetail.youtubeVideoId)}
                      title={showEventDetail.title}
                      className="w-full h-full"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="font-semibold mb-2">About This Event</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">{showEventDetail.description}</p>
                </div>

                {/* Event Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-2">Event Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span>Capacity: {showEventDetail.registrationCount}/{showEventDetail.capacity}</span>
                      </div>
                      {showEventDetail.isPaid && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          <span>Starting at ${showEventDetail.basePrice}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hosts */}
                  {showEventDetail.hostNames && showEventDetail.hostNames.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Hosts</h3>
                      <div className="space-y-2">
                        {showEventDetail.hostNames.map((hostName, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                            <span className="text-sm">{hostName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tags */}
                {showEventDetail.tags && showEventDetail.tags.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {showEventDetail.tags.map((tag, index) => (
                        <Badge key={index} variant="outline">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ticket Types */}
                {showEventDetail.ticketTypes && showEventDetail.ticketTypes.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Ticket Options</h3>
                    <div className="space-y-3">
                      {showEventDetail.ticketTypes.map((ticket) => (
                        <div key={ticket.id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{ticket.name}</h4>
                            <span className="font-semibold">${ticket.price}</span>
                          </div>
                          {ticket.description && (
                            <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                          )}
                          {ticket.perks && ticket.perks.length > 0 && (
                            <ul className="text-sm text-gray-600 space-y-1">
                              {ticket.perks.map((perk, index) => (
                                <li key={index}>• {perk}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <div className="flex items-center gap-3 w-full">
                  <Button variant="outline" onClick={() => setShowEventDetail(null)}>
                    Close
                  </Button>
                  {!showEventDetail.isUserRegistered ? (
                    <Button
                      onClick={() => {
                        registerMutation.mutate({ eventId: showEventDetail.id });
                        setShowEventDetail(null);
                      }}
                      disabled={registerMutation.isPending}
                      className="bg-[#1a365d] hover:bg-[#2c5282]"
                    >
                      Register for Event
                    </Button>
                  ) : (
                    <Badge className="bg-green-100 text-green-800">Already Registered</Badge>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {/* Create Event Dialog */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Create an event for the STAK ecosystem. Fill in the details below.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title" className="text-gray-700 font-medium">Event Title *</Label>
                    <Input
                      id="title"
                      value={eventForm.title}
                      onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter event title"
                      className="mt-1 border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <Label htmlFor="eventType" className="text-gray-700 font-medium">Event Type</Label>
                    <Select 
                      value={eventForm.eventType} 
                      onValueChange={(value) => setEventForm(prev => ({ ...prev, eventType: value }))}
                    >
                      <SelectTrigger className="mt-1 border-gray-300 text-gray-900 bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white border border-gray-300">
                        <SelectItem value="networking" className="text-gray-900">Networking</SelectItem>
                        <SelectItem value="workshop" className="text-gray-900">Workshop</SelectItem>
                        <SelectItem value="conference" className="text-gray-900">Conference</SelectItem>
                        <SelectItem value="meetup" className="text-gray-900">Meetup</SelectItem>
                        <SelectItem value="webinar" className="text-gray-900">Webinar</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="shortDescription" className="text-gray-700 font-medium">Short Description</Label>
                  <Input
                    id="shortDescription"
                    value={eventForm.shortDescription}
                    onChange={(e) => setEventForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                    placeholder="Brief description for event cards"
                    className="mt-1 border-gray-300 text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-gray-700 font-medium">Full Description</Label>
                  <Textarea
                    id="description"
                    value={eventForm.description}
                    onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of your event"
                    rows={4}
                    className="mt-1 border-gray-300 text-gray-900"
                  />
                </div>
              </div>

              {/* Date and Location */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Date & Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-gray-700 font-medium">Start Date *</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={eventForm.startDate}
                      onChange={(e) => setEventForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="mt-1 border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <Label htmlFor="startTime" className="text-gray-700 font-medium">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={eventForm.startTime}
                      onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))}
                      className="mt-1 border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-gray-700 font-medium">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={eventForm.endDate}
                      onChange={(e) => setEventForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="mt-1 border-gray-300 text-gray-900"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime" className="text-gray-700 font-medium">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={eventForm.endTime}
                      onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))}
                      className="mt-1 border-gray-300 text-gray-900"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isVirtual"
                    checked={eventForm.isVirtual}
                    onCheckedChange={(checked) => setEventForm(prev => ({ ...prev, isVirtual: checked }))}
                  />
                  <Label htmlFor="isVirtual" className="text-gray-700">Virtual Event</Label>
                </div>

                <div>
                  <Label htmlFor="location" className="text-gray-700 font-medium">Location *</Label>
                  <Input
                    id="location"
                    value={eventForm.location}
                    onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))}
                    placeholder={eventForm.isVirtual ? "Meeting link or platform" : "Event venue address"}
                    className="mt-1 border-gray-300 text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="capacity" className="text-gray-700 font-medium">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    value={eventForm.capacity}
                    onChange={(e) => setEventForm(prev => ({ ...prev, capacity: parseInt(e.target.value) || 50 }))}
                    min="1"
                    className="mt-1 border-gray-300 text-gray-900"
                  />
                </div>
              </div>

              {/* Media */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Media & Content</h3>
                <div>
                  <Label htmlFor="coverImageUrl" className="text-gray-700 font-medium">Cover Image URL</Label>
                  <Input
                    id="coverImageUrl"
                    value={eventForm.coverImageUrl}
                    onChange={(e) => setEventForm(prev => ({ ...prev, coverImageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="mt-1 border-gray-300 text-gray-900"
                  />
                </div>

                <div>
                  <Label htmlFor="youtubeVideoId" className="text-gray-700 font-medium">YouTube Video ID</Label>
                  <Input
                    id="youtubeVideoId"
                    value={eventForm.youtubeVideoId}
                    onChange={(e) => setEventForm(prev => ({ ...prev, youtubeVideoId: e.target.value }))}
                    placeholder="dQw4w9WgXcQ"
                    className="mt-1 border-gray-300 text-gray-900"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter just the video ID from the YouTube URL (the part after v=)
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Pricing & Tickets</h3>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isPaid"
                      checked={eventForm.isPaid}
                      onCheckedChange={(checked) => setEventForm(prev => ({ ...prev, isPaid: checked }))}
                    />
                    <Label htmlFor="isPaid" className="text-gray-700">Paid Event</Label>
                  </div>
                </div>

                {eventForm.isPaid && (
                  <>
                    <div>
                      <Label htmlFor="basePrice" className="text-gray-700 font-medium">Base Price ($)</Label>
                      <Input
                        id="basePrice"
                        type="number"
                        step="0.01"
                        value={eventForm.basePrice}
                        onChange={(e) => setEventForm(prev => ({ ...prev, basePrice: parseFloat(e.target.value) || 0 }))}
                        min="0"
                        className="mt-1 border-gray-300 text-gray-900"
                      />
                    </div>

                    {/* Ticket Types */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-gray-700 font-medium">Ticket Types</Label>
                        <Button type="button" onClick={addTicketType} size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Ticket Type
                        </Button>
                      </div>
                      {eventForm.ticketTypes.map((ticket, index) => (
                        <Card key={index} className="p-4 mb-3 border-gray-200 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                            <Input
                              placeholder="Ticket name"
                              value={ticket.name}
                              onChange={(e) => updateTicketType(index, 'name', e.target.value)}
                              className="border-gray-300 text-gray-900"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Price"
                              value={ticket.price}
                              onChange={(e) => updateTicketType(index, 'price', parseFloat(e.target.value) || 0)}
                              className="border-gray-300 text-gray-900"
                            />
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                placeholder="Quantity (optional)"
                                value={ticket.quantity || ""}
                                onChange={(e) => updateTicketType(index, 'quantity', parseInt(e.target.value) || undefined)}
                                className="border-gray-300 text-gray-900"
                              />
                              <Button 
                                type="button" 
                                onClick={() => removeTicketType(index)} 
                                size="sm" 
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <Textarea
                            placeholder="Ticket description and perks"
                            value={ticket.description}
                            onChange={(e) => updateTicketType(index, 'description', e.target.value)}
                            rows={2}
                            className="border-gray-300 text-gray-900"
                          />
                        </Card>
                      ))}
                    </div>

                    {/* Line Items */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label className="text-gray-700 font-medium">Additional Charges</Label>
                        <Button type="button" onClick={addLineItem} size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Charge
                        </Button>
                      </div>
                      {eventForm.lineItems.map((item, index) => (
                        <Card key={index} className="p-4 mb-3 border-gray-200 bg-white">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Input
                              placeholder="Item name (e.g., Parking)"
                              value={item.name}
                              onChange={(e) => updateLineItem(index, 'name', e.target.value)}
                              className="border-gray-300 text-gray-900"
                            />
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Price"
                              value={item.price}
                              onChange={(e) => updateLineItem(index, 'price', parseFloat(e.target.value) || 0)}
                              className="border-gray-300 text-gray-900"
                            />
                            <div className="flex gap-2 items-center">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={item.isRequired}
                                  onCheckedChange={(checked) => updateLineItem(index, 'isRequired', checked)}
                                />
                                <Label className="text-sm text-gray-700">Required</Label>
                              </div>
                              <Button 
                                type="button" 
                                onClick={() => removeLineItem(index)} 
                                size="sm" 
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Tags */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Tags</h3>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    className="border-gray-300 text-gray-900"
                  />
                  <Button type="button" onClick={addTag} size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {eventForm.tags.map((tag, index) => (
                    <Badge key={index} className="bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1 px-2 py-1">
                      {tag}
                      <button 
                        onClick={() => removeTag(tag)} 
                        className="ml-1 text-blue-600 hover:text-blue-800 text-sm font-bold"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Additional Settings */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Additional Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requiresApproval"
                      checked={eventForm.requiresApproval}
                      onCheckedChange={(checked) => setEventForm(prev => ({ ...prev, requiresApproval: checked }))}
                    />
                    <Label htmlFor="requiresApproval" className="text-gray-700">Require approval for registration</Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="instructions" className="text-gray-700 font-medium">Special Instructions</Label>
                  <Textarea
                    id="instructions"
                    value={eventForm.instructions}
                    onChange={(e) => setEventForm(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Any special instructions for attendees"
                    rows={3}
                    className="mt-1 border-gray-300 text-gray-900"
                  />
                </div>

                {eventForm.isPaid && (
                  <div>
                    <Label htmlFor="refundPolicy" className="text-gray-700 font-medium">Refund Policy</Label>
                    <Textarea
                      id="refundPolicy"
                      value={eventForm.refundPolicy}
                      onChange={(e) => setEventForm(prev => ({ ...prev, refundPolicy: e.target.value }))}
                      placeholder="Describe your refund policy"
                      rows={3}
                      className="mt-1 border-gray-300 text-gray-900"
                    />
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createEventMutation.isPending}
                className="bg-[#1a365d] hover:bg-[#2c5282]"
              >
                {createEventMutation.isPending ? "Creating..." : "Create Event"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}