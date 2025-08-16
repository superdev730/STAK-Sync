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
  syncScore?: number;
  syncLevel?: string;
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
      tooltip: "Total scheduled meetings and events you've arranged through STAK Sync. Includes completed video calls, in-person meetings, and event networking sessions. Tracked to measure your active networking engagement and relationship building progress."
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
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Live Event Alert - Priority Section */}
        <Card className="bg-gradient-to-r from-stak-black to-gray-800 text-white border-0 shadow-xl">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Display actual live event with cover image when available */}
                <div className="w-12 h-12 bg-stak-copper/20 rounded-full flex items-center justify-center overflow-hidden">
                  {/* This should be replaced with actual live event data when available */}
                  <Calendar className="w-6 h-6 text-stak-copper" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">STAK Spring Summit</h2>
                  <p className="text-gray-200">Live networking event in progress • 47 attendees online</p>
                </div>
              </div>
              <Button asChild className="bg-stak-copper text-stak-black hover:bg-stak-dark-copper font-semibold">
                <Link href="/live-dashboard">Join Live Event</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Core Metrics - AI Matchmaking Focus */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Match Score</p>
                  <p className="text-2xl font-bold text-stak-copper">{userStats?.matchScore || "85%"}</p>
                </div>
                <Brain className="w-8 h-8 text-stak-copper" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Active connections ready</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Connections</p>
                  <p className="text-2xl font-bold text-stak-black">{userStats?.connections || 0}</p>
                </div>
                <Users className="w-8 h-8 text-stak-copper" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Quality network built</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Messages</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-stak-black">{userStats?.messages || 0}</p>
                    {userStats && (userStats.unreadMessages || 0) > 0 && (
                      <Badge className="bg-red-500 text-white text-xs">{userStats.unreadMessages}</Badge>
                    )}
                  </div>
                </div>
                <MessageSquare className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Active conversations</p>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Meetings</p>
                  <div className="flex items-center space-x-2">
                    <p className="text-2xl font-bold text-stak-black">{userStats?.meetings || 0}</p>
                    {userStats && (userStats.pendingMeetups || 0) > 0 && (
                      <Badge className="bg-stak-copper text-stak-black text-xs">{userStats.pendingMeetups}</Badge>
                    )}
                  </div>
                </div>
                <Calendar className="w-8 h-8 text-gray-500" />
              </div>
              <p className="text-xs text-gray-500 mt-2">Scheduled & completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Action Center */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Matchmaking Panel */}
          <Card className="bg-gradient-to-br from-stak-black to-gray-800 text-white border-0 shadow-xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center">
                <Brain className="w-6 h-6 mr-3 text-stak-copper" />
                AI Networking Hub
              </CardTitle>
              <p className="text-gray-300">Your intelligent connection center</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button asChild className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black h-12">
                  <Link href="/discover">
                    <Target className="w-4 h-4 mr-2" />
                    Find Matches
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700 h-12">
                  <Link href="/matches">
                    <Users className="w-4 h-4 mr-2" />
                    View Connections
                  </Link>
                </Button>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Profile Optimization</span>
                  <Badge className="bg-stak-copper text-stak-black">
                    {user ? Math.round(([(user as any).firstName, (user as any).lastName, (user as any).title, (user as any).company, (user as any).bio, (user as any).location].filter(f => f).length / 6) * 100) : 0}%
                  </Badge>
                </div>
                <Progress 
                  value={user ? Math.round(([(user as any).firstName, (user as any).lastName, (user as any).title, (user as any).company, (user as any).bio, (user as any).location].filter(f => f).length / 6) * 100) : 0} 
                  className="h-2 bg-gray-700"
                />
                <p className="text-xs text-gray-400 mt-2">Complete your profile for better AI matching</p>
              </div>
            </CardContent>
          </Card>

          {/* Communication Center */}
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl flex items-center text-stak-black">
                <MessageSquare className="w-6 h-6 mr-3 text-stak-copper" />
                Communication Center
              </CardTitle>
              <p className="text-gray-600">Manage your professional conversations</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Button asChild className="bg-stak-black hover:bg-gray-800 text-white h-12">
                  <Link href="/messages">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Messages
                    {userStats && (userStats.unreadMessages || 0) > 0 && (
                      <Badge className="ml-2 bg-red-500 text-white text-xs">
                        {userStats.unreadMessages}
                      </Badge>
                    )}
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 h-12">
                  <Link href="/events">
                    <Calendar className="w-4 h-4 mr-2" />
                    Schedule
                    {userStats && (userStats.pendingMeetups || 0) > 0 && (
                      <Badge className="ml-2 bg-stak-copper text-stak-black text-xs">
                        {userStats.pendingMeetups}
                      </Badge>
                    )}
                  </Link>
                </Button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-stak-black mb-2">Recent Activity</h4>
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-stak-forest rounded-full mr-3"></div>
                    New match: Sarah Chen (96% compatibility)
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-stak-copper rounded-full mr-3"></div>
                    Message from Marcus Rodriguez
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="w-2 h-2 bg-gray-500 rounded-full mr-3"></div>
                    Meeting confirmed with Emma Thompson
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access & AI Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Enhancement */}
          <Card className="bg-white border border-gray-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-stak-black">
                <Sparkles className="w-5 h-5 mr-2 text-stak-copper" />
                Profile Enhancement
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full bg-stak-copper hover:bg-stak-dark-copper text-stak-black">
                <Link href="/profile">
                  <Target className="w-4 h-4 mr-2" />
                  Optimize Profile
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-50">
                <Link href="/questionnaire">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Survey
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Sync Score & Gamification */}
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center text-stak-black">
                <Trophy className="w-5 h-5 mr-2 text-stak-copper" />
                Sync Level
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-stak-copper">
                  {userStats ? Math.min((userStats.connections || 0) * 10 + (userStats.meetings || 0) * 15 + (userStats.messages || 0) * 2, 1000) : 0}
                </div>
                <p className="text-sm text-gray-600">Sync Points</p>
                <Badge className="bg-stak-copper text-stak-black">
                  {userStats && ((userStats.connections || 0) * 10 + (userStats.meetings || 0) * 15 + (userStats.messages || 0) * 2) >= 800 ? "Sync Master" :
                   userStats && ((userStats.connections || 0) * 10 + (userStats.meetings || 0) * 15 + (userStats.messages || 0) * 2) >= 400 ? "Sync Builder" : "Sync Starter"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Share & Invite */}
          <Card className="bg-gradient-to-br from-stak-black to-gray-800 text-white border-0 shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center">
                <Share2 className="w-5 h-5 mr-2 text-stak-copper" />
                Grow Network
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-stak-copper hover:bg-stak-dark-copper text-stak-black">
                <Gift className="w-4 h-4 mr-2" />
                Invite Colleagues
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pricing Section */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-stak-black mb-4">Unlock Your Networking Potential</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Free for STAK members with premium tiers that unlock our best features, exclusive meetups, and discounted event access
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {/* Free Tier - STAK Members */}
            <Card className="relative border-2 border-gray-200 bg-white shadow-sm">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-stak-forest text-white px-4 py-1">STAK MEMBERS</Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl font-bold text-stak-black">Core</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-stak-black">FREE</span>
                  <p className="text-gray-500 mt-2">For verified STAK members</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-forest" />
                    <span className="text-gray-700">AI-powered matching</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-forest" />
                    <span className="text-gray-700">Basic messaging</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-forest" />
                    <span className="text-gray-700">Profile creation</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-forest" />
                    <span className="text-gray-700">Event discovery</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-forest" />
                    <span className="text-gray-700">Community access</span>
                  </div>
                </div>
                <Button className="w-full bg-stak-forest hover:bg-green-700 text-white">
                  Current Plan
                </Button>
              </CardContent>
            </Card>

            {/* Pro Tier */}
            <Card className="relative border-2 border-stak-copper bg-white shadow-lg scale-105">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-stak-copper text-stak-black px-4 py-1">MOST POPULAR</Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl font-bold text-stak-black">Pro</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-stak-black">$29</span>
                  <span className="text-gray-500">/month</span>
                  <p className="text-gray-500 mt-2">Enhanced networking power</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-stak-copper" />
                    <span className="text-gray-700">Everything in Core</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkles className="w-5 h-5 text-stak-copper" />
                    <span className="text-gray-700">Advanced AI insights</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-stak-copper" />
                    <span className="text-gray-700">Exclusive Pro meetups</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-stak-copper" />
                    <span className="text-gray-700">20% off ticketed events</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-stak-copper" />
                    <span className="text-gray-700">Priority messaging</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-stak-copper" />
                    <span className="text-gray-700">Analytics dashboard</span>
                  </div>
                </div>
                <Button className="w-full bg-stak-copper hover:bg-stak-dark-copper text-stak-black">
                  Upgrade to Pro
                </Button>
              </CardContent>
            </Card>

            {/* Elite Tier */}
            <Card className="relative border-2 border-gray-900 bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-lg">
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 px-4 py-1 font-semibold">ELITE</Badge>
              </div>
              <CardHeader className="text-center pt-8">
                <CardTitle className="text-2xl font-bold text-white">Elite</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-white">$99</span>
                  <span className="text-gray-300">/month</span>
                  <p className="text-gray-300 mt-2">Maximum networking leverage</p>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-200">Everything in Pro</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-200">VIP Elite events</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-200">Personal AI concierge</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-200">50% off all events</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Brain className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-200">Custom matching algorithms</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ExternalLink className="w-5 h-5 text-yellow-400" />
                    <span className="text-gray-200">Direct founder access</span>
                  </div>
                </div>
                <Button className="w-full bg-gradient-to-r from-yellow-400 to-yellow-600 text-gray-900 font-semibold hover:from-yellow-500 hover:to-yellow-700">
                  Go Elite
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Feature Comparison */}
          <Card className="mt-8 bg-white border border-gray-200">
            <CardHeader>
              <CardTitle className="text-center text-2xl font-bold text-navy">Feature Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Features</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Core</th>
                      <th className="text-center py-3 px-4 font-semibold text-stak-copper">Pro</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900">Elite</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-700">AI Matching</td>
                      <td className="py-3 px-4 text-center"><CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><CheckCircle className="w-5 h-5 text-stak-copper mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><CheckCircle className="w-5 h-5 text-yellow-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-700">Monthly meetups</td>
                      <td className="py-3 px-4 text-center text-gray-400">—</td>
                      <td className="py-3 px-4 text-center"><CheckCircle className="w-5 h-5 text-stak-copper mx-auto" /></td>
                      <td className="py-3 px-4 text-center"><CheckCircle className="w-5 h-5 text-yellow-500 mx-auto" /></td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-700">Event discounts</td>
                      <td className="py-3 px-4 text-center text-gray-400">—</td>
                      <td className="py-3 px-4 text-center text-stak-copper font-semibold">20%</td>
                      <td className="py-3 px-4 text-center text-yellow-600 font-semibold">50%</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-700">AI Insights</td>
                      <td className="py-3 px-4 text-center text-gray-500">Basic</td>
                      <td className="py-3 px-4 text-center text-stak-copper font-semibold">Advanced</td>
                      <td className="py-3 px-4 text-center text-yellow-600 font-semibold">Custom</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3 px-4 text-gray-700">Personal Concierge</td>
                      <td className="py-3 px-4 text-center text-gray-400">—</td>
                      <td className="py-3 px-4 text-center text-gray-400">—</td>
                      <td className="py-3 px-4 text-center"><CheckCircle className="w-5 h-5 text-yellow-500 mx-auto" /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-center">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Elevate Your Network?</h3>
              <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">
                Join thousands of STAK professionals who are building meaningful connections and growing their businesses through intelligent networking.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button className="bg-white text-emerald-700 hover:bg-emerald-50 font-semibold px-8">
                  Start Free Trial
                </Button>
                <Button variant="outline" className="border-white text-white hover:bg-white hover:text-emerald-700 font-semibold px-8">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Drill-Down Dialog */}
        <Dialog open={drillDownDialog} onOpenChange={setDrillDownDialog}>
        <DialogContent className="bg-white border border-slate-200 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-600" />
              {drillDownType} - Detailed Records
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              Detailed information about your {drillDownType.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">{drillDownData.length} records found</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="border-slate-300 text-slate-700 bg-white hover:bg-slate-50">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-slate-700">
                  <div>Name/Title</div>
                  <div>Type/Status</div>
                  <div>Date/Time</div>
                  <div>Action</div>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {drillDownData.length > 0 ? (
                  drillDownData.map((record: any, index: number) => (
                    <div key={record.id || index} className="px-4 py-3 border-b border-slate-200 hover:bg-slate-50 transition-colors">
                      <div className="grid grid-cols-4 gap-4 items-center text-sm">
                        <div className="text-slate-900 font-medium">
                          {record.name || record.title || record.email || `Record ${index + 1}`}
                        </div>
                        <div className="text-slate-600">
                          {record.type || record.status || record.category || 'N/A'}
                        </div>
                        <div className="text-slate-600">
                          {record.createdAt || record.timestamp || record.date || 'N/A'}
                        </div>
                        <div>
                          <Button size="sm" variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-slate-500">
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
