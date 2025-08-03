import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, User } from "lucide-react";
import { Link } from "wouter";
import type { Match, User as UserType } from "@shared/schema";

export default function Matches() {
  const { data: matches, isLoading } = useQuery<(Match & { matchedUser: UserType })[]>({
    queryKey: ["/api/matches"],
  });

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
        <Card className="luxury-card text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-navy mb-2">{allMatches.length}</div>
            <div className="text-gray-600">Total Matches</div>
          </CardContent>
        </Card>
        <Card className="luxury-card text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-prof-green mb-2">{connectedMatches.length}</div>
            <div className="text-gray-600">Connected</div>
          </CardContent>
        </Card>
        <Card className="luxury-card text-center">
          <CardContent className="p-6">
            <div className="text-3xl font-bold text-gold mb-2">{pendingMatches.length}</div>
            <div className="text-gray-600">Pending</div>
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
    </div>
  );
}
