import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Brain, MessageSquare, Calendar, MapPin, Building, Target, Users, Lightbulb } from "lucide-react";
import { useState } from "react";

interface MatchCardProps {
  match: {
    id: string;
    matchScore: number;
    status: string;
    aiAnalysis?: string;
    compatibilityFactors?: {
      personalityAlignment: number;
      goalsSynergy: number;
      communicationCompatibility: number;
      collaborationPotential: number;
      networkingStyleMatch: number;
      geographicAlignment: number;
      industryRelevance: number;
    };
    recommendedTopics?: string[];
    mutualGoals?: string[];
    collaborationPotential?: string;
    meetingSuggestions?: {
      format: string;
      duration: string;
      suggestedAgenda: string[];
      idealLocation?: string;
    };
    matchedUser: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      title: string | null;
      company: string | null;
      bio: string | null;
      location: string | null;
      industries: string[] | null;
      skills: string[] | null;
      profileImageUrl?: string | null;
    };
  };
  onConnect: (matchId: string) => void;
  onPass: (matchId: string) => void;
  onViewAnalysis?: (matchId: string) => void;
}

export function MatchCard({ match, onConnect, onPass, onViewAnalysis }: MatchCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const { matchedUser, matchScore, compatibilityFactors, recommendedTopics, mutualGoals, collaborationPotential, meetingSuggestions } = match;

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 80) return "text-blue-600";
    if (score >= 70) return "text-yellow-600";
    return "text-gray-600";
  };

  const getCollaborationIcon = (type: string) => {
    switch (type) {
      case 'investment': return <Target className="w-4 h-4" />;
      case 'partnership': return <Users className="w-4 h-4" />;
      case 'mentorship': return <Brain className="w-4 h-4" />;
      case 'knowledge-exchange': return <Lightbulb className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  return (
    <Card className="bg-stak-black border border-stak-gray hover:border-stak-copper transition-all duration-300">
      <CardHeader className="pb-3 p-3 lg:p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-stak-copper/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-stak-copper font-semibold text-sm lg:text-lg">
                {matchedUser.firstName?.[0] || 'U'}{matchedUser.lastName?.[0] || ''}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base lg:text-lg font-semibold text-stak-white truncate">
                {matchedUser.firstName || 'Unknown'} {matchedUser.lastName || 'User'}
              </h3>
              {matchedUser.title && <p className="text-xs lg:text-sm text-stak-light-gray truncate">{matchedUser.title}</p>}
              {matchedUser.company && (
                <p className="text-xs lg:text-sm text-stak-light-gray flex items-center truncate">
                  <Building className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">{matchedUser.company}</span>
                </p>
              )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-xl lg:text-2xl font-bold ${getScoreColor(matchScore)}`}>
              {matchScore}%
            </div>
            <p className="text-xs text-stak-light-gray">Match Score</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3 lg:space-y-4 p-3 lg:p-6">
        {/* Location and Industries */}
        {matchedUser.location && (
          <div className="flex items-center space-x-4 text-xs lg:text-sm text-stak-light-gray">
            <div className="flex items-center">
              <MapPin className="w-3 h-3 mr-1" />
              <span className="truncate">{matchedUser.location}</span>
            </div>
          </div>
        )}

        {/* Industries and Skills */}
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1">
            {matchedUser.industries?.slice(0, window.innerWidth < 640 ? 2 : 3).map((industry, index) => (
              <Badge key={index} variant="outline" className="text-xs border-stak-copper text-stak-copper">
                {industry}
              </Badge>
            ))}
          </div>
        </div>

        {/* Bio */}
        {matchedUser.bio && (
          <div className="bg-stak-gray/30 rounded-lg p-3 border border-stak-gray/50">
            <p className="text-xs lg:text-sm text-stak-light-gray leading-relaxed line-clamp-2 lg:line-clamp-3">
              {matchedUser.bio}
            </p>
          </div>
        )}

        {/* AI Insights */}
        {compatibilityFactors && (
          <div className="bg-stak-gray/50 rounded-lg p-3 space-y-2">
            <div className="flex items-center space-x-2 text-stak-copper text-sm font-medium">
              <Brain className="w-4 h-4" />
              <span>AI Compatibility Analysis</span>
            </div>
            
            {showDetails ? (
              <div className="space-y-2">
                {Object.entries(compatibilityFactors).map(([factor, score]) => (
                  <div key={factor} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-stak-light-gray capitalize">
                        {factor.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <span className="text-stak-copper">{score}%</span>
                    </div>
                    <Progress value={score} className="h-1" />
                  </div>
                ))}
                
                {/* Collaboration Potential */}
                {collaborationPotential && (
                  <div className="flex items-center space-x-2 mt-3 p-2 bg-stak-black/50 rounded">
                    {getCollaborationIcon(collaborationPotential)}
                    <span className="text-sm text-stak-white capitalize">
                      {collaborationPotential.replace('-', ' ')} Opportunity
                    </span>
                  </div>
                )}

                {/* Mutual Goals */}
                {mutualGoals && mutualGoals.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-stak-copper font-medium mb-1">Shared Interests:</p>
                    <div className="flex flex-wrap gap-1">
                      {mutualGoals.slice(0, 3).map((goal, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-stak-copper/20 text-stak-copper">
                          {goal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Topics */}
                {recommendedTopics && recommendedTopics.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-stak-copper font-medium mb-1">Conversation Starters:</p>
                    <div className="space-y-1">
                      {recommendedTopics.slice(0, 2).map((topic, index) => (
                        <p key={index} className="text-xs text-stak-light-gray">• {topic}</p>
                      ))}
                    </div>
                  </div>
                )}

                {/* Meeting Suggestion */}
                {meetingSuggestions && (
                  <div className="mt-3 p-2 bg-stak-copper/10 rounded">
                    <div className="flex items-center space-x-2 mb-1">
                      <Calendar className="w-3 h-3 text-stak-copper" />
                      <span className="text-xs text-stak-copper font-medium">
                        Suggested Meeting: {meetingSuggestions.format} ({meetingSuggestions.duration})
                      </span>
                    </div>
                    {meetingSuggestions.idealLocation && (
                      <p className="text-xs text-stak-light-gray">
                        📍 {meetingSuggestions.idealLocation}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(true)}
                className="text-stak-copper hover:bg-stak-copper/10 w-full"
              >
                View AI Analysis
              </Button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2 pt-2">
          <Button
            onClick={() => onConnect(match.id)}
            className="flex-1 bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium text-sm"
            size={window.innerWidth < 640 ? "sm" : "default"}
          >
            <MessageSquare className="w-3 h-3 lg:w-4 lg:h-4 mr-1 lg:mr-2" />
            <span className="hidden sm:inline">Connect</span>
            <span className="sm:hidden">✓</span>
          </Button>
          <Button
            onClick={() => onPass(match.id)}
            variant="outline"
            className="border-stak-gray text-stak-light-gray hover:bg-stak-gray text-sm px-3 lg:px-4"
            size={window.innerWidth < 640 ? "sm" : "default"}
          >
            <span className="hidden sm:inline">Pass</span>
            <span className="sm:hidden">✗</span>
          </Button>
          {showDetails && onViewAnalysis && (
            <Button
              onClick={() => onViewAnalysis(match.id)}
              variant="ghost"
              size="sm"
              className="text-stak-copper px-2 lg:px-3"
            >
              <Brain className="w-3 h-3 lg:w-4 lg:h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}