import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Zap
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
  
  // Fetch profile data - either current user's or the specified user's
  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: userId ? ["/api/profile", userId] : ["/api/profile"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ProfileStats>({
    queryKey: userId ? ["/api/profile/stats", userId] : ["/api/profile/stats"],
  });

  // Calculate Signal Score display
  const getSignalLevel = (score: number) => {
    if (score >= 800) return { level: "Signal Master", color: "bg-yellow-500", badge: "🏆" };
    if (score >= 600) return { level: "Signal Expert", color: "bg-purple-500", badge: "⭐" };
    if (score >= 400) return { level: "Signal Builder", color: "bg-blue-500", badge: "🚀" };
    if (score >= 200) return { level: "Signal Starter", color: "bg-green-500", badge: "🌱" };
    return { level: "New Member", color: "bg-gray-500", badge: "👋" };
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-copper mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Profile Not Found</h2>
          <p className="text-gray-600">This profile doesn't exist or you don't have permission to view it.</p>
        </div>
      </div>
    );
  }

  const signalLevel = getSignalLevel(stats?.signalScore || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <Card className="mb-8 overflow-hidden">
          <div className="h-32 bg-gradient-to-r from-blue-600 via-purple-600 to-copper"></div>
          <CardContent className="relative -mt-16 pb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-end space-y-4 sm:space-y-0 sm:space-x-6">
              <Avatar className="w-32 h-32 border-4 border-white shadow-lg">
                <AvatarImage src={profile.profileImageUrl || ""} alt={profile.firstName || ""} />
                <AvatarFallback className="bg-gray-300 text-gray-600 text-3xl font-semibold">
                  {profile.firstName?.[0]}{profile.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                      {profile.firstName} {profile.lastName}
                    </h1>
                    <div className="flex items-center space-x-2 mb-3">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span className="text-lg text-gray-700 font-medium">
                        {profile.position} {profile.company && `at ${profile.company}`}
                      </span>
                    </div>
                    {profile.location && (
                      <div className="flex items-center space-x-2 mb-4">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">{profile.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {!isOwnProfile && (
                    <div className="flex space-x-3">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Message
                      </Button>
                      <Button variant="outline">
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
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-gray-700 leading-relaxed">
                  {profile.bio || "No bio available yet."}
                </p>
              </CardContent>
            </Card>

            {/* Networking Goals */}
            {profile.networkingGoals && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4 flex items-center">
                    <Users className="h-5 w-5 mr-2 text-blue-600" />
                    Networking Goals
                  </h2>
                  <p className="text-gray-700">{profile.networkingGoals}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills & Industries */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Expertise</h2>
                <div className="space-y-4">
                  {profile.skills && profile.skills.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-800 mb-2">Skills</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.skills.map((skill, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {profile.industries && profile.industries.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-800 mb-2">Industries</h3>
                      <div className="flex flex-wrap gap-2">
                        {profile.industries.map((industry, index) => (
                          <Badge key={index} variant="outline" className="border-purple-200 text-purple-700">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Signal Score */}
            <Card>
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <div className="text-4xl mb-2">{signalLevel.badge}</div>
                  <h3 className="text-lg font-semibold text-gray-800">{signalLevel.level}</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Signal Score</span>
                    <span className="font-semibold text-copper">{stats?.signalScore || 0}/1000</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${signalLevel.color}`}
                      style={{ width: `${((stats?.signalScore || 0) / 1000) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Network Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Users className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-gray-600">Connections</span>
                    </div>
                    <span className="font-semibold">{stats?.connections || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-gray-600">Profile Views</span>
                    </div>
                    <span className="font-semibold">{stats?.profileViews || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-purple-600 mr-2" />
                      <span className="text-gray-600">Meetings</span>
                    </div>
                    <span className="font-semibold">{stats?.meetingRequestsCount || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Social Links */}
            {(profile.linkedinUrl || profile.twitterUrl || profile.githubUrl || (profile.websiteUrls && profile.websiteUrls.length > 0)) && (
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Connect</h3>
                  <div className="space-y-3">
                    {profile.linkedinUrl && (
                      <a 
                        href={profile.linkedinUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
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
                        className="flex items-center text-blue-400 hover:text-blue-500 transition-colors"
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
                        className="flex items-center text-gray-700 hover:text-gray-800 transition-colors"
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
                        className="flex items-center text-green-600 hover:text-green-700 transition-colors"
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
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center">
                    <TrendingUp className="h-4 w-4 mr-2 text-green-600" />
                    Investment Info
                  </h3>
                  <div className="space-y-2">
                    {profile.investmentStage && (
                      <div>
                        <span className="text-sm text-gray-600">Stage: </span>
                        <span className="font-medium">{profile.investmentStage}</span>
                      </div>
                    )}
                    {profile.fundingRange && (
                      <div>
                        <span className="text-sm text-gray-600">Range: </span>
                        <span className="font-medium">{profile.fundingRange}</span>
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
            <Button variant="outline" onClick={() => window.location.href = '/profile'}>
              <Zap className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}