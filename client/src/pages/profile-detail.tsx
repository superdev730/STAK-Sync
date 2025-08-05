import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  Target, 
  Mail, 
  Phone, 
  Globe,
  Users,
  Calendar,
  Award
} from "lucide-react";
import { Link } from "wouter";
import type { User } from "@shared/schema";

interface ProfileDetailProps {
  userId: string;
}

export default function ProfileDetail() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const userId = searchParams.get('userId');

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">User not found</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="flex items-start space-x-6">
                <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/matches')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Button>
          <p className="text-center text-gray-600">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/matches')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Matches
        </Button>

        {/* Profile Header */}
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-8">
            <div className="flex items-start space-x-6">
              <Avatar className="w-32 h-32 border-4 border-gray-200">
                <AvatarImage 
                  src={user.profileImageUrl || ""} 
                  alt={`${user.firstName} ${user.lastName}`} 
                />
                <AvatarFallback className="bg-gray-300 text-gray-700 text-2xl font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {user.firstName} {user.lastName}
                </h1>
                
                {user.title && (
                  <div className="flex items-center text-xl text-gray-700 mb-2">
                    <Briefcase className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="font-medium">{user.title}</span>
                    {user.company && (
                      <span className="text-gray-600"> at {user.company}</span>
                    )}
                  </div>
                )}
                
                {user.location && (
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{user.location}</span>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Mail className="w-4 h-4 mr-2" />
                    Connect
                  </Button>
                  <Button variant="outline" className="border-gray-300 text-gray-700">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule Meeting
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {user.bio && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{user.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Networking Goals */}
            {user.networkingGoal && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                    <Target className="h-5 w-5 mr-2 text-blue-600" />
                    Networking Goals
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">{user.networkingGoal}</p>
                </CardContent>
              </Card>
            )}

            {/* Skills */}
            {user.skills && user.skills.length > 0 && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                    <Award className="h-5 w-5 mr-2 text-purple-600" />
                    Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {user.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact Information */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.email && (
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-3 text-gray-500" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                )}

                {user.websiteUrls && user.websiteUrls.length > 0 && (
                  <div className="space-y-2">
                    {user.websiteUrls.map((url, index) => (
                      <div key={index} className="flex items-center text-gray-600">
                        <Globe className="h-4 w-4 mr-3 text-gray-500" />
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 truncate"
                        >
                          {url}
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Industries */}
            {user.industries && user.industries.length > 0 && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                    <Users className="h-4 w-4 mr-2 text-green-600" />
                    Industries
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {user.industries.map((industry, index) => (
                      <Badge key={index} variant="outline" className="border-purple-200 text-purple-700 bg-purple-50 block w-fit">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Professional Details */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Professional</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {user.title && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Role</p>
                    <p className="text-sm text-gray-900">{user.title}</p>
                  </div>
                )}
                {user.company && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Company</p>
                    <p className="text-sm text-gray-900">{user.company}</p>
                  </div>
                )}

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}