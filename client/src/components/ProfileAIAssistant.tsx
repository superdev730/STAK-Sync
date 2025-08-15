import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot,
  Users,
  Sparkles,
  MessageSquare,
  Send,
  ThumbsUp,
  ThumbsDown,
  UserCheck,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Wand2,
  Heart,
  Star,
  TrendingUp
} from "lucide-react";

interface ProfileAIAssistantProps {
  currentProfile: {
    bio?: string;
    firstName?: string;
    lastName?: string;
    company?: string;
    title?: string;
    skills?: string[];
    industries?: string[];
    networkingGoal?: string;
  };
  onBioUpdate: (newBio: string) => void;
}

interface Connection {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  company?: string;
  profileImageUrl?: string;
  connectionStrength: number; // How active/connected they are with this user
  lastInteraction: string;
}

interface ProfileRecommendation {
  id: string;
  recommenderId: string;
  recommenderName: string;
  recommenderTitle?: string;
  recommendation: string;
  context: string;
  fieldType: string;
  status: string;
  createdAt: string;
}

interface AIsuggestion {
  type: 'bio' | 'achievements' | 'personality' | 'skills';
  content: string;
  reasoning: string;
  confidence: number;
}

export function ProfileAIAssistant({ currentProfile, onBioUpdate }: ProfileAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ai-help");
  const [aiPrompt, setAiPrompt] = useState("");
  const [selectedConnections, setSelectedConnections] = useState<string[]>([]);
  const [requestMessage, setRequestMessage] = useState("");
  const [specificAsk, setSpecificAsk] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch connections sorted by interaction frequency
  const { data: connections = [], isLoading: connectionsLoading } = useQuery<Connection[]>({
    queryKey: ["/api/profile/connections-for-assistance"],
    enabled: isOpen && activeTab === "crowdsource",
  });

  // Fetch existing recommendations
  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery<ProfileRecommendation[]>({
    queryKey: ["/api/profile/recommendations"],
    enabled: isOpen,
  });

  // AI Bio Generation
  const generateBioMutation = useMutation({
    mutationFn: async (prompt: string) => {
      const response = await apiRequest("/api/profile/ai/generate-bio", "POST", {
        prompt,
        currentProfile,
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "AI Bio Generated",
        description: "Your professional bio has been created with AI assistance.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate bio with AI",
        variant: "destructive",
      });
    },
  });

  // Request recommendations from connections
  const requestRecommendationsMutation = useMutation({
    mutationFn: async (data: { connectionIds: string[], message: string, specificAsk: string, fieldType: string }) => {
      const response = await apiRequest("/api/profile/request-recommendations", "POST", data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Requests Sent",
        description: `Recommendation requests sent to ${data.sentCount} connections.`,
      });
      setSelectedConnections([]);
      setRequestMessage("");
      setSpecificAsk("");
      queryClient.invalidateQueries({ queryKey: ["/api/profile/recommendations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to send recommendation requests",
        variant: "destructive",
      });
    },
  });

  // Approve/Use recommendation
  const useRecommendationMutation = useMutation({
    mutationFn: async (recommendationId: string) => {
      const response = await apiRequest(`/api/profile/recommendations/${recommendationId}/use`, "POST");
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Recommendation Applied",
        description: "The recommendation has been added to your profile.",
      });
      onBioUpdate(data.updatedBio);
      queryClient.invalidateQueries({ queryKey: ["/api/profile/recommendations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to apply recommendation",
        variant: "destructive",
      });
    },
  });

  const handleAIGenerate = () => {
    const prompt = aiPrompt || "Create a compelling professional bio that highlights my experience, skills, and networking goals";
    generateBioMutation.mutate(prompt);
  };

  const handleRequestRecommendations = () => {
    if (selectedConnections.length === 0) {
      toast({
        title: "No Connections Selected",
        description: "Please select at least one connection to request help from.",
        variant: "destructive",
      });
      return;
    }

    requestRecommendationsMutation.mutate({
      connectionIds: selectedConnections,
      message: requestMessage,
      specificAsk,
      fieldType: "bio"
    });
  };

  const toggleConnectionSelection = (connectionId: string) => {
    setSelectedConnections(prev => 
      prev.includes(connectionId) 
        ? prev.filter(id => id !== connectionId)
        : [...prev, connectionId]
    );
  };

  const getSuggestedConnections = () => {
    return connections
      .sort((a, b) => b.connectionStrength - a.connectionStrength)
      .slice(0, 5);
  };

  const getRecommendationIcon = (fieldType: string) => {
    switch (fieldType) {
      case 'bio': return <Edit className="h-4 w-4" />;
      case 'skills': return <Star className="h-4 w-4" />;
      case 'achievements': return <TrendingUp className="h-4 w-4" />;
      case 'personality': return <Heart className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'declined': return 'bg-red-100 text-red-800';
      case 'used': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-white">
          <Wand2 className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-stak-copper" />
            Profile AI Assistant
          </DialogTitle>
          <DialogDescription>
            Get AI help or crowdsource input from your connections to enhance your professional profile.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai-help" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Help
            </TabsTrigger>
            <TabsTrigger value="crowdsource" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ask Connections
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          {/* AI Help Tab */}
          <TabsContent value="ai-help" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-stak-copper" />
                  AI Bio Generator
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What would you like your bio to emphasize? (Optional)
                  </label>
                  <Textarea
                    placeholder="e.g., 'Focus on my AI expertise and startup experience' or 'Highlight my leadership in sustainable tech'"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                {currentProfile.bio && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Current Bio:</h4>
                    <p className="text-sm text-gray-700">{currentProfile.bio}</p>
                  </div>
                )}

                <Button
                  onClick={handleAIGenerate}
                  disabled={generateBioMutation.isPending}
                  className="w-full bg-stak-copper hover:bg-stak-copper/90 text-white"
                >
                  {generateBioMutation.isPending ? (
                    <>
                      <Bot className="h-4 w-4 mr-2 animate-pulse" />
                      Generating Bio...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Bio with AI
                    </>
                  )}
                </Button>

                {generateBioMutation.data && (
                  <div className="bg-blue-50 p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-stak-black">AI Generated Bio:</h4>
                      <Badge variant="secondary">
                        {Math.round(generateBioMutation.data.confidence * 100)}% confidence
                      </Badge>
                    </div>
                    <p className="text-stak-black mb-3">{generateBioMutation.data.bio}</p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => onBioUpdate(generateBioMutation.data.bio)}
                        size="sm"
                        className="bg-stak-forest hover:bg-stak-forest/90 text-white"
                      >
                        <ThumbsUp className="h-4 w-4 mr-1" />
                        Use This Bio
                      </Button>
                      <Button
                        onClick={handleAIGenerate}
                        size="sm"
                        variant="outline"
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        Generate Another
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Crowdsource Tab */}
          <TabsContent value="crowdsource" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-stak-copper" />
                  Request Help from Connections
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    What specific help do you need?
                  </label>
                  <Textarea
                    placeholder="e.g., 'Help me describe our work on the Series A funding round' or 'What would you say about my leadership style?'"
                    value={specificAsk}
                    onChange={(e) => setSpecificAsk(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Personal message to your connections:
                  </label>
                  <Textarea
                    placeholder="Hey! I'm updating my STAK profile and would love your perspective..."
                    value={requestMessage}
                    onChange={(e) => setRequestMessage(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>

                {/* AI-suggested connections */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm">AI Suggested Connections</h4>
                    <Badge variant="secondary">
                      <Bot className="h-3 w-3 mr-1" />
                      Most Active
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {getSuggestedConnections().map((connection) => (
                      <div
                        key={connection.id}
                        className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                        onClick={() => toggleConnectionSelection(connection.id)}
                      >
                        <Checkbox
                          checked={selectedConnections.includes(connection.id)}
                          className="data-[state=checked]:bg-stak-copper data-[state=checked]:border-stak-copper"
                        />
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={connection.profileImageUrl} />
                          <AvatarFallback>
                            {connection.firstName?.[0]}{connection.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {connection.firstName} {connection.lastName}
                          </div>
                          <div className="text-xs text-gray-600">
                            {connection.title} {connection.company && `at ${connection.company}`}
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round(connection.connectionStrength)}% active
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleRequestRecommendations}
                  disabled={requestRecommendationsMutation.isPending || selectedConnections.length === 0}
                  className="w-full bg-stak-copper hover:bg-stak-copper/90 text-white"
                >
                  {requestRecommendationsMutation.isPending ? (
                    <>
                      <Send className="h-4 w-4 mr-2 animate-pulse" />
                      Sending Requests...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Requests ({selectedConnections.length})
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-stak-copper" />
                  Profile Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No recommendations yet.</p>
                    <p className="text-sm">Ask your connections for help to get started!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec) => (
                      <div key={rec.id} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-start gap-3">
                            {getRecommendationIcon(rec.fieldType)}
                            <div>
                              <div className="font-medium text-sm">
                                {rec.recommenderName}
                              </div>
                              {rec.recommenderTitle && (
                                <div className="text-xs text-gray-600">
                                  {rec.recommenderTitle}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge className={getStatusColor(rec.status)}>
                            {rec.status}
                          </Badge>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h5 className="font-medium text-sm mb-1">Recommendation:</h5>
                            <p className="text-sm text-gray-700">{rec.recommendation}</p>
                          </div>

                          {rec.context && (
                            <div>
                              <h5 className="font-medium text-sm mb-1">Context:</h5>
                              <p className="text-xs text-gray-600">{rec.context}</p>
                            </div>
                          )}

                          {rec.status === 'approved' && (
                            <div className="flex gap-2">
                              <Button
                                onClick={() => useRecommendationMutation.mutate(rec.id)}
                                disabled={useRecommendationMutation.isPending}
                                size="sm"
                                className="bg-stak-forest hover:bg-stak-forest/90 text-white"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Use in Profile
                              </Button>
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-gray-500 mt-3">
                          {new Date(rec.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}