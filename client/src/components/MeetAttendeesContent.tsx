import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ExternalLink, AlertCircle } from "lucide-react";
import { AttendeeCard } from "./AttendeeCard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Mission {
  id: string;
  title: string;
  description: string;
  points: number;
  status: string;
}

interface MeetAttendeesContentProps {
  eventId: string;
  mission: Mission;
  onMissionUpdate?: () => void;
}

type Attendee = {
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
};

interface RankedAttendeesResponse {
  event_id: string;
  member_id: string;
  attendees: Attendee[];
  generated_at: string;
}

export const MeetAttendeesContent: React.FC<MeetAttendeesContentProps> = ({
  eventId,
  mission,
  onMissionUpdate,
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch ranked attendees
  const { data: rankedData, isLoading, error } = useQuery<RankedAttendeesResponse>({
    queryKey: [`/api/events/${eventId}/attendees/ranked`, { limit: 5 }],
    enabled: !!eventId,
  });

  // Mission telemetry mutation
  const telemetryMutation = useMutation({
    mutationFn: async ({ action, target_member_id }: { action: string; target_member_id: string }) => {
      return await fetch(`/api/events/${eventId}/missions/meet_attendees/telemetry`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action, target_member_id })
      });
    },
    onSuccess: () => {
      // Invalidate missions cache to refresh status
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/missions`] });
      queryClient.invalidateQueries({ queryKey: ['/api/events', eventId, 'missions'] });
      onMissionUpdate?.();
    },
    onError: (error) => {
      console.error('Telemetry error:', error);
    }
  });

  const handleViewProfile = async (memberId: string) => {
    // Track the action
    await telemetryMutation.mutateAsync({
      action: "view_profile",
      target_member_id: memberId
    });

    // Navigate to profile (would typically use router)
    window.open(`/profile/${memberId}`, '_blank');
  };

  const handleMessage = async (memberId: string) => {
    // Track the action
    await telemetryMutation.mutateAsync({
      action: "message_sent", 
      target_member_id: memberId
    });

    // Navigate to messages (would typically use router)
    window.open(`/messages/new?to=${memberId}`, '_blank');
    
    toast({
      title: "Message Action Tracked",
      description: "Mission progress updated!",
    });
  };

  const handleScheduleSync = async (memberId: string) => {
    // Track the action
    await telemetryMutation.mutateAsync({
      action: "sync_created",
      target_member_id: memberId  
    });

    // Navigate to sync creation (would typically use router)
    window.open(`/events/${eventId}/sync/new?with=${memberId}`, '_blank');
    
    toast({
      title: "Sync Action Tracked", 
      description: "Mission progress updated!",
    });
  };

  const handleSeeAll = () => {
    // Navigate to full attendees page
    window.open(`/events/${eventId}/attendees`, '_blank');
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Loading top attendees...
        </p>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 mb-3">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">Failed to load attendees</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/attendees/ranked`] })}
        >
          Retry
        </Button>
      </div>
    );
  }

  // Empty state
  if (!rankedData?.attendees || rankedData.attendees.length === 0) {
    return (
      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center py-6">
          <Users className="w-8 h-8 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            No ranked matches yet. Set your networking goals to unlock personalized matches.
          </p>
          <Button 
            size="sm" 
            onClick={() => window.open(`/events/${eventId}/goals`, '_blank')}
          >
            Set Networking Goals
          </Button>
        </div>
      </div>
    );
  }

  // Main content with attendees
  return (
    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-medium text-sm">Top Sync Matches</h4>
        <span className="text-xs text-gray-500">
          {rankedData.attendees.length} of {rankedData.attendees.length} shown
        </span>
      </div>

      {/* Attendee Cards */}
      <div className="space-y-3 mb-4">
        {rankedData.attendees.map((attendee) => (
          <AttendeeCard
            key={attendee.member_id}
            attendee={attendee}
            onViewProfile={handleViewProfile}
            onMessage={handleMessage}
            onScheduleSync={handleScheduleSync}
          />
        ))}
      </div>

      {/* See All Button */}
      <div className="border-t pt-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleSeeAll}
          data-testid="button-see-all-attendees"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          See All Attendees
        </Button>
      </div>

      {/* Mission completion hint */}
      {mission.status !== 'completed' && (
        <div className="mt-3 text-xs text-gray-500">
          💡 Complete by viewing 3 profiles, sending a message, or scheduling a sync
        </div>
      )}
    </div>
  );
};