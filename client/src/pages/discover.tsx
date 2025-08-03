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

  const seedUsersMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/seed-users", {}),
    onSuccess: () => {
      toast({
        title: "Sample Users Created!",
        description: "Demo users have been added to the platform.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create sample users",
        variant: "destructive",
      });
    }
  });

  const generateMatchesMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/matches/generate", {}),
    onSuccess: () => {
      toast({
        title: "AI Matches Generated!",
        description: "Your personalized AI-powered matches are ready.",
      });
      refetch();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate AI matches",
        variant: "destructive",
      });
    }
  });

  const generateMatches = () => {
    generateMatchesMutation.mutate();
  };

  const seedUsers = () => {
    seedUsersMutation.mutate();
  };

  const filteredMatches = matches?.filter(match => match.status === "pending") || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-stak-white mb-4">Find Signal, Cut the Noise</h1>
        <p className="text-xl text-stak-light-gray mb-6">AI-powered matching for STAK's exclusive membership community</p>
        
        {/* Demo Setup */}
        <div className="flex justify-center space-x-4 mb-8">
          <Button 
            onClick={seedUsers}
            disabled={seedUsersMutation.isPending}
            className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium"
          >
            {seedUsersMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Users className="w-4 h-4 mr-2" />
                Create Demo Members
              </>
            )}
          </Button>
          <Button 
            onClick={generateMatches}
            disabled={generateMatchesMutation.isPending}
            className="bg-stak-black border border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-stak-black font-medium"
          >
            {generateMatchesMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
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

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-stak-black border border-stak-gray">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl font-semibold text-stak-white flex items-center">
                  <Brain className="w-6 h-6 mr-2 text-stak-copper" />
                  AI-Powered Recommendations
                </CardTitle>
                <Button 
                  variant="ghost" 
                  onClick={generateMatches}
                  disabled={generateMatchesMutation.isPending}
                  className="text-stak-copper hover:bg-stak-copper/10"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${generateMatchesMutation.isPending ? 'animate-spin' : ''}`} />
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
                  <div className="text-stak-light-gray text-lg mb-4">No AI matches available yet</div>
                  <div className="space-y-2 mb-6">
                    <p className="text-sm text-stak-light-gray">First create demo members, then generate AI-powered matches</p>
                  </div>
                  <div className="space-x-2">
                    <Button onClick={seedUsers} variant="outline" className="border-stak-copper text-stak-copper">
                      <Users className="w-4 h-4 mr-2" />
                      Create Demo Members
                    </Button>
                    <Button onClick={generateMatches} className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black">
                      <Brain className="w-4 h-4 mr-2" />
                      Generate AI Matches
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
          <Card className="bg-gradient-to-br from-stak-copper to-stak-dark-copper text-stak-black">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4 flex items-center">
                <Zap className="w-5 h-5 mr-2" />
                AI Match Engine
              </h3>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2">{matches?.length || 0}</div>
                <p className="text-stak-black/80">Active Matches</p>
              </div>
              <Button 
                className="w-full mt-4 bg-stak-black text-stak-copper hover:bg-stak-gray"
                onClick={() => window.open('/api/matches/analytics', '_blank')}
              >
                <Brain className="w-4 h-4 mr-2" />
                View Analytics
              </Button>
            </CardContent>
          </Card>

          {/* AI Insights */}
          <Card className="bg-stak-black border border-stak-gray">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stak-white flex items-center">
                <Brain className="w-5 h-5 mr-2 text-stak-copper" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="text-sm text-stak-light-gray">
                  <div className="font-medium text-stak-copper mb-2">Match Quality Factors:</div>
                  <div className="space-y-1 text-xs">
                    <div>• Personality Alignment</div>
                    <div>• Goals Synergy</div>
                    <div>• Communication Compatibility</div>
                    <div>• Industry Relevance</div>
                    <div>• Geographic Alignment</div>
                  </div>
                </div>
                
                <div className="text-sm text-stak-light-gray">
                  <div className="font-medium text-stak-copper mb-2">Collaboration Types:</div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs border-stak-copper text-stak-copper">Investment</Badge>
                    <Badge variant="outline" className="text-xs border-stak-copper text-stak-copper">Partnership</Badge>
                    <Badge variant="outline" className="text-xs border-stak-copper text-stak-copper">Mentorship</Badge>
                  </div>
                </div>
              </div>
              
              <Button className="w-full bg-stak-copper hover:bg-stak-dark-copper text-stak-black">
                Analyze My Profile
              </Button>
            </CardContent>
          </Card>

          {/* Match Insights */}
          <Card className="bg-stak-black border border-stak-gray">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-stak-white">Match Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span className="text-stak-light-gray">Quality Score</span>
                  <span className="font-semibold text-green-500">89%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stak-light-gray">Total Matches</span>
                  <span className="font-semibold text-stak-white">{matches?.length || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-stak-light-gray">AI Accuracy</span>
                  <span className="font-semibold text-stak-copper">94%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
