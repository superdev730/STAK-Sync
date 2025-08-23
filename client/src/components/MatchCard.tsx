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

  // Debug logging
  console.log('MatchCard rendering:', {
    matchId: match.id,
    userName: `${matchedUser.firstName} ${matchedUser.lastName}`,
    title: matchedUser.title,
    company: matchedUser.company,
    bio: matchedUser.bio ? `${matchedUser.bio.substring(0, 50)}...` : 'No bio',
    industries: matchedUser.industries
  });

  return (
    <Card className="bg-stak-black border border-stak-gray hover:border-stak-copper transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4">
          {/* Avatar and Info */}
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            <div className="w-12 h-12 bg-stak-copper/20 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-stak-copper font-semibold text-lg">
                {matchedUser.firstName?.[0] || 'U'}{matchedUser.lastName?.[0] || ''}
              </span>
            </div>
            
            {/* Name, Title, Company, Description */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-stak-white truncate mb-1">
                {matchedUser.firstName || 'Unknown'} {matchedUser.lastName || 'User'}
              </h3>
              
              {/* Title */}
              {matchedUser.title && (
                <div className="text-sm text-stak-light-gray mb-1 truncate">
                  {matchedUser.title}
                </div>
              )}
              
              {/* Company */}
              {matchedUser.company && (
                <div className="flex items-center gap-1 text-stak-copper mb-2">
                  <Building className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate font-medium text-sm">{matchedUser.company}</span>
                </div>
              )}
              
              {/* Description - Max 2 sentences from bio */}
              {matchedUser.bio && (
                <div className="text-xs text-stak-light-gray leading-relaxed mb-2">
                  <span className="line-clamp-2">
                    {matchedUser.bio.split('.').slice(0, 2).join('.').trim()}{matchedUser.bio.split('.').length > 2 ? '.' : ''}
                  </span>
                </div>
              )}
              
              {/* Industries - At bottom */}
              {matchedUser.industries && matchedUser.industries.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {matchedUser.industries.slice(0, 3).map((industry, index) => (
                    <Badge key={index} variant="outline" className="text-xs border-stak-copper/60 text-stak-copper bg-stak-copper/10">
                      {industry}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Match Score */}
          <div className="text-right w-16 flex-shrink-0">
            <div className={`text-2xl font-bold ${getScoreColor(matchScore)}`}>
              {matchScore}%
            </div>
            <p className="text-xs text-stak-light-gray">Sync</p>
          </div>

          {/* Action Buttons - Pass left, Connect right, Mobile-first */}
          <div className="flex gap-2 w-32 flex-shrink-0">
            <Button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Pass clicked for:', match.id);
                onPass(match.id);
              }}
              variant="outline"
              size="sm"
              className="flex-1 border-2 border-red-500 text-red-300 bg-transparent active:bg-red-500/20 font-medium"
              data-testid={`button-pass-${match.id}`}
            >
              Pass
            </Button>
            
            <Button
              onClick={(e) => {
                e.stopPropagation();
                console.log('Connect clicked:', { 
                  matchId: match.id, 
                  matchedUser: `${matchedUser.firstName} ${matchedUser.lastName}`,
                  userId: matchedUser.id 
                });
                onConnect(match.id);
              }}
              className="flex-1 bg-stak-copper border-2 border-stak-copper text-stak-black font-medium active:bg-stak-dark-copper"
              size="sm"
              data-testid={`button-connect-${match.id}`}
            >
              Connect
            </Button>
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

            {/* Additional Action Buttons */}
            <div className="flex gap-2">
              {onViewAnalysis && (
                <Button
                  onClick={() => onViewAnalysis(match.id)}
                  variant="ghost"
                  size="sm"
                  className="flex-1 text-stak-copper hover:bg-stak-copper/10"
                >
                  <Brain className="w-4 h-4 mr-1" />
                  View Full Analysis
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}