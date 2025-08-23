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
    console.log('Connecting to user:', { matchId, matchedUser: `${matchedUser.firstName} ${matchedUser.lastName}`, userId: matchedUser.id });
    try {
      await apiRequest(`/api/matches/${matchId}/status`, "POST", { status: "connected" });
      toast({
        title: "Connection Sent!",
        description: "Your connection request has been sent successfully.",
      });
      refetch();
      // Navigate to messages with the connected user
      console.log('Navigating to messages with userId:', matchedUser.id);
      setLocation(`/messages?userId=${matchedUser.id}`);
    } catch (error) {
      console.error('Connection error:', error);
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
          <h1 className="text-2xl lg:text-4xl font-bold text-slate-900 mb-2 lg:mb-4">Get in Sync, Cut the Noise</h1>
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
            <CardContent className="p-0">
              {isLoading ? (
                <div className="space-y-2 p-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="flex items-center space-x-4 p-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-8 w-16 bg-gray-200 rounded"></div>
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
                <div className="divide-y divide-stak-gray/30">
                  {filteredMatches.map((match, index) => {
                    const { matchedUser, matchScore } = match;
                    
                    // Generate engagement tags based on user data
                    const getEngagementTags = (user: typeof matchedUser) => {
                      const tags = [];
                      
                      // Industry-based tags
                      if (user.industries?.some(ind => ind.toLowerCase().includes('venture') || ind.toLowerCase().includes('vc'))) {
                        tags.push('VC');
                      }
                      if (user.industries?.some(ind => ind.toLowerCase().includes('invest'))) {
                        tags.push('Investor');
                      }
                      if (user.title?.toLowerCase().includes('founder') || user.title?.toLowerCase().includes('ceo')) {
                        tags.push('Founder');
                      }
                      if (user.title?.toLowerCase().includes('cto') || user.title?.toLowerCase().includes('engineer')) {
                        tags.push('Tech Leader');
                      }
                      if (user.industries?.some(ind => ind.toLowerCase().includes('market') || ind.toLowerCase().includes('sales'))) {
                        tags.push('GTM Specialist');
                      }
                      if (user.industries?.some(ind => ind.toLowerCase().includes('community') || ind.toLowerCase().includes('network'))) {
                        tags.push('Community Builder');
                      }
                      if (user.bio?.toLowerCase().includes('exit') || user.bio?.toLowerCase().includes('acquisition')) {
                        tags.push('Prior Exits');
                      }
                      if (user.industries?.some(ind => ind.toLowerCase().includes('advisor') || ind.toLowerCase().includes('mentor'))) {
                        tags.push('Advisor');
                      }
                      
                      // Default tags if none found
                      if (tags.length === 0) {
                        if (user.industries?.length) {
                          tags.push(user.industries[0]);
                        }
                        if (user.skills?.length) {
                          tags.push(user.skills[0]);
                        }
                      }
                      
                      return tags.slice(0, 3); // Limit to 3 tags
                    };

                    const getScoreColor = (score: number) => {
                      if (score >= 90) return "text-green-400";
                      if (score >= 80) return "text-blue-400";
                      if (score >= 70) return "text-yellow-400";
                      return "text-gray-400";
                    };

                    const engagementTags = getEngagementTags(matchedUser);

                    return (
                      <div 
                        key={match.id} 
                        className="flex items-center justify-between p-4 hover:bg-stak-gray/20 transition-colors group cursor-pointer"
                        data-testid={`match-row-${index}`}
                        onClick={() => handleConnect(match.id, matchedUser)}
                      >
                        {/* Left side - User info */}
                        <div className="flex items-center space-x-4 flex-1 min-w-0">
                          {/* Avatar */}
                          <div className="w-10 h-10 bg-stak-copper/20 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-stak-copper font-semibold text-sm">
                              {matchedUser.firstName?.[0] || 'U'}{matchedUser.lastName?.[0] || ''}
                            </span>
                          </div>
                          
                          {/* User details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-base font-semibold text-stak-white truncate">
                                {matchedUser.firstName || 'Unknown'} {matchedUser.lastName || 'User'}
                              </h3>
                              {/* Match Score Badge */}
                              <Badge className={`${getScoreColor(matchScore)} bg-transparent border text-xs font-bold`} data-testid={`score-${index}`}>
                                {matchScore}%
                              </Badge>
                            </div>
                            
                            {/* Title and Company */}
                            <div className="flex items-center space-x-1 text-sm text-stak-light-gray truncate mt-1">
                              {matchedUser.title && (
                                <span className="truncate" data-testid={`title-${index}`}>{matchedUser.title}</span>
                              )}
                              {matchedUser.title && matchedUser.company && (
                                <span>•</span>
                              )}
                              {matchedUser.company && (
                                <span className="truncate" data-testid={`company-${index}`}>{matchedUser.company}</span>
                              )}
                            </div>
                            
                            {/* Engagement Tags */}
                            <div className="flex flex-wrap gap-1 mt-2">
                              {engagementTags.map((tag, tagIndex) => (
                                <Badge 
                                  key={tagIndex} 
                                  variant="outline" 
                                  className="text-xs border-stak-copper/50 text-stak-copper bg-stak-copper/10 px-2 py-0"
                                  data-testid={`tag-${index}-${tagIndex}`}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Button
                            size="sm"
                            className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-connect-${index}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleConnect(match.id, matchedUser);
                            }}
                          >
                            Connect
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-stak-gray/50 text-stak-light-gray hover:bg-stak-gray/20 opacity-0 group-hover:opacity-100 transition-opacity"
                            data-testid={`button-pass-${index}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePass(match.id);
                            }}
                          >
                            Pass
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
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
