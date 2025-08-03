import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Activity, 
  MessageSquare, 
  Target,
  BarChart3,
  PieChart,
  Settings,
  UserCheck,
  Clock,
  MapPin,
  Star
} from "lucide-react";

interface AdminAnalytics {
  userStats: {
    totalUsers: number;
    activeUsersToday: number;
    newUsersThisWeek: number;
    completedProfiles: number;
  };
  eventStats: {
    totalEvents: number;
    upcomingEvents: number;
    totalRegistrations: number;
    averageAttendance: number;
  };
  matchingStats: {
    totalMatches: number;
    successfulMatches: number;
    matchSuccessRate: number;
    averageCompatibilityScore: number;
  };
  engagementStats: {
    totalMessages: number;
    activeMeetups: number;
    averageResponseTime: number;
    userSatisfactionScore: number;
  };
  topEvents: Array<{
    id: string;
    title: string;
    registrationCount: number;
    attendanceRate: number;
    satisfactionScore: number;
  }>;
  topUsers: Array<{
    id: string;
    name: string;
    matchCount: number;
    messagesSent: number;
    eventsAttended: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'registration' | 'match' | 'message' | 'meetup';
    description: string;
    timestamp: string;
    user: string;
  }>;
}

export default function Admin() {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  const { data: analytics, isLoading } = useQuery<AdminAnalytics>({
    queryKey: ['/api/admin/analytics', selectedTimeRange],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-12 bg-muted rounded-lg w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="h-96 bg-muted rounded-lg"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
        <div className="max-w-7xl mx-auto">
          <Card className="bg-destructive/10 border-destructive/20">
            <CardHeader>
              <CardTitle className="text-destructive">Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access the admin panel. Please contact your administrator.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, change, icon: Icon, trend }: {
    title: string;
    value: string | number;
    change: string;
    icon: any;
    trend: 'up' | 'down' | 'neutral';
  }) => (
    <Card className="bg-card/50 backdrop-blur-sm border-border/50">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className={`text-xs ${
          trend === 'up' ? 'text-green-500' : 
          trend === 'down' ? 'text-red-500' : 
          'text-muted-foreground'
        }`}>
          {change}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">STAK Signal Platform Analytics & Management</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant={selectedTimeRange === '7d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange('7d')}
            >
              7 Days
            </Button>
            <Button
              variant={selectedTimeRange === '30d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange('30d')}
            >
              30 Days
            </Button>
            <Button
              variant={selectedTimeRange === '90d' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange('90d')}
            >
              90 Days
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Users"
            value={analytics.userStats.totalUsers}
            change={`+${analytics.userStats.newUsersThisWeek} this week`}
            icon={Users}
            trend="up"
          />
          <StatCard
            title="Active Today"
            value={analytics.userStats.activeUsersToday}
            change={`${Math.round((analytics.userStats.activeUsersToday / analytics.userStats.totalUsers) * 100)}% of total`}
            icon={Activity}
            trend="up"
          />
          <StatCard
            title="Total Events"
            value={analytics.eventStats.totalEvents}
            change={`${analytics.eventStats.upcomingEvents} upcoming`}
            icon={Calendar}
            trend="neutral"
          />
          <StatCard
            title="Match Success Rate"
            value={`${analytics.matchingStats.matchSuccessRate}%`}
            change={`${analytics.matchingStats.totalMatches} total matches`}
            icon={Target}
            trend="up"
          />
        </div>

        {/* Detailed Analytics */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="matching">Matching</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Platform Health */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Platform Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Profile Completion Rate</span>
                      <span className="font-medium">
                        {Math.round((analytics.userStats.completedProfiles / analytics.userStats.totalUsers) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${(analytics.userStats.completedProfiles / analytics.userStats.totalUsers) * 100}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Event Attendance Rate</span>
                      <span className="font-medium">{analytics.eventStats.averageAttendance}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${analytics.eventStats.averageAttendance}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>User Satisfaction</span>
                      <span className="font-medium">{analytics.engagementStats.userSatisfactionScore}/5.0</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-yellow-500 h-2 rounded-full" 
                        style={{ width: `${(analytics.engagementStats.userSatisfactionScore / 5) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Events */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Top Performing Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topEvents.slice(0, 5).map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{event.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {event.registrationCount} registrations • {event.attendanceRate}% attendance
                          </div>
                        </div>
                        <Badge variant="secondary">
                          {event.satisfactionScore}/5.0
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Growth */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>User Growth Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {analytics.userStats.totalUsers}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Users</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-500">
                        {analytics.userStats.newUsersThisWeek}
                      </div>
                      <div className="text-sm text-muted-foreground">New This Week</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Active Users Today</span>
                      <span className="font-medium">{analytics.userStats.activeUsersToday}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Completed Profiles</span>
                      <span className="font-medium">{analytics.userStats.completedProfiles}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Users */}
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Most Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analytics.topUsers.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{user.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.matchCount} matches • {user.messagesSent} messages • {user.eventsAttended} events
                          </div>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="events" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="text-lg">Event Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center p-4 bg-muted/30 rounded-lg">
                    <div className="text-3xl font-bold text-primary">
                      {analytics.eventStats.totalEvents}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Events</div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Upcoming Events</span>
                      <span className="font-medium">{analytics.eventStats.upcomingEvents}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Total Registrations</span>
                      <span className="font-medium">{analytics.eventStats.totalRegistrations}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Average Attendance</span>
                      <span className="font-medium">{analytics.eventStats.averageAttendance}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Event Performance Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics.topEvents.map((event) => (
                      <div key={event.id} className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{event.title}</h4>
                          <Badge variant="secondary">{event.satisfactionScore}/5.0</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                          <div>Registrations: {event.registrationCount}</div>
                          <div>Attendance: {event.attendanceRate}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="matching" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>AI Matching Performance</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {analytics.matchingStats.totalMatches}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Matches</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-green-500">
                        {analytics.matchingStats.matchSuccessRate}%
                      </div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Successful Matches</span>
                      <span className="font-medium">{analytics.matchingStats.successfulMatches}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Avg. Compatibility Score</span>
                      <span className="font-medium">{analytics.matchingStats.averageCompatibilityScore}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle>Engagement Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Total Messages</span>
                      <span className="font-medium">{analytics.engagementStats.totalMessages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Active Meetups</span>
                      <span className="font-medium">{analytics.engagementStats.activeMeetups}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Avg. Response Time</span>
                      <span className="font-medium">{analytics.engagementStats.averageResponseTime}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">User Satisfaction</span>
                      <span className="font-medium">{analytics.engagementStats.userSatisfactionScore}/5.0</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
              <CardHeader>
                <CardTitle>Recent Platform Activity</CardTitle>
                <CardDescription>Real-time insights into user interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                      <div className="p-2 bg-primary/10 rounded-full">
                        {activity.type === 'registration' && <UserCheck className="h-4 w-4 text-primary" />}
                        {activity.type === 'match' && <Target className="h-4 w-4 text-green-500" />}
                        {activity.type === 'message' && <MessageSquare className="h-4 w-4 text-blue-500" />}
                        {activity.type === 'meetup' && <Calendar className="h-4 w-4 text-purple-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{activity.description}</div>
                        <div className="text-xs text-muted-foreground">
                          {activity.user} • {new Date(activity.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {activity.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}