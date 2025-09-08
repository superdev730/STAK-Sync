import React, { useState, useMemo } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Users, Filter, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

export default function EventAttendeesPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const { toast } = useToast();
  
  // Local state for filtering and sorting
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("score");

  // Fetch all attendees for the event
  const { data: attendeesData, isLoading, error } = useQuery<AttendeesResponse>({
    queryKey: [`/api/events/${eventId}/attendees/ranked`],
    enabled: !!eventId,
  });

  // Process attendees for filtering and sorting
  const processedAttendees = useMemo(() => {
    if (!attendeesData?.attendees) return [];

    let filtered = attendeesData.attendees;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(attendee =>
        attendee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendee.company?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        attendee.headline?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tag
    if (selectedTag !== "all") {
      filtered = filtered.filter(attendee =>
        attendee.overlap_tags?.includes(selectedTag)
      );
    }

    // Sort attendees
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (b.match_score || 0) - (a.match_score || 0);
        case "name":
          return a.name.localeCompare(b.name);
        case "company":
          return (a.company || "").localeCompare(b.company || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [attendeesData?.attendees, searchTerm, selectedTag, sortBy]);

  // Get all unique tags for filter dropdown
  const allTags = useMemo(() => {
    if (!attendeesData?.attendees) return [];
    const tagSet = new Set<string>();
    attendeesData.attendees.forEach(attendee => {
      attendee.overlap_tags?.forEach(tag => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [attendeesData?.attendees]);

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
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-10 w-10 rounded" />
            <Skeleton className="h-8 w-48" />
          </div>
          
          {/* Filter skeleton */}
          <div className="flex gap-4 mb-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
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
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">All Event Attendees</h1>
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
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-3xl font-bold">All Event Attendees</h1>
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
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handleBack}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                All Event Attendees
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {processedAttendees.length} of {attendeesData.attendees.length} attendees shown
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Users className="w-4 h-4" />
            {attendeesData.total_count || attendeesData.attendees.length} total
          </div>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg border">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search attendees by name, company, or title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-attendees"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedTag} onValueChange={setSelectedTag}>
              <SelectTrigger className="w-40" data-testid="select-filter-tags">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32" data-testid="select-sort-by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="score">Sync Score</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="company">Company</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Results Summary */}
        {(searchTerm || selectedTag !== "all") && (
          <div className="mb-4 flex items-center gap-2">
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Showing {processedAttendees.length} results
            </span>
            {searchTerm && (
              <Badge variant="secondary" className="text-xs">
                Search: "{searchTerm}"
              </Badge>
            )}
            {selectedTag !== "all" && (
              <Badge variant="secondary" className="text-xs">
                Tag: {selectedTag}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedTag("all");
              }}
              className="text-xs"
            >
              Clear filters
            </Button>
          </div>
        )}

        {/* Attendees Grid */}
        {processedAttendees.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {processedAttendees.map((attendee) => (
              <AttendeeCard
                key={attendee.member_id}
                attendee={attendee}
                onViewProfile={handleViewProfile}
                onMessage={handleMessage}
                onScheduleSync={handleScheduleSync}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-8 h-8 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No attendees match your filters
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Try adjusting your search or filter criteria.
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm("");
                setSelectedTag("all");
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 p-4 bg-white dark:bg-gray-800 rounded-lg border">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-gray-600 dark:text-gray-300">
            <span>
              Last updated: {new Date(attendeesData.generated_at).toLocaleTimeString()}
            </span>
            <span>
              Sorted by {sortBy === "score" ? "Sync Score (highest first)" : sortBy === "name" ? "Name (A-Z)" : "Company (A-Z)"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}