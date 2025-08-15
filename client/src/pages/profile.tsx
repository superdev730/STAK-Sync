import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { SocialMediaSection } from "@/components/SocialMediaSection";
import { SimpleProfileAIAssistant } from "@/components/SimpleProfileAIAssistant";
import { BrandStorytellingGenerator } from "@/components/BrandStorytellingGenerator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, 
  MapPin, 
  Building2, 
  Globe, 
  Linkedin, 
  Twitter, 
  Github, 
  Mail,
  MessageCircle,
  Calendar,
  TrendingUp,
  Eye,
  Award,
  Star,
  Edit2,
  Camera
} from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  position: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  linkedinUrl: string | null;
  twitterUrl: string | null;
  githubUrl: string | null;
  websiteUrls: string[] | null;
  skills: string[] | null;
  industries: string[] | null;
  networkingGoals: string | null;
  investmentStage: string | null;
  fundingRange: string | null;
  privacySettings: any | null;
  createdAt: string;
  updatedAt: string;
}

interface ProfileStats {
  completionPercentage: number;
  signalScore: number;
  connections: number;
  meetingRequestsCount: number;
  profileViews: number;
}

export default function Profile() {
  // All hooks declared at the top level in consistent order
  const { user: currentUser } = useAuth();
  const [, params] = useRoute("/profile/:userId?");
  const userId = params?.userId;
  const isOwnProfile = !userId || userId === currentUser?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // State hooks
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{[key: string]: any}>({});
  
  // Query hooks
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: userId ? ["/api/profile", userId] : ["/api/profile"],
    enabled: !!currentUser,
  });

  const { data: stats } = useQuery<ProfileStats>({
    queryKey: userId ? ["/api/profile/stats", userId] : ["/api/profile/stats"],
    enabled: !!currentUser && !!profile,
  });

  // Mutation hooks
  const updateFieldMutation = useMutation({
    mutationFn: async ({ field, value }: { field: string, value: any }) => {
      const response = await apiRequest("PUT", "/api/profile", { [field]: value });
      return response.json();
    },
    onSuccess: (data, { field }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      setEditingField(null);
      setEditValues(prev => ({ ...prev, [field]: undefined }));
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: any, { field }) => {
      toast({
        title: "Update Failed",
        description: `Failed to update ${field}. Please try again.`,
        variant: "destructive",
      });
    },
  });

  // All helper functions after hooks
  const getSyncLevel = (score: number) => {
    if (score >= 800) return { level: "Sync Master", color: "bg-stak-copper", badge: "🏆" };
    if (score >= 600) return { level: "Sync Expert", color: "bg-yellow-500", badge: "⭐" };
    if (score >= 400) return { level: "Sync Builder", color: "bg-gray-500", badge: "🚀" };
    if (score >= 200) return { level: "Sync Starter", color: "bg-stak-forest", badge: "🌱" };
    return { level: "New Member", color: "bg-gray-400", badge: "👋" };
  };

  const startEditing = (field: string, currentValue: any) => {
    setEditingField(field);
    setEditValues(prev => ({ ...prev, [field]: currentValue || '' }));
  };

  const cancelEditing = () => {
    setEditingField(null);
    setEditValues({});
  };

  const saveField = (field: string) => {
    const value = editValues[field];
    if (value !== undefined) {
      updateFieldMutation.mutate({ field, value });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, field: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveField(field);
    }
    if (e.key === 'Escape') {
      cancelEditing();
    }
  };

  // Early returns after all hooks
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-stak-copper mx-auto mb-4"></div>
          <p className="text-stak-black">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stak-black mb-2">Profile Not Found</h2>
          <p className="text-gray-600">This profile doesn't exist or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }

  const syncLevel = getSyncLevel(stats?.signalScore || 0);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              {isOwnProfile ? (
                <div className="relative group cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          const base64 = e.target?.result as string;
                          updateFieldMutation.mutate({ 
                            field: 'profileImageUrl', 
                            value: base64 
                          });
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="hidden"
                    id="photo-upload"
                    data-testid="input-photo-upload"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="block cursor-pointer relative"
                    data-testid="button-edit-photo"
                  >
                    <Avatar className="w-32 h-32 border-4 border-white shadow-lg hover:opacity-80 transition-opacity">
                      <AvatarImage 
                        src={profile.profileImageUrl || undefined} 
                        alt={`${profile.firstName} ${profile.lastName}`} 
                      />
                      <AvatarFallback className="text-2xl bg-stak-copper text-white">
                        {(profile.firstName?.[0] || 'U')}{(profile.lastName?.[0] || 'N')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                      <div className="text-center text-white">
                        <Camera className="h-8 w-8 mx-auto mb-1" />
                        <div className="text-xs font-medium">Change Photo</div>
                      </div>
                    </div>
                  </label>
                </div>
              ) : (
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage 
                    src={profile.profileImageUrl || undefined} 
                    alt={`${profile.firstName} ${profile.lastName}`} 
                  />
                  <AvatarFallback className="text-2xl bg-stak-copper text-white">
                    {(profile.firstName?.[0] || 'U')}{(profile.lastName?.[0] || 'N')}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  {/* Name */}
                  <div className="mb-2">
                    <div className="text-2xl font-bold text-stak-black" data-testid="text-user-name">
                      {isOwnProfile ? (
                        <input
                          type="text"
                          value={`${profile.firstName || ''} ${profile.lastName || ''}`.trim() || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            const [firstName, ...lastNameParts] = value.split(' ');
                            const lastName = lastNameParts.join(' ');
                            
                            if (firstName !== profile.firstName) {
                              updateFieldMutation.mutate({ 
                                field: 'firstName', 
                                value: firstName 
                              });
                            }
                            if (lastName !== profile.lastName) {
                              updateFieldMutation.mutate({ 
                                field: 'lastName', 
                                value: lastName 
                              });
                            }
                          }}
                          placeholder="Your name"
                          className="text-2xl font-bold text-stak-black bg-transparent border-none focus:outline-none w-full"
                          data-testid="input-user-name"
                        />
                      ) : (
                        `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User Name'
                      )}
                    </div>
                  </div>

                  {/* Position & Company */}
                  <div className="mb-2">
                    {isOwnProfile ? (
                      <input
                        type="text"
                        value={profile.position || ''}
                        onChange={(e) => updateFieldMutation.mutate({ field: 'position', value: e.target.value })}
                        className="text-lg font-medium text-gray-800 bg-transparent border-none focus:outline-none w-full"
                        placeholder="Your job title"
                        data-testid="text-job-title"
                      />
                    ) : (
                      <span className="text-lg font-medium text-gray-800">{profile.position || 'Job title not provided'}</span>
                    )}
                    {profile.company && (
                      <div className="flex items-center gap-1 mt-1">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        {isOwnProfile ? (
                          <input
                            type="text"
                            value={profile.company || ''}
                            onChange={(e) => updateFieldMutation.mutate({ field: 'company', value: e.target.value })}
                            className="text-gray-600 bg-transparent border-none focus:outline-none w-full"
                            placeholder="Company name"
                            data-testid="text-company"
                          />
                        ) : (
                          <span className="text-gray-600">{profile.company}</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  {profile.location && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {isOwnProfile ? (
                        <input
                          type="text"
                          value={profile.location || ''}
                          onChange={(e) => updateFieldMutation.mutate({ field: 'location', value: e.target.value })}
                          className="bg-transparent border-none focus:outline-none w-full"
                          placeholder="Your location"
                          data-testid="text-location"
                        />
                      ) : (
                        <span>{profile.location}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Sync Score */}
                <div className="flex-shrink-0">
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-full text-white text-sm font-medium ${syncLevel.color}`}>
                      <span>{syncLevel.badge}</span>
                      <span>{syncLevel.level}</span>
                    </div>
                    <div className="mt-2">
                      <div className="text-2xl font-bold text-stak-copper" data-testid="text-sync-score">
                        {stats?.signalScore || 0}
                      </div>
                      <div className="text-xs text-gray-500">Sync Score</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <div className="mb-4">
                {isOwnProfile ? (
                  <textarea
                    value={profile.bio || ''}
                    onChange={(e) => updateFieldMutation.mutate({ field: 'bio', value: e.target.value })}
                    className="w-full text-gray-700 leading-relaxed bg-transparent border-none focus:outline-none resize-none min-h-[100px]"
                    placeholder="Tell others about yourself..."
                    data-testid="text-bio"
                  />
                ) : (
                  <p className="text-gray-700 leading-relaxed">{profile.bio || 'Bio not provided'}</p>
                )}
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && (
                <div className="flex gap-2">
                  <Button className="bg-stak-copper hover:bg-stak-copper/90" data-testid="button-connect">
                    <Users className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                  <Button variant="outline" data-testid="button-message">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" data-testid="button-schedule">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="experience">Experience</TabsTrigger>
            <TabsTrigger value="connections">Network</TabsTrigger>
            {isOwnProfile && <TabsTrigger value="ai-assistant">AI Assistant</TabsTrigger>}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Skills & Industries */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    Skills & Expertise
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills?.length ? (
                          profile.skills.map((skill, index) => (
                            <Badge key={index} variant="secondary" data-testid={`badge-skill-${index}`}>
                              {skill}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">
                            {isOwnProfile ? "Add your skills to showcase your expertise" : "No skills listed"}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">Industries</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.industries?.length ? (
                          profile.industries.map((industry, index) => (
                            <Badge key={index} variant="outline" data-testid={`badge-industry-${index}`}>
                              {industry}
                            </Badge>
                          ))
                        ) : (
                          <p className="text-gray-500 text-sm">
                            {isOwnProfile ? "Add industries you work in" : "No industries listed"}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Profile Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Profile Analytics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-stak-copper" data-testid="text-profile-views">
                        {stats?.profileViews || 0}
                      </div>
                      <div className="text-sm text-gray-600">Profile Views</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-stak-forest" data-testid="text-connections">
                        {stats?.connections || 0}
                      </div>
                      <div className="text-sm text-gray-600">Connections</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-800" data-testid="text-meeting-requests">
                        {stats?.meetingRequestsCount || 0}
                      </div>
                      <div className="text-sm text-gray-600">Meeting Requests</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600" data-testid="text-completion">
                        {stats?.completionPercentage || 0}%
                      </div>
                      <div className="text-sm text-gray-600">Profile Complete</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Networking Goals */}
            {profile.networkingGoals && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="w-5 h-5" />
                    Networking Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isOwnProfile ? (
                    <textarea
                      value={profile.networkingGoals || ''}
                      onChange={(e) => updateFieldMutation.mutate({ field: 'networkingGoals', value: e.target.value })}
                      className="w-full text-gray-700 bg-transparent border-none focus:outline-none resize-none"
                      placeholder="What are your networking goals?"
                      data-testid="text-networking-goals"
                    />
                  ) : (
                    <p className="text-gray-700">{profile.networkingGoals || 'Networking goals not provided'}</p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Social & Web Presence - Completely Rewritten */}
            <SocialMediaSection 
              profile={profile}
              isOwnProfile={isOwnProfile}
              updateProfile={updateFieldMutation.mutate}
              isUpdating={updateFieldMutation.isPending}
            />

            {/* Brand Storytelling Generator */}
            {isOwnProfile && (
              <BrandStorytellingGenerator
                profile={profile}
                updateProfile={updateFieldMutation.mutate}
              />
            )}
          </TabsContent>

          <TabsContent value="experience">
            <Card>
              <CardHeader>
                <CardTitle>Professional Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Experience section coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="connections">
            <Card>
              <CardHeader>
                <CardTitle>Professional Network</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500">Network view coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {isOwnProfile && (
            <TabsContent value="ai-assistant">
              <SimpleProfileAIAssistant 
                currentProfile={{
                  bio: profile.bio || '',
                  firstName: profile.firstName || '',
                  lastName: profile.lastName || '',
                  company: profile.company || '',
                  title: profile.position || '',
                  skills: profile.skills || [],
                  industries: profile.industries || [],
                  networkingGoal: profile.networkingGoals || '',
                  linkedinUrl: profile.linkedinUrl || '',
                  twitterUrl: profile.twitterUrl || '',
                  githubUrl: profile.githubUrl || '',
                  websiteUrls: profile.websiteUrls || []
                }}
                onBioUpdate={(newBio) => {
                  updateFieldMutation.mutate({ field: 'bio', value: newBio });
                }}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}