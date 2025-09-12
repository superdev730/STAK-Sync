import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Plus, 
  Upload, 
  Edit3, 
  Share2,
  Video,
  Image as ImageIcon,
  Trash2,
  MoreVertical,
  DollarSign,
  Tag,
  Globe,
  Shield,
  Star,
  AlertCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Event {
  id: string;
  title: string;
  description: string;
  shortDescription?: string;
  eventType: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  location: string;
  isVirtual: boolean;
  capacity: number;
  tags: string[];
  organizerId: string;
  coverImageUrl?: string;
  youtubeVideoId?: string;
  socialShareText?: string;
  status: string;
  isFeatured: boolean;
  isPublic?: boolean;
  requiresApproval?: boolean;
  isPaid?: boolean;
  basePrice?: string;
  currency?: string;
  instructions?: string;
  refundPolicy?: string;
  registrationCount?: number;
  organizer?: { firstName: string; lastName: string; profileImageUrl?: string };
  createdAt?: string;
  updatedAt?: string;
}

interface AdminEventsResponse {
  events: Event[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export default function AdminEvents() {
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [formTab, setFormTab] = useState("basic");
  const { toast } = useToast();

  // Filter states
  const [statusFilter, setStatusFilter] = useState<string>('draft,published,archived');
  const [timeScope, setTimeScope] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [page, setPage] = useState<number>(1);

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (statusFilter) params.set('status', statusFilter);
    if (timeScope !== 'all') params.set('time_scope', timeScope);
    if (searchQuery.trim()) params.set('q', searchQuery.trim());
    params.set('page', page.toString());
    params.set('page_size', '25');
    return params.toString();
  }, [statusFilter, timeScope, searchQuery, page]);

  const { data: adminEventsData, isLoading } = useQuery<AdminEventsResponse>({
    queryKey: ["/api/admin/events", { statusFilter, timeScope, searchQuery, page }],
    queryFn: async () => {
      return apiRequest(`/api/admin/events?${queryParams}`);
    },
    staleTime: 0,
  });

  const events = adminEventsData?.events || [];
  const total = adminEventsData?.total || 0;
  const totalPages = adminEventsData?.total_pages || 1;

  const createEventMutation = useMutation({
    mutationFn: async (eventData: Partial<Event>) => {
      return apiRequest('/api/admin/events', 'POST', eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setCreateDialog(false);
      setFormTab("basic");
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }: Partial<Event> & { id: string }) => {
      return apiRequest(`/api/admin/events/${id}`, 'PUT', eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setEditDialog(false);
      setSelectedEvent(null);
      setFormTab("basic");
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update event",
        variant: "destructive",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest(`/api/admin/events/${eventId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setDeleteDialog(false);
      setSelectedEvent(null);
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete event",
        variant: "destructive",
      });
    },
  });

  const handleCreateEvent = (formData: FormData) => {
    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      shortDescription: formData.get('shortDescription') as string,
      eventType: formData.get('eventType') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      location: formData.get('location') as string,
      isVirtual: formData.get('isVirtual') === 'true',
      capacity: parseInt(formData.get('capacity') as string) || 100,
      coverImageUrl: formData.get('coverImageUrl') as string,
      youtubeVideoId: formData.get('youtubeVideoId') as string,
      socialShareText: formData.get('socialShareText') as string,
      tags: (formData.get('tags') as string)?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
      isFeatured: formData.get('isFeatured') === 'true',
      isPublic: formData.get('isPublic') === 'true',
      requiresApproval: formData.get('requiresApproval') === 'true',
      isPaid: formData.get('isPaid') === 'true',
      basePrice: formData.get('basePrice') as string,
      currency: formData.get('currency') as string || 'USD',
      instructions: formData.get('instructions') as string,
      refundPolicy: formData.get('refundPolicy') as string,
      status: formData.get('status') as string || 'draft',
    };

    createEventMutation.mutate(eventData);
  };

  const handleUpdateEvent = (formData: FormData) => {
    if (!selectedEvent) return;

    const eventData = {
      id: selectedEvent.id,
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      shortDescription: formData.get('shortDescription') as string,
      eventType: formData.get('eventType') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      location: formData.get('location') as string,
      isVirtual: formData.get('isVirtual') === 'true',
      capacity: parseInt(formData.get('capacity') as string) || 100,
      coverImageUrl: formData.get('coverImageUrl') as string,
      youtubeVideoId: formData.get('youtubeVideoId') as string,
      socialShareText: formData.get('socialShareText') as string,
      tags: (formData.get('tags') as string)?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
      isFeatured: formData.get('isFeatured') === 'true',
      isPublic: formData.get('isPublic') === 'true',
      requiresApproval: formData.get('requiresApproval') === 'true',
      isPaid: formData.get('isPaid') === 'true',
      basePrice: formData.get('basePrice') as string,
      currency: formData.get('currency') as string || 'USD',
      instructions: formData.get('instructions') as string,
      refundPolicy: formData.get('refundPolicy') as string,
      status: formData.get('status') as string || 'draft',
    };

    updateEventMutation.mutate(eventData);
  };

  const handleShareEvent = (event: Event) => {
    const shareText = event.socialShareText || `Join us for ${event.title} - ${event.description}`;
    const shareUrl = `${window.location.origin}/events/${event.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: event.title,
        text: shareText,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
      toast({
        title: "Copied to clipboard",
        description: "Event details copied to clipboard",
      });
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'speaker-series':
      case 'stak-speaker-series':
        return 'bg-blue-100 text-blue-800';
      case 'meetup':
      case 'networking':
        return 'bg-green-100 text-green-800';
      case 'workshop':
        return 'bg-purple-100 text-purple-800';
      case 'conference':
        return 'bg-amber-100 text-amber-800';
      case 'webinar':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEventTypeName = (type: string) => {
    switch (type) {
      case 'speaker-series':
        return 'Speaker Series';
      case 'stak-speaker-series':
        return 'STAK Speaker Series';
      case 'meetup':
        return 'Meetup';
      case 'networking':
        return 'Networking';
      case 'workshop':
        return 'Workshop';
      case 'conference':
        return 'Conference';
      case 'webinar':
        return 'Webinar';
      default:
        return type;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setStatusFilter('draft,published,archived');
    setTimeScope('all');
    setSearchQuery('');
    setPage(1);
  };

  const EventForm = ({ event, onSubmit }: { event?: Event | null; onSubmit: (formData: FormData) => void }) => {
    const [isPaidLocal, setIsPaidLocal] = useState(event?.isPaid || false);

    return (
      <form onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}>
        <Tabs value={formTab} onValueChange={setFormTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[500px] pr-4">
            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={event?.title}
                  required
                  placeholder="Event title"
                  data-testid="input-title"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Short Description</Label>
                <Input
                  id="shortDescription"
                  name="shortDescription"
                  defaultValue={event?.shortDescription}
                  placeholder="Brief description (for cards)"
                  data-testid="input-short-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Full Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={event?.description}
                  required
                  rows={4}
                  placeholder="Detailed event description"
                  data-testid="textarea-description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="eventType">Event Type *</Label>
                <Select name="eventType" defaultValue={event?.eventType || 'networking'}>
                  <SelectTrigger data-testid="select-event-type">
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="networking">Networking</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="conference">Conference</SelectItem>
                    <SelectItem value="meetup">Meetup</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="speaker-series">Speaker Series</SelectItem>
                    <SelectItem value="stak-speaker-series">STAK Speaker Series</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select name="status" defaultValue={event?.status || 'draft'}>
                  <SelectTrigger data-testid="select-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="details" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    defaultValue={event?.startDate?.split('T')[0]}
                    required
                    data-testid="input-start-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startTime">Start Time</Label>
                  <Input
                    id="startTime"
                    name="startTime"
                    type="time"
                    defaultValue={event?.startTime}
                    data-testid="input-start-time"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    defaultValue={event?.endDate?.split('T')[0]}
                    required
                    data-testid="input-end-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">End Time</Label>
                  <Input
                    id="endTime"
                    name="endTime"
                    type="time"
                    defaultValue={event?.endTime}
                    data-testid="input-end-time"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  name="location"
                  defaultValue={event?.location}
                  required
                  placeholder="Event location or address"
                  data-testid="input-location"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isVirtual"
                  name="isVirtual"
                  defaultChecked={event?.isVirtual}
                  data-testid="switch-virtual"
                />
                <Label htmlFor="isVirtual">Virtual Event</Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  defaultValue={event?.capacity || 100}
                  min="1"
                  data-testid="input-capacity"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={event?.tags?.join(', ')}
                  placeholder="tech, startup, networking"
                  data-testid="input-tags"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instructions">Event Instructions</Label>
                <Textarea
                  id="instructions"
                  name="instructions"
                  defaultValue={event?.instructions}
                  rows={3}
                  placeholder="Special instructions for attendees"
                  data-testid="textarea-instructions"
                />
              </div>
            </TabsContent>

            <TabsContent value="media" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="coverImageUrl">Cover Image URL</Label>
                <Input
                  id="coverImageUrl"
                  name="coverImageUrl"
                  type="url"
                  defaultValue={event?.coverImageUrl}
                  placeholder="https://example.com/image.jpg"
                  data-testid="input-cover-image"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="youtubeVideoId">YouTube Video ID</Label>
                <Input
                  id="youtubeVideoId"
                  name="youtubeVideoId"
                  defaultValue={event?.youtubeVideoId}
                  placeholder="dQw4w9WgXcQ"
                  data-testid="input-youtube"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialShareText">Social Share Text</Label>
                <Textarea
                  id="socialShareText"
                  name="socialShareText"
                  defaultValue={event?.socialShareText}
                  rows={3}
                  placeholder="Text for social media sharing"
                  data-testid="textarea-social-share"
                />
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    name="isFeatured"
                    defaultChecked={event?.isFeatured}
                    data-testid="switch-featured"
                  />
                  <Label htmlFor="isFeatured">Featured Event</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    name="isPublic"
                    defaultChecked={event?.isPublic !== false}
                    data-testid="switch-public"
                  />
                  <Label htmlFor="isPublic">Public Event</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="requiresApproval"
                    name="requiresApproval"
                    defaultChecked={event?.requiresApproval}
                    data-testid="switch-approval"
                  />
                  <Label htmlFor="requiresApproval">Requires Approval</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPaid"
                    name="isPaid"
                    defaultChecked={event?.isPaid}
                    onCheckedChange={setIsPaidLocal}
                    data-testid="switch-paid"
                  />
                  <Label htmlFor="isPaid">Paid Event</Label>
                </div>

                {isPaidLocal && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="basePrice">Base Price</Label>
                        <Input
                          id="basePrice"
                          name="basePrice"
                          type="number"
                          step="0.01"
                          min="0"
                          defaultValue={event?.basePrice}
                          placeholder="29.99"
                          data-testid="input-price"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select name="currency" defaultValue={event?.currency || 'USD'}>
                          <SelectTrigger data-testid="select-currency">
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="USD">USD</SelectItem>
                            <SelectItem value="EUR">EUR</SelectItem>
                            <SelectItem value="GBP">GBP</SelectItem>
                            <SelectItem value="CAD">CAD</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="refundPolicy">Refund Policy</Label>
                      <Textarea
                        id="refundPolicy"
                        name="refundPolicy"
                        defaultValue={event?.refundPolicy}
                        rows={3}
                        placeholder="Describe your refund policy"
                        data-testid="textarea-refund"
                      />
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="mt-6">
          <Button type="submit" disabled={createEventMutation.isPending || updateEventMutation.isPending}>
            {event ? 'Update Event' : 'Create Event'}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-navy mb-4">Event Management</h1>
          <p className="text-muted-foreground">
            Manage all events in the system
          </p>
        </div>
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-navy hover:bg-navy/90" data-testid="button-create-event">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new event
              </DialogDescription>
            </DialogHeader>
            <EventForm onSubmit={handleCreateEvent} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Search</Label>
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="input-search"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft,published,archived">All Statuses</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Time Scope</Label>
              <Select value={timeScope} onValueChange={setTimeScope}>
                <SelectTrigger data-testid="select-filter-time">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="past">Past</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={clearFilters} data-testid="button-clear-filters">
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      {isLoading ? (
        <div className="text-center py-8">Loading events...</div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'draft,published,archived' || timeScope !== 'all'
                ? "Try adjusting your filters"
                : "Create your first event to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card key={event.id} className="hover:shadow-lg transition-shadow" data-testid={`card-event-${event.id}`}>
                {event.coverImageUrl && (
                  <div className="h-48 bg-gradient-to-br from-navy/20 to-navy/5 relative">
                    <img 
                      src={event.coverImageUrl} 
                      alt={event.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {event.isFeatured && (
                      <Badge className="absolute top-2 right-2 bg-yellow-500 text-yellow-900">
                        <Star className="mr-1 h-3 w-3" />
                        Featured
                      </Badge>
                    )}
                  </div>
                )}
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{event.title}</CardTitle>
                      <div className="flex flex-wrap gap-2 mb-2">
                        <Badge className={getEventTypeColor(event.eventType)}>
                          {getEventTypeName(event.eventType)}
                        </Badge>
                        <Badge className={getStatusBadgeColor(event.status)}>
                          {event.status}
                        </Badge>
                        {event.isVirtual && (
                          <Badge variant="outline">
                            <Video className="mr-1 h-3 w-3" />
                            Virtual
                          </Badge>
                        )}
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-menu-${event.id}`}>
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedEvent(event);
                            setEditDialog(true);
                          }}
                          data-testid={`menu-edit-${event.id}`}
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleShareEvent(event)}
                          data-testid={`menu-share-${event.id}`}
                        >
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            setSelectedEvent(event);
                            setDeleteDialog(true);
                          }}
                          className="text-red-600"
                          data-testid={`menu-delete-${event.id}`}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardDescription className="line-clamp-2">
                    {event.shortDescription || event.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    {new Date(event.startDate).toLocaleDateString()}
                    {event.startTime && ` at ${event.startTime}`}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="mr-2 h-4 w-4" />
                    {event.location}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="mr-2 h-4 w-4" />
                      {event.registrationCount || 0} / {event.capacity} attendees
                    </div>
                    {event.isPaid && (
                      <Badge variant="outline" className="text-green-600">
                        <DollarSign className="mr-1 h-3 w-3" />
                        {event.basePrice} {event.currency}
                      </Badge>
                    )}
                  </div>
                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {event.tags.slice(0, 3).map((tag, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          <Tag className="mr-1 h-2 w-2" />
                          {tag}
                        </Badge>
                      ))}
                      {event.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{event.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2 pt-2">
                    {event.isPublic === false && (
                      <Badge variant="outline" className="text-xs">
                        <Shield className="mr-1 h-3 w-3" />
                        Private
                      </Badge>
                    )}
                    {event.requiresApproval && (
                      <Badge variant="outline" className="text-xs">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Approval Required
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Showing {events.length} of {total} events
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  data-testid="button-prev-page"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        data-testid={`button-page-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  {totalPages > 5 && <span className="px-2">...</span>}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  data-testid="button-next-page"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update the event details
            </DialogDescription>
          </DialogHeader>
          <EventForm event={selectedEvent} onSubmit={handleUpdateEvent} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the event "{selectedEvent?.title}" and all associated data.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedEvent && deleteEventMutation.mutate(selectedEvent.id)}
              className="bg-red-600 hover:bg-red-700"
              data-testid="button-confirm-delete"
            >
              Delete Event
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}