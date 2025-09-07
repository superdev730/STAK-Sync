import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CalendarDays, Clock, MapPin, Users, Calendar, User, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface ProgramContentProps {
  eventId: string;
  onMissionUpdate?: (action: string, data?: any) => void;
}

interface EventComponent {
  id: string;
  kind: string;
  title: string;
  description?: string;
  start_ts: string;
  end_ts: string;
  location?: string;
  speakers: Array<{
    speaker_id?: string;
    name: string;
    headline?: string;
  }>;
  tags: string[];
  order_index: number;
}

interface SyncGroup {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  is_active: boolean;
  planned_start_ts?: string;
  planned_end_ts?: string;
  location?: string;
  member_count: number;
}

export default function ProgramContent({ eventId, onMissionUpdate }: ProgramContentProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedComponent, setExpandedComponent] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<Set<string>>(new Set());
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  // Fetch agenda
  const { data: agendaData, isLoading: agendaLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'agenda'],
  });

  // Fetch sync groups
  const { data: groupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/events', eventId, 'groups'],
  });

  // Fetch user's joined groups
  const { data: myGroupsData } = useQuery({
    queryKey: ['/api/events', eventId, 'groups', 'mine'],
  });

  // Create new group mutation
  const createGroupMutation = useMutation({
    mutationFn: async ({ name, description }: { name: string; description: string }) => {
      return apiRequest('POST', `/api/events/${eventId}/groups`, { name, description });
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Group Created!",
        description: `You've created and joined "${newGroupName}".`,
      });
      
      // Reset form
      setNewGroupName('');
      setNewGroupDescription('');
      setShowCreateGroup(false);
      
      // Add to user's groups
      setUserGroups(prev => new Set(Array.from(prev).concat([(data as any).group.id])));
      
      // Refresh groups
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'groups'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'groups', 'mine'] 
      });

      // Send telemetry for mission tracking
      onMissionUpdate?.('join_group', { group_id: (data as any).group.id });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create group. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Join/leave group mutation
  const groupMutation = useMutation({
    mutationFn: async ({ groupId, action }: { groupId: string; action: 'join' | 'leave' }) => {
      if (action === 'join') {
        return apiRequest('POST', `/api/events/${eventId}/groups/${groupId}/join`);
      } else {
        return apiRequest('DELETE', `/api/events/${eventId}/groups/${groupId}/join`);
      }
    },
    onSuccess: (data, variables) => {
      const { groupId, action } = variables;
      
      // Update local state immediately
      if (action === 'join') {
        setUserGroups(prev => new Set([...Array.from(prev), groupId]));
        toast({
          title: "Joined Sync Group",
          description: "You've successfully joined the group!",
        });
        
        // Send telemetry for mission tracking
        onMissionUpdate?.('join_group', { group_id: groupId });
      } else {
        setUserGroups(prev => {
          const newSet = new Set(Array.from(prev));
          newSet.delete(groupId);
          return newSet;
        });
        toast({
          title: "Left Sync Group",
          description: "You've left the group.",
        });
      }

      // Invalidate and refetch groups data
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'groups'] 
      });
      queryClient.invalidateQueries({ 
        queryKey: ['/api/events', eventId, 'groups', 'mine'] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Initialize user groups from API
  useEffect(() => {
    if ((myGroupsData as any)?.groups) {
      const joinedGroupIds = new Set<string>((myGroupsData as any).groups.map((g: any) => g.group_id as string));
      setUserGroups(joinedGroupIds);
    }
  }, [myGroupsData]);

  // Track agenda viewing for mission
  useEffect(() => {
    const timer = setTimeout(() => {
      onMissionUpdate?.('view_agenda', { view_duration: 20000 });
    }, 20000); // 20 seconds

    return () => clearTimeout(timer);
  }, [onMissionUpdate]);

  const handleComponentExpand = (componentId: string) => {
    setExpandedComponent(prev => prev === componentId ? null : componentId);
    if (expandedComponent !== componentId) {
      onMissionUpdate?.('open_component', { component_id: componentId });
    }
  };

  const handleGroupAction = (groupId: string, action: 'join' | 'leave') => {
    groupMutation.mutate({ groupId, action });
  };

  const handleCreateGroup = () => {
    if (!newGroupName.trim()) {
      toast({
        title: "Group Name Required",
        description: "Please enter a name for your sync group.",
        variant: "destructive",
      });
      return;
    }
    createGroupMutation.mutate({ 
      name: newGroupName.trim(), 
      description: newGroupDescription.trim() 
    });
  };

  const getComponentIcon = (kind: string) => {
    switch (kind) {
      case 'keynote': return '🎯';
      case 'panel': return '👥';
      case 'workshop': return '🔧';
      case 'roundtable': return '⭕';
      case 'breakout': return '💭';
      case 'social': return '🍾';
      case 'sponsor': return '🤝';
      default: return '📋';
    }
  };

  const formatTime = (timestamp: string) => {
    return format(new Date(timestamp), 'h:mm a');
  };

  const formatTimeRange = (start: string, end: string) => {
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  if (agendaLoading || groupsLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded animate-pulse" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-muted rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const components: EventComponent[] = (agendaData as any)?.components || [];
  const groups: SyncGroup[] = (groupsData as any)?.groups || [];

  return (
    <div className="space-y-6" data-testid="program-content">
      <Tabs defaultValue="agenda" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="agenda" data-testid="tab-agenda">
            <CalendarDays className="mr-2 h-4 w-4" />
            Event Agenda
          </TabsTrigger>
          <TabsTrigger value="groups" data-testid="tab-groups">
            <Users className="mr-2 h-4 w-4" />
            Sync Groups ({groups.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agenda" className="space-y-4" data-testid="agenda-content">
          <div className="text-sm text-muted-foreground">
            {components.length} program components • Expand any item to see details
          </div>
          
          {components.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  No agenda items available yet. Check back soon!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {components.map((component) => (
                <Card 
                  key={component.id} 
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md",
                    expandedComponent === component.id && "border-primary/50 shadow-md"
                  )}
                  onClick={() => handleComponentExpand(component.id)}
                  data-testid={`component-${component.id}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{getComponentIcon(component.kind)}</span>
                        <div>
                          <CardTitle className="text-base leading-tight">
                            {component.title}
                          </CardTitle>
                          <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Clock className="mr-1 h-3 w-3" />
                              {formatTimeRange(component.start_ts, component.end_ts)}
                            </span>
                            {component.location && (
                              <span className="flex items-center">
                                <MapPin className="mr-1 h-3 w-3" />
                                {component.location}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {component.kind}
                      </Badge>
                    </div>
                  </CardHeader>

                  {expandedComponent === component.id && (
                    <CardContent className="pt-0">
                      {component.description && (
                        <p className="text-sm text-muted-foreground mb-4">
                          {component.description}
                        </p>
                      )}
                      
                      {component.speakers.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold flex items-center">
                            <User className="mr-2 h-4 w-4" />
                            Speakers
                          </h4>
                          <div className="space-y-1">
                            {component.speakers.map((speaker, idx) => (
                              <div key={idx} className="text-sm">
                                <span className="font-medium">{speaker.name}</span>
                                {speaker.headline && (
                                  <span className="text-muted-foreground ml-2">
                                    • {speaker.headline}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {component.tags.length > 0 && (
                        <div className="mt-4">
                          <div className="flex flex-wrap gap-1">
                            {component.tags.map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="groups" className="space-y-4" data-testid="groups-content">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Join Sync Groups to connect with attendees who share your interests
            </div>
            
            <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
              <DialogTrigger asChild>
                <Button size="sm" data-testid="button-create-group">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create a New Sync Group</DialogTitle>
                  <DialogDescription>
                    Start a new group to connect with attendees around a specific topic or interest.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-name">Group Name</Label>
                    <Input
                      id="group-name"
                      placeholder="e.g., SaaS Startup Founders"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      data-testid="input-group-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-description">Description (Optional)</Label>
                    <Textarea
                      id="group-description"
                      placeholder="Describe what this group is about..."
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      data-testid="textarea-group-description"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateGroup(false)}
                    data-testid="button-cancel-create"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateGroup}
                    disabled={createGroupMutation.isPending}
                    data-testid="button-confirm-create"
                  >
                    {createGroupMutation.isPending ? 'Creating...' : 'Create Group'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {groups.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-muted-foreground mb-4">
                    No Sync Groups available yet. Be the first to create one!
                  </p>
                  <Button onClick={() => setShowCreateGroup(true)} data-testid="button-create-first-group">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Group
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {groups.filter(g => g.is_active).map((group) => {
                const isJoined = userGroups.has(group.id);
                
                return (
                  <Card key={group.id} data-testid={`group-${group.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base">{group.name}</CardTitle>
                          {group.description && (
                            <CardDescription className="mt-1">
                              {group.description}
                            </CardDescription>
                          )}
                          
                          <div className="flex items-center space-x-4 mt-3 text-sm text-muted-foreground">
                            <span className="flex items-center">
                              <Users className="mr-1 h-3 w-3" />
                              {group.member_count} members
                            </span>
                            
                            {group.planned_start_ts && group.planned_end_ts && (
                              <span className="flex items-center">
                                <Calendar className="mr-1 h-3 w-3" />
                                {formatTimeRange(group.planned_start_ts, group.planned_end_ts)}
                              </span>
                            )}
                            
                            {group.location && (
                              <span className="flex items-center">
                                <MapPin className="mr-1 h-3 w-3" />
                                {group.location}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <Button
                          variant={isJoined ? "outline" : "default"}
                          size="sm"
                          onClick={() => handleGroupAction(group.id, isJoined ? 'leave' : 'join')}
                          disabled={groupMutation.isPending}
                          data-testid={`button-${isJoined ? 'leave' : 'join'}-group-${group.id}`}
                        >
                          {groupMutation.isPending ? (
                            'Loading...'
                          ) : isJoined ? (
                            'Leave Group'
                          ) : (
                            'Join Group'
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}