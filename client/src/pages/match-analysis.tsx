import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  Target, 
  Users,
  TrendingUp,
  Lightbulb,
  MessageSquare,
  Calendar,
  Star,
  CheckCircle
} from "lucide-react";
import type { User } from "@shared/schema";

interface MatchAnalysis {
  match: any;
  matchedUser: User;
  aiAnalysis: string;
  compatibilityFactors: {
    industryAlignment: number;
    experienceLevel: number;
    geographicProximity: number;
    goalAlignment: number;
    skillsComplementarity: number;
  };
  recommendedTopics: string[];
  mutualGoals: string[];
  collaborationPotential: string;
  meetingSuggestions: string[];
}

export default function MatchAnalysis() {
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const matchId = searchParams.get('matchId');

  const { data: analysis, isLoading } = useQuery<MatchAnalysis>({
    queryKey: ["/api/matches", matchId, "analysis"],
    enabled: !!matchId,
  });

  if (!matchId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-gray-600">Match not found</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-24 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/matches')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Button>
          <p className="text-center text-gray-600">Match analysis not found</p>
        </div>
      </div>
    );
  }

  const { match, matchedUser, aiAnalysis, compatibilityFactors, recommendedTopics, mutualGoals, collaborationPotential, meetingSuggestions } = analysis;

  const overallScore = Math.round(
    (compatibilityFactors.industryAlignment + 
     compatibilityFactors.experienceLevel + 
     compatibilityFactors.geographicProximity + 
     compatibilityFactors.goalAlignment + 
     compatibilityFactors.skillsComplementarity) / 5
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <Button 
          variant="ghost" 
          onClick={() => setLocation('/matches')}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Matches
        </Button>

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Match Analysis</h1>
          <p className="text-gray-600">AI-powered compatibility breakdown and networking insights</p>
        </div>

        {/* Match Overview */}
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-8">
            <div className="flex items-center space-x-6">
              <Avatar className="w-24 h-24 border-4 border-gray-200">
                <AvatarImage 
                  src={matchedUser.profileImageUrl || ""} 
                  alt={`${matchedUser.firstName} ${matchedUser.lastName}`} 
                />
                <AvatarFallback className="bg-gray-300 text-gray-700 text-xl font-semibold">
                  {matchedUser.firstName?.[0]}{matchedUser.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {matchedUser.firstName} {matchedUser.lastName}
                </h2>
                
                {matchedUser.position && (
                  <div className="flex items-center text-lg text-gray-700 mb-2">
                    <Briefcase className="h-5 w-5 mr-2 text-gray-500" />
                    <span className="font-medium">{matchedUser.position}</span>
                    {matchedUser.company && (
                      <span className="text-gray-600"> at {matchedUser.company}</span>
                    )}
                  </div>
                )}
                
                {matchedUser.location && (
                  <div className="flex items-center text-gray-600 mb-4">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{matchedUser.location}</span>
                  </div>
                )}
              </div>

              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{overallScore}%</div>
                <div className="text-sm text-gray-600">Match Score</div>
                <div className="flex items-center mt-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${i < Math.floor(overallScore / 20) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Analysis */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Analysis */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-blue-600" />
                  AI Match Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{aiAnalysis}</p>
              </CardContent>
            </Card>

            {/* Compatibility Breakdown */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                  Compatibility Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Industry Alignment</span>
                    <span className="text-sm text-gray-600">{compatibilityFactors.industryAlignment}%</span>
                  </div>
                  <Progress value={compatibilityFactors.industryAlignment} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Experience Level</span>
                    <span className="text-sm text-gray-600">{compatibilityFactors.experienceLevel}%</span>
                  </div>
                  <Progress value={compatibilityFactors.experienceLevel} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Geographic Proximity</span>
                    <span className="text-sm text-gray-600">{compatibilityFactors.geographicProximity}%</span>
                  </div>
                  <Progress value={compatibilityFactors.geographicProximity} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Goal Alignment</span>
                    <span className="text-sm text-gray-600">{compatibilityFactors.goalAlignment}%</span>
                  </div>
                  <Progress value={compatibilityFactors.goalAlignment} className="h-2" />
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">Skills Complementarity</span>
                    <span className="text-sm text-gray-600">{compatibilityFactors.skillsComplementarity}%</span>
                  </div>
                  <Progress value={compatibilityFactors.skillsComplementarity} className="h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Collaboration Potential */}
            <Card className="bg-white border border-gray-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <Users className="h-5 w-5 mr-2 text-purple-600" />
                  Collaboration Potential
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{collaborationPotential}</p>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Mutual Goals */}
            {mutualGoals && mutualGoals.length > 0 && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                    <Target className="h-4 w-4 mr-2 text-green-600" />
                    Mutual Goals
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {mutualGoals.map((goal, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{goal}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Recommended Topics */}
            {recommendedTopics && recommendedTopics.length > 0 && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                    <MessageSquare className="h-4 w-4 mr-2 text-blue-600" />
                    Conversation Starters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {recommendedTopics.map((topic, index) => (
                      <Badge key={index} variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meeting Suggestions */}
            {meetingSuggestions && meetingSuggestions.length > 0 && (
              <Card className="bg-white border border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-orange-600" />
                    Meeting Ideas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {meetingSuggestions.map((suggestion, index) => (
                    <div key={index} className="text-sm text-gray-700 border-l-2 border-orange-200 pl-3">
                      {suggestion}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4 space-y-3">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Message
                </Button>
                <Button variant="outline" className="w-full border-gray-300 text-gray-700">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}