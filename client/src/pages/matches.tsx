import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Calendar, User, ExternalLink, BarChart3 } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Match, User as UserType } from "@shared/schema";

export default function Matches() {
  const [drillDownDialog, setDrillDownDialog] = useState(false);
  const [drillDownType, setDrillDownType] = useState("");
  const [drillDownData, setDrillDownData] = useState<any[]>([]);

  const { data: matches, isLoading } = useQuery<(Match & { matchedUser: UserType })[]>({
    queryKey: ["/api/matches"],
  });

  const handleMetricClick = async (metricType: string) => {
    setDrillDownType(metricType);
    setDrillDownDialog(true);
    
    try {
      let data;
      switch (metricType) {
        case 'Total Matches':
          data = await apiRequest('GET', '/api/user/matches-detailed');
          break;
        case 'Connected':
          data = await apiRequest('GET', '/api/user/connections-detailed');
          break;
        case 'Pending':
          data = await apiRequest('GET', '/api/user/pending-detailed');
          break;
        default:
          data = [];
      }
      setDrillDownData(data || []);
    } catch (error) {
      console.error('Error fetching drill-down data:', error);
      setDrillDownData([]);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-prof-green text-white';
      case 'pending':
        return 'bg-gold text-navy';
      case 'passed':
        return 'bg-gray-200 text-gray-600';
      default:
        return 'bg-gray-200 text-gray-600';
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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-playfair font-bold text-navy mb-4">Your Matches</h1>
        <p className="text-xl text-charcoal">Track and manage your professional connections</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6">
        <Card 
          className="luxury-card text-center cursor-pointer hover:shadow-lg transition-all duration-200 group"
          onClick={() => handleMetricClick('Total Matches')}
        >
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-navy mb-2 group-hover:text-stak-copper transition-colors">{allMatches.length}</div>
            <div className="text-gray-600 flex items-center justify-center gap-1">
              Total Matches
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className="luxury-card text-center cursor-pointer hover:shadow-lg transition-all duration-200 group"
          onClick={() => handleMetricClick('Connected')}
        >
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-prof-green mb-2 group-hover:text-stak-copper transition-colors">{connectedMatches.length}</div>
            <div className="text-gray-600 flex items-center justify-center gap-1">
              Connected
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
        <Card 
          className="luxury-card text-center cursor-pointer hover:shadow-lg transition-all duration-200 group"
          onClick={() => handleMetricClick('Pending')}
        >
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gold mb-2 group-hover:text-stak-copper transition-colors">{pendingMatches.length}</div>
            <div className="text-gray-600 flex items-center justify-center gap-1">
              Pending
              <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Matches List */}
      <Card className="luxury-card">
        <CardHeader>
          <CardTitle className="text-2xl font-playfair font-semibold text-navy">
            All Matches
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex space-x-4 p-4">
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
              <Button asChild className="bg-navy hover:bg-blue-800">
                <Link href="/discover">Discover Matches</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {allMatches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center space-x-4 p-4 border border-gray-200 rounded-lg hover:border-gold transition-colors"
                >
                  <Avatar className="w-16 h-16">
                    <AvatarImage src={match.matchedUser.profileImageUrl || ""} alt={match.matchedUser.firstName || ""} />
                    <AvatarFallback className="bg-navy text-white">
                      {match.matchedUser.firstName?.[0]}{match.matchedUser.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-lg font-semibold text-charcoal">
                        {match.matchedUser.firstName} {match.matchedUser.lastName}
                      </h4>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(match.status)}>
                          {getStatusText(match.status)}
                        </Badge>
                        <Badge variant="outline" className="text-navy">
                          {match.matchScore}% Match
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-gold font-medium mb-1">{match.matchedUser.title}</p>
                    {match.matchedUser.company && (
                      <p className="text-sm text-gray-600 mb-2">at {match.matchedUser.company}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {match.matchedUser.industries?.slice(0, 2).map((industry, index) => (
                          <Badge key={index} variant="secondary" className="bg-light-blue text-navy">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                      
                      {match.status === 'connected' && (
                        <div className="flex space-x-2">
                          <Button
                            asChild
                            size="sm"
                            className="bg-navy hover:bg-blue-800"
                          >
                            <Link href={`/messages?user=${match.matchedUserId}`}>
                              <MessageSquare className="w-4 h-4 mr-1" />
                              Message
                            </Link>
                          </Button>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="border-gray-300"
                          >
                            <Link href="/events">
                              <Calendar className="w-4 h-4 mr-1" />
                              Schedule
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
            </div>

            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="grid grid-cols-4 gap-4 text-sm font-medium text-gray-700">
                  <div>Name</div>
                  <div>Company</div>
                  <div>Match Score</div>
                  <div>Status</div>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {drillDownData.length > 0 ? (
                  drillDownData.map((record: any, index: number) => (
                    <div key={index} className="px-4 py-3 border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                      <div className="grid grid-cols-4 gap-4 items-center text-sm">
                        <div className="text-gray-900 font-medium">
                          {record.firstName} {record.lastName}
                        </div>
                        <div className="text-gray-600">
                          {record.title} at {record.company || 'N/A'}
                        </div>
                        <div className="text-gray-600">
                          {record.matchScore || record.compatibility || 'N/A'}
                        </div>
                        <div>
                          <Badge className={getStatusColor(record.status || 'pending')}>
                            {getStatusText(record.status || 'pending')}
                          </Badge>
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
  );
}
