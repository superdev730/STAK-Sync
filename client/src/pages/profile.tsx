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
  Plus,
  Trash2,
  Building2,
  MapPin,
  Target,
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
      case 'db': return <UserIcon className="w-3 h-3" />;
      case 'enrichment': return <Wand2 className="w-3 h-3" />;
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
    getFieldProvenance,
    getFieldConfidence,
    isFieldFromEnrichment
  } = useProfile(userId);

  // Extract values from profile objects
  const getProfileValue = (field: any) => {
    if (typeof field === 'object' && field?.value !== undefined) {
      return field.value;
    }
    return field || '';
  };

  // Debug profile data
  console.log('🔍 PROFILE DEBUG: Profile data', {
    profile,
    profileLoading,
    isOwnProfile,
    firstName: getProfileValue(profile?.firstName),
    lastName: getProfileValue(profile?.lastName),
    websiteUrls: profile?.websiteUrls,
    websiteUrlsType: typeof profile?.websiteUrls,
    websiteUrlsArray: Array.isArray(profile?.websiteUrls)
  });
  
  // State for consolidated AI profile builder and photo cropper
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [showPhotoCropper, setShowPhotoCropper] = useState(false);
  



  // Helper to refresh profile data after AI builder updates
  const handleProfileUpdate = () => {
    try {
      console.log('🔍 PROFILE DEBUG: Refreshing profile data');
      queryClient.invalidateQueries({ queryKey: userId ? ["/api/profile", userId] : ["/api/me"] });
    } catch (error) {
      console.error('🚨 PROFILE ERROR: Failed to refresh profile data', error);
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
          <UserIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-stak-black mb-2">Profile Not Found</h2>
          <p className="text-gray-600">This profile doesn't exist or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }


  try {
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
                    onError={(e) => {
                      console.log('🔍 PROFILE DEBUG: Image load error', e);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="rounded-full w-24 h-24 flex items-center justify-center bg-orange-400 text-white text-xl font-bold">
                    {(getProfileValue(profile?.firstName)?.[0] || 'U')}{(getProfileValue(profile?.lastName)?.[0] || 'N')}
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
                        value={`${getProfileValue(profile?.firstName)} ${getProfileValue(profile?.lastName)}`.trim()}
                        onChange={(e) => {
                          try {
                            const [firstName, ...lastNameParts] = e.target.value.split(' ');
                            const lastName = lastNameParts.join(' ');
                            console.log('🔍 PROFILE DEBUG: Updating name', { firstName, lastName });
                            updateProfile({ 
                              firstName: firstName || null, 
                              lastName: lastName || null
                            });
                          } catch (error) {
                            console.error('🚨 PROFILE ERROR: Name update failed', error);
                          }
                        }}
                        className="text-3xl font-bold border-none shadow-none p-0 bg-transparent focus-visible:ring-0"
                        placeholder="Enter your name"
                        data-testid="input-user-name"
                      />
                    ) : (
                      `${getProfileValue(profile?.firstName)} ${getProfileValue(profile?.lastName)}`.trim() || 'User Name'
                    )}
                  </h1>
                  
                  <div className="text-xl text-gray-700 mb-2">
                    {isOwnProfile ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={getProfileValue(profile?.title)}
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
                        <span>{getProfileValue(profile?.title) || 'Job Title'}</span>
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
                            value={getProfileValue(profile?.company)}
                            onChange={(e) => updateProfile({ company: e.target.value })}
                            className="border-none shadow-none p-0 bg-transparent focus-visible:ring-0"
                            placeholder="Company"
                            data-testid="input-company"
                          />
                        </div>
                      ) : (
                        <span>{getProfileValue(profile?.company) || 'No company specified'}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {isOwnProfile ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={getProfileValue(profile?.location)}
                            onChange={(e) => updateProfile({ location: e.target.value })}
                            className="border-none shadow-none p-0 bg-transparent focus-visible:ring-0"
                            placeholder="Location"
                            data-testid="input-location"
                          />
                        </div>
                      ) : (
                        <span>{getProfileValue(profile?.location) || 'No location specified'}</span>
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
                      value={getProfileValue(profile?.bio)}
                      onChange={(e) => updateProfile({ bio: e.target.value })}
                      placeholder="Tell others about yourself, your experience, and what you're passionate about..."
                      className="min-h-[120px]"
                      data-testid="textarea-bio"
                    />

                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {getProfileValue(profile?.bio) || "No bio provided."}
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
                    <Textarea
                      value={getProfileValue(profile?.networkingGoal)}
                      onChange={(e) => updateProfile({ networkingGoal: e.target.value })}
                      placeholder="What are you looking to achieve through networking? Who would you like to meet?"
                      className="min-h-[100px]"
                      data-testid="textarea-networking-goals"
                    />
                  </div>
                ) : (
                  <p className="text-gray-700 leading-relaxed">
                    {getProfileValue(profile?.networkingGoal) || "No networking goals specified."}
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
                  {getProfileValue(profile?.skills)?.length ? (
                    getProfileValue(profile?.skills).map((skill: string, index: number) => (
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
                  {getProfileValue(profile?.industries)?.length ? (
                    getProfileValue(profile?.industries).map((industry: string, index: number) => (
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
                {getProfileValue(profile?.linkedinUrl) && (
                  <a 
                    href={getProfileValue(profile?.linkedinUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Linkedin className="h-4 w-4" />
                    LinkedIn
                  </a>
                )}
                {getProfileValue(profile?.twitterUrl) && (
                  <a 
                    href={getProfileValue(profile?.twitterUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-600 transition-colors"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </a>
                )}
                {getProfileValue(profile?.githubUrl) && (
                  <a 
                    href={getProfileValue(profile?.githubUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                )}
                {Array.isArray(profile?.websiteUrls) && profile.websiteUrls.map((url, index) => (
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
                
                {!getProfileValue(profile?.linkedinUrl) && !getProfileValue(profile?.twitterUrl) && !getProfileValue(profile?.githubUrl) && (!Array.isArray(profile?.websiteUrls) || profile.websiteUrls.length === 0) && (
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
  } catch (error) {
    console.error('🚨 PROFILE ERROR: Component render failed', error);
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <AlertCircle className="h-16 w-16 mx-auto mb-2" />
            <h2 className="text-2xl font-bold">Profile Error</h2>
          </div>
          <p className="text-gray-600 mb-4">There was an error loading the profile page.</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Reload Page
          </Button>
        </div>
      </div>
    );
  }
}