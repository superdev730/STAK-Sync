import React from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendeeCard } from "@/components/AttendeeCard";
import { useToast } from "@/hooks/use-toast";

interface Attendee {
  member_id: string;
  name: string;
  company?: string;
  headline?: string;
  avatar_url?: string;
  match_score?: number;
  overlap_tags?: string[];
  actions?: {
    profile_url: string;
    message_url: string;
    sync_url: string;
  };
}

interface AttendeesResponse {
  event_id: string;
  attendees: Attendee[];
  total_count: number;
  generated_at: string;
}

export default function AttendeesPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();

  // Fetch all attendees for the event
  const { data: attendeesData, isLoading, error } = useQuery<AttendeesResponse>({
    queryKey: [`/api/events/${eventId}/attendees/ranked`],
    enabled: !!eventId,
  });

  const handleViewProfile = (memberId: string) => {
    window.open(`/profile/${memberId}`, '_blank');
  };

  const handleMessage = (memberId: string) => {
    window.open(`/messages/new?to=${memberId}`, '_blank');
    toast({
      title: "Message Opened",
      description: "New message window opened!",
    });
  };

  const handleScheduleSync = (memberId: string) => {
    window.open(`/events/${eventId}/sync/new?with=${memberId}`, '_blank');
    toast({
      title: "Sync Opened",
      description: "Sync scheduling window opened!",
    });
  };

  const handleBack = () => {
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-8 w-48" />
          </div>
          
          <div className="space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Event Attendees</h1>
          </div>
          
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Failed to load attendees
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Something went wrong while loading the attendee list.
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!attendeesData?.attendees || attendeesData.attendees.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Event Attendees</h1>
          </div>
          
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No attendees yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Be the first to join this event and start networking!
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Event Attendees
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {attendeesData.attendees.length} attendees ranked by sync score
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            {attendeesData.total_count || attendeesData.attendees.length} total
          </div>
        </div>

        {/* Attendees Grid */}
        <div className="space-y-4">
          {attendeesData.attendees.map((attendee) => (
            <AttendeeCard
              key={attendee.member_id}
              attendee={attendee}
              onViewProfile={handleViewProfile}
              onMessage={handleMessage}
              onScheduleSync={handleScheduleSync}
            />
          ))}
        </div>

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
            <span>
              Last updated: {new Date(attendeesData.generated_at).toLocaleTimeString()}
            </span>
            <span>
              Sorted by Sync Score (highest first)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}