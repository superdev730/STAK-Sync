import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, MapPin, Clock, Users } from "lucide-react";
import CalendarComponent from "@/components/CalendarComponent";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Meetup, User } from "@shared/schema";

export default function Events() {
  const [showQuickSchedule, setShowQuickSchedule] = useState(false);
  const [quickScheduleData, setQuickScheduleData] = useState({
    attendeeId: "",
    title: "",
    location: "",
    date: "",
    time: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: meetups, isLoading } = useQuery<(Meetup & { organizer: User; attendee: User })[]>({
    queryKey: ["/api/meetups"],
  });

  const createMeetupMutation = useMutation({
    mutationFn: async (meetupData: any) => {
      const scheduledAt = new Date(`${meetupData.date}T${meetupData.time}`);
      return apiRequest("POST", "/api/meetups", {
        ...meetupData,
        scheduledAt: scheduledAt.toISOString(),
      });
    },
    onSuccess: () => {
      toast({
        title: "Meetup Scheduled!",
        description: "Your meetup invitation has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meetups"] });
      setShowQuickSchedule(false);
      setQuickScheduleData({
        attendeeId: "",
        title: "",
        location: "",
        date: "",
        time: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to schedule meetup",
        variant: "destructive",
      });
    },
  });

  const handleQuickSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickScheduleData.attendeeId || !quickScheduleData.date || !quickScheduleData.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    await createMeetupMutation.mutateAsync(quickScheduleData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'border-l-gold';
      case 'pending':
        return 'border-l-light-blue';
      case 'cancelled':
        return 'border-l-red-500';
      default:
        return 'border-l-prof-green';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-prof-green text-white">Confirmed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge className="bg-prof-green text-white">Available</Badge>;
    }
  };

  const upcomingMeetups = meetups?.filter(meetup => 
    new Date(meetup.scheduledAt) > new Date()
  ).sort((a, b) => 
    new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  ) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-playfair font-bold text-navy mb-4">Schedule Meetups</h1>
        <p className="text-xl text-charcoal">Coordinate in-person meetings at events and private clubs</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Calendar Interface */}
        <div>
          <CalendarComponent 
            meetups={meetups || []}
            onDateSelect={(date) => {
              setQuickScheduleData(prev => ({
                ...prev,
                date: date.toISOString().split('T')[0]
              }));
              setShowQuickSchedule(true);
            }}
          />
        </div>

        {/* Upcoming Meetups & Quick Schedule */}
        <div className="space-y-6">
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-xl font-playfair font-semibold text-navy">
                Upcoming Meetups
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : upcomingMeetups.length === 0 ? (
                <div className="text-center py-8">
                  <CalendarIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No upcoming meetups scheduled</p>
                  <Button 
                    onClick={() => setShowQuickSchedule(true)}
                    className="bg-navy hover:bg-blue-800"
                  >
                    Schedule Your First Meetup
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingMeetups.map((meetup) => (
                    <div
                      key={meetup.id}
                      className={`border-l-4 pl-4 py-3 ${getStatusColor(meetup.status)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-charcoal">{meetup.title}</h4>
                        {getStatusBadge(meetup.status)}
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          {new Date(meetup.scheduledAt).toLocaleDateString()} • {new Date(meetup.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {meetup.location && (
                          <div className="flex items-center">
                            <MapPin className="w-4 h-4 mr-2" />
                            {meetup.location}
                          </div>
                        )}
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-2" />
                          with {meetup.attendee.firstName} {meetup.attendee.lastName}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Schedule */}
          <Card className="luxury-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-semibold text-charcoal">Quick Schedule</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickSchedule(!showQuickSchedule)}
                >
                  {showQuickSchedule ? 'Cancel' : 'New Meetup'}
                </Button>
              </div>
            </CardHeader>
            {showQuickSchedule && (
              <CardContent>
                <form onSubmit={handleQuickSchedule} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Meeting Title</Label>
                    <Input
                      id="title"
                      value={quickScheduleData.title}
                      onChange={(e) => setQuickScheduleData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Coffee meeting, lunch discussion..."
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="attendee">Select Contact</Label>
                    <Select
                      value={quickScheduleData.attendeeId}
                      onValueChange={(value) => setQuickScheduleData(prev => ({ ...prev, attendeeId: value }))}
                      required
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a contact" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mock-user-1">Sarah Chen</SelectItem>
                        <SelectItem value="mock-user-2">Marcus Rodriguez</SelectItem>
                        <SelectItem value="mock-user-3">Emma Thompson</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={quickScheduleData.date}
                        onChange={(e) => setQuickScheduleData(prev => ({ ...prev, date: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="time">Time</Label>
                      <Input
                        id="time"
                        type="time"
                        value={quickScheduleData.time}
                        onChange={(e) => setQuickScheduleData(prev => ({ ...prev, time: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={quickScheduleData.location}
                      onChange={(e) => setQuickScheduleData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter venue or address"
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-navy hover:bg-blue-800"
                    disabled={createMeetupMutation.isPending}
                  >
                    {createMeetupMutation.isPending ? 'Sending...' : 'Send Invitation'}
                  </Button>
                </form>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
