import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Sliders } from "lucide-react";
import MatchCard from "@/components/MatchCard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Match, User } from "@shared/schema";

export default function Discover() {
  const [filters, setFilters] = useState({
    venturCapital: true,
    startupFounders: true,
    corporateInnovation: false,
    angelInvestors: false,
  });

  const { toast } = useToast();

  const { data: matches, isLoading, refetch } = useQuery<(Match & { matchedUser: User })[]>({
    queryKey: ["/api/matches"],
  });

  const handleConnect = async (matchId: string) => {
    try {
      await apiRequest("POST", `/api/matches/${matchId}/status`, { status: "connected" });
      toast({
        title: "Connection Sent!",
        description: "Your connection request has been sent successfully.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
    }
  };

  const handlePass = async (matchId: string) => {
    try {
      await apiRequest("POST", `/api/matches/${matchId}/status`, { status: "passed" });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update match status",
        variant: "destructive",
      });
    }
  };

  const generateMatches = async () => {
    try {
      await apiRequest("POST", "/api/matches/generate", {});
      toast({
        title: "New Matches Generated!",
        description: "We've found new potential connections for you.",
      });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate new matches",
        variant: "destructive",
      });
    }
  };

  const filteredMatches = matches?.filter(match => match.status === "pending") || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-playfair font-bold text-navy mb-4">Smart Matches for You</h1>
        <p className="text-xl text-charcoal">AI-powered connections based on your professional goals and interests</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="luxury-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-playfair font-semibold text-navy">
                  Today's Recommendations
                </CardTitle>
                <Button 
                  variant="ghost" 
                  onClick={generateMatches}
                  className="text-gold hover:text-yellow-600"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex space-x-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-xl"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredMatches.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-lg mb-4">No new matches available</div>
                  <Button onClick={generateMatches} className="bg-navy hover:bg-blue-800">
                    Generate New Matches
                  </Button>
                </div>
              ) : (
                filteredMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onConnect={handleConnect}
                    onPass={handlePass}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Match Score */}
          <Card className="bg-gradient-to-br from-gold to-yellow-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-xl font-playfair font-semibold mb-4">Your AI Match Score</h3>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">94%</div>
                <p className="text-yellow-100">Profile Optimization</p>
              </div>
              <Button className="w-full mt-4 bg-white text-gold hover:bg-gray-100">
                Enhance Profile
              </Button>
            </CardContent>
          </Card>

          {/* Quick Filters */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-charcoal flex items-center">
                <Sliders className="w-5 h-5 mr-2" />
                Quick Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center space-x-3">
                <Checkbox 
                  checked={filters.venturCapital}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, venturCapital: !!checked }))
                  }
                />
                <span className="text-gray-700">Venture Capital</span>
              </label>
              <label className="flex items-center space-x-3">
                <Checkbox 
                  checked={filters.startupFounders}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, startupFounders: !!checked }))
                  }
                />
                <span className="text-gray-700">Startup Founders</span>
              </label>
              <label className="flex items-center space-x-3">
                <Checkbox 
                  checked={filters.corporateInnovation}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, corporateInnovation: !!checked }))
                  }
                />
                <span className="text-gray-700">Corporate Innovation</span>
              </label>
              <label className="flex items-center space-x-3">
                <Checkbox 
                  checked={filters.angelInvestors}
                  onCheckedChange={(checked) => 
                    setFilters(prev => ({ ...prev, angelInvestors: !!checked }))
                  }
                />
                <span className="text-gray-700">Angel Investors</span>
              </label>
            </CardContent>
          </Card>

          {/* Networking Goal */}
          <Card className="luxury-card">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-charcoal">Current Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-light-blue rounded-lg p-4">
                <p className="text-navy font-medium">Seeking Series A Funding</p>
                <p className="text-sm text-gray-600 mt-1">Target: $5M - $15M</p>
              </div>
              <Button variant="ghost" className="w-full mt-3 text-gold hover:text-yellow-600">
                Update Goal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
