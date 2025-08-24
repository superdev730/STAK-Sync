import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  Brain, MessageSquare, Calendar, Users, TrendingUp, Award, ExternalLink, 
  BarChart3, Sparkles, CheckCircle, Trophy, Target, Zap, Share2, Gift,
  ArrowRight, Star, Shield, Globe, Clock, Lightbulb, TrendingDown,
  UserPlus, Video, MapPin, Smartphone, Monitor, ChevronRight, Activity,
  Eye, Heart, Network, Send, Plus, AlertCircle, Bot, Mic, Settings,
  BarChart, UserCheck, Rocket, Wand2, History, X, Maximize2
} from "lucide-react";
import { LiveEventBanner } from "@/components/LiveEventBanner";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Match, User, Message } from "@shared/schema";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, role: string, content: string, timestamp: string}>>([]);

  // Fetch user's data for dashboard stats
  const { data: matches } = useQuery<(Match & { matchedUser: User })[]>({
    queryKey: ["/api/matches"],
  });

  const { data: conversations } = useQuery<(Message & { sender: User; receiver: User })[]>({
    queryKey: ["/api/conversations"],
  });

  // Calculate dashboard stats
  const totalMatches = matches?.length || 0;
  const newMatches = matches?.filter(m => m.status === 'pending')?.length || 0;
  const connectedMatches = matches?.filter(m => m.status === 'connected')?.length || 0;
  
  // Calculate unread messages
  const unreadMessages = conversations?.filter(conv => 
    conv.senderId !== user?.id && !conv.isRead
  )?.length || 0;

  // Calculate unique conversations
  const uniqueConversations = new Set(conversations?.map(conv => 
    conv.senderId === user?.id ? conv.receiverId : conv.senderId
  ))?.size || 0;

  // Profile completeness
  const profileFields = [
    user?.firstName,
    user?.lastName,
    user?.email,
    user?.title,
    user?.company,
    user?.bio,
    user?.location,
    user?.profileImageUrl
  ];
  const filledFields = profileFields.filter(field => field && field.trim().length > 0).length;
  const profileCompleteness = Math.round((filledFields / profileFields.length) * 100);

  // Activity score
  const recentActivityScore = Math.min(100, (newMatches * 20) + (unreadMessages * 10) + (connectedMatches * 15));

  // Fetch AI conversations
  const { data: aiConversations } = useQuery({
    queryKey: ["/api/ai-conversations"],
    enabled: !!user,
  });

  // Fetch current conversation messages
  const { data: conversationData } = useQuery({
    queryKey: ["/api/ai-conversations", currentConversationId],
    enabled: !!currentConversationId,
    onSuccess: (data: any) => {
      if (data?.messages) {
        setChatMessages(data.messages);
      }
    }
  });

  // AI Assistant Mutation with chat history
  const aiAssistantMutation = useMutation({
    mutationFn: async (query: string) => {
      const response = await apiRequest("/api/ai-assistant", "POST", { 
        query, 
        conversationId: currentConversationId,
        userContext: {
          totalMatches,
          newMatches,
          unreadMessages,
          profileCompleteness,
          recentActivityScore,
          firstName: user?.firstName,
          title: user?.title,
          company: user?.company
        }
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAiResponse(data.response);
      setIsAiOpen(true);
      
      // If chat is open, add messages to chat history
      if (isChatOpen) {
        const newUserMessage = {
          id: Date.now().toString() + '-user',
          role: 'user', 
          content: aiInput,
          timestamp: new Date().toISOString()
        };
        const newAiMessage = {
          id: Date.now().toString() + '-ai',
          role: 'assistant',
          content: data.response,
          timestamp: data.timestamp || new Date().toISOString()
        };
        setChatMessages(prev => [...prev, newUserMessage, newAiMessage]);
        
        // Update conversation ID for future messages
        if (data.conversationId) {
          setCurrentConversationId(data.conversationId);
        }
        
        // Refresh conversations list
        queryClient.invalidateQueries(["/api/ai-conversations"]);
        if (currentConversationId) {
          queryClient.invalidateQueries(["/api/ai-conversations", currentConversationId]);
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "AI Assistant Error",
        description: error.message || "Failed to get AI response",
        variant: "destructive",
      });
    }
  });

  const handleAiSubmit = () => {
    if (!aiInput.trim()) return;
    aiAssistantMutation.mutate(aiInput);
    setAiInput("");
  };

  const openChatWindow = () => {
    setIsChatOpen(true);
    setIsAiOpen(false);
  };

  const selectConversation = (conversationId: string) => {
    setCurrentConversationId(conversationId);
    queryClient.invalidateQueries(["/api/ai-conversations", conversationId]);
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setChatMessages([]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <LiveEventBanner />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-stak-black mb-2">
            Welcome back, <span className="text-stak-copper">{user?.firstName}</span>
          </h1>
          <p className="text-lg text-gray-600">
            Your AI-powered networking command center
          </p>
        </div>

        {/* AI Assistant Toolbar */}
        <Card className="mb-8 bg-gradient-to-r from-stak-black to-gray-900 border-stak-copper/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Bot className="w-6 h-6 text-stak-copper" />
                <h3 className="text-lg font-semibold text-white">STAK Sync AI Assistant</h3>
              </div>
              <div className="flex-1 flex space-x-3">
                <Input
                  placeholder="Ask me anything... 'What's new?', 'Find me matches', 'Improve my profile'"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAiSubmit()}
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  data-testid="ai-input"
                />
                <Button 
                  onClick={handleAiSubmit}
                  disabled={aiAssistantMutation.isPending || !aiInput.trim()}
                  className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                  data-testid="ai-submit"
                >
                  {aiAssistantMutation.isPending ? (
                    <div className="w-4 h-4 border-2 border-stak-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* AI Response Window */}
            {isAiOpen && aiResponse && (
              <div className="mt-4 p-4 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-sm font-medium text-stak-copper">AI Response:</h4>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={openChatWindow}
                      variant="ghost"
                      size="sm"
                      className="text-white/60 hover:text-white p-1 h-auto"
                      title="Open Chat History"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setIsAiOpen(false)}
                      variant="ghost"
                      size="sm"
                      className="text-white/60 hover:text-white p-1 h-auto"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-white text-sm leading-relaxed whitespace-pre-wrap" data-testid="ai-response">
                  {aiResponse}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Chat History Dialog */}
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] p-0">
            <DialogHeader className="p-6 pb-4">
              <DialogTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-stak-copper" />
                STAK Sync AI Assistant - Chat History
              </DialogTitle>
            </DialogHeader>
            
            <div className="flex h-[60vh]">
              {/* Conversations Sidebar */}
              <div className="w-80 border-r bg-gray-50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-medium text-gray-900">Conversations</h3>
                  <Button
                    onClick={startNewChat}
                    size="sm"
                    variant="outline"
                    className="text-xs"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    New Chat
                  </Button>
                </div>
                
                <ScrollArea className="h-full">
                  <div className="space-y-2">
                    {aiConversations?.map((conv: any) => (
                      <Button
                        key={conv.id}
                        onClick={() => selectConversation(conv.id)}
                        variant={currentConversationId === conv.id ? "default" : "ghost"}
                        className="w-full justify-start text-left p-3 h-auto"
                      >
                        <div className="flex items-start gap-2 w-full">
                          <History className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{conv.title}</div>
                            <div className="text-xs text-gray-500 truncate">
                              {new Date(conv.updatedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </Button>
                    ))}
                    
                    {(!aiConversations || aiConversations.length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        <Bot className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No conversations yet</p>
                        <p className="text-xs">Start chatting to build your history</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            message.role === 'user'
                              ? 'bg-stak-copper text-stak-black ml-4'
                              : 'bg-gray-100 text-gray-900 mr-4'
                          }`}
                        >
                          <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                          <div className="text-xs mt-1 opacity-70">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {chatMessages.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Start a conversation</p>
                        <p className="text-xs">Ask me anything about your networking goals!</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                {/* Chat Input - positioned to flow with conversation */}
                <div className="border-t bg-white p-4 mt-auto">
                  <div className="flex gap-2 items-end">
                    <Input
                      placeholder="Ask me anything about networking, matches, or improving your profile..."
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAiSubmit()}
                      className="flex-1"
                      data-testid="chat-input"
                    />
                    <Button 
                      onClick={handleAiSubmit}
                      disabled={aiAssistantMutation.isPending || !aiInput.trim()}
                      className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                      data-testid="chat-submit"
                    >
                      {aiAssistantMutation.isPending ? (
                        <div className="w-4 h-4 border-2 border-stak-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Priority Actions Grid - Equal Heights */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* 1. See AI Matches */}
          <Link href="/discover" className="group">
            <Card className="h-48 bg-gradient-to-br from-stak-copper/20 to-stak-copper/10 border-stak-copper/30 hover:border-stak-copper transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardContent className="h-full p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-stak-copper/20 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-stak-copper" />
                  </div>
                  {newMatches > 0 && (
                    <Badge className="bg-red-500 text-white">{newMatches} new</Badge>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stak-black mb-2">See AI Matches</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Discover {totalMatches} AI-powered connections waiting for you
                  </p>
                  <div className="flex items-center text-stak-copper text-sm font-medium">
                    Explore Matches <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 2. See Messages */}
          <Link href="/messages" className="group">
            <Card className="h-48 bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-blue-500/30 hover:border-blue-500 transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardContent className="h-full p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-500" />
                  </div>
                  {unreadMessages > 0 && (
                    <Badge className="bg-red-500 text-white">{unreadMessages} unread</Badge>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stak-black mb-2">See Messages</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    {uniqueConversations} active conversations and networking opportunities
                  </p>
                  <div className="flex items-center text-blue-500 text-sm font-medium">
                    View Messages <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 3. Improve Profile */}
          <Link href="/profile" className="group">
            <Card className="h-48 bg-gradient-to-br from-green-500/20 to-green-500/10 border-green-500/30 hover:border-green-500 transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardContent className="h-full p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-green-500" />
                  </div>
                  {profileCompleteness < 80 && (
                    <Badge className="bg-yellow-500 text-black">Optimize</Badge>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stak-black mb-2">Improve Profile</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Profile {profileCompleteness}% complete - AI enhancement available
                  </p>
                  <div className="flex items-center text-green-500 text-sm font-medium">
                    Enhance Profile <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 4. Live Event (Prepare Matches) */}
          <Link href="/events/live" className="group">
            <Card className="h-48 bg-gradient-to-br from-purple-500/20 to-purple-500/10 border-purple-500/30 hover:border-purple-500 transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardContent className="h-full p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <Rocket className="w-6 h-6 text-purple-500" />
                  </div>
                  <Badge className="bg-purple-500 text-white">Live</Badge>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stak-black mb-2">Live Event</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Prepare AI matches for upcoming live networking events
                  </p>
                  <div className="flex items-center text-purple-500 text-sm font-medium">
                    Prepare Matches <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 5. Events (See Events) */}
          <Link href="/events" className="group">
            <Card className="h-48 bg-gradient-to-br from-orange-500/20 to-orange-500/10 border-orange-500/30 hover:border-orange-500 transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardContent className="h-full p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-500" />
                  </div>
                  <Badge className="bg-orange-500 text-white">Join</Badge>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stak-black mb-2">Events</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Discover upcoming networking events and opportunities
                  </p>
                  <div className="flex items-center text-orange-500 text-sm font-medium">
                    See Events <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* 6. Activity Score (See Activity) */}
          <Link href="/activity" className="group">
            <Card className="h-48 bg-gradient-to-br from-stak-copper/20 to-yellow-500/10 border-yellow-500/30 hover:border-yellow-500 transition-all duration-300 hover:scale-105 cursor-pointer">
              <CardContent className="h-full p-6 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-xl flex items-center justify-center">
                    <BarChart className="w-6 h-6 text-yellow-600" />
                  </div>
                  <Badge className={`${recentActivityScore >= 80 ? 'bg-green-500' : recentActivityScore >= 60 ? 'bg-yellow-500 text-black' : 'bg-red-500'} text-white`}>
                    {recentActivityScore}
                  </Badge>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-stak-black mb-2">Activity Score</h3>
                  <p className="text-gray-600 text-sm mb-3">
                    Track networking performance and get improvement tips
                  </p>
                  <div className="flex items-center text-yellow-600 text-sm font-medium">
                    See Activity <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

        </div>
      </div>
    </div>
  );
}
