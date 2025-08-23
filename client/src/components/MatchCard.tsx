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
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Avatar and Info - Fixed Width */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-stak-copper/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-stak-copper font-semibold text-lg">
                {matchedUser.firstName?.[0] || 'U'}{matchedUser.lastName?.[0] || ''}
              </span>
            </div>
            
            {/* Name and Title - Flexible Width */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-stak-white truncate mb-0.5">
                {matchedUser.firstName || 'Unknown'} {matchedUser.lastName || 'User'}
              </h3>
              <div className="flex items-center gap-2 text-sm text-stak-light-gray">
                {matchedUser.title && (
                  <span className="truncate">{matchedUser.title}</span>
                )}
                {matchedUser.company && matchedUser.title && (
                  <span>•</span>
                )}
                {matchedUser.company && (
                  <span className="truncate">{matchedUser.company}</span>
                )}
              </div>
              
              {/* Industries */}
              {matchedUser.industries && matchedUser.industries.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {matchedUser.industries.slice(0, 2).map((industry, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-stak-copper/50 text-stak-copper">
                      {industry}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Match Score - Fixed Width */}
          <div className="text-right w-16 flex-shrink-0">
            <div className={`text-2xl font-bold ${getScoreColor(matchScore)}`}>
              {matchScore}%
            </div>
            <p className="text-xs text-stak-light-gray">Sync</p>
          </div>

          {/* Action Buttons - Fixed Width */}
          <div className="flex gap-2 w-20 flex-shrink-0">
            <Button
              onClick={() => {
                console.log('MatchCard Connect clicked:', { 
                  matchId: match.id, 
                  matchedUser: `${match.matchedUser.firstName} ${match.matchedUser.lastName}`,
                  userId: match.matchedUser.id 
                });
                onConnect(match.id);
              }}
              className="flex-1 bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium"
              size="sm"
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            
            {showDetails ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(false)}
                className="text-stak-light-gray hover:bg-stak-gray/20"
              >
                <span className="text-xs">−</span>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(true)}
                className="text-stak-light-gray hover:bg-stak-gray/20"
              >
                <span className="text-xs">+</span>
              </Button>
            )}
          </div>
        </div>

        {/* Expandable Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-stak-gray/30 space-y-3">
            {/* Bio */}
            {matchedUser.bio && (
              <div className="bg-stak-gray/20 rounded-lg p-3">
                <p className="text-sm text-stak-light-gray leading-relaxed">
                  {matchedUser.bio}
                </p>
              </div>
            )}
            
            {/* Location */}
            {matchedUser.location && (
              <div className="flex items-center text-sm text-stak-light-gray">
                <MapPin className="w-4 h-4 mr-2 text-stak-copper" />
                <span>{matchedUser.location}</span>
              </div>
            )}

            {/* AI Insights */}
            {compatibilityFactors && (
              <div className="bg-stak-copper/10 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-stak-copper text-sm font-medium mb-2">
                  <Brain className="w-4 h-4" />
                  <span>AI Analysis</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(compatibilityFactors).slice(0, 4).map(([factor, score]) => (
                    <div key={factor} className="flex justify-between">
                      <span className="text-stak-light-gray capitalize">
                        {factor.replace(/([A-Z])/g, ' $1').trim().slice(0, 15)}...
                      </span>
                      <span className="text-stak-copper font-medium">{score}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => onPass(match.id)}
                variant="outline"
                size="sm"
                className="flex-1 border-stak-gray text-stak-light-gray hover:bg-stak-gray/20"
              >
                Pass
              </Button>
              {onViewAnalysis && (
                <Button
                  onClick={() => onViewAnalysis(match.id)}
                  variant="ghost"
                  size="sm"
                  className="text-stak-copper hover:bg-stak-copper/10"
                >
                  <Brain className="w-4 h-4 mr-1" />
                  Details
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}