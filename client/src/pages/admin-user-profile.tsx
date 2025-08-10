import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  User, 
  Brain, 
  Target, 
  TrendingUp, 
  Users, 
  MessageSquare,
  Calendar,
  Star,
  BarChart3,
  Eye,
  Activity,
  Network,
  Lightbulb
} from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company: string;
  position: string;
  location: string;
  bio: string;
  skills: string[];
  industries: string[];
  networkingGoals: string[];
  linkedinUrl: string;
  personalityProfile: string;
  goalAnalysis: string;
  createdAt: string;
  adminRole: string;
  billingPlan: string;
}

interface UserStats {
  completionPercentage: number;
  signalScore: number;
  connections: number;
  meetingRequestsCount: number;
  profileViews: number;
}

interface MatchAnalytics {
  totalMatches: number;
  connectedMatches: number;
  pendingMatches: number;
  passedMatches: number;
  connectionRate: number;
  avgMatchScore: number;
  topIndustries: Array<{ industry: string; count: number }>;
  recentActivity: Array<{
    type: string;
    description: string;
    score: number;
    date: string;
  }>;
}

export default function AdminUserProfile() {
  const [match, params] = useRoute("/admin/user/:userId");
  const userId = params?.userId;

  const { data: userProfile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ["/api/admin/user", userId],
    enabled: !!userId,
  });

  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/profile/stats", userId],
    enabled: !!userId,
  });

  const { data: matchAnalytics, isLoading: analyticsLoading } = useQuery<MatchAnalytics>({
    queryKey: ["/api/admin/user", userId, "match-analytics"],
    enabled: !!userId,
  });

  const { data: userMatches, isLoading: matchesLoading } = useQuery({
    queryKey: ["/api/admin/user", userId, "matches"],
    enabled: !!userId,
  });

  if (!match || !userId) {
    return (
      <div className="min-h-screen bg-stak-black p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stak-white mb-4">User Not Found</h2>
          <Link href="/admin">
            <Button className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black">
              Back to Admin
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (profileLoading || statsLoading || analyticsLoading) {
    return (
      <div className="min-h-screen bg-stak-black p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-stak-copper border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-stak-black p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stak-white mb-4">User Profile Not Found</h2>
          <Link href="/admin">
            <Button className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black">
              Back to Admin
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const completionPercentage = userStats?.completionPercentage || 0;
  const signalScore = userStats?.signalScore || 0;

  return (
    <div className="min-h-screen bg-stak-black">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin">
            <Button variant="ghost" size="icon" className="text-stak-light-gray hover:text-stak-copper">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-stak-copper">User Profile Analysis</h1>
            <p className="text-stak-light-gray">Detailed insights and matchmaking analytics</p>
          </div>
        </div>

        {/* User Overview Card */}
        <Card className="bg-stak-gray border-stak-dark-gray">
          <CardContent className="p-6">
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.email}`} />
                <AvatarFallback className="text-2xl bg-stak-copper text-stak-black">
                  {userProfile.firstName?.[0]}{userProfile.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-stak-white">
                    {userProfile.firstName} {userProfile.lastName}
                  </h2>
                  <Badge className={`${
                    userProfile.adminRole === 'owner' ? 'bg-yellow-600' :
                    userProfile.adminRole === 'admin' ? 'bg-blue-600' : 'bg-gray-600'
                  } text-white`}>
                    {userProfile.adminRole || 'user'}
                  </Badge>
                  <Badge className="bg-stak-copper text-stak-black">
                    {userProfile.billingPlan}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-stak-light-gray">Email: <span className="text-stak-white">{userProfile.email}</span></p>
                    <p className="text-stak-light-gray">Company: <span className="text-stak-white">{userProfile.company || 'Not specified'}</span></p>
                    <p className="text-stak-light-gray">Position: <span className="text-stak-white">{userProfile.position || 'Not specified'}</span></p>
                  </div>
                  <div>
                    <p className="text-stak-light-gray">Location: <span className="text-stak-white">{userProfile.location || 'Not specified'}</span></p>
                    <p className="text-stak-light-gray">Member Since: <span className="text-stak-white">
                      {new Date(userProfile.createdAt).toLocaleDateString()}
                    </span></p>
                  </div>
                </div>

                {/* Profile Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-stak-copper">{completionPercentage}%</div>
                    <div className="text-xs text-stak-light-gray">Profile Complete</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-stak-copper">{signalScore}</div>
                    <div className="text-xs text-stak-light-gray">Sync Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-stak-copper">{userStats?.connections || 0}</div>
                    <div className="text-xs text-stak-light-gray">Connections</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-stak-copper">{matchAnalytics?.totalMatches || 0}</div>
                    <div className="text-xs text-stak-light-gray">Total Matches</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detailed Analysis Tabs */}
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-stak-gray">
            <TabsTrigger value="profile" className="data-[state=active]:bg-stak-copper data-[state=active]:text-stak-black">
              Profile Data
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="data-[state=active]:bg-stak-copper data-[state=active]:text-stak-black">
              AI Analysis
            </TabsTrigger>
            <TabsTrigger value="matches" className="data-[state=active]:bg-stak-copper data-[state=active]:text-stak-black">
              Match Analytics
            </TabsTrigger>
            <TabsTrigger value="insights" className="data-[state=active]:bg-stak-copper data-[state=active]:text-stak-black">
              Algorithm Insights
            </TabsTrigger>
          </TabsList>

          {/* Profile Data Tab */}
          <TabsContent value="profile" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profile Completion */}
              <Card className="bg-stak-gray border-stak-dark-gray">
                <CardHeader>
                  <CardTitle className="text-stak-white flex items-center gap-2">
                    <User className="h-5 w-5 text-stak-copper" />
                    Profile Completion
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-stak-light-gray">Overall Progress</span>
                        <span className="text-stak-copper font-medium">{completionPercentage}%</span>
                      </div>
                      <Progress value={completionPercentage} className="h-2" />
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-stak-light-gray">Basic Info</span>
                        <span className={userProfile.firstName && userProfile.lastName && userProfile.email ? 'text-green-400' : 'text-red-400'}>
                          {userProfile.firstName && userProfile.lastName && userProfile.email ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stak-light-gray">Professional Info</span>
                        <span className={userProfile.company && userProfile.position ? 'text-green-400' : 'text-red-400'}>
                          {userProfile.company && userProfile.position ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stak-light-gray">Bio & Goals</span>
                        <span className={userProfile.bio && userProfile.networkingGoals?.length ? 'text-green-400' : 'text-red-400'}>
                          {userProfile.bio && userProfile.networkingGoals?.length ? '✓' : '✗'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stak-light-gray">Skills & Industries</span>
                        <span className={userProfile.skills?.length && userProfile.industries?.length ? 'text-green-400' : 'text-red-400'}>
                          {userProfile.skills?.length && userProfile.industries?.length ? '✓' : '✗'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Professional Details */}
              <Card className="bg-stak-gray border-stak-dark-gray">
                <CardHeader>
                  <CardTitle className="text-stak-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-stak-copper" />
                    Professional Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userProfile.bio && (
                    <div>
                      <h4 className="font-medium text-stak-white mb-2">Bio</h4>
                      <p className="text-sm text-stak-light-gray">{userProfile.bio}</p>
                    </div>
                  )}
                  
                  {userProfile.skills?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-stak-white mb-2">Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {userProfile.skills.map((skill, index) => (
                          <Badge key={index} variant="outline" className="border-stak-copper text-stak-copper">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {userProfile.industries?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-stak-white mb-2">Industries</h4>
                      <div className="flex flex-wrap gap-2">
                        {userProfile.industries.map((industry, index) => (
                          <Badge key={index} variant="outline" className="border-stak-copper text-stak-copper">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {userProfile.networkingGoals?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-stak-white mb-2">Networking Goals</h4>
                      <div className="flex flex-wrap gap-2">
                        {userProfile.networkingGoals.map((goal, index) => (
                          <Badge key={index} variant="outline" className="border-stak-copper text-stak-copper">
                            {goal}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* AI Analysis Tab */}
          <TabsContent value="ai-analysis" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-stak-gray border-stak-dark-gray">
                <CardHeader>
                  <CardTitle className="text-stak-white flex items-center gap-2">
                    <Brain className="h-5 w-5 text-stak-copper" />
                    AI Personality Profile
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userProfile.personalityProfile ? (
                    <p className="text-stak-light-gray whitespace-pre-wrap">{userProfile.personalityProfile}</p>
                  ) : (
                    <p className="text-stak-light-gray italic">No personality profile generated yet</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-stak-gray border-stak-dark-gray">
                <CardHeader>
                  <CardTitle className="text-stak-white flex items-center gap-2">
                    <Target className="h-5 w-5 text-stak-copper" />
                    AI Goal Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userProfile.goalAnalysis ? (
                    <p className="text-stak-light-gray whitespace-pre-wrap">{userProfile.goalAnalysis}</p>
                  ) : (
                    <p className="text-stak-light-gray italic">No goal analysis generated yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Match Analytics Tab */}
          <TabsContent value="matches" className="space-y-6">
            {matchAnalytics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-stak-gray border-stak-dark-gray">
                  <CardHeader>
                    <CardTitle className="text-stak-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-stak-copper" />
                      Match Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-stak-copper">{matchAnalytics.totalMatches}</div>
                        <div className="text-xs text-stak-light-gray">Total</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-400">{matchAnalytics.connectedMatches}</div>
                        <div className="text-xs text-stak-light-gray">Connected</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-yellow-400">{matchAnalytics.pendingMatches}</div>
                        <div className="text-xs text-stak-light-gray">Pending</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-400">{matchAnalytics.passedMatches}</div>
                        <div className="text-xs text-stak-light-gray">Passed</div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-stak-copper">{matchAnalytics.connectionRate}%</div>
                      <div className="text-xs text-stak-light-gray">Connection Rate</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-lg font-bold text-stak-copper">{matchAnalytics.avgMatchScore}%</div>
                      <div className="text-xs text-stak-light-gray">Avg Match Score</div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-stak-gray border-stak-dark-gray">
                  <CardHeader>
                    <CardTitle className="text-stak-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-stak-copper" />
                      Top Industries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {matchAnalytics.topIndustries?.map((item, index) => (
                        <div key={index} className="flex justify-between items-center">
                          <span className="text-sm text-stak-light-gray">{item.industry}</span>
                          <Badge variant="outline" className="border-stak-copper text-stak-copper">
                            {item.count}
                          </Badge>
                        </div>
                      ))}
                      {(!matchAnalytics.topIndustries || matchAnalytics.topIndustries.length === 0) && (
                        <p className="text-stak-light-gray italic text-sm">No industry data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-stak-gray border-stak-dark-gray">
                  <CardHeader>
                    <CardTitle className="text-stak-white flex items-center gap-2">
                      <Activity className="h-5 w-5 text-stak-copper" />
                      Recent Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {matchAnalytics.recentActivity?.map((activity, index) => (
                        <div key={index} className="text-sm">
                          <div className="flex justify-between items-start">
                            <span className="text-stak-light-gray flex-1">{activity.description}</span>
                            <span className="text-stak-copper font-medium ml-2">{activity.score}%</span>
                          </div>
                          <div className="text-xs text-stak-light-gray mt-1">
                            {new Date(activity.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                      {(!matchAnalytics.recentActivity || matchAnalytics.recentActivity.length === 0) && (
                        <p className="text-stak-light-gray italic text-sm">No recent activity</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Algorithm Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <Card className="bg-stak-gray border-stak-dark-gray">
              <CardHeader>
                <CardTitle className="text-stak-white flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-stak-copper" />
                  Matchmaking Algorithm Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-stak-white mb-3">Profile Strengths</h4>
                    <div className="space-y-2">
                      {userProfile.skills?.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          <span className="text-stak-light-gray">Rich skills data ({userProfile.skills.length} skills)</span>
                        </div>
                      )}
                      {userProfile.industries?.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          <span className="text-stak-light-gray">Industry diversity ({userProfile.industries.length} industries)</span>
                        </div>
                      )}
                      {userProfile.bio && userProfile.bio.length > 100 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          <span className="text-stak-light-gray">Detailed bio ({userProfile.bio.length} characters)</span>
                        </div>
                      )}
                      {userProfile.networkingGoals?.length > 0 && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                          <span className="text-stak-light-gray">Clear networking goals ({userProfile.networkingGoals.length} goals)</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-stak-white mb-3">Improvement Opportunities</h4>
                    <div className="space-y-2">
                      {(!userProfile.skills || userProfile.skills.length < 3) && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                          <span className="text-stak-light-gray">Add more skills for better matching</span>
                        </div>
                      )}
                      {(!userProfile.bio || userProfile.bio.length < 100) && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                          <span className="text-stak-light-gray">Expand bio for richer AI analysis</span>
                        </div>
                      )}
                      {(!userProfile.networkingGoals || userProfile.networkingGoals.length === 0) && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          <span className="text-stak-light-gray">Missing networking goals</span>
                        </div>
                      )}
                      {!userProfile.personalityProfile && (
                        <div className="flex items-center gap-2 text-sm">
                          <span className="w-2 h-2 bg-red-400 rounded-full"></span>
                          <span className="text-stak-light-gray">No AI personality analysis</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-stak-white mb-3">Algorithm Recommendations</h4>
                  <div className="bg-stak-black p-4 rounded-lg space-y-2">
                    {matchAnalytics && matchAnalytics.connectionRate < 20 && (
                      <p className="text-sm text-yellow-400">⚠️ Low connection rate - consider adjusting match scoring algorithm</p>
                    )}
                    {matchAnalytics && matchAnalytics.avgMatchScore > 80 && (
                      <p className="text-sm text-blue-400">ℹ️ High average match scores - algorithm may be too selective</p>
                    )}
                    {(!userProfile.personalityProfile || !userProfile.goalAnalysis) && (
                      <p className="text-sm text-red-400">❌ Missing AI analysis - profile needs processing for optimal matching</p>
                    )}
                    {completionPercentage < 70 && (
                      <p className="text-sm text-yellow-400">⚠️ Low profile completion affects match quality</p>
                    )}
                    {completionPercentage >= 90 && matchAnalytics && matchAnalytics.connectionRate > 30 && (
                      <p className="text-sm text-green-400">✅ Optimal profile for high-quality matches</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}