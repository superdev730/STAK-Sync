import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { InlineEdit } from "@/components/InlineEdit";
import { SimpleProfileAIAssistant } from "@/components/SimpleProfileAIAssistant";
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
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage 
                    src={profile.profileImageUrl || undefined} 
                    alt={`${profile.firstName} ${profile.lastName}`} 
                  />
                  <AvatarFallback className="text-2xl bg-stak-copper text-white">
                    {(profile.firstName?.[0] || 'U')}{(profile.lastName?.[0] || 'N')}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button
                    size="sm"
                    className="absolute bottom-0 right-0 rounded-full w-8 h-8 p-0 bg-stak-copper hover:bg-stak-copper/80"
                    data-testid="button-edit-profile-image"
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Profile Info */}
            <div className="flex-grow">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  {/* Name */}
                  <div className="mb-2">
                    <InlineEdit
                      value={`${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User Name'}
                      onSave={(value) => {
                        const [firstName, ...lastNameParts] = value.split(' ');
                        const lastName = lastNameParts.join(' ');
                        updateFieldMutation.mutate({ 
                          field: 'firstName', 
                          value: firstName 
                        });
                        if (lastName) {
                          updateFieldMutation.mutate({ 
                            field: 'lastName', 
                            value: lastName 
                          });
                        }
                      }}
                      isEditable={isOwnProfile}
                      className="text-2xl font-bold text-stak-black"
                      placeholder="Your name"
                      dataTestId="text-user-name"
                    />
                  </div>

                  {/* Position & Company */}
                  <div className="mb-2">
                    <InlineEdit
                      value={profile.position || ''}
                      onSave={(value) => updateFieldMutation.mutate({ field: 'position', value })}
                      isEditable={isOwnProfile}
                      className="text-lg font-medium text-gray-800"
                      placeholder="Your job title"
                      dataTestId="text-job-title"
                    />
                    {profile.company && (
                      <div className="flex items-center gap-1 mt-1">
                        <Building2 className="w-4 h-4 text-gray-500" />
                        <InlineEdit
                          value={profile.company || ''}
                          onSave={(value) => updateFieldMutation.mutate({ field: 'company', value })}
                          isEditable={isOwnProfile}
                          className="text-gray-600"
                          placeholder="Company name"
                          dataTestId="text-company"
                        />
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  {profile.location && (
                    <div className="flex items-center gap-1 text-gray-600">
                      <MapPin className="w-4 h-4" />
                      <InlineEdit
                        value={profile.location || ''}
                        onSave={(value) => updateFieldMutation.mutate({ field: 'location', value })}
                        isEditable={isOwnProfile}
                        placeholder="Your location"
                        dataTestId="text-location"
                      />
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
                <InlineEdit
                  value={profile.bio || ''}
                  onSave={(value) => updateFieldMutation.mutate({ field: 'bio', value })}
                  isEditable={isOwnProfile}
                  className="text-gray-700 leading-relaxed"
                  placeholder="Tell others about yourself..."
                  multiline
                  dataTestId="text-bio"
                />
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
                  <InlineEdit
                    value={profile.networkingGoals || ''}
                    onSave={(value) => updateFieldMutation.mutate({ field: 'networkingGoals', value })}
                    isEditable={isOwnProfile}
                    className="text-gray-700"
                    placeholder="What are your networking goals?"
                    dataTestId="text-networking-goals"
                  />
                </CardContent>
              </Card>
            )}

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Social & Web Presence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Always show LinkedIn with inline edit if it's your profile */}
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Linkedin className="w-5 h-5 text-blue-600" />
                    {profile.linkedinUrl ? (
                      <div className="flex-grow">
                        {isOwnProfile ? (
                          <InlineEdit
                            value={profile.linkedinUrl}
                            onSave={(value) => updateFieldMutation.mutate({ field: 'linkedinUrl', value })}
                            isEditable={isOwnProfile}
                            className="text-gray-700 flex-grow"
                            placeholder="Your LinkedIn URL"
                            dataTestId="input-linkedin-url"
                          />
                        ) : (
                          <a 
                            href={profile.linkedinUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            data-testid="link-linkedin"
                          >
                            LinkedIn Profile
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex-grow">
                        {isOwnProfile ? (
                          <InlineEdit
                            value=""
                            onSave={(value) => updateFieldMutation.mutate({ field: 'linkedinUrl', value })}
                            isEditable={isOwnProfile}
                            className="text-gray-500"
                            placeholder="Add your LinkedIn URL"
                            dataTestId="input-linkedin-url"
                          />
                        ) : (
                          <span className="text-gray-500">LinkedIn not provided</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Twitter */}
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Twitter className="w-5 h-5 text-sky-500" />
                    {profile.twitterUrl ? (
                      <div className="flex-grow">
                        {isOwnProfile ? (
                          <InlineEdit
                            value={profile.twitterUrl}
                            onSave={(value) => updateFieldMutation.mutate({ field: 'twitterUrl', value })}
                            isEditable={isOwnProfile}
                            className="text-gray-700 flex-grow"
                            placeholder="Your Twitter/X URL"
                            dataTestId="input-twitter-url"
                          />
                        ) : (
                          <a 
                            href={profile.twitterUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sky-500 hover:underline"
                            data-testid="link-twitter"
                          >
                            Twitter/X Profile
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex-grow">
                        {isOwnProfile ? (
                          <InlineEdit
                            value=""
                            onSave={(value) => updateFieldMutation.mutate({ field: 'twitterUrl', value })}
                            isEditable={isOwnProfile}
                            className="text-gray-500"
                            placeholder="Add your Twitter/X URL"
                            dataTestId="input-twitter-url"
                          />
                        ) : (
                          <span className="text-gray-500">Twitter not provided</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* GitHub */}
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Github className="w-5 h-5 text-gray-800" />
                    {profile.githubUrl ? (
                      <div className="flex-grow">
                        {isOwnProfile ? (
                          <InlineEdit
                            value={profile.githubUrl}
                            onSave={(value) => updateFieldMutation.mutate({ field: 'githubUrl', value })}
                            isEditable={isOwnProfile}
                            className="text-gray-700 flex-grow"
                            placeholder="Your GitHub URL"
                            dataTestId="input-github-url"
                          />
                        ) : (
                          <a 
                            href={profile.githubUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-800 hover:underline"
                            data-testid="link-github"
                          >
                            GitHub Profile
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="flex-grow">
                        {isOwnProfile ? (
                          <InlineEdit
                            value=""
                            onSave={(value) => updateFieldMutation.mutate({ field: 'githubUrl', value })}
                            isEditable={isOwnProfile}
                            className="text-gray-500"
                            placeholder="Add your GitHub URL"
                            dataTestId="input-github-url"
                          />
                        ) : (
                          <span className="text-gray-500">GitHub not provided</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Website URLs */}
                  {profile.websiteUrls?.map((url, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                      <Globe className="w-5 h-5 text-gray-600" />
                      <div className="flex-grow">
                        {isOwnProfile ? (
                          <InlineEdit
                            value={url}
                            onSave={(value) => {
                              const newUrls = [...(profile.websiteUrls || [])];
                              newUrls[index] = value;
                              updateFieldMutation.mutate({ field: 'websiteUrls', value: newUrls });
                            }}
                            isEditable={isOwnProfile}
                            className="text-gray-700 flex-grow"
                            placeholder="Website URL"
                            dataTestId={`input-website-url-${index}`}
                          />
                        ) : (
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:underline"
                            data-testid={`link-website-${index}`}
                          >
                            Personal Website
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Add new website button for own profile */}
                  {isOwnProfile && (
                    <Button
                      variant="outline"
                      onClick={async () => {
                        try {
                          const newUrls = [...(profile.websiteUrls || []), ''];
                          await updateFieldMutation.mutateAsync({ field: 'websiteUrls', value: newUrls });
                        } catch (error) {
                          console.error('Error adding website:', error);
                          toast({
                            title: "Error",
                            description: "Failed to add website field. Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                      className="w-full border-dashed"
                      data-testid="button-add-website"
                      disabled={updateFieldMutation.isPending}
                    >
                      {updateFieldMutation.isPending ? 'Adding...' : '+ Add Website'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
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
              <SimpleProfileAIAssistant />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}