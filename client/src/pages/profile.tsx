import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, type EnhancedProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import ConsolidatedAIProfileBuilder from "@/components/ConsolidatedAIProfileBuilder";
import ProfilePhotoCropper from "@/components/ProfilePhotoCropper";
import { apiRequest } from "@/lib/queryClient";
import { 
  User as UserIcon,
  Camera,
  Wand2,
  Linkedin,
  Twitter,
  Github,
  Globe,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Trash2,
  Users,
  Building2,
  MapPin,
  Target,
  UserPlus,
  Database,
  Brain,
  Zap,
  TrendingUp,
  Info
} from "lucide-react";

// Provenance Badge Component
const ProvenanceBadge = ({ fieldName, getFieldProvenance, getFieldConfidence }: {
  fieldName: string;
  getFieldProvenance: (field: string) => any;
  getFieldConfidence: (field: string) => number;
}) => {
  const provenance = getFieldProvenance(fieldName);
  const confidence = getFieldConfidence(fieldName);
  
  if (!provenance) return null;
  
  const getIcon = () => {
    switch (provenance.source) {
      case 'db': return <Database className="w-3 h-3" />;
      case 'enrichment': return <Brain className="w-3 h-3" />;
      case 'user': return <UserIcon className="w-3 h-3" />;
      default: return <Info className="w-3 h-3" />;
    }
  };
  
  const getColor = () => {
    switch (provenance.source) {
      case 'db': return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
      case 'enrichment': return 'bg-purple-100 text-purple-800 hover:bg-purple-200';
      case 'user': return 'bg-green-100 text-green-800 hover:bg-green-200';
      default: return 'bg-gray-100 text-gray-800 hover:bg-gray-200';
    }
  };
  
  const getLabel = () => {
    switch (provenance.source) {
      case 'db': return 'Account Info';
      case 'enrichment': return 'AI Enhanced';
      case 'user': return 'User Verified';
      default: return 'Unknown';
    }
  };
  
  return (
    <Badge
      variant="secondary"
      className={`ml-2 text-xs ${getColor()} transition-colors cursor-help`}
      title={`Source: ${getLabel()}, Confidence: ${Math.round(confidence * 100)}%`}
    >
      {getIcon()}
      <span className="ml-1">{getLabel()}</span>
      {confidence < 1 && (
        <span className="ml-1 text-xs opacity-75">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </Badge>
  );
};



export default function Profile() {
  const { user: currentUser } = useAuth();
  const [, params] = useRoute("/profile/:userId?");
  const userId = params?.userId;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Use enhanced profile hook with provenance data
  const {
    profile,
    isLoading: profileLoading,
    isOwnProfile,
    updateProfile,
    isUpdating,
    enrichProfile,
    isEnriching,
    getFieldProvenance,
    getFieldConfidence,
    isFieldFromEnrichment,
    getUnknownFields,
    getCompleteness
  } = useProfile(userId);
  
  // State for consolidated AI profile builder and photo cropper
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [showPhotoCropper, setShowPhotoCropper] = useState(false);
  
  // Local state for company and location fields with autosave
  const [companyValue, setCompanyValue] = useState('');
  const [locationValue, setLocationValue] = useState('');
  const [lastSavedCompany, setLastSavedCompany] = useState('');
  const [lastSavedLocation, setLastSavedLocation] = useState('');
  const [companySaveState, setCompanySaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [locationSaveState, setLocationSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [companyAbortController, setCompanyAbortController] = useState<AbortController | null>(null);
  const [locationAbortController, setLocationAbortController] = useState<AbortController | null>(null);


  // Initialize local state values from profile data
  useEffect(() => {
    if (profile) {
      setCompanyValue(profile.company || '');
      setLocationValue(profile.location || '');
      setLastSavedCompany(profile.company || '');
      setLastSavedLocation(profile.location || '');
    }
  }, [profile]);

  // Helper to refresh profile data after AI builder updates
  const handleProfileUpdate = () => {
    queryClient.invalidateQueries({ queryKey: userId ? ["/api/profile", userId] : ["/api/me"] });
  };

  // Save company field with proper state management and abort handling
  const saveCompany = async (value: string) => {
    if (value === lastSavedCompany) return;
    
    // Cancel any existing request
    if (companyAbortController) {
      companyAbortController.abort();
    }
    
    const controller = new AbortController();
    setCompanyAbortController(controller);
    setCompanySaveState('saving');
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ company: value }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      setLastSavedCompany(value);
      setCompanySaveState('saved');
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      setTimeout(() => setCompanySaveState('idle'), 1000);
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setCompanySaveState('error');
        setTimeout(() => setCompanySaveState('idle'), 2000);
      }
    } finally {
      setCompanyAbortController(null);
    }
  };

  // Save location field with proper state management and abort handling
  const saveLocation = async (value: string) => {
    if (value === lastSavedLocation) return;
    
    // Cancel any existing request
    if (locationAbortController) {
      locationAbortController.abort();
    }
    
    const controller = new AbortController();
    setLocationAbortController(controller);
    setLocationSaveState('saving');
    
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ location: value }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      setLastSavedLocation(value);
      setLocationSaveState('saved');
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      
      setTimeout(() => setLocationSaveState('idle'), 1000);
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setLocationSaveState('error');
        setTimeout(() => setLocationSaveState('idle'), 2000);
      }
    } finally {
      setLocationAbortController(null);
    }
  };

  // Handle field blur for company
  const handleCompanyBlur = () => {
    saveCompany(companyValue);
  };

  // Handle field blur for location
  const handleLocationBlur = () => {
    saveLocation(locationValue);
  };

  // Handle Enter key press
  const handleKeyDown = (e: React.KeyboardEvent, field: 'company' | 'location') => {
    if (e.key === 'Enter') {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
  };

  // Fixed update profile mutation with proper error handling
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      console.log('=== PROFILE UPDATE ATTEMPT ===');
      console.log('Updates:', updates);
      
      try {
        const response = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(updates),
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server error response:', errorText);
          throw new Error(`Server error: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        console.log('=== UPDATE SUCCESS ===');
        console.log('Result:', result);
        return result;

      } catch (networkError: any) {
        console.error('=== NETWORK ERROR ===');
        console.error('Error details:', networkError);
        throw new Error(`Network error: ${networkError.message}`);
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: (error: any, variables) => {
      console.error('=== MUTATION ERROR ===');
      console.error('Error:', error);
      console.error('Variables:', variables);
      
      toast({
        title: "Update Failed", 
        description: error.message || "Failed to update profile. Check console for details.",
        variant: "destructive",
      });
    },
  });


  // Handle photo upload success from cropper
  const handlePhotoUploadSuccess = (imageUrl: string) => {
    // Update profile with new image URL and invalidate cache
    queryClient.setQueryData(
      userId ? ["/api/profile", userId] : ["/api/me"],
      (oldData: EnhancedProfile | undefined) => ({
        ...oldData,
        profileImageUrl: imageUrl
      })
    );
    queryClient.invalidateQueries({ queryKey: userId ? ["/api/profile", userId] : ["/api/me"] });
  };


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

  if (!profile && !isOwnProfile) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Header Section */}
        <Card className="mb-8 border-0 shadow-sm">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              
              {/* Profile Photo */}
              <div className="flex flex-col items-center">
                {profile?.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt="Profile"
                    className="rounded-full w-24 h-24 object-cover border"
                  />
                ) : (
                  <div className="rounded-full w-24 h-24 flex items-center justify-center bg-orange-400 text-white text-xl font-bold">
                    {(profile?.firstName?.[0] || 'U')}{(profile?.lastName?.[0] || 'N')}
                  </div>
                )}
                
                {isOwnProfile && (
                  <button
                    onClick={() => setShowPhotoCropper(true)}
                    className="mt-2 text-sm text-blue-600"
                    data-testid="button-edit-photo"
                  >
                    Edit Photo
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-grow text-center md:text-left">
                <div className="mb-4">
                  <h1 className="text-3xl font-bold text-stak-black mb-2">
                    {isOwnProfile ? (
                      <Input
                        value={`${profile?.firstName || ''} ${profile?.lastName || ''}`.trim()}
                        onChange={(e) => {
                          const [firstName, ...lastNameParts] = e.target.value.split(' ');
                          const lastName = lastNameParts.join(' ');
                          updateProfile({ 
                            firstName: firstName || null, 
                            lastName: lastName || null
                          });
                        }}
                        className="text-3xl font-bold border-none shadow-none p-0 bg-transparent focus-visible:ring-0"
                        placeholder="Enter your name"
                        data-testid="input-user-name"
                      />
                    ) : (
                      `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'User Name'
                    )}
                  </h1>
                  
                  <div className="text-xl text-gray-700 mb-2">
                    {isOwnProfile ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={profile?.title || ''}
                          onChange={(e) => updateProfile({ title: e.target.value })}
                          className="text-xl border-none shadow-none p-0 bg-transparent focus-visible:ring-0"
                          placeholder="Your Job Title"
                          data-testid="input-job-title"
                        />
                        <ProvenanceBadge
                          fieldName="title"
                          getFieldProvenance={getFieldProvenance}
                          getFieldConfidence={getFieldConfidence}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{profile?.title || 'Job Title'}</span>
                        <ProvenanceBadge
                          fieldName="title"
                          getFieldProvenance={getFieldProvenance}
                          getFieldConfidence={getFieldConfidence}
                        />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row items-center md:justify-start gap-4 text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      {isOwnProfile ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={companyValue}
                            onChange={(e) => setCompanyValue(e.target.value)}
                            onBlur={handleCompanyBlur}
                            onKeyDown={(e) => handleKeyDown(e, 'company')}
                            className="border-none shadow-none p-0 bg-transparent focus-visible:ring-0"
                            placeholder="Company"
                            data-testid="input-company"
                          />
                          {companySaveState === 'saving' && (
                            <span className="text-xs text-gray-400 ml-1">Saving…</span>
                          )}
                          {companySaveState === 'saved' && (
                            <span className="text-xs text-green-500 ml-1">Saved</span>
                          )}
                          {companySaveState === 'error' && (
                            <span className="text-xs text-red-500 ml-1">Error</span>
                          )}
                        </div>
                      ) : (
                        <span>{profile?.company || 'No company specified'}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {isOwnProfile ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={locationValue}
                            onChange={(e) => setLocationValue(e.target.value)}
                            onBlur={handleLocationBlur}
                            onKeyDown={(e) => handleKeyDown(e, 'location')}
                            className="border-none shadow-none p-0 bg-transparent focus-visible:ring-0"
                            placeholder="Location"
                            data-testid="input-location"
                          />
                          {locationSaveState === 'saving' && (
                            <span className="text-xs text-gray-400 ml-1">Saving…</span>
                          )}
                          {locationSaveState === 'saved' && (
                            <span className="text-xs text-green-500 ml-1">Saved</span>
                          )}
                          {locationSaveState === 'error' && (
                            <span className="text-xs text-red-500 ml-1">Error</span>
                          )}
                        </div>
                      ) : (
                        <span>{profile?.location || 'No location specified'}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Profile Actions for own profile */}
                {isOwnProfile && (
                  <div className="flex justify-center md:justify-start mt-4">
                    <Button 
                      onClick={() => setShowAIBuilder(true)}
                      className="bg-stak-copper hover:bg-stak-copper/90"
                      data-testid="button-ai-profile-builder"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      AI Profile Builder
                    </Button>
                  </div>
                )}

                {/* Consolidated AI Profile Builder */}
                <ConsolidatedAIProfileBuilder
                  isOpen={showAIBuilder}
                  onClose={() => setShowAIBuilder(false)}
                  profile={profile || undefined}
                  onProfileUpdate={handleProfileUpdate}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Profile Enhancement Section */}
            {isOwnProfile && profile && (
              <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <span>Zero-Friction Profile</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">
                        {Math.round(getCompleteness() * 100)}% Complete
                      </Badge>
                    </div>
                    <Button
                      onClick={() => enrichProfile()}
                      disabled={isEnriching}
                      variant="outline"
                      size="sm"
                      className="border-purple-200 hover:bg-purple-50"
                      data-testid="button-enrich-profile"
                    >
                      {isEnriching ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enhancing...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Enhance Profile
                        </>
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Completeness Progress */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Profile Completeness</span>
                        <span className="font-medium">{Math.round(getCompleteness() * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${getCompleteness() * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Unknown Fields */}
                    {getUnknownFields().length > 0 && (
                      <div className="p-3 bg-white rounded-lg border border-purple-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">
                          🎯 Missing Information ({getUnknownFields().length} fields)
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {getUnknownFields().slice(0, 6).map((field) => (
                            <Badge
                              key={field}
                              variant="outline"
                              className="text-xs border-orange-200 text-orange-700 bg-orange-50"
                            >
                              {field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </Badge>
                          ))}
                          {getUnknownFields().length > 6 && (
                            <Badge variant="outline" className="text-xs border-gray-200 text-gray-500">
                              +{getUnknownFields().length - 6} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Provenance Summary */}
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center p-2 bg-white rounded-lg border border-blue-200">
                        <div className="flex items-center justify-center gap-1 text-blue-700 mb-1">
                          <Database className="w-4 h-4" />
                          <span className="font-medium">Account</span>
                        </div>
                        <div className="text-xs text-gray-600">Basic info from signup</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg border border-purple-200">
                        <div className="flex items-center justify-center gap-1 text-purple-700 mb-1">
                          <Brain className="w-4 h-4" />
                          <span className="font-medium">AI Enhanced</span>
                        </div>
                        <div className="text-xs text-gray-600">Enriched from web sources</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded-lg border border-green-200">
                        <div className="flex items-center justify-center gap-1 text-green-700 mb-1">
                          <UserIcon className="w-4 h-4" />
                          <span className="font-medium">Verified</span>
                        </div>
                        <div className="text-xs text-gray-600">Manually confirmed</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Bio Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="h-5 w-5" />
                  About
                  {isOwnProfile && (
                    <ProvenanceBadge
                      fieldName="bio"
                      getFieldProvenance={getFieldProvenance}
                      getFieldConfidence={getFieldConfidence}
                    />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isOwnProfile ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingBio ?? (profile?.bio || '')}
                      onChange={(e) => setEditingBio(e.target.value)}
                      onBlur={() => {
                        if (editingBio !== undefined && editingBio !== profile?.bio) {
                          updateProfileMutation.mutate({ bio: editingBio });
                        }
                        setEditingBio(undefined);
                      }}
                      placeholder="Tell others about yourself, your experience, and what you're passionate about..."
                      className="min-h-[120px]"
                      data-testid="textarea-bio"
                    />
                    <p className="text-xs text-gray-500">Click outside or press Tab to save changes</p>
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {profile?.bio || "No bio provided."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Networking Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Networking Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isOwnProfile ? (
                  <div className="space-y-4">
                    {/* Show networking goal suggestions if available */}
                    {networkingGoalSuggestions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-stak-copper">Quick suggestions based on your role:</p>
                        <div className="space-y-2">
                          {networkingGoalSuggestions.slice(0, 3).map((suggestion, index) => (
                            <Button
                              key={index}
                              variant="outline"
                              size="sm"
                              className="text-left h-auto py-2 px-3 whitespace-normal w-full hover:bg-stak-copper/10 hover:border-stak-copper"
                              onClick={() => {
                                setEditingGoal(suggestion);
                                updateProfileMutation.mutate({ networkingGoal: suggestion });
                                setNetworkingGoalSuggestions([]);
                                toast({
                                  title: "Networking Goal Updated",
                                  description: "Your networking goal has been set.",
                                });
                              }}
                            >
                              {suggestion}
                            </Button>
                          ))}
                        </div>
                        <Separator className="my-2" />
                        <p className="text-xs text-muted-foreground">Or write your own:</p>
                      </div>
                    )}
                    
                    <Textarea
                      value={editingGoal ?? (profile?.networkingGoal || '')}
                      onChange={(e) => setEditingGoal(e.target.value)}
                      onBlur={() => {
                        if (editingGoal !== undefined && editingGoal !== profile?.networkingGoal) {
                          updateProfileMutation.mutate({ networkingGoal: editingGoal });
                        }
                        setEditingGoal(undefined);
                      }}
                      placeholder="What are you looking to achieve through networking? Who would you like to meet?"
                      className="min-h-[100px]"
                      data-testid="textarea-networking-goals"
                    />
                    <p className="text-xs text-gray-500">Click outside or press Tab to save changes</p>
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {profile?.networkingGoal || "No networking goals specified."}
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile?.skills?.length ? (
                    profile.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-stak-copper/10 text-stak-copper">
                        {skill}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No skills listed</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Industries */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Industries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile?.industries?.length ? (
                    profile.industries.map((industry, index) => (
                      <Badge key={index} variant="outline" className="border-stak-copper text-stak-copper">
                        {industry}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm">No industries specified</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Connect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {profile?.linkedinUrl && (
                  <a 
                    href={profile.linkedinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
                {profile?.twitterUrl && (
                  <a 
                    href={profile.twitterUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </a>
                )}
                {profile?.githubUrl && (
                  <a 
                    href={profile.githubUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}
                {profile?.websiteUrls?.map((url, index) => (
                  <a 
                    key={index}
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-green-600 hover:text-green-800 transition-colors"
                  >
                    <Globe className="h-4 w-4" />
                    Website
                  </a>
                ))}
                
                {!profile?.linkedinUrl && !profile?.twitterUrl && !profile?.githubUrl && !profile?.websiteUrls?.length && (
                  <p className="text-gray-500 text-sm">No social links added</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>


        {/* Profile Photo Cropper */}
        <ProfilePhotoCropper
          isOpen={showPhotoCropper}
          onClose={() => setShowPhotoCropper(false)}
          onSuccess={handlePhotoUploadSuccess}
        />
      </div>
    </div>
  );
}