import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RefreshCw, Sliders, Brain, Zap, Users, Search, Sparkles } from "lucide-react";
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

  const [aiSearchQuery, setAiSearchQuery] = useState("");
  const [aiFilteredMatches, setAiFilteredMatches] = useState<(Match & { matchedUser: User })[]>([]);
  const [isAiSearching, setIsAiSearching] = useState(false);
  const [aiResponse, setAiResponse] = useState<string>("");

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

  const aiSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("/api/matches/ai-search", "POST", { query });
      return response.json();
    },
    onSuccess: (data: { filteredMatches?: (Match & { matchedUser: User })[]; response: string; needsClarification: boolean }) => {
      setAiResponse(data.response);
      if (data.filteredMatches) {
        setAiFilteredMatches(data.filteredMatches);
      }
      if (!data.needsClarification) {
        toast({
          title: "AI Search Complete",
          description: `Found ${data.filteredMatches?.length || 0} matches`,
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to perform AI search",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsAiSearching(false);
    },
  });

  const handleAiSearch = async () => {
    if (!aiSearchQuery.trim()) return;
    
    setIsAiSearching(true);
    await aiSearchMutation.mutateAsync(aiSearchQuery);
  };

  const handleClearAiSearch = () => {
    setAiSearchQuery("");
    setAiFilteredMatches([]);
    setAiResponse("");
  };

  const filteredMatches = matches?.filter(match => match.status === "pending") || [];
  const displayMatches = aiFilteredMatches.length > 0 ? aiFilteredMatches : filteredMatches;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-3 lg:p-4 space-y-3 lg:space-y-4">
        {/* Condensed Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center shadow-sm">
          <h1 className="text-xl lg:text-2xl font-bold text-slate-900 mb-2">Find Great Matches</h1>
          <div className="flex justify-center">
            <Button 
              onClick={generateMatches}
              disabled={generateMatchesMutation.isPending}
              className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium px-4 py-2"
              size="sm"
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

        <div className="grid lg:grid-cols-4 gap-3 lg:gap-4">
          {/* Main Content - Much Wider */}
          <div className="lg:col-span-3 space-y-3">
            <Card className="bg-stak-black border border-stak-gray">
              <CardHeader className="pb-3 p-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base lg:text-lg font-semibold text-stak-white flex items-center">
                    <Users className="w-4 h-4 mr-2 text-stak-copper" />
                    Your Matches ({displayMatches.length})
                  </CardTitle>
                  <Button 
                    variant="ghost" 
                    onClick={generateMatches}
                    disabled={generateMatchesMutation.isPending}
                    className="text-stak-copper hover:bg-stak-copper/10 px-2"
                    size="sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${generateMatchesMutation.isPending ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              
              {/* AI Search Bar */}
              <div className="px-4 pb-3">
                <div className="flex gap-2 items-center">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Describe who you're looking for... (e.g., VC looking for fintech startups, founder with prior exits)"
                      value={aiSearchQuery}
                      onChange={(e) => setAiSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-2 border-stak-gray/30 focus:border-stak-copper text-sm"
                      onKeyPress={(e) => e.key === 'Enter' && handleAiSearch()}
                    />
                  </div>
                  <Button
                    onClick={handleAiSearch}
                    disabled={isAiSearching || !aiSearchQuery.trim()}
                    className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium px-3 py-2"
                    size="sm"
                  >
                    {isAiSearching ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </Button>
                  {(aiFilteredMatches.length > 0 || aiResponse) && (
                    <Button
                      onClick={handleClearAiSearch}
                      variant="outline"
                      size="sm"
                      className="border-stak-gray/30 text-stak-light-gray hover:bg-stak-gray/20 px-3 py-2"
                    >
                      Clear
                    </Button>
                  )}
                </div>
                
                {/* AI Response */}
                {aiResponse && (
                  <div className="mt-3 p-3 bg-stak-copper/10 rounded-lg border border-stak-copper/20">
                    <div className="flex items-start gap-2">
                      <Brain className="w-4 h-4 text-stak-copper mt-0.5 flex-shrink-0" />
                      <div className="text-sm text-stak-white leading-relaxed">
                        {aiResponse}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
            <CardContent className="p-3">
              {isLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="animate-pulse bg-stak-gray/20 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                          <div className="h-4 bg-gray-300 rounded w-32 mb-1"></div>
                          <div className="h-3 bg-gray-300 rounded w-24"></div>
                        </div>
                        <div className="w-16 text-right">
                          <div className="h-6 bg-gray-300 rounded w-12 ml-auto"></div>
                        </div>
                        <div className="w-20">
                          <div className="h-8 bg-gray-300 rounded w-full"></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : displayMatches.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-stak-light-gray text-base mb-3">No matches available</div>
                  <Button 
                    onClick={generateMatches} 
                    disabled={generateMatchesMutation.isPending}
                    className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                    size="sm"
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
              ) : (
                <div className="space-y-2">
                  {displayMatches.map((match, index) => {
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
                      
                      return tags.slice(0, 2); // Limit to 2 tags for compact view
                    };

                    const getScoreColor = (score: number) => {
                      if (score >= 90) return "text-green-400 border-green-400";
                      if (score >= 80) return "text-blue-400 border-blue-400";
                      if (score >= 70) return "text-yellow-400 border-yellow-400";
                      return "text-gray-400 border-gray-400";
                    };

                    const engagementTags = getEngagementTags(matchedUser);

                    return (
                      <Card 
                        key={match.id} 
                        className="bg-stak-gray/10 border-stak-gray/30 hover:border-stak-copper/50 transition-all hover:scale-[1.02] cursor-pointer group"
                        data-testid={`match-card-${index}`}
                        onClick={() => handleConnect(match.id, matchedUser)}
                      >
                        <CardContent className="p-3">
                          {/* Header with avatar, name and score */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2 flex-1 min-w-0">
                              <div className="w-8 h-8 bg-stak-copper/20 rounded-full flex items-center justify-center flex-shrink-0">
                                <span className="text-stak-copper font-semibold text-xs">
                                  {matchedUser.firstName?.[0] || 'U'}{matchedUser.lastName?.[0] || ''}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-semibold text-stak-white truncate">
                                  {matchedUser.firstName || 'Unknown'} {matchedUser.lastName || 'User'}
                                </h3>
                              </div>
                            </div>
                            <Badge className={`${getScoreColor(matchScore)} bg-transparent text-xs font-bold px-2`} data-testid={`score-${index}`}>
                              {matchScore}%
                            </Badge>
                          </div>
                          
                          {/* Title and Company */}
                          <div className="text-xs text-stak-light-gray mb-2 min-h-[2.5rem]">
                            {matchedUser.title && (
                              <div className="font-medium truncate" data-testid={`title-${index}`}>{matchedUser.title}</div>
                            )}
                            {matchedUser.company && (
                              <div className="truncate" data-testid={`company-${index}`}>{matchedUser.company}</div>
                            )}
                          </div>
                          
                          {/* Engagement Tags */}
                          <div className="flex flex-wrap gap-1 mb-3 min-h-[1.5rem]">
                            {engagementTags.map((tag, tagIndex) => (
                              <Badge 
                                key={tagIndex} 
                                variant="outline" 
                                className="text-xs border-stak-copper/50 text-stak-copper bg-stak-copper/10 px-1.5 py-0 h-5"
                                data-testid={`tag-${index}-${tagIndex}`}
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              className="flex-1 bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium h-7 text-xs"
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
                              className="border-stak-gray/50 text-stak-light-gray hover:bg-stak-gray/20 h-7 text-xs px-3"
                              data-testid={`button-pass-${index}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePass(match.id);
                              }}
                            >
                              Pass
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
            </Card>
          </div>

          {/* Compact Sidebar */}
          <div className="space-y-3">
            {/* Match Stats */}
            <Card className="bg-gradient-to-br from-stak-copper to-stak-dark-copper text-stak-black">
              <CardContent className="p-3 text-center">
                <div className="text-2xl font-bold mb-1">{matches?.length || 0}</div>
                <p className="text-stak-black/80 text-xs">Active Matches</p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-stak-black border border-stak-gray">
              <CardHeader className="pb-2 p-3">
                <CardTitle className="text-sm font-semibold text-stak-white flex items-center">
                  <Brain className="w-3 h-3 mr-1 text-stak-copper" />
                  AI Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-stak-light-gray">Quality</span>
                    <span className="font-semibold text-green-400">89%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-stak-light-gray">Accuracy</span>
                    <span className="font-semibold text-stak-copper">94%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Collaboration Types */}
            <Card className="bg-stak-black border border-stak-gray">
              <CardHeader className="pb-2 p-3">
                <CardTitle className="text-sm font-semibold text-stak-white">Types</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="flex flex-wrap gap-1">
                  <Badge variant="outline" className="text-xs border-stak-copper/50 text-stak-copper bg-stak-copper/10">Investment</Badge>
                  <Badge variant="outline" className="text-xs border-stak-copper/50 text-stak-copper bg-stak-copper/10">Partnership</Badge>
                  <Badge variant="outline" className="text-xs border-stak-copper/50 text-stak-copper bg-stak-copper/10">Mentorship</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
