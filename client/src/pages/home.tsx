import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Brain, MessageSquare, Calendar, Users, TrendingUp, Award, ExternalLink, BarChart3, Filter, ArrowUpDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function Home() {
  const { user } = useAuth();
  const [drillDownDialog, setDrillDownDialog] = useState(false);
  const [drillDownType, setDrillDownType] = useState("");
  const [drillDownData, setDrillDownData] = useState<any[]>([]);

  const stats = [
    { label: "Connections", value: "87", icon: Users },
    { label: "Match Score", value: "94%", icon: TrendingUp },
    { label: "Meetings", value: "23", icon: Calendar },
    { label: "Messages", value: "156", icon: MessageSquare },
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
      setDrillDownData(response || []);
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
    },
    {
      title: "Check Messages",
      description: "3 unread conversations",
      icon: MessageSquare,
      href: "/messages",
      color: "bg-green-600/20 text-green-400",
    },
    {
      title: "Schedule Meetup",
      description: "Coordinate your next meeting",
      icon: Calendar,
      href: "/events",
      color: "bg-blue-600/20 text-blue-400",
    },
    {
      title: "Update Profile",
      description: "Enhance your networking profile",
      icon: Award,
      href: "/profile",
      color: "bg-purple-600/20 text-purple-400",
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
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-blue-200 text-lg">
          You have 3 new matches and 2 pending meetup requests waiting for you.
        </p>
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
              <stat.icon className="w-8 h-8 text-navy mx-auto mb-3 group-hover:text-stak-copper transition-colors" />
              <div className="text-2xl font-bold text-navy mb-1 group-hover:text-stak-copper transition-colors">{stat.value}</div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                {stat.label}
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-playfair font-bold text-navy mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Link key={action.title} href={action.href}>
              <Card className="luxury-card hover:shadow-lg transition-all cursor-pointer group">
                <CardContent className="p-6 text-center">
                  <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                    <action.icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-charcoal mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600">{action.description}</p>
                </CardContent>
              </Card>
            </Link>
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
