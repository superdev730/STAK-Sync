import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeManager } from "@/components/BadgeManager";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ObjectUploader } from "@/components/ObjectUploader";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  MapPin, 
  Briefcase, 
  Globe, 
  Mail,
  Linkedin,
  Twitter,
  Github,
  Link,
  Award,
  Users,
  TrendingUp,
  MessageSquare,
  Calendar,
  Star,
  Zap,
  Camera,
  Upload
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRoute } from "wouter";

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  company: string | null;
  position: string | null;
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
  const { user: currentUser } = useAuth();
  const [, params] = useRoute("/profile/:userId?");
  const userId = params?.userId;
  const isOwnProfile = !userId || userId === currentUser?.id;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Fetch profile data - either current user's or the specified user's
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: userId ? ["/api/profile", userId] : ["/api/profile"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ProfileStats>({
    queryKey: userId ? ["/api/profile/stats", userId] : ["/api/profile/stats"],
  });

  // Calculate Sync Score display using STAK brand colors
  const getSyncLevel = (score: number) => {
    if (score >= 800) return { level: "Sync Master", color: "bg-stak-copper", badge: "🏆" };
    if (score >= 600) return { level: "Sync Expert", color: "bg-yellow-500", badge: "⭐" };
    if (score >= 400) return { level: "Sync Builder", color: "bg-gray-500", badge: "🚀" };
    if (score >= 200) return { level: "Sync Starter", color: "bg-stak-forest", badge: "🌱" };
    return { level: "New Member", color: "bg-gray-400", badge: "👋" };
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

  // Handle profile image upload
  const handleGetUploadParameters = async () => {
    try {
      const response = await apiRequest("POST", "/api/user/objects/upload");
      return {
        method: "PUT" as const,
        url: response.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload parameters:", error);
      throw error;
    }
  };

  const handleImageUploadComplete = async (result: any) => {
    try {
      if (result.successful && result.successful.length > 0) {
        const uploadedFile = result.successful[0];
        const imageUrl = uploadedFile.uploadURL;

        // Update user profile with new image URL
        await apiRequest("PUT", "/api/user/profile-image", {
          profileImageUrl: imageUrl,
        });

        // Refresh profile data
        queryClient.invalidateQueries({ queryKey: ["/api/profile"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });

        toast({
          title: "Profile Image Updated",
          description: "Your profile image has been successfully updated.",
        });
      }
    } catch (error) {
      console.error("Error updating profile image:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to update your profile image. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <Card className="mb-8 overflow-hidden border border-gray-200 shadow-lg">
          <div className="h-32 bg-gradient-to-r from-stak-black via-gray-700 to-stak-copper"></div>
          <CardContent className="relative -mt-16 pb-8 bg-white">
            <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
              {/* Profile Image with Upload Functionality */}
              <div className="relative group">
                <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                  <AvatarImage src={profile.profileImageUrl || ""} alt={profile.firstName || ""} />
                  <AvatarFallback className="bg-gray-200 text-stak-black text-3xl font-semibold">
                    {profile.firstName?.[0]}{profile.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                
                {/* Upload Overlay - Only show for own profile */}
                {isOwnProfile && (
                  <ObjectUploader
                    maxNumberOfFiles={1}
                    maxFileSize={5242880} // 5MB limit for profile images
                    onGetUploadParameters={handleGetUploadParameters}
                    onComplete={handleImageUploadComplete}
                    buttonClassName="absolute inset-0 w-32 h-32 rounded-full bg-black bg-opacity-0 hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center group-hover:bg-opacity-50 border-0 p-0"
                  >
                    <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center">
                      <Camera className="h-6 w-6 mb-1" />
                      <span className="text-xs font-medium">Change Photo</span>
                    </div>
                  </ObjectUploader>
                )}
              </div>
              
              <div className="flex-1 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-stak-black mb-2">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <div className="flex items-center space-x-2 mb-3">
                      <Briefcase className="h-4 w-4 text-stak-copper" />
                      <span className="text-lg text-stak-black font-medium">
                        {profile.position} {profile.company && `at ${profile.company}`}
                      </span>
                    </div>
                    {profile.location && (
                      <div className="flex items-center space-x-2 mb-4">
                        <MapPin className="h-4 w-4 text-stak-copper" />
                        <span className="text-gray-600">{profile.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {!isOwnProfile && (
                    <div className="flex space-x-3">
                      <Button className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline" className="border-gray-300 text-stak-black hover:bg-gray-50">
                        <Calendar className="h-4 w-4 mr-2" />
                        Meet
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* About Section */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6 bg-white">
                <h2 className="text-xl font-semibold mb-4 text-stak-black">About</h2>
                <p className="text-gray-700 leading-relaxed">
                  {profile.bio || "No bio available yet."}
                </p>
              </CardContent>
            </Card>

            {/* Networking Goals */}
            {profile.networkingGoals && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6 bg-white">
                  <h2 className="text-xl font-semibold mb-4 flex items-center text-stak-black">
                    <Users className="h-5 w-5 mr-2 text-stak-copper" />
                    Networking Goals
                  </h2>
                  <p className="text-gray-700">{profile.networkingGoals}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills & Industries */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6 bg-white">
                <h2 className="text-xl font-semibold mb-4 text-stak-black">Expertise</h2>
                <div className="space-y-4">
                  {profile.skills && profile.skills.length > 0 && (
                    <div>
                      <h3 className="font-medium text-stak-black mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-gray-100 text-stak-black border border-gray-300">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.industries && profile.industries.length > 0 && (
                    <div>
                      <h3 className="font-medium text-stak-black mb-2">Industries</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.industries.map((industry, index) => (
                          <Badge key={index} variant="outline" className="border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-stak-black">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Badges Section */}
            <BadgeManager userId={profile.id} isAdmin={false} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Sync Score */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6 text-center bg-white">
                <div className="mb-4">
                  <div className="text-4xl mb-2">{syncLevel.badge}</div>
                  <h3 className="text-lg font-semibold text-stak-black">{syncLevel.level}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Sync Score</span>
                    <span className="font-semibold text-stak-copper">{stats?.signalScore || 0}/1000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${syncLevel.color}`}
                      style={{ width: `${((stats?.signalScore || 0) / 1000) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="p-6 bg-white">
                <h3 className="font-semibold mb-4 text-stak-black">Network Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-stak-copper mr-2" />
                      <span className="text-gray-600">Connections</span>
                    </div>
                    <span className="font-semibold text-stak-black">{stats?.connections || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-stak-forest mr-2" />
                      <span className="text-gray-600">Profile Views</span>
                    </div>
                    <span className="font-semibold text-stak-black">{stats?.profileViews || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                      <span className="text-gray-600">Meetings</span>
                    </div>
                    <span className="font-semibold text-stak-black">{stats?.meetingRequestsCount || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            {(profile.linkedinUrl || profile.twitterUrl || profile.githubUrl || (profile.websiteUrls && profile.websiteUrls.length > 0)) && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6 bg-white">
                  <h3 className="font-semibold mb-4 text-stak-black">Connect</h3>
                  <div className="space-y-3">
                    {profile.linkedinUrl && (
                      <a 
                        href={profile.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-stak-copper hover:text-stak-dark-copper transition-colors"
                      >
                        <Linkedin className="h-4 w-4 mr-3" />
                        LinkedIn
                      </a>
                    )}
                    {profile.twitterUrl && (
                      <a 
                        href={profile.twitterUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-gray-600 hover:text-stak-black transition-colors"
                      >
                        <Twitter className="h-4 w-4 mr-3" />
                        Twitter
                      </a>
                    )}
                    {profile.githubUrl && (
                      <a 
                        href={profile.githubUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-stak-black hover:text-stak-copper transition-colors"
                      >
                        <Github className="h-4 w-4 mr-3" />
                        GitHub
                      </a>
                    )}
                    {profile.websiteUrls && profile.websiteUrls.map((url, index) => (
                      <a 
                        key={index}
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-stak-forest hover:text-stak-dark-forest transition-colors"
                      >
                        <Globe className="h-4 w-4 mr-3" />
                        Website
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Investment Info (if applicable) */}
            {(profile.investmentStage || profile.fundingRange) && (
              <Card className="border border-gray-200 shadow-sm">
                <CardContent className="p-6 bg-white">
                  <h3 className="font-semibold mb-4 flex items-center text-stak-black">
                    <TrendingUp className="h-4 w-4 mr-2 text-stak-forest" />
                    Investment Info
                  </h3>
                  <div className="space-y-2">
                    {profile.investmentStage && (
                      <div>
                        <span className="text-sm text-gray-600">Stage: </span>
                        <span className="font-medium text-stak-black">{profile.investmentStage}</span>
                      </div>
                    )}
                    {profile.fundingRange && (
                      <div>
                        <span className="text-sm text-gray-600">Range: </span>
                        <span className="font-medium text-stak-black">{profile.fundingRange}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {isOwnProfile && (
          <div className="mt-8 text-center">
            <Button variant="outline" className="border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-stak-black" onClick={() => window.location.href = '/profile/edit'}>
              <Zap className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}