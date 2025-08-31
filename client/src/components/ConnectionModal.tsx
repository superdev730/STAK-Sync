import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Users, MessageSquare, Brain, Sparkles, Send, Edit3, 
  Target, Lightbulb, TrendingUp, HelpCircle, CheckCircle,
  X, Loader2, User as UserIcon, Building, MapPin, Tag
} from "lucide-react";
import type { Match, User } from "@shared/schema";

interface ConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match & { matchedUser: User };
  onConnectionSent: () => void;
}

interface ProfileQuestion {
  id: string;
  question: string;
  field: string;
  suggestion?: string;
}

export function ConnectionModal({ isOpen, onClose, match, onConnectionSent }: ConnectionModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [aiMessage, setAiMessage] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isGeneratingMessage, setIsGeneratingMessage] = useState(false);
  const [showProfileQuestions, setShowProfileQuestions] = useState(false);
  const [profileQuestions, setProfileQuestions] = useState<ProfileQuestion[]>([]);
  const [profileAnswers, setProfileAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState<'message' | 'questions' | 'review'>('message');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setAiMessage("");
      setCustomMessage("");
      setStep('message');
      setShowProfileQuestions(false);
      setProfileQuestions([]);
      setProfileAnswers({});
      generateConnectionMessage();
    }
  }, [isOpen, match.id]);

  // Generate AI-powered connection message
  const generateConnectionMessage = async () => {
    setIsGeneratingMessage(true);
    try {
      const response = await apiRequest("/api/ai/connection-message", "POST", {
        matchId: match.id,
        targetUserId: match.matchedUser.id,
        currentUserId: user?.id,
        matchData: {
          matchScore: match.matchScore,
          compatibilityFactors: match.compatibilityFactors,
          recommendedTopics: match.recommendedTopics,
          mutualGoals: match.mutualGoals,
          collaborationPotential: match.collaborationPotential
        }
      });
      
      const data = await response.json();
      
      if (data.needsProfileEnhancement && data.questions) {
        setProfileQuestions(data.questions);
        setShowProfileQuestions(true);
        setStep('questions');
      } else {
        setAiMessage(data.message);
        setCustomMessage(data.message);
      }
      
    } catch (error) {
      console.error('Error generating connection message:', error);
      toast({
        title: "Message Generation Failed",
        description: "Using a default template instead",
        variant: "destructive",
      });
      
      // Fallback message
      const fallbackMessage = `Hi ${match.matchedUser.firstName},\n\nI came across your profile and was impressed by your work at ${match.matchedUser.company || 'your company'}. I'd love to connect and explore potential collaboration opportunities.\n\nBest regards,\n${user?.firstName}`;
      setAiMessage(fallbackMessage);
      setCustomMessage(fallbackMessage);
    } finally {
      setIsGeneratingMessage(false);
    }
  };

  // Handle profile enhancement questions
  const handleProfileQuestionSubmit = async () => {
    try {
      const response = await apiRequest("/api/ai/enhance-connection", "POST", {
        matchId: match.id,
        targetUserId: match.matchedUser.id,
        currentUserId: user?.id,
        profileAnswers,
        matchData: {
          matchScore: match.matchScore,
          compatibilityFactors: match.compatibilityFactors,
          recommendedTopics: match.recommendedTopics,
          mutualGoals: match.mutualGoals,
          collaborationPotential: match.collaborationPotential
        }
      });
      
      const data = await response.json();
      setAiMessage(data.message);
      setCustomMessage(data.message);
      setStep('review');
      
      // Update user profile with new information
      if (data.profileUpdates) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      }
      
    } catch (error) {
      console.error('Error enhancing connection:', error);
      toast({
        title: "Enhancement Failed",
        description: "Please try again or proceed with a manual message",
        variant: "destructive",
      });
    }
  };

  // Send connection request
  const sendConnectionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/connections/request", "POST", {
        userId: match.matchedUser.id,
        matchId: match.id,
        message: customMessage
      });
    },
    onSuccess: () => {
      toast({
        title: "Connection Sent!",
        description: `Your message has been sent to ${match.matchedUser.firstName}`,
      });
      onConnectionSent();
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive",
      });
    }
  });

  const handleSendConnection = () => {
    if (!customMessage.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send with your connection request",
        variant: "destructive",
      });
      return;
    }
    sendConnectionMutation.mutate();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-stak-copper" />
            Connect with {match.matchedUser.firstName} {match.matchedUser.lastName}
            <Badge className="ml-auto bg-stak-copper/20 text-stak-copper">
              {match.matchScore}% Match
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="px-6 pb-6">
            {/* Profile Summary */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-stak-copper/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-stak-copper font-semibold text-xl">
                      {match.matchedUser.firstName?.[0]}{match.matchedUser.lastName?.[0]}
                    </span>
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {match.matchedUser.firstName} {match.matchedUser.lastName}
                    </h3>
                    
                    {match.matchedUser.title && (
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <UserIcon className="w-4 h-4" />
                        <span>{match.matchedUser.title}</span>
                      </div>
                    )}
                    
                    {match.matchedUser.company && (
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <Building className="w-4 h-4" />
                        <span>{match.matchedUser.company}</span>
                      </div>
                    )}
                    
                    {match.matchedUser.location && (
                      <div className="flex items-center gap-2 text-gray-600 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{match.matchedUser.location}</span>
                      </div>
                    )}

                    {match.matchedUser.industries && match.matchedUser.industries.length > 0 && (
                      <div className="flex items-center gap-2 mt-3">
                        <Tag className="w-4 h-4 text-gray-500" />
                        <div className="flex flex-wrap gap-1">
                          {match.matchedUser.industries.slice(0, 3).map((industry, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {industry}
                            </Badge>
                          ))}
                          {match.matchedUser.industries.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{match.matchedUser.industries.length - 3} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Connection Insights */}
                {(match.recommendedTopics || match.mutualGoals || match.collaborationPotential) && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-stak-copper" />
                      Connection Insights
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {match.recommendedTopics && match.recommendedTopics.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-2">Discussion Topics</div>
                          <div className="flex flex-wrap gap-1">
                            {match.recommendedTopics.slice(0, 2).map((topic, idx) => (
                              <Badge key={idx} className="bg-blue-100 text-blue-800 text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {match.mutualGoals && match.mutualGoals.length > 0 && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-2">Mutual Goals</div>
                          <div className="flex flex-wrap gap-1">
                            {match.mutualGoals.slice(0, 2).map((goal, idx) => (
                              <Badge key={idx} className="bg-green-100 text-green-800 text-xs">
                                {goal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {match.collaborationPotential && (
                        <div>
                          <div className="text-xs font-medium text-gray-500 mb-2">Collaboration</div>
                          <Badge className="bg-purple-100 text-purple-800 text-xs flex items-center gap-1">
                            {getCollaborationIcon(match.collaborationPotential)}
                            {match.collaborationPotential}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Profile Enhancement Questions */}
            {step === 'questions' && showProfileQuestions && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <HelpCircle className="w-5 h-5 text-orange-500" />
                    <h4 className="font-semibold text-gray-900">
                      Let's enhance your profile for better connections
                    </h4>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4">
                    To create a more personalized connection message, please answer these quick questions:
                  </p>
                  
                  <div className="space-y-4">
                    {profileQuestions.map((question) => (
                      <div key={question.id}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {question.question}
                        </label>
                        <Input
                          placeholder={question.suggestion || "Your answer..."}
                          value={profileAnswers[question.field] || ""}
                          onChange={(e) => setProfileAnswers(prev => ({
                            ...prev,
                            [question.field]: e.target.value
                          }))}
                          className="w-full"
                        />
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex gap-2 mt-6">
                    <Button
                      onClick={handleProfileQuestionSubmit}
                      className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                      disabled={Object.keys(profileAnswers).length === 0}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Generate Enhanced Message
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep('message');
                        setShowProfileQuestions(false);
                      }}
                    >
                      Skip for Now
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Generated Message */}
            {(step === 'message' || step === 'review') && (
              <Card className="mb-6">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-stak-copper" />
                      Your Connection Message
                    </h4>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={generateConnectionMessage}
                        disabled={isGeneratingMessage}
                      >
                        {isGeneratingMessage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )}
                        Regenerate
                      </Button>
                    </div>
                  </div>

                  {isGeneratingMessage ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-stak-copper mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          Analyzing your profiles and generating a personalized message...
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <Textarea
                        value={customMessage}
                        onChange={(e) => setCustomMessage(e.target.value)}
                        placeholder="Your connection message..."
                        className="min-h-[120px] resize-none"
                        rows={6}
                      />
                      
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span>{customMessage.length} characters</span>
                        <div className="flex items-center gap-1">
                          <Edit3 className="w-3 h-3" />
                          Feel free to edit the message above
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={sendConnectionMutation.isPending}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              
              {step === 'questions' && showProfileQuestions ? null : (
                <Button
                  onClick={handleSendConnection}
                  disabled={sendConnectionMutation.isPending || !customMessage.trim() || isGeneratingMessage}
                  className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium"
                >
                  {sendConnectionMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send Connection Request
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}