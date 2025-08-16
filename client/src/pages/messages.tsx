import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Search, Plus, Users, Filter, ArrowLeft, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import MessageInterface from "@/components/MessageInterface";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import type { Message, User } from "@shared/schema";

export default function Messages() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewMessageDialog, setShowNewMessageDialog] = useState(false);
  const [newMessageSearch, setNewMessageSearch] = useState("");
  const [showMobileChat, setShowMobileChat] = useState(false);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  // Get userId from URL parameters
  const searchParams = new URLSearchParams(window.location.search);
  const userIdFromUrl = searchParams.get('userId');

  const { data: conversations, isLoading } = useQuery<(Message & { sender: User; receiver: User })[]>({
    queryKey: ["/api/conversations"],
  });

  const { data: matches } = useQuery<any[]>({
    queryKey: ["/api/matches"],
  });

  // Handle user selection from URL
  useEffect(() => {
    if (userIdFromUrl && matches) {
      // Find the user from matches
      const matchedUser = matches.find(m => m.matchedUser?.id === userIdFromUrl)?.matchedUser;
      if (matchedUser) {
        setSelectedUser(matchedUser);
      } else {
        // Try to find user from conversations if not in matches
        const conversationUser = conversations?.find(c => 
          c.sender.id === userIdFromUrl || c.receiver.id === userIdFromUrl
        );
        if (conversationUser) {
          const user = conversationUser.sender.id === userIdFromUrl ? conversationUser.sender : conversationUser.receiver;
          setSelectedUser(user);
        }
      }
    }
  }, [userIdFromUrl, matches, conversations]);

  // Initialize demo messages on first load
  useEffect(() => {
    if (currentUser && (!conversations || conversations.length === 0)) {
      apiRequest("/api/seed-messages", "POST", {})
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        })
        .catch((error) => {
          console.log("Demo messages may already exist:", error);
        });
    }
  }, [currentUser, conversations, queryClient]);

  const { data: selectedConversation } = useQuery<(Message & { sender: User; receiver: User })[]>({
    queryKey: ["/api/conversations", selectedUser?.id],
    enabled: !!selectedUser,
  });

  // WebSocket for real-time messages
  useWebSocket({
    onMessage: (data) => {
      if (data.type === 'new_message') {
        // Invalidate conversations to refresh the list
        queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
        if (selectedUser) {
          queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedUser.id] });
        }
      }
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { receiverId: string; content: string }) => {
      console.log('Sending message:', messageData);
      return apiRequest("/api/messages", "POST", messageData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/conversations"] });
      if (selectedUser) {
        queryClient.invalidateQueries({ queryKey: ["/api/conversations", selectedUser.id] });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = async (content: string) => {
    if (!selectedUser) return;
    await sendMessageMutation.mutateAsync({
      receiverId: selectedUser.id,
      content,
    });
  };



  // Fallback conversations for demonstration when no real conversations exist  
  const fallbackConversations = [
    {
      user: {
        id: "demo-sarah",
        firstName: "Sarah",
        lastName: "Chen",
        email: "sarah.chen@techcorp.com",
        title: "VP of Engineering",
        company: "TechCorp",
        profileImageUrl: null
      },
      lastMessage: {
        id: "msg1",
        content: "Thanks for connecting! I'd love to discuss the AI infrastructure challenges you mentioned. Would you be available for a 30-minute call next week?",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        senderId: "demo-sarah",
        receiverId: currentUser?.id || "",
        isRead: false
      },
      unreadCount: 2
    },
    {
      user: {
        id: "demo-michael", 
        firstName: "Michael",
        lastName: "Rodriguez",
        email: "m.rodriguez@venturecp.com",
        title: "Partner",
        company: "Venture Capital Partners",
        profileImageUrl: null
      },
      lastMessage: {
        id: "msg2",
        content: "Great presentation at the STAK event yesterday! I'm particularly interested in your Series A fundraising timeline. Let's schedule a follow-up meeting.",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
        senderId: "demo-michael",
        receiverId: currentUser?.id || "",
        isRead: false
      },
      unreadCount: 1
    },
    {
      user: {
        id: "demo-jessica",
        firstName: "Jessica",
        lastName: "Park",
        email: "jessica@innovatelab.com", 
        title: "Founder & CEO",
        company: "InnovateLab",
        profileImageUrl: null
      },
      lastMessage: {
        id: "msg3",
        content: "Perfect! I'll send over the partnership proposal by Friday. Looking forward to exploring how our companies can collaborate on the healthcare AI space.",
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        senderId: currentUser?.id || "",
        receiverId: "demo-jessica",
        isRead: true
      },
      unreadCount: 0
    },
    {
      user: {
        id: "demo-david",
        firstName: "David",
        lastName: "Kim",
        email: "dkim@stakventures.com",
        title: "Investment Director",
        company: "STAK Ventures",
        profileImageUrl: null
      },
      lastMessage: {
        id: "msg4",
        content: "Welcome to the STAK ecosystem! I noticed you're working on fintech solutions. Would love to introduce you to our portfolio company CEOs in the space.",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        senderId: "demo-david",
        receiverId: currentUser?.id || "",
        isRead: true
      },
      unreadCount: 0
    }
  ];

  // Get unique conversations grouped by users
  const getUniqueConversations = () => {
    if (!currentUser) return fallbackConversations;

    if (!conversations || conversations.length === 0) return fallbackConversations;

    const userMap = new Map<string, { user: User; lastMessage: Message & { sender: User; receiver: User }; unreadCount: number }>();

    conversations.forEach((message) => {
      const otherUser = message.senderId === currentUser.id ? message.receiver : message.sender;
      
      if (!userMap.has(otherUser.id) || (message.createdAt && userMap.get(otherUser.id)?.lastMessage.createdAt && new Date(message.createdAt) > new Date(userMap.get(otherUser.id)!.lastMessage.createdAt || new Date()))) {
        const unreadCount = conversations.filter(m => 
          m.senderId === otherUser.id && 
          m.receiverId === currentUser.id && 
          !m.isRead
        ).length;

        userMap.set(otherUser.id, {
          user: otherUser,
          lastMessage: message,
          unreadCount,
        });
      }
    });

    return Array.from(userMap.values()).sort((a, b) => {
      const aTime = a.lastMessage.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  };

  const uniqueConversations = getUniqueConversations();

  // Filter conversations based on search query
  const filteredConversations = uniqueConversations.filter(conv => {
    const fullName = `${conv.user.firstName} ${conv.user.lastName}`.toLowerCase();
    const company = conv.user.company?.toLowerCase() || '';
    const title = conv.user.title?.toLowerCase() || '';
    const searchLower = searchQuery.toLowerCase();
    
    return fullName.includes(searchLower) || 
           company.includes(searchLower) || 
           title.includes(searchLower);
  });

  // Filter matches for new message dialog
  const availableMatches = matches?.filter(match => {
    if (!match.matchedUser) return false;
    
    // Don't show users we already have conversations with
    const hasConversation = uniqueConversations.some(conv => 
      conv.user.id === match.matchedUser.id
    );
    
    // Filter by search in new message dialog
    if (newMessageSearch) {
      const fullName = `${match.matchedUser.firstName} ${match.matchedUser.lastName}`.toLowerCase();
      const company = match.matchedUser.company?.toLowerCase() || '';
      const title = match.matchedUser.title?.toLowerCase() || '';
      const searchLower = newMessageSearch.toLowerCase();
      
      return !hasConversation && (
        fullName.includes(searchLower) || 
        company.includes(searchLower) || 
        title.includes(searchLower)
      );
    }
    
    return !hasConversation;
  }) || [];

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedUser && currentUser) {
      apiRequest(`/api/conversations/${selectedUser.id}/read`, 'PUT', {}).catch(console.error);
    }
  }, [selectedUser, currentUser]);

  // Handle starting a new conversation
  const handleStartConversation = (user: User) => {
    setSelectedUser(user);
    setShowNewMessageDialog(false);
    setNewMessageSearch("");
    setShowMobileChat(true); // Show chat on mobile after selecting user
  };

  // Handle selecting a conversation
  const handleSelectConversation = (user: User) => {
    setSelectedUser(user);
    setShowMobileChat(true); // Show chat on mobile
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-3 lg:p-6">
        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 lg:p-8 mb-4 lg:mb-8 text-center shadow-sm">
          <h1 className="text-2xl lg:text-4xl font-bold text-black mb-2">Professional Conversations</h1>
          <p className="text-base lg:text-xl text-gray-600 px-4 lg:px-0 mb-4">Secure messaging platform designed for meaningful business connections</p>
          
          {/* Primary New Message Button */}
          <Button 
            onClick={() => setShowNewMessageDialog(true)}
            className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-semibold px-6 py-2"
            data-testid="button-new-message"
          >
            <Plus className="w-4 h-4 mr-2" />
            Start New Conversation
          </Button>
        </div>

        {/* Messages Interface */}
        <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="relative">
              {/* Mobile Chat View - Shown when showMobileChat is true on mobile */}
              <div className={`lg:hidden absolute inset-0 bg-white z-20 ${showMobileChat ? 'block' : 'hidden'}`}>
                {selectedUser && currentUser && (
                  <div className="flex flex-col h-[calc(100vh-250px)]">
                    {/* Mobile Chat Header */}
                    <div className="flex items-center p-4 border-b border-gray-200 bg-white">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowMobileChat(false)}
                        className="mr-3"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </Button>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-900">
                          {selectedUser.firstName} {selectedUser.lastName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {selectedUser.title} at {selectedUser.company}
                        </p>
                      </div>
                    </div>
                    
                    {/* Mobile Message Interface */}
                    <div className="flex-1 overflow-hidden">
                      <MessageInterface
                        currentUser={currentUser}
                        otherUser={selectedUser}
                        messages={selectedConversation || []}
                        onSendMessage={handleSendMessage}
                        matchId={matches?.find((m: any) => m.matchedUserId === selectedUser.id)?.id}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Grid / Mobile List */}
              <div className="grid lg:grid-cols-3 lg:h-[700px]">
                {/* Conversations List */}
                <div className={`border-r border-gray-200 bg-white ${showMobileChat ? 'hidden lg:block' : 'block'}`}>
                  <div className="p-4 border-b border-gray-200 bg-white">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-black text-lg">Messages</h3>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm"
                          onClick={() => setShowNewMessageDialog(true)}
                          className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                          data-testid="button-new-message-sidebar"
                        >
                          <Plus className="w-4 h-4 lg:mr-1" />
                          <span className="hidden lg:inline">New</span>
                        </Button>
                      </div>
                    </div>
                  
                  {/* Search Bar */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 pr-3 py-2 w-full border-gray-200 focus:border-stak-copper"
                    />
                  </div>
                  
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs lg:text-sm text-gray-600">{filteredConversations.length} conversations</p>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="text-gray-500 hover:text-gray-700 lg:inline-flex hidden"
                      >
                        <Filter className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-y-auto h-[calc(100vh-350px)] lg:h-[calc(700px-160px)]">
                  {isLoading ? (
                    <div className="space-y-1">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="p-4 animate-pulse border-b border-gray-100">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                              <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-700 font-medium">
                        {searchQuery ? 'No conversations found' : 'Ready to start messaging'}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {searchQuery 
                          ? 'Try adjusting your search terms or start a new conversation' 
                          : 'Use the "Start New Conversation" button above to connect with professionals'}
                      </p>
                    </div>
                  ) : (
                    <div>
                      {filteredConversations.map(({ user, lastMessage, unreadCount }) => (
                        <div
                          key={user.id}
                          className={`p-4 cursor-pointer transition-colors border-b border-gray-100 ${
                            selectedUser?.id === user.id
                              ? 'bg-navy/10 lg:border-l-4 lg:border-l-navy'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => handleSelectConversation(user as User)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Avatar 
                                className="w-12 h-12 border-2 border-gray-200 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/profile/${user.id}`);
                                }}
                              >
                                <AvatarImage src={user.profileImageUrl || ""} alt={user.firstName || ""} />
                                <AvatarFallback className="bg-navy text-white font-semibold">
                                  {user.firstName?.[0]}{user.lastName?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              {unreadCount > 0 && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                  {unreadCount}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p 
                                  className="font-semibold text-gray-900 text-sm truncate cursor-pointer hover:underline"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLocation(`/profile/${user.id}`);
                                  }}
                                >
                                  {user.firstName} {user.lastName}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {lastMessage.createdAt && new Date(lastMessage.createdAt).toLocaleTimeString([], { 
                                    hour: '2-digit', 
                                    minute: '2-digit' 
                                  })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {lastMessage.content}
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <p className="text-xs text-gray-500">
                                  {user.title} at {user.company}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

                {/* Chat Interface - Desktop Only */}
                <div className="hidden lg:block lg:col-span-2">
                  {selectedUser && currentUser ? (
                    <MessageInterface
                      currentUser={currentUser}
                      otherUser={selectedUser}
                      messages={selectedConversation || []}
                      onSendMessage={handleSendMessage}
                      matchId={matches?.find((m: any) => m.matchedUserId === selectedUser.id)?.id}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-gray-50">
                      <div className="text-center">
                        <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a conversation</h3>
                        <p className="text-gray-500">Choose a contact to start messaging</p>
                        <Button 
                          onClick={() => setShowNewMessageDialog(true)}
                          className="mt-6 bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Start New Conversation
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* New Message Dialog */}
      <Dialog open={showNewMessageDialog} onOpenChange={setShowNewMessageDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Start New Conversation</DialogTitle>
            <DialogDescription>
              Select a matched professional to start messaging
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search by name, company, or title..."
                value={newMessageSearch}
                onChange={(e) => setNewMessageSearch(e.target.value)}
                className="pl-9 pr-3 py-2 w-full"
              />
            </div>

            {/* Available Matches List */}
            <div className="overflow-y-auto max-h-[50vh] space-y-2">
              {availableMatches.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {newMessageSearch 
                      ? 'No matches found for your search' 
                      : matches && matches.length > 0
                        ? 'You have conversations with all your matches'
                        : 'No matches available'}
                  </p>
                  {!matches || matches.length === 0 ? (
                    <Button 
                      onClick={() => {
                        setShowNewMessageDialog(false);
                        setLocation('/discover');
                      }}
                      className="mt-4 bg-stak-copper hover:bg-stak-dark-copper text-stak-black"
                    >
                      Find New Matches
                    </Button>
                  ) : null}
                </div>
              ) : (
                availableMatches.map((match) => (
                  <div
                    key={match.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleStartConversation(match.matchedUser)}
                  >
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage 
                          src={match.matchedUser.profileImageUrl || ""} 
                          alt={match.matchedUser.firstName || ""} 
                        />
                        <AvatarFallback className="bg-stak-copper/20 text-stak-copper font-semibold">
                          {match.matchedUser.firstName?.[0]}{match.matchedUser.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">
                            {match.matchedUser.firstName} {match.matchedUser.lastName}
                          </p>
                          <Badge variant="outline" className="text-stak-copper border-stak-copper">
                            {match.matchScore}% Match
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {match.matchedUser.title}
                          {match.matchedUser.company && ` at ${match.matchedUser.company}`}
                        </p>
                        {match.matchedUser.location && (
                          <p className="text-xs text-gray-500 mt-1">
                            📍 {match.matchedUser.location}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
