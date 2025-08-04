import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Brain, MessageSquare, Calendar, Users, TrendingUp, Award, ExternalLink, BarChart3, Filter, ArrowUpDown, AlertCircle, Clock, Info, HelpCircle, Zap, Share2, Gift, Trophy, Target, Sparkles, CheckCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiRequest } from "@/lib/queryClient";

interface UserStats {
  connections: number;
  matchScore: string;
  meetings: number;
  messages: number;
  pendingMatches: number;
  pendingMeetups: number;
  unreadMessages: number;
  profileCompleteness?: number;
  signalScore?: number;
  signalLevel?: string;
}

export default function Home() {
  const { user } = useAuth();
  const [drillDownDialog, setDrillDownDialog] = useState(false);
  const [drillDownType, setDrillDownType] = useState("");
  const [drillDownData, setDrillDownData] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const stats = await apiRequest('/api/user/stats', 'GET') as unknown as UserStats;
        setUserStats(stats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
  }, []);

  const stats = userStats ? [
    { 
      label: "Connections", 
      value: (userStats.connections || 0).toString(), 
      icon: Users,
      tooltip: "Your verified professional connections within the STAK ecosystem. This number represents mutual connections where both parties have accepted the connection request. Quality over quantity - each connection is vetted through our AI matching system."
    },
    { 
      label: "Match Score", 
      value: userStats.matchScore || "0%", 
      icon: TrendingUp,
      tooltip: "AI-calculated compatibility score based on your networking goals, industry alignment, geographic preferences, investment focus, and communication style. Higher scores indicate stronger potential for meaningful professional relationships. Updated in real-time as you engage with the platform."
    },
    { 
      label: "Meetings", 
      value: (userStats.meetings || 0).toString(), 
      icon: Calendar,
      tooltip: "Total scheduled meetings and events you've arranged through STAK Signal. Includes completed video calls, in-person meetings, and event networking sessions. Tracked to measure your active networking engagement and relationship building progress."
    },
    { 
      label: "Messages", 
      value: (userStats.messages || 0).toString(), 
      icon: MessageSquare,
      tooltip: "Total messages exchanged with your connections. Our AI monitors engagement patterns to suggest optimal communication timing and helps maintain professional relationship momentum. Quality conversations lead to stronger business outcomes."
    },
  ] : [
    { 
      label: "Connections", 
      value: "0", 
      icon: Users,
      tooltip: "Your verified professional connections within the STAK ecosystem. Complete your profile to start receiving AI-matched connection suggestions."
    },
    { 
      label: "Match Score", 
      value: "0%", 
      icon: TrendingUp,
      tooltip: "AI-calculated compatibility score. Complete your questionnaire and add more details to your profile to improve your match score and receive better connection recommendations."
    },
    { 
      label: "Meetings", 
      value: "0", 
      icon: Calendar,
      tooltip: "Total scheduled meetings and events. Start connecting with others to begin scheduling valuable networking meetings."
    },
    { 
      label: "Messages", 
      value: "0", 
      icon: MessageSquare,
      tooltip: "Total messages exchanged. Begin conversations with your matches to start building meaningful professional relationships."
    },
  ];

  const handleMetricClick = async (metricType: string) => {
    setDrillDownType(metricType);
    setDrillDownDialog(true);

    // Fetch detailed data based on metric type
    try {
      let endpoint = '';
      switch (metricType) {
        case 'Connections':
          endpoint = '/api/user/connections-detailed';
          break;
        case 'Meetings':
          endpoint = '/api/user/meetings-detailed';
          break;
        case 'Messages':
          endpoint = '/api/user/messages-detailed';
          break;
        case 'Match Score':
          endpoint = '/api/user/matches-detailed';
          break;
        default:
          return;
      }

      const response = await apiRequest('GET', endpoint);
      setDrillDownData(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching detailed data:', error);
      setDrillDownData([]);
    }
  };

  const quickActions = [
    {
      title: "Discover New Matches",
      description: "Find your next business connection",
      icon: Brain,
      href: "/discover",
      color: "bg-stak-copper/20 text-stak-copper",
      urgent: false,
      badge: 0,
    },
    {
      title: "Check Messages",
      description: userStats ? `${userStats.unreadMessages || 0} unread conversations` : "Check your messages",
      icon: MessageSquare,
      href: "/messages",
      color: "bg-red-600/20 text-red-400",
      urgent: userStats ? (userStats.unreadMessages || 0) > 0 : false,
      badge: userStats?.unreadMessages || 0,
    },
    {
      title: "Review Meetup Requests",
      description: userStats ? `${userStats.pendingMeetups || 0} pending requests` : "Coordinate your meetings",
      icon: Calendar,
      href: "/events",
      color: "bg-orange-600/20 text-orange-400",
      urgent: userStats ? (userStats.pendingMeetups || 0) > 0 : false,
      badge: userStats?.pendingMeetups || 0,
    },
    {
      title: "Update Profile",
      description: "Enhance your networking profile",
      icon: Award,
      href: "/profile",
      color: "bg-purple-600/20 text-purple-400",
      urgent: false,
      badge: 0,
    },
  ];

  const recentActivity = [
    {
      type: "match",
      description: "New match: Sarah Chen (96% compatibility)",
      time: "2 hours ago",
      icon: Brain,
    },
    {
      type: "message",
      description: "Message from Marcus Rodriguez",
      time: "4 hours ago",
      icon: MessageSquare,
    },
    {
      type: "meetup",
      description: "Meetup confirmed with Emma Thompson",
      time: "1 day ago",
      icon: Calendar,
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Profile Completeness & Signal Score */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Profile Completeness Card */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-green-600" />
                    Profile Strength
                  </CardTitle>
                  <p className="text-gray-600 text-sm">Complete your profile</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-green-600">
                    {user ? Math.round(([(user as any).firstName, (user as any).lastName, (user as any).title, (user as any).company, (user as any).bio, (user as any).location].filter(f => f).length / 6) * 100) : 0}%
                  </div>
                </div>
              </div>
              <Progress value={user ? Math.round(([(user as any).firstName, (user as any).lastName, (user as any).title, (user as any).company, (user as any).bio, (user as any).location].filter(f => f).length / 6) * 100) : 0} className="h-2 mt-3" />
            </CardHeader>
            <CardContent className="pt-0">
              <Button asChild size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Link href="/profile">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Complete Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Signal Score Card */}
          <Card className="bg-white border-0 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900 flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-stak-copper" />
                    Signal Score
                  </CardTitle>
                  <p className="text-gray-600 text-sm">Platform engagement</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-stak-copper">
                    {userStats ? Math.min((userStats.connections || 0) * 10 + (userStats.meetings || 0) * 15 + (userStats.messages || 0) * 2, 1000) : 0}
                  </div>
                  <div className="text-xs text-gray-500">/ 1000 pts</div>
                </div>
              </div>
              <Badge variant="outline" className="text-stak-copper border-stak-copper/30 mt-2">
                <Trophy className="w-3 h-3 mr-1" />
                {userStats && ((userStats.connections || 0) * 10 + (userStats.meetings || 0) * 15 + (userStats.messages || 0) * 2) >= 800 ? "Signal Master" :
                 userStats && ((userStats.connections || 0) * 10 + (userStats.meetings || 0) * 15 + (userStats.messages || 0) * 2) >= 400 ? "Signal Builder" : "Signal Starter"}
              </Badge>
            </CardHeader>
          </Card>

          {/* Referral Card */}
          <Card className="bg-gradient-to-r from-gray-900 to-gray-800 text-white border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center">
                <Share2 className="w-5 h-5 mr-2 text-stak-copper" />
                Share STAK Signal
              </CardTitle>
              <p className="text-gray-300 text-sm">Invite colleagues to join</p>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="secondary" size="sm" className="w-full bg-stak-copper text-gray-900 hover:bg-stak-dark-copper hover:text-white">
                <Gift className="w-4 h-4 mr-2" />
                Invite & Earn Rewards
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-stak-copper to-stak-dark-copper text-white rounded-2xl p-8 shadow-lg">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                Welcome back, {(user as any)?.firstName || 'there'}!
              </h1>
              <p className="text-white/90 text-lg">
                Your STAK Signal dashboard is ready
              </p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Link href="/messages">
              <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm h-16 text-left justify-start">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <MessageSquare className="h-6 w-6" />
                    {userStats && (userStats.unreadMessages || 0) > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white">
                        {userStats.unreadMessages}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">Check Messages</div>
                    <div className="text-sm opacity-90">
                      {userStats ? (userStats.unreadMessages || 0) > 0 ? `${userStats.unreadMessages} unread` : 'All caught up' : 'Loading...'}
                    </div>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Link href="/matches">
              <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm h-16 text-left justify-start">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Users className="h-6 w-6" />
                    {userStats && (userStats.pendingMatches || 0) > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-orange-500 text-white">
                        {userStats.pendingMatches}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">Connection Requests</div>
                    <div className="text-sm opacity-90">
                      {userStats ? (userStats.pendingMatches || 0) > 0 ? `${userStats.pendingMatches} pending` : 'No new requests' : 'Loading...'}
                    </div>
                  </div>
                </div>
              </Button>
            </Link>
            
            <Link href="/events">
              <Button className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm h-16 text-left justify-start">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Calendar className="h-6 w-6" />
                    {userStats && (userStats.pendingMeetups || 0) > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs bg-blue-500 text-white">
                        {userStats.pendingMeetups}
                      </Badge>
                    )}
                  </div>
                  <div>
                    <div className="font-semibold">Meetup Requests</div>
                    <div className="text-sm opacity-90">
                      {userStats ? (userStats.pendingMeetups || 0) > 0 ? `${userStats.pendingMeetups} pending` : 'No new meetings' : 'Loading...'}
                    </div>
                  </div>
                </div>
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <TooltipProvider>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <Card 
                key={stat.label} 
                className="bg-white shadow-md hover:shadow-lg border border-gray-200 text-center cursor-pointer transition-all duration-200 group"
                onClick={() => handleMetricClick(stat.label)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-center mb-3">
                    <stat.icon className="w-8 h-8 text-gray-600 group-hover:text-stak-copper transition-colors" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="w-4 h-4 text-gray-400 hover:text-stak-copper ml-2 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs bg-gray-900 text-white p-3 rounded-lg border border-gray-700">
                        <p className="text-sm leading-relaxed">{stat.tooltip}</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1 group-hover:text-stak-copper transition-colors">{stat.value}</div>
                  <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                    {stat.label}
                    <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TooltipProvider>

        {/* Quick Actions */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">Quick Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <Card key={action.title} className={`bg-white shadow-md hover:shadow-lg border border-gray-200 text-center transition-all duration-200 group relative ${action.urgent ? 'ring-2 ring-red-500' : ''}`}>
                <Link href={action.href}>
                  <CardContent className="p-6">
                    {(action.badge || 0) > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 text-xs bg-red-500 text-white">
                        {action.badge}
                      </Badge>
                    )}
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${action.color} group-hover:scale-110 transition-transform ${action.urgent ? 'ring-2 ring-current' : ''}`}>
                      <action.icon className="w-8 h-8" />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${action.urgent ? 'text-red-600' : 'text-gray-900'}`}>
                      {action.title}
                      {action.urgent && <span className="ml-2 text-red-500">!</span>}
                    </h3>
                    <p className={`text-sm ${action.urgent ? 'text-red-500 font-medium' : 'text-gray-600'}`}>
                      {action.description}
                    </p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h3>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className="w-8 h-8 bg-stak-copper/20 rounded-full flex items-center justify-center">
                      <activity.icon className="w-4 h-4 text-stak-copper" />
                    </div>
                    <div className="flex-1">
                      <p className="text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="bg-white shadow-md border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">AI Insights</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Profile Optimization</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-400 hover:text-stak-copper cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-gray-900 text-white p-3 rounded-lg border border-gray-700">
                          <p className="text-sm leading-relaxed">
                            AI analyzes your profile completeness, keyword optimization, industry alignment, and engagement patterns. Factors include: professional summary quality, skills relevance, education details, and response to messages. Higher scores lead to better match recommendations.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Badge className="bg-green-600 text-white">94%</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your profile is performing well. Consider adding more industry keywords to improve match quality.
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Networking Goal</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-400 hover:text-stak-copper cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-gray-900 text-white p-3 rounded-lg border border-gray-700">
                          <p className="text-sm leading-relaxed">
                            Tracks progress toward your specified networking objectives. AI matches you with relevant professionals based on your goals (funding, partnerships, mentorship, etc.) and monitors completion through successful connections and meeting outcomes.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Badge className="bg-yellow-600 text-white">Active</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    You're 60% closer to your Series A funding goal. 3 relevant VCs are in your match queue.
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">Best Time to Connect</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="w-4 h-4 text-gray-400 hover:text-stak-copper cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs bg-gray-900 text-white p-3 rounded-lg border border-gray-700">
                          <p className="text-sm leading-relaxed">
                            AI analyzes when your connections are most active and responsive. Based on login patterns, message response times, and successful interaction data across the STAK network to optimize your outreach timing.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <Badge className="bg-gray-600 text-white">2-4 PM</Badge>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your connections are most active in the afternoons. Schedule your outreach accordingly.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drill-Down Dialog */}
        <Dialog open={drillDownDialog} onOpenChange={setDrillDownDialog}>
        <DialogContent className="bg-white border border-gray-200 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-stak-copper" />
              {drillDownType} - Detailed Records
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Detailed information about your {drillDownType.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">{drillDownData.length} records found</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 bg-white hover:bg-gray-50">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700">
                  <div>Name/Title</div>
                  <div>Type/Status</div>
                  <div>Date/Time</div>
                  <div>Action</div>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {drillDownData.length > 0 ? (
                  drillDownData.map((record: any, index: number) => (
                    <div key={record.id || index} className="px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-4 gap-4 items-center text-sm">
                        <div className="text-gray-900 font-medium">
                          {record.name || record.title || record.email || `Record ${index + 1}`}
                        </div>
                        <div className="text-gray-600">
                          {record.type || record.status || record.category || 'N/A'}
                        </div>
                        <div className="text-gray-600">
                          {record.createdAt || record.timestamp || record.date || 'N/A'}
                        </div>
                        <div>
                          <Button size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-gray-500">
                    No detailed records available for this metric
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
