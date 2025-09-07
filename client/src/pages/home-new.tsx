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
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Match, User, Message } from "@shared/schema";
import FirstTimeOnboarding from "@/components/FirstTimeOnboarding";

export default function Home() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState<any>(null);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<Array<{id: string, role: string, content: string, timestamp: string}>>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

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

  // Profile completeness - enhanced with networking essentials
  const profileFields = [
    user?.firstName,
    user?.lastName,
    user?.email,
    user?.title,
    user?.company,
    user?.bio,
    user?.location,
    user?.profileImageUrl,
    user?.linkedinUrl,
    user?.websiteUrls,
    user?.networkingGoal,
    user?.industries
  ];
  const filledFields = profileFields.filter(field => field && field.trim?.().length > 0).length;
  const profileCompleteness = Math.round((filledFields / profileFields.length) * 100);

  // Check if user needs onboarding (new user with low profile completeness)
  const isNewUser = profileCompleteness < 50 && !hasSeenOnboarding;

  // Set onboarding state on mount
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem(`onboarding_completed_${user?.id}`);
    setHasSeenOnboarding(!!hasCompletedOnboarding);
    
    if (isNewUser && !hasCompletedOnboarding) {
      setShowOnboarding(true);
    }
  }, [user?.id, profileCompleteness]);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
    localStorage.setItem(`onboarding_completed_${user?.id}`, 'true');
    toast({
      title: "Welcome to STAK Sync!",
      description: "Your profile is ready. Start discovering amazing connections!",
    });
    queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
  };

  const handleOnboardingSkip = () => {
    setShowOnboarding(false);
    setHasSeenOnboarding(true);
    localStorage.setItem(`onboarding_skipped_${user?.id}`, 'true');
  };

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
    enabled: !!currentConversationId
  });

  // Handle conversation data changes
  useEffect(() => {
    if (conversationData && typeof conversationData === 'object' && 'messages' in conversationData && Array.isArray((conversationData as any).messages)) {
      setChatMessages((conversationData as any).messages);
    }
  }, [conversationData]);

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
      setAiResponse(data);
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
        queryClient.invalidateQueries({ queryKey: ["/api/ai-conversations"] });
        if (currentConversationId) {
          queryClient.invalidateQueries({ queryKey: ["/api/ai-conversations", currentConversationId] });
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
    queryClient.invalidateQueries({ queryKey: ["/api/ai-conversations", conversationId] });
  };

  const startNewChat = () => {
    setCurrentConversationId(null);
    setChatMessages([]);
  };

  // Show onboarding for new users
  if (showOnboarding) {
    return (
      <FirstTimeOnboarding 
        user={user}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      
      {/* Profile Completion Alert for users who haven't finished */}
      {profileCompleteness < 80 && hasSeenOnboarding && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-gradient-to-r from-stak-copper/10 to-stak-copper/5 border border-stak-copper/30 rounded-lg p-3 sm:p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-stak-copper flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-stak-black text-sm sm:text-base">Complete Your Profile ({profileCompleteness}%)</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">Add more details to get better AI matches and increase your networking success</p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <Progress value={profileCompleteness} className="w-16 sm:w-24 h-2" />
                <Button 
                  asChild 
                  size="sm"
                  className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black whitespace-nowrap"
                >
                  <Link href="/profile">
                    <Wand2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    <span className="hidden sm:inline">Enhance Profile</span>
                    <span className="sm:hidden">Enhance</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
        <Card className="mb-6 sm:mb-8 bg-gradient-to-r from-stak-black to-gray-900 border-stak-copper/30 mx-2 sm:mx-0">
          <CardContent className="p-4 sm:p-6">
            {/* Header - Always visible */}
            <div className="flex items-center space-x-2 mb-3 sm:mb-4">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6 text-stak-copper" />
              <h3 className="text-base sm:text-lg font-semibold text-white">STAK Sync AI Assistant</h3>
            </div>
            
            {/* Input Section - Stack on mobile */}
            <div className="flex flex-col space-y-3">
              <Input
                placeholder="Ask me anything... 'What's new?', 'Find matches', 'Improve profile'"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAiSubmit()}
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 h-12 sm:h-10 text-base sm:text-sm px-4 py-3 sm:py-2"
                data-testid="ai-input"
              />
              <Button 
                onClick={handleAiSubmit}
                disabled={aiAssistantMutation.isPending || !aiInput.trim()}
                className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black h-12 sm:h-10 px-6 text-base sm:text-sm font-medium w-full sm:w-auto"
                data-testid="ai-submit"
              >
                {aiAssistantMutation.isPending ? (
                  <>
                    <div className="w-5 h-5 sm:w-4 sm:h-4 border-2 border-stak-black border-t-transparent rounded-full animate-spin mr-2" />
                    <span className="hidden sm:inline">Processing...</span>
                    <span className="sm:hidden">AI Working...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 sm:w-4 sm:h-4 mr-2 sm:mr-0" />
                    <span className="sm:hidden">Ask AI Assistant</span>
                  </>
                )}
              </Button>
            </div>

            {/* AI Response Window */}
            {isAiOpen && aiResponse && (
              <div className="mt-4 p-3 sm:p-4 bg-white/10 rounded-lg border border-white/20">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-xs sm:text-sm font-medium text-stak-copper">AI Response:</h4>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      onClick={openChatWindow}
                      variant="ghost"
                      size="sm"
                      className="text-white/60 hover:text-white p-1 h-auto"
                      title="Open Chat History"
                    >
                      <Maximize2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      onClick={() => setIsAiOpen(false)}
                      variant="ghost"
                      size="sm"
                      className="text-white/60 hover:text-white p-1 h-auto"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
                <div className="text-white text-xs sm:text-sm leading-relaxed whitespace-pre-wrap" data-testid="ai-response">
                  {aiResponse?.response || aiResponse}
                </div>
                
                {/* Enhanced Contact Listings with All Metrics */}
                {aiResponse?.hasContacts && aiResponse?.contacts && aiResponse.contacts.length > 0 && (
                  <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                    <h4 className="text-sm font-semibold text-stak-copper mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Recommended Connections ({aiResponse.contacts.length})
                    </h4>
                    <div className="space-y-3">
                      {aiResponse.contacts.map((contact: any, index: number) => (
                        <div key={contact.id || index} className="bg-white/10 rounded-lg p-4 hover:bg-white/15 transition-all duration-200 border border-white/5 hover:border-stak-copper/30">
                          {/* Header with Name and Status Badges */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h5 className="font-semibold text-white text-base">{contact.name}</h5>
                              
                              {/* Connection Status */}
                              {contact.isConnected ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Connected
                                </Badge>
                              ) : (
                                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                                  <UserPlus className="w-3 h-3 mr-1" />
                                  Not Connected
                                </Badge>
                              )}
                              
                              {/* Live Status */}
                              {contact.isLive && (
                                <Badge className="bg-red-500 text-white text-xs animate-pulse">
                                  <div className="w-2 h-2 bg-white rounded-full mr-1" />
                                  LIVE NOW
                                </Badge>
                              )}
                            </div>
                            
                            {/* Match Score */}
                            {contact.compatibilityScore && (
                              <div className="text-right">
                                <div className="text-lg font-bold text-stak-copper">{contact.compatibilityScore}%</div>
                                <div className="text-xs text-gray-400">match</div>
                              </div>
                            )}
                          </div>
                          
                          {/* Professional Info */}
                          <div className="mb-3">
                            <p className="text-sm text-gray-300 font-medium">{contact.title}</p>
                            {contact.company && (
                              <p className="text-sm text-gray-400">{contact.company}</p>
                            )}
                          </div>
                          
                          {/* Event Attendance Tags */}
                          {contact.upcomingEvents && contact.upcomingEvents.length > 0 && (
                            <div className="mb-3">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-orange-400" />
                                <span className="text-xs font-medium text-orange-400">Attending Events:</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {contact.upcomingEvents.map((event: any, idx: number) => (
                                  <Badge key={idx} className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-xs">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {event.event.title}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Match Reason */}
                          {contact.reason && (
                            <div className="mb-4 p-2 bg-white/5 rounded border-l-2 border-stak-copper/50">
                              <p className="text-xs text-gray-300 italic">"{contact.reason}"</p>
                            </div>
                          )}
                          
                          {/* Action Buttons - Prioritized */}
                          <div className="flex flex-wrap gap-2">
                            {/* Priority 1: Live Event Connection */}
                            {contact.isLive && (
                              <Button
                                size="sm"
                                className="bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-1"
                                onClick={() => window.location.href = `/events/live`}
                                data-testid={`join-live-${contact.id}`}
                              >
                                <Zap className="w-3 h-3" />
                                Join Live Event
                              </Button>
                            )}
                            
                            {/* Priority 2: Upcoming Event Connection */}
                            {contact.upcomingEvents && contact.upcomingEvents.length > 0 && (
                              <Button
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600 text-white font-medium flex items-center gap-1"
                                onClick={() => window.location.href = `/events/${contact.upcomingEvents[0].event.id}`}
                                data-testid={`event-connect-${contact.id}`}
                              >
                                <Calendar className="w-3 h-3" />
                                Meet at {contact.upcomingEvents[0].event.title}
                              </Button>
                            )}
                            
                            {/* Priority 3: Direct Connection */}
                            <Button
                              size="sm"
                              variant={contact.isLive || (contact.upcomingEvents && contact.upcomingEvents.length > 0) ? "outline" : "default"}
                              className={contact.isLive || (contact.upcomingEvents && contact.upcomingEvents.length > 0) ? 
                                "border-white/20 text-white hover:bg-white/10" : 
                                "bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium"
                              }
                              onClick={() => window.location.href = `/messages?userId=${contact.id}`}
                              data-testid={`direct-connect-${contact.id}`}
                            >
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {contact.isConnected ? 'Message' : 'Connect'}
                            </Button>
                            
                            {/* View Profile */}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-gray-400 hover:text-white hover:bg-white/10"
                              onClick={() => window.location.href = `/profile/${contact.id}`}
                              data-testid={`profile-${contact.id}`}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              View Profile
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                    {(aiConversations as any[])?.map((conv: any) => (
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
                    
                    {(!aiConversations || (aiConversations as any[])?.length === 0) && (
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
