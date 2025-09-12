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
  Info,
  X,
  Pencil
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
    // Handle nested JSON structure
    if (typeof field === 'object' && field !== null) {
      // Check if it's a provenance object with value
      if (field?.value !== undefined) {
        return field.value;
      }
      // For objects, stringify them to avoid [object Object]
      return '';
    }
    return field || '';
  };

  // Helper to safely get nested values from user JSON structure
  const getProfileField = (fieldPath: string) => {
    if (!profile) return '';
    
    const paths = fieldPath.split('.');
    let value: any = profile;
    
    for (const path of paths) {
      value = value?.[path];
      if (value === undefined || value === null) return '';
    }
    
    return getProfileValue(value);
  };

  // Extract user details from new JSON structure
  const firstName = getProfileField('identity.first_name') || getProfileField('identity.display_name') || getProfileField('firstName') || '';
  const lastName = getProfileField('identity.last_name') || getProfileField('lastName') || '';
  const fullName = `${firstName} ${lastName}`.trim() || getProfileField('identity.display_name') || 'Your Name';
  const jobTitle = getProfileField('identity.headline') || getProfileField('persona.role_title') || getProfileField('title') || '';
  const userCompany = getProfileField('persona.company') || getProfileField('company') || '';
  const userLocation = getProfileField('identity.city_region') || getProfileField('identity.location') || getProfileField('location') || '';

  
  // State for consolidated AI profile builder and photo cropper
  const [showAIBuilder, setShowAIBuilder] = useState(false);
  const [showPhotoCropper, setShowPhotoCropper] = useState(false);
  



  // Helper to refresh profile data after AI builder updates
  const handleProfileUpdate = () => {
    try {
      queryClient.invalidateQueries({ queryKey: userId ? ["/api/profile", userId] : ["/api/me"] });
    } catch (error) {
      console.error('🚨 PROFILE ERROR: Failed to refresh profile data', error);
    }
  };


  // Fixed update profile mutation with proper error handling
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      
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
                    src={getProfileValue(profile?.profileImageUrl)}
                    alt="Profile"
                    className="rounded-full w-24 h-24 object-cover border"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="rounded-full w-24 h-24 flex items-center justify-center bg-orange-400 text-white text-xl font-bold">
                    {(firstName?.[0] || 'U')}{(lastName?.[0] || 'N')}
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
                      <div className="group relative inline-flex items-center">
                        <Input
                          value={fullName === 'Your Name' ? '' : fullName}
                          onChange={(e) => {
                            try {
                              const [firstNameInput, ...lastNameParts] = e.target.value.split(' ');
                              const lastNameInput = lastNameParts.join(' ');
                              updateProfile({ 
                                identity: {
                                  ...(profile?.identity || {}),
                                  first_name: firstNameInput || '',
                                  last_name: lastNameInput || '',
                                  display_name: firstNameInput || ''
                                }
                              });
                            } catch (error) {
                              console.error('Profile ERROR: Name update failed', error);
                            }
                          }}
                          className="text-3xl font-bold border-b-2 border-dashed border-gray-300 hover:border-gray-500 focus:border-blue-500 transition-colors px-2 py-1 bg-transparent"
                          placeholder="Enter your name"
                          data-testid="input-user-name"
                        />
                        <Pencil className="w-4 h-4 text-gray-400 ml-2 group-hover:text-gray-600 transition-colors" />
                      </div>
                    ) : (
                      fullName
                    )}
                  </h1>
                  
                  <div className="text-xl text-gray-700 mb-2">
                    {isOwnProfile ? (
                      <div className="flex items-center gap-2 group">
                        <Input
                          value={jobTitle || ''}
                          onChange={(e) => updateProfile({ 
                            identity: {
                              ...(profile?.identity || {}),
                              headline: e.target.value
                            }
                          })}
                          className="text-xl border-b-2 border-dashed border-gray-300 hover:border-gray-500 focus:border-blue-500 transition-colors px-2 py-1 bg-transparent"
                          placeholder="Your Job Title"
                          data-testid="input-job-title"
                        />
                        <Pencil className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        <ProvenanceBadge
                          fieldName="title"
                          getFieldProvenance={getFieldProvenance}
                          getFieldConfidence={getFieldConfidence}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>{jobTitle || 'Job Title'}</span>
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
                        <div className="flex items-center gap-1 group">
                          <Input
                            value={userCompany}
                            onChange={(e) => updateProfile({ 
                              persona: {
                                ...(profile?.persona || {}),
                                company: e.target.value
                              }
                            })}
                            className="border-b border-dashed border-gray-300 hover:border-gray-500 focus:border-blue-500 transition-colors px-1 py-0.5 bg-transparent"
                            placeholder="Company"
                            data-testid="input-company"
                          />
                          <Pencil className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </div>
                      ) : (
                        <span>{userCompany || 'No company specified'}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {isOwnProfile ? (
                        <div className="flex items-center gap-1 group">
                          <Input
                            value={userLocation || ''}
                            onChange={(e) => updateProfile({ 
                              identity: {
                                ...(profile?.identity || {}),
                                city_region: e.target.value
                              }
                            })}
                            className="border-b border-dashed border-gray-300 hover:border-gray-500 focus:border-blue-500 transition-colors px-1 py-0.5 bg-transparent"
                            placeholder="Location"
                            data-testid="input-location"
                          />
                          <Pencil className="w-3 h-3 text-gray-400 group-hover:text-gray-600 transition-colors" />
                        </div>
                      ) : (
                        <span>{userLocation || 'No location specified'}</span>
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
                      <Badge key={index} variant="secondary" className="bg-stak-copper/10 text-stak-copper group hover:bg-stak-copper/20 transition-colors">
                        <span className="mr-1">{skill}</span>
                        {isOwnProfile && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentSkills = getProfileValue(profile?.skills) || [];
                              const updatedSkills = currentSkills.filter((_: string, i: number) => i !== index);
                              updateProfile({ skills: updatedSkills });
                            }}
                            className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all text-xs"
                            data-testid={`button-delete-skill-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
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
                      <Badge key={index} variant="outline" className="border-stak-copper text-stak-copper group hover:bg-stak-copper/10 transition-colors">
                        <span className="mr-1">{industry}</span>
                        {isOwnProfile && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const currentIndustries = getProfileValue(profile?.industries) || [];
                              const updatedIndustries = currentIndustries.filter((_: string, i: number) => i !== index);
                              updateProfile({ industries: updatedIndustries });
                            }}
                            className="ml-1 opacity-0 group-hover:opacity-100 hover:text-red-600 transition-all text-xs"
                            data-testid={`button-delete-industry-${index}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
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
                {Array.isArray(getProfileValue(profile?.websiteUrls)) && getProfileValue(profile?.websiteUrls).map((url: string, index: number) => (
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
                
                {!getProfileValue(profile?.linkedinUrl) && !getProfileValue(profile?.twitterUrl) && !getProfileValue(profile?.githubUrl) && (!Array.isArray(getProfileValue(profile?.websiteUrls)) || getProfileValue(profile?.websiteUrls).length === 0) && (
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