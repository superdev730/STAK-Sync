import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Badge, Eye, EyeOff, Plus, Award, Users, Settings, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BadgeDisplay, BadgeCollection } from "./BadgeDisplay";

interface UserBadge {
  id: string;
  userId: string;
  badgeId: string;
  earnedAt: string;
  isVisible: boolean;
  metadata?: any;
  badge: {
    id: string;
    name: string;
    description: string;
    badgeType: string;
    tier: string;
    backgroundColor: string;
    textColor: string;
    rarity: string;
    points: number;
    isEventSpecific: boolean;
    eventId?: string;
  };
}

export function BadgeManager({ userId, isAdmin = false }: { userId: string; isAdmin?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBadge, setSelectedBadge] = useState<UserBadge | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  // Fetch user's badges
  const { data: userBadges = [], isLoading } = useQuery<UserBadge[]>({
    queryKey: ['/api/users', userId, 'badges'],
    queryFn: () => apiRequest('GET', `/api/users/${userId}/badges`).then(res => res.json()),
  });

  // Fetch all available badges (for admin)
  const { data: allBadges = [] } = useQuery({
    queryKey: ['/api/badges'],
    queryFn: () => apiRequest('GET', '/api/badges').then(res => res.json()),
    enabled: isAdmin,
  });

  // Update badge visibility
  const updateVisibilityMutation = useMutation({
    mutationFn: ({ badgeId, isVisible }: { badgeId: string; isVisible: boolean }) =>
      apiRequest('PATCH', `/api/users/${userId}/badges/${badgeId}/visibility`, { isVisible }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'badges'] });
      toast({
        title: "Badge visibility updated",
        description: "Your badge preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update badge visibility.",
        variant: "destructive",
      });
    },
  });

  // Award badge (admin only)
  const awardBadgeMutation = useMutation({
    mutationFn: ({ badgeId, metadata }: { badgeId: string; metadata?: any }) =>
      apiRequest('POST', `/api/admin/badges/${badgeId}/award`, { userId, metadata }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'badges'] });
      toast({
        title: "Badge awarded",
        description: "The badge has been successfully awarded to the user.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to award badge.",
        variant: "destructive",
      });
    },
  });

  // Remove badge (admin only)
  const removeBadgeMutation = useMutation({
    mutationFn: (badgeId: string) =>
      apiRequest('DELETE', `/api/admin/users/${userId}/badges/${badgeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users', userId, 'badges'] });
      toast({
        title: "Badge removed",
        description: "The badge has been removed from the user.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove badge.",
        variant: "destructive",
      });
    },
  });

  const handleVisibilityToggle = (badgeId: string, isVisible: boolean) => {
    updateVisibilityMutation.mutate({ badgeId, isVisible });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-copper-600" />
            Loading Badges...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const visibleBadges = userBadges.filter(ub => ub.isVisible);
  const hiddenBadges = userBadges.filter(ub => !ub.isVisible);

  return (
    <div className="space-y-6">
      {/* Badge Collection Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-copper-600" />
            My Badges ({userBadges.length})
          </CardTitle>
          <CardDescription>
            Showcase your achievements and networking accomplishments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {userBadges.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No badges earned yet</p>
              <p className="text-sm">Complete activities and attend events to earn your first badges!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visibleBadges.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-gray-700">Public Badges</h4>
                  <BadgeCollection
                    badges={visibleBadges.map(ub => ({ badge: ub.badge, userBadge: ub }))}
                    maxDisplay={10}
                    size="lg"
                    onBadgeClick={(badgeData) => setSelectedBadge(badgeData)}
                  />
                </div>
              )}
              
              {hiddenBadges.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3 text-gray-500">Hidden Badges</h4>
                  <BadgeCollection
                    badges={hiddenBadges.map(ub => ({ badge: ub.badge, userBadge: ub }))}
                    maxDisplay={10}
                    size="md"
                    onBadgeClick={(badgeData) => setSelectedBadge(badgeData)}
                  />
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Badge Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-copper-600" />
            Badge Visibility Settings
          </CardTitle>
          <CardDescription>
            Control which badges are shown on your public profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userBadges.map((userBadge) => (
              <div key={userBadge.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <BadgeDisplay
                    badge={userBadge.badge}
                    userBadge={userBadge}
                    size="sm"
                    showTooltip={false}
                  />
                  <div>
                    <div className="font-medium">{userBadge.badge.name}</div>
                    <div className="text-sm text-gray-500">
                      Earned {new Date(userBadge.earnedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Label htmlFor={`badge-${userBadge.id}`} className="text-sm">
                    {userBadge.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Label>
                  <Switch
                    id={`badge-${userBadge.id}`}
                    checked={userBadge.isVisible}
                    onCheckedChange={(checked) => handleVisibilityToggle(userBadge.badgeId, checked)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Admin Actions */}
      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-copper-600" />
              Admin Actions
            </CardTitle>
            <CardDescription>
              Manage badges for this user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Award Badge
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Award Badge</DialogTitle>
                    <DialogDescription>
                      Select a badge to award to this user
                    </DialogDescription>
                  </DialogHeader>
                  <AwardBadgeForm
                    badges={allBadges}
                    onAward={(badgeId, metadata) => {
                      awardBadgeMutation.mutate({ badgeId, metadata });
                      setShowCreateDialog(false);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <BadgeDetailModal
          userBadge={selectedBadge}
          onClose={() => setSelectedBadge(null)}
          onRemove={isAdmin ? (badgeId) => removeBadgeMutation.mutate(badgeId) : undefined}
        />
      )}
    </div>
  );
}

function AwardBadgeForm({ 
  badges, 
  onAward 
}: { 
  badges: any[]; 
  onAward: (badgeId: string, metadata?: any) => void; 
}) {
  const [selectedBadgeId, setSelectedBadgeId] = useState("");
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="badge-select">Badge</Label>
        <Select value={selectedBadgeId} onValueChange={setSelectedBadgeId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a badge to award" />
          </SelectTrigger>
          <SelectContent>
            {badges.map((badge) => (
              <SelectItem key={badge.id} value={badge.id}>
                {badge.name} - {badge.description}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="reason">Reason (Optional)</Label>
        <Textarea
          id="reason"
          placeholder="Why is this badge being awarded?"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      <Button
        onClick={() => onAward(selectedBadgeId, { reason: reason || undefined })}
        disabled={!selectedBadgeId}
        className="w-full"
      >
        Award Badge
      </Button>
    </div>
  );
}

function BadgeDetailModal({ 
  userBadge, 
  onClose, 
  onRemove 
}: { 
  userBadge: UserBadge; 
  onClose: () => void;
  onRemove?: (badgeId: string) => void;
}) {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <BadgeDisplay
              badge={userBadge.badge}
              userBadge={userBadge}
              size="lg"
              showTooltip={false}
            />
            {userBadge.badge.name}
          </DialogTitle>
          <DialogDescription>
            {userBadge.badge.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-medium">Tier</div>
              <div className="capitalize">{userBadge.badge.tier}</div>
            </div>
            <div>
              <div className="font-medium">Rarity</div>
              <div className="capitalize">{userBadge.badge.rarity}</div>
            </div>
            <div>
              <div className="font-medium">Points</div>
              <div>{userBadge.badge.points}</div>
            </div>
            <div>
              <div className="font-medium">Earned</div>
              <div>{new Date(userBadge.earnedAt).toLocaleDateString()}</div>
            </div>
          </div>

          {userBadge.metadata?.reason && (
            <div>
              <div className="font-medium text-sm">Reason</div>
              <div className="text-sm text-gray-600">{userBadge.metadata.reason}</div>
            </div>
          )}

          {onRemove && (
            <div className="flex justify-end">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onRemove(userBadge.badgeId);
                  onClose();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Remove Badge
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}