import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  MessageSquare, 
  Calendar, 
  User, 
  ExternalLink, 
  BarChart3, 
  MapPin, 
  Briefcase, 
  Target,
  X,
  Check
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Match, User as UserType } from "@shared/schema";

interface ScheduleData {
  date: string;
  time: string;
  message: string;
}

export default function Matches() {
  const [drillDownDialog, setDrillDownDialog] = useState(false);
  const [drillDownType, setDrillDownType] = useState("");
  const [drillDownData, setDrillDownData] = useState<any[]>([]);
  const [scheduleDialog, setScheduleDialog] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<(Match & { matchedUser: UserType }) | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData>({
    date: "",
    time: "",
    message: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matches, isLoading } = useQuery<(Match & { matchedUser: UserType })[]>({
    queryKey: ["/api/matches"],
  });

  const { data: userStats } = useQuery({
    queryKey: ["/api/user/stats"],
  });

  const scheduleMeetingMutation = useMutation({
    mutationFn: async (data: { matchId: string; date: string; time: string; message: string }) => {
      return await apiRequest("POST", "/api/meetings/schedule", data);
    },
    onSuccess: () => {
      toast({
        title: "Meeting Request Sent",
        description: "Your meeting request has been sent and an email notification was delivered.",
      });
      setScheduleDialog(false);
      setScheduleData({ date: "", time: "", message: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Schedule",
        description: error.message || "Something went wrong while scheduling the meeting.",
        variant: "destructive",
      });
    },
  });

  const handleMetricClick = async (metricType: string) => {
    setDrillDownType(metricType);
    setDrillDownDialog(true);
    
    try {
      let data: (Match & { matchedUser: UserType })[];
      switch (metricType) {
        case 'Total Matches':
          data = matches || [];
          break;
        case 'Connected':
          data = matches?.filter(match => match.status === 'connected') || [];
          break;
        case 'Pending':
          data = matches?.filter(match => match.status === 'pending') || [];
          break;
        default:
          data = [];
      }
      setDrillDownData(data);
    } catch (error) {
      console.error('Error fetching drill-down data:', error);
      setDrillDownData([]);
    }
  };

  const handleScheduleClick = (match: Match & { matchedUser: UserType }) => {
    if (match.status !== 'connected') {
      toast({
        title: "Connection Required",
        description: "You can only schedule meetings with connected users.",
        variant: "destructive",
      });
      return;
    }
    setSelectedMatch(match);
    setScheduleDialog(true);
  };

  const handleScheduleSubmit = () => {
    if (!selectedMatch || !scheduleData.date || !scheduleData.time) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    scheduleMeetingMutation.mutate({
      matchId: selectedMatch.id,
      date: scheduleData.date,
      time: scheduleData.time,
      message: scheduleData.message
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'passed':
        return 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'pending':
        return 'Pending';
      case 'passed':
        return 'Passed';
      default:
        return status;
    }
  };

  const connectedMatches = matches?.filter(match => match.status === 'connected') || [];
  const pendingMatches = matches?.filter(match => match.status === 'pending') || [];
  const allMatches = matches || [];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Matches</h1>
          <p className="text-xl text-gray-600">Track and manage your professional connections</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6">
          <Card 
            className="bg-white border border-gray-200 text-center cursor-pointer hover:shadow-lg transition-all duration-200 group"
            onClick={() => handleMetricClick('Total Matches')}
          >
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {allMatches.length}
              </div>
              <div className="text-gray-600 flex items-center justify-center gap-1">
                Total Matches
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-white border border-gray-200 text-center cursor-pointer hover:shadow-lg transition-all duration-200 group"
            onClick={() => handleMetricClick('Connected')}
          >
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-green-600 mb-2 group-hover:text-blue-600 transition-colors">
                {connectedMatches.length}
              </div>
              <div className="text-gray-600 flex items-center justify-center gap-1">
                Connected
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="bg-white border border-gray-200 text-center cursor-pointer hover:shadow-lg transition-all duration-200 group"
            onClick={() => handleMetricClick('Pending')}
          >
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-yellow-600 mb-2 group-hover:text-blue-600 transition-colors">
                {pendingMatches.length}
              </div>
              <div className="text-gray-600 flex items-center justify-center gap-1">
                Pending
                <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matches List */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold text-gray-900">
              All Matches
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex space-x-4 p-6">
                    <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : allMatches.length === 0 ? (
              <div className="text-center py-12">
                <User className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">No matches yet</h3>
                <p className="text-gray-500 mb-4">Start discovering new connections to see your matches here.</p>
                <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Link href="/discover">Discover Matches</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {allMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-start space-x-6 p-6 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors bg-white"
                  >
                    {/* Profile Image - Clickable */}
                    <Link href={`/profile-detail?userId=${match.matchedUserId}`}>
                      <Avatar className="w-20 h-20 border-2 border-gray-200 cursor-pointer hover:border-blue-400 transition-colors">
                        <AvatarImage 
                          src={match.matchedUser.profileImageUrl || ""} 
                          alt={`${match.matchedUser.firstName} ${match.matchedUser.lastName}`} 
                        />
                        <AvatarFallback className="bg-gray-300 text-gray-700 text-lg font-semibold">
                          {match.matchedUser.firstName?.[0]}{match.matchedUser.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    
                    {/* Profile Information */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <Link href={`/profile-detail?userId=${match.matchedUserId}`}>
                            <h4 className="text-xl font-semibold text-gray-900 mb-1 cursor-pointer hover:text-blue-600 transition-colors">
                              {match.matchedUser.firstName} {match.matchedUser.lastName}
                            </h4>
                          </Link>
                          {match.matchedUser.title && (
                            <div className="flex items-center text-gray-700 mb-1">
                              <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                              <span className="font-medium">{match.matchedUser.title}</span>
                              {match.matchedUser.company && (
                                <span className="text-gray-600"> at {match.matchedUser.company}</span>
                              )}
                            </div>
                          )}
                          {match.matchedUser.location && (
                            <div className="flex items-center text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                              <span>{match.matchedUser.location}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge className={getStatusColor(match.status)}>
                            {getStatusText(match.status)}
                          </Badge>
                          <Link href={`/match-analysis?matchId=${match.id}`}>
                            <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50 cursor-pointer hover:bg-blue-100 transition-colors">
                              {match.matchScore}% Match
                            </Badge>
                          </Link>
                        </div>
                      </div>
                      
                      {/* Bio Preview */}
                      {match.matchedUser.bio && (
                        <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                          {match.matchedUser.bio}
                        </p>
                      )}

                      {/* Networking Goals */}
                      {match.matchedUser.networkingGoal && (
                        <div className="flex items-start mb-3">
                          <Target className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {match.matchedUser.networkingGoal}
                          </p>
                        </div>
                      )}
                      
                      {/* Skills and Industries */}
                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {match.matchedUser.skills?.slice(0, 3).map((skill, index) => (
                            <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                              {skill}
                            </Badge>
                          ))}
                          {match.matchedUser.industries?.slice(0, 2).map((industry, index) => (
                            <Badge key={index} variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">
                              {industry}
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Action Buttons */}
                        <div className="flex space-x-2">
                          {match.status === 'connected' ? (
                            <>
                              <Button
                                asChild
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                              >
                                <Link href={`/messages?user=${match.matchedUserId}`}>
                                  <MessageSquare className="w-4 h-4 mr-1" />
                                  Message
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-300 text-gray-700 hover:bg-gray-50"
                                onClick={() => handleScheduleClick(match)}
                              >
                                <Calendar className="w-4 h-4 mr-1" />
                                Schedule
                              </Button>
                            </>
                          ) : match.status === 'pending' ? (
                            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                              Connection Pending
                            </Badge>
                          ) : (
                            <Link href={`/connect-request?userId=${match.matchedUserId}&matchId=${match.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-300 text-blue-700 hover:bg-blue-50"
                              >
                                Connect
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Drill-down Dialog */}
        <Dialog open={drillDownDialog} onOpenChange={setDrillDownDialog}>
          <DialogContent className="max-w-2xl bg-white">
            <DialogHeader>
              <DialogTitle className="text-gray-900">{drillDownType} Details</DialogTitle>
              <DialogDescription className="text-gray-600">
                Detailed breakdown of your {drillDownType.toLowerCase()}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto">
              {drillDownData.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No data available</p>
              ) : (
                <div className="space-y-3">
                  {drillDownData.map((item, index) => (
                    <Link key={index} href={`/profile-detail?userId=${item.matchedUserId}`}>
                      <div className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={item.matchedUser?.profileImageUrl || ""} />
                          <AvatarFallback className="bg-gray-300 text-gray-700">
                            {item.matchedUser?.firstName?.[0]}{item.matchedUser?.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">
                            {item.matchedUser?.firstName} {item.matchedUser?.lastName}
                          </p>
                          <p className="text-sm text-gray-600">{item.matchedUser?.title}</p>
                        </div>
                        <Badge className={getStatusColor(item.status)}>
                          {getStatusText(item.status)}
                        </Badge>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Schedule Meeting Dialog */}
        <Dialog open={scheduleDialog} onOpenChange={setScheduleDialog}>
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-gray-900">Schedule Meeting</DialogTitle>
              <DialogDescription className="text-gray-600">
                Request a meeting with {selectedMatch?.matchedUser.firstName} {selectedMatch?.matchedUser.lastName}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="date" className="text-gray-700">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={scheduleData.date}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, date: e.target.value }))}
                  className="border-gray-300 focus:border-blue-500"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div>
                <Label htmlFor="time" className="text-gray-700">Time</Label>
                <Input
                  id="time"
                  type="time"
                  value={scheduleData.time}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, time: e.target.value }))}
                  className="border-gray-300 focus:border-blue-500"
                />
              </div>
              <div>
                <Label htmlFor="message" className="text-gray-700">Message (Optional)</Label>
                <Textarea
                  id="message"
                  placeholder="Add a note about the meeting purpose..."
                  value={scheduleData.message}
                  onChange={(e) => setScheduleData(prev => ({ ...prev, message: e.target.value }))}
                  className="border-gray-300 focus:border-blue-500"
                  rows={3}
                />
              </div>
              <div className="flex space-x-2 pt-2">
                <Button
                  onClick={handleScheduleSubmit}
                  disabled={scheduleMeetingMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {scheduleMeetingMutation.isPending ? "Sending..." : "Send Request"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setScheduleDialog(false)}
                  className="border-gray-300 text-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}