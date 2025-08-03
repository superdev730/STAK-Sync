import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { Brain, MessageSquare, Calendar, Users, TrendingUp, Award } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  const stats = [
    { label: "Connections", value: "87", icon: Users },
    { label: "Match Score", value: "94%", icon: TrendingUp },
    { label: "Meetings", value: "23", icon: Calendar },
    { label: "Messages", value: "156", icon: MessageSquare },
  ];

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
          <Card key={stat.label} className="luxury-card text-center">
            <CardContent className="p-6">
              <stat.icon className="w-8 h-8 text-navy mx-auto mb-3" />
              <div className="text-2xl font-bold text-navy mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
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
    </div>
  );
}
