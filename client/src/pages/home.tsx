import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Brain, MessageSquare, Calendar, Users, TrendingUp, Award, ExternalLink, BarChart3, Filter, ArrowUpDown, AlertCircle, Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface UserStats {
  connections: number;
  matchScore: string;
  meetings: number;
  messages: number;
  pendingMatches: number;
  pendingMeetups: number;
  unreadMessages: number;
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
        const stats = await apiRequest('GET', '/api/user/stats');
        setUserStats(stats);
      } catch (error) {
        console.error('Error fetching user stats:', error);
      }
    };

    fetchUserStats();
  }, []);

  const stats = userStats ? [
    { label: "Connections", value: userStats.connections.toString(), icon: Users },
    { label: "Match Score", value: userStats.matchScore, icon: TrendingUp },
    { label: "Meetings", value: userStats.meetings.toString(), icon: Calendar },
    { label: "Messages", value: userStats.messages.toString(), icon: MessageSquare },
  ] : [
    { label: "Connections", value: "...", icon: Users },
    { label: "Match Score", value: "...", icon: TrendingUp },
    { label: "Meetings", value: "...", icon: Calendar },
    { label: "Messages", value: "...", icon: MessageSquare },
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
    },
    {
      title: "Check Messages",
      description: userStats ? `${userStats.unreadMessages} unread conversations` : "Check your messages",
      icon: MessageSquare,
      href: "/messages",
      color: "bg-red-600/20 text-red-400",
      urgent: userStats ? userStats.unreadMessages > 0 : false,
      badge: userStats?.unreadMessages || 0,
    },
    {
      title: "Review Meetup Requests",
      description: userStats ? `${userStats.pendingMeetups} pending requests` : "Coordinate your meetings",
      icon: Calendar,
      href: "/events",
      color: "bg-orange-600/20 text-orange-400",
      urgent: userStats ? userStats.pendingMeetups > 0 : false,
      badge: userStats?.pendingMeetups || 0,
    },
    {
      title: "Update Profile",
      description: "Enhance your networking profile",
      icon: Award,
      href: "/profile",
      color: "bg-purple-600/20 text-purple-400",
      urgent: false,
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
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-stak-black to-stak-gray text-stak-white rounded-2xl p-8 border border-stak-copper/20">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName || 'there'}!
        </h1>
        <div className="space-y-2">
          {userStats && userStats.pendingMatches > 0 && (
            <div className="flex items-center space-x-2 text-stak-copper">
              <AlertCircle className="h-5 w-5" />
              <span className="text-lg font-medium">
                You have {userStats.pendingMatches} new matches waiting for review
              </span>
            </div>
          )}
          {userStats && userStats.pendingMeetups > 0 && (
            <div className="flex items-center space-x-2 text-orange-400">
              <Clock className="h-5 w-5" />
              <span className="text-lg font-medium">
                {userStats.pendingMeetups} meetup requests need your attention
              </span>
            </div>
          )}
          {userStats && userStats.unreadMessages > 0 && (
            <div className="flex items-center space-x-2 text-red-400">
              <MessageSquare className="h-5 w-5" />
              <span className="text-lg font-medium">
                {userStats.unreadMessages} unread messages waiting
              </span>
            </div>
          )}
          {userStats && userStats.pendingMatches === 0 && userStats.pendingMeetups === 0 && userStats.unreadMessages === 0 && (
            <p className="text-stak-light-gray text-lg">
              You're all caught up! Your network is active and engaged.
            </p>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card 
            key={stat.label} 
            className="luxury-card text-center cursor-pointer hover:shadow-lg transition-all duration-200 group"
            onClick={() => handleMetricClick(stat.label)}
          >
            <CardContent className="p-6">
              <stat.icon className="w-8 h-8 text-stak-light-gray mx-auto mb-3 group-hover:text-stak-copper transition-colors" />
              <div className="text-2xl font-bold text-stak-white mb-1 group-hover:text-stak-copper transition-colors">{stat.value}</div>
              <div className="text-sm text-stak-light-gray flex items-center justify-center gap-1">
                {stat.label}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-stak-white">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Card key={action.title} className={`luxury-card text-center hover:shadow-lg transition-all duration-200 group relative ${action.urgent ? 'ring-2 ring-red-500 animate-pulse' : ''}`}>
              <Link href={action.href}>
                <CardContent className="p-6">
                  {action.badge > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 text-xs bg-red-500 text-white">
                      {action.badge}
                    </Badge>
                  )}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${action.color} group-hover:scale-110 transition-transform ${action.urgent ? 'ring-2 ring-current' : ''}`}>
                    <action.icon className="w-8 h-8" />
                  </div>
                  <h3 className={`text-lg font-semibold mb-2 ${action.urgent ? 'text-red-400' : 'text-stak-white'}`}>
                    {action.title}
                    {action.urgent && <span className="ml-2 text-red-500">!</span>}
                  </h3>
                  <p className={`text-sm ${action.urgent ? 'text-red-300 font-medium' : 'text-stak-light-gray'}`}>
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
        <Card className="luxury-card">
          <CardContent className="p-6">
            <h3 className="text-xl font-playfair font-semibold text-navy mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-8 h-8 bg-light-blue rounded-full flex items-center justify-center">
                    <activity.icon className="w-4 h-4 text-navy" />
                  </div>
                  <div className="flex-1">
                    <p className="text-charcoal">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Insights */}
        <Card className="luxury-card">
          <CardContent className="p-6">
            <h3 className="text-xl font-playfair font-semibold text-navy mb-4">AI Insights</h3>
            <div className="space-y-4">
              <div className="p-4 bg-light-blue rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-navy">Profile Optimization</span>
                  <Badge className="bg-prof-green text-white">94%</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  Your profile is performing well. Consider adding more industry keywords to improve match quality.
                </p>
              </div>
              
              <div className="p-4 bg-yellow-50 rounded-lg border border-gold">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-navy">Networking Goal</span>
                  <Badge variant="outline" className="border-gold text-gold">Active</Badge>
                </div>
                <p className="text-sm text-gray-600">
                  You're 60% closer to your Series A funding goal. 3 relevant VCs are in your match queue.
                </p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-navy">Best Time to Connect</span>
                  <Badge variant="secondary">2-4 PM</Badge>
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
        <DialogContent className="bg-stak-black border-stak-gray max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-stak-white flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-stak-copper" />
              {drillDownType} - Detailed Records
            </DialogTitle>
            <DialogDescription className="text-stak-light-gray">
              Detailed information about your {drillDownType.toLowerCase()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-stak-light-gray">{drillDownData.length} records found</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-stak-gray text-stak-light-gray">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm" className="border-stak-gray text-stak-light-gray">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  Sort
                </Button>
              </div>
            </div>

            <div className="border border-stak-gray rounded-lg overflow-hidden">
              <div className="bg-stak-gray px-4 py-3 border-b border-stak-gray">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-stak-light-gray">
                  <div>Name/Title</div>
                  <div>Type/Status</div>
                  <div>Date/Time</div>
                  <div>Action</div>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {drillDownData.length > 0 ? (
                  drillDownData.map((record: any, index: number) => (
                    <div key={record.id || index} className="px-4 py-3 border-b border-stak-gray hover:bg-stak-gray/30 transition-colors">
                      <div className="grid grid-cols-4 gap-4 items-center text-sm">
                        <div className="text-stak-white font-medium">
                          {record.name || record.title || record.email || `Record ${index + 1}`}
                        </div>
                        <div className="text-stak-light-gray">
                          {record.type || record.status || record.category || 'N/A'}
                        </div>
                        <div className="text-stak-light-gray">
                          {record.createdAt || record.timestamp || record.date || 'N/A'}
                        </div>
                        <div>
                          <Button size="sm" variant="outline" className="border-stak-gray text-stak-light-gray hover:bg-stak-gray">
                            View
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-8 text-center text-stak-light-gray">
                    No detailed records available for this metric
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
