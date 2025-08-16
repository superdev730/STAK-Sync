import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { RefreshCw, Sliders, Brain, Zap, Users } from "lucide-react";
import { MatchCard } from "@/components/MatchCard";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Match, User } from "@shared/schema";

export default function Discover() {
  const [filters, setFilters] = useState({
    venturCapital: true,
    startupFounders: true,
    corporateInnovation: false,
    angelInvestors: false,
  });

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: matches, isLoading, refetch } = useQuery<(Match & { matchedUser: User })[]>({
    queryKey: ["/api/matches"],
  });

  const handleConnect = async (matchId: string, matchedUser: User) => {
    try {
      await apiRequest(`/api/matches/${matchId}/status`, "POST", { status: "connected" });
      toast({
        title: "Connection Sent!",
        description: "Your connection request has been sent successfully.",
      });
      refetch();
      // Navigate to messages with the connected user
      setLocation(`/messages?userId=${matchedUser.id}`);
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
      await apiRequest(`/api/matches/${matchId}/status`, "POST", { status: "passed" });
      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update match status",
        variant: "destructive",
      });
    }
  };



  const generateMatchesMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("/api/matches/generate", "POST", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "AI Matches Generated!",
        description: "Your personalized AI-powered matches are ready.",
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate AI matches",
        variant: "destructive",
      });
    }
  });

  const generateMatches = () => {
    generateMatchesMutation.mutate();
  };



  const filteredMatches = matches?.filter(match => match.status === "pending") || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-3 lg:p-6 space-y-4 lg:space-y-8">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-8 text-center shadow-sm">
          <h1 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-2 lg:mb-4">Find Signal, Cut the Noise</h1>
          <p className="text-base lg:text-xl text-slate-600 mb-4 lg:mb-6 px-2 lg:px-0">AI-powered matching for STAK's exclusive membership community</p>
          
          {/* Demo Setup */}
          <div className="flex justify-center">
            <Button 
              onClick={generateMatches}
              disabled={generateMatchesMutation.isPending}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-6 py-2"
            >
              {generateMatchesMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  <span className="hidden sm:inline">Analyzing...</span>
                  <span className="sm:hidden">...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Generate AI Matches</span>
                  <span className="sm:hidden">Find Matches</span>
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 lg:space-y-6">
            <Card className="bg-stak-black border border-stak-gray">
                <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg lg:text-2xl font-semibold text-stak-white flex items-center">
                    <Brain className="w-5 h-5 lg:w-6 lg:h-6 mr-2 text-stak-copper" />
                    <span className="hidden sm:inline">AI-Powered Recommendations</span>
                    <span className="sm:hidden">Matches</span>
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    onClick={generateMatches}
                    disabled={generateMatchesMutation.isPending}
                    className="text-stak-copper hover:bg-stak-copper/10 px-2 lg:px-3"
                    size="sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${generateMatchesMutation.isPending ? 'animate-spin' : ''} lg:mr-2`} />
                    <span className="hidden lg:inline">Refresh</span>
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
                  <div className="text-stak-light-gray text-lg mb-4">No AI matches available yet</div>
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-stak-light-gray">Click the button below to generate AI-powered matches based on your profile</p>
                  </div>
                  <div className="flex justify-center">
                    <Button 
                      onClick={generateMatches} 
                      disabled={generateMatchesMutation.isPending}
                      className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                    >
                      {generateMatchesMutation.isPending ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Brain className="w-4 h-4 mr-2" />
                          Generate AI Matches
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ) : (
                filteredMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={{
                      ...match,
                      aiAnalysis: match.aiAnalysis as string | undefined,
                      compatibilityFactors: match.compatibilityFactors as any,
                      recommendedTopics: match.recommendedTopics || [],
                      mutualGoals: match.mutualGoals || [],
                      collaborationPotential: match.collaborationPotential || '',
                      meetingSuggestions: match.meetingSuggestions as any
                    }}
                    onConnect={(matchId) => handleConnect(matchId, match.matchedUser)}
                    onPass={handlePass}
                  />
                ))
              )}
            </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 lg:space-y-6">
            {/* AI Match Score */}
            <Card className="bg-gradient-to-br from-stak-copper to-stak-dark-copper text-stak-black">
              <CardContent className="p-4 lg:p-6">
                <h3 className="text-lg lg:text-xl font-semibold mb-3 lg:mb-4 flex items-center">
                  <Zap className="w-4 h-4 lg:w-5 lg:h-5 mr-2" />
                  AI Match Engine
                </h3>
                <div className="text-center">
                  <div className="text-3xl lg:text-4xl font-bold mb-2">{matches?.length || 0}</div>
                  <p className="text-stak-black/80 text-sm lg:text-base">Active Matches</p>
                </div>
              </CardContent>
            </Card>

            {/* AI Insights */}
            <Card className="bg-stak-black border border-stak-gray">
              <CardHeader>
                <CardTitle className="text-base lg:text-lg font-semibold text-stak-white flex items-center">
                  <Brain className="w-4 h-4 lg:w-5 lg:h-5 mr-2 text-stak-copper" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 lg:space-y-4 p-3 lg:p-6">
                <div className="space-y-2 lg:space-y-3">
                  <div className="text-xs lg:text-sm text-stak-light-gray">
                    <div className="font-medium text-stak-copper mb-2">Match Quality Factors:</div>
                    <div className="space-y-1 text-xs">
                      <div>• Personality Alignment</div>
                      <div>• Goals Synergy</div>
                      <div>• Communication Compatibility</div>
                      <div>• Industry Relevance</div>
                      <div>• Geographic Alignment</div>
                    </div>
                  </div>
                  
                  <div className="text-xs lg:text-sm text-stak-light-gray">
                    <div className="font-medium text-stak-copper mb-2">Collaboration Types:</div>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline" className="text-xs border-stak-copper text-stak-copper">Investment</Badge>
                      <Badge variant="outline" className="text-xs border-stak-copper text-stak-copper">Partnership</Badge>
                      <Badge variant="outline" className="text-xs border-stak-copper text-stak-copper">Mentorship</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Match Insights */}
            <Card className="bg-stak-black border border-stak-gray">
              <CardHeader>
                <CardTitle className="text-base lg:text-lg font-semibold text-stak-white">Match Insights</CardTitle>
              </CardHeader>
              <CardContent className="p-3 lg:p-6">
                <div className="space-y-3 lg:space-y-4">
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-stak-light-gray">Quality Score</span>
                    <span className="font-semibold text-green-500">89%</span>
                  </div>
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-stak-light-gray">Total Matches</span>
                    <span className="font-semibold text-stak-white">{matches?.length || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs lg:text-sm">
                    <span className="text-stak-light-gray">AI Accuracy</span>
                    <span className="font-semibold text-stak-copper">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
