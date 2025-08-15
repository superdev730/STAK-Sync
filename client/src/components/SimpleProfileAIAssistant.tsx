import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Bot,
  Users,
  Sparkles,
  MessageSquare,
  ThumbsUp,
  Wand2,
  Send
} from "lucide-react";

interface SimpleProfileAIAssistantProps {
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

export function SimpleProfileAIAssistant({ currentProfile, onBioUpdate }: SimpleProfileAIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("ai-help");
  const [aiPrompt, setAiPrompt] = useState("");
  const [requestNote, setRequestNote] = useState("");
  const { toast } = useToast();

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

  const handleAIGenerate = () => {
    const prompt = aiPrompt || "Create a compelling professional bio that highlights my experience, skills, and networking goals";
    generateBioMutation.mutate(prompt);
  };

  const handleRequestHelp = () => {
    toast({
      title: "Feature Coming Soon",
      description: "Connection-based profile recommendations will be available soon. For now, you can use the AI assistant to enhance your bio.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-white">
          <Wand2 className="h-4 w-4 mr-2" />
          AI Assistant
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-stak-copper" />
            Profile AI Assistant
          </DialogTitle>
          <DialogDescription>
            Get AI help or request input from your connections to enhance your professional profile.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai-help" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Help
            </TabsTrigger>
            <TabsTrigger value="crowdsource" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ask Connections
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
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-5 w-5 text-yellow-600" />
                    <h4 className="font-medium text-yellow-800">Coming Soon</h4>
                  </div>
                  <p className="text-yellow-700 text-sm">
                    We're building a feature that will let you request profile recommendations from your STAK connections. 
                    They'll be able to provide insights about your work together, achievements, and professional reputation.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    What specific help would you want from connections?
                  </label>
                  <Textarea
                    placeholder="e.g., 'Help me describe our work on the Series A funding round' or 'What would you say about my leadership style?'"
                    value={requestNote}
                    onChange={(e) => setRequestNote(e.target.value)}
                    className="min-h-[80px]"
                    disabled
                  />
                </div>

                <div className="bg-gray-100 p-4 rounded-lg">
                  <h4 className="font-medium text-sm mb-2">How this will work:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• AI will suggest your most active connections</li>
                    <li>• Send personalized requests for profile feedback</li>
                    <li>• Get recommendations about your work, deals, and abilities</li>
                    <li>• Choose which input to incorporate into your profile</li>
                  </ul>
                </div>

                <Button
                  onClick={handleRequestHelp}
                  disabled
                  className="w-full"
                  variant="outline"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Request Help (Coming Soon)
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}