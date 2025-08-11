import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/dialog";
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
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Event {
  id: string;
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  location: string;
  isVirtual: boolean;
  maxAttendees: number;
  registrationDeadline: string;
  tags: string[];
  organizerId: string;
  imageUrl?: string;
  videoUrl?: string;
  socialShareText?: string;
  status: string;
  isFeatured: boolean;
  registrationCount?: number;
}

export default function AdminEvents() {
  const [createDialog, setCreateDialog] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ["/api/admin/events"],
  });

  const createEventMutation = useMutation({
    mutationFn: async (eventData: Partial<Event>) => {
      return apiRequest('POST', '/api/admin/events', eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setCreateDialog(false);
      toast({
        title: "Success",
        description: "Event created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive",
      });
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async ({ id, ...eventData }: Partial<Event> & { id: string }) => {
      return apiRequest('PUT', `/api/admin/events/${id}`, eventData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      setSelectedEvent(null);
      toast({
        title: "Success",
        description: "Event updated successfully",
      });
    },
  });

  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      return apiRequest('DELETE', `/api/admin/events/${eventId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
    },
  });

  const handleCreateEvent = (formData: FormData) => {
    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      eventType: formData.get('eventType') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      location: formData.get('location') as string,
      isVirtual: formData.get('isVirtual') === 'true',
      maxAttendees: parseInt(formData.get('maxAttendees') as string),
      registrationDeadline: formData.get('registrationDeadline') as string,
      imageUrl: formData.get('imageUrl') as string,
      videoUrl: formData.get('videoUrl') as string,
      socialShareText: formData.get('socialShareText') as string,
      tags: (formData.get('tags') as string)?.split(',').map(tag => tag.trim()).filter(Boolean) || [],
      isFeatured: formData.get('isFeatured') === 'true',
    };

    createEventMutation.mutate(eventData);
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
        return 'bg-blue-100 text-blue-800';
      case 'stak-speaker-series':
        return 'bg-emerald-100 text-emerald-800';
      case 'meetup':
        return 'bg-green-100 text-green-800';
      case 'vc-dinner':
        return 'bg-purple-100 text-purple-800';
      case 'leadership-event':
        return 'bg-amber-100 text-amber-800';
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
        return 'Weekly Meetup';
      case 'vc-dinner':
        return 'VC Partner Dinner';
      case 'leadership-event':
        return 'Leadership Event';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-playfair font-bold text-navy mb-4">Event Management</h1>
          <p className="text-xl text-charcoal">Create and manage STAK networking events</p>
        </div>
        
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogTrigger asChild>
            <Button className="bg-stak-copper hover:bg-stak-copper/90 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event</DialogTitle>
              <DialogDescription>
                Add a new networking event for the STAK community
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              handleCreateEvent(new FormData(e.currentTarget));
            }} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input id="title" name="title" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type</Label>
                  <Select name="eventType" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="speaker-series">Bi-weekly Speaker Series</SelectItem>
                      <SelectItem value="stak-speaker-series">STAK Speaker Series</SelectItem>
                      <SelectItem value="meetup">Weekly Meetup</SelectItem>
                      <SelectItem value="vc-dinner">Quarterly VC Partner Dinner</SelectItem>
                      <SelectItem value="leadership-event">Annual Leadership Event</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" rows={3} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date & Time</Label>
                  <Input id="startDate" name="startDate" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date & Time</Label>
                  <Input id="endDate" name="endDate" type="datetime-local" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input id="location" name="location" placeholder="1900 Broadway, Denver, CO" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAttendees">Max Attendees</Label>
                  <Input id="maxAttendees" name="maxAttendees" type="number" min="1" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">Registration Deadline</Label>
                <Input id="registrationDeadline" name="registrationDeadline" type="datetime-local" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl">Cover Photo</Label>
                <div className="space-y-3">
                  <Input 
                    id="imageUrl" 
                    name="imageUrl" 
                    type="url" 
                    placeholder="https://..." 
                    onChange={(e) => {
                      const url = e.target.value.trim();
                      const preview = document.getElementById('image-preview');
                      const thumbnail = document.getElementById('thumbnail-image') as HTMLImageElement;
                      
                      if (url && url.startsWith('http')) {
                        thumbnail.src = url;
                        thumbnail.onload = () => {
                          preview?.classList.remove('hidden');
                        };
                        thumbnail.onerror = () => {
                          preview?.classList.add('hidden');
                        };
                      } else {
                        preview?.classList.add('hidden');
                      }
                    }}
                  />
                  
                  {/* Image Preview/Thumbnail */}
                  <div className="space-y-2">
                    <div id="image-preview" className="hidden">
                      <div className="relative w-full max-w-md">
                        <img 
                          id="thumbnail-image"
                          src="" 
                          alt="Cover photo preview" 
                          className="w-full h-32 object-cover rounded-lg border border-gray-200 shadow-sm"
                        />
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-green-600 text-white text-xs">
                            ✓ Preview
                          </Badge>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600">
                      Enter a direct image URL or upload to your preferred hosting service
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="videoUrl">YouTube Video URL</Label>
                <Input id="videoUrl" name="videoUrl" type="url" placeholder="https://youtube.com/..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="socialShareText">Social Share Text</Label>
                <Textarea id="socialShareText" name="socialShareText" rows={2} 
                  placeholder="Join us for an exclusive networking event..." />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" placeholder="tech, networking, venture capital" />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isVirtual" value="true" />
                  <span>Virtual Event</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" name="isFeatured" value="true" />
                  <span>Featured Event</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-stak-copper hover:bg-stak-copper/90">
                  Create Event
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Events List */}
      <div className="grid gap-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">No events yet</h3>
              <p className="text-gray-500 mb-4">Create your first STAK networking event to get started.</p>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <Card key={event.id} className="luxury-card">
              <CardContent className="p-6">
                <div className="flex items-start space-x-6">
                  {event.imageUrl && (
                    <div className="w-32 h-24 rounded-lg overflow-hidden">
                      <img 
                        src={event.imageUrl} 
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-semibold text-navy">{event.title}</h3>
                          {event.isFeatured && (
                            <Badge className="bg-stak-copper text-white">Featured</Badge>
                          )}
                        </div>
                        <Badge className={getEventTypeColor(event.eventType)}>
                          {getEventTypeName(event.eventType)}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedEvent(event)}
                        >
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleShareEvent(event)}
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Share
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => deleteEventMutation.mutate(event.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{event.description}</p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {new Date(event.startDate).toLocaleDateString()}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {event.isVirtual ? 'Virtual' : event.location || 'TBD'}
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Users className="w-4 h-4 mr-2" />
                        {event.registrationCount || 0}/{event.maxAttendees || 'Unlimited'}
                      </div>
                    </div>
                    
                    {event.videoUrl && (
                      <div className="mt-3">
                        <a 
                          href={event.videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-stak-copper hover:text-stak-copper/80"
                        >
                          <Video className="w-4 h-4 mr-1" />
                          Watch Video
                        </a>
                      </div>
                    )}
                    
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {event.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}