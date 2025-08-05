import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import MessageInterface from "@/components/MessageInterface";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message, User } from "@shared/schema";

export default function Messages() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: conversations, isLoading } = useQuery<(Message & { sender: User; receiver: User })[]>({
    queryKey: ["/api/conversations"],
  });

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



  // Dummy conversations for demonstration when no real conversations exist
  const dummyConversations = [
    {
      user: {
        id: "2",
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
        senderId: "2",
        receiverId: currentUser?.id || "",
        isRead: false
      },
      unreadCount: 2
    },
    {
      user: {
        id: "3", 
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
        senderId: "3",
        receiverId: currentUser?.id || "",
        isRead: false
      },
      unreadCount: 1
    },
    {
      user: {
        id: "4",
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
        receiverId: "4",
        isRead: true
      },
      unreadCount: 0
    },
    {
      user: {
        id: "5",
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
        senderId: "5",
        receiverId: currentUser?.id || "",
        isRead: true
      },
      unreadCount: 0
    }
  ];

  // Get unique conversations grouped by users
  const getUniqueConversations = () => {
    if (!currentUser) return dummyConversations;

    if (!conversations || conversations.length === 0) return dummyConversations;

    const userMap = new Map<string, { user: User; lastMessage: Message & { sender: User; receiver: User }; unreadCount: number }>();

    conversations.forEach((message) => {
      const otherUser = message.senderId === currentUser.id ? message.receiver : message.sender;
      
      if (!userMap.has(otherUser.id) || new Date(message.createdAt) > new Date(userMap.get(otherUser.id)!.lastMessage.createdAt)) {
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

    return Array.from(userMap.values()).sort((a, b) => 
      new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
    );
  };

  const uniqueConversations = getUniqueConversations();

  // Mark messages as read when conversation is selected
  useEffect(() => {
    if (selectedUser && currentUser) {
      apiRequest(`/api/conversations/${selectedUser.id}/read`, 'PUT', {}).catch(console.error);
    }
  }, [selectedUser, currentUser]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="bg-navy border border-navy rounded-lg p-8 mb-8 text-center shadow-sm">
          <h1 className="text-4xl font-bold text-white mb-2">Professional Conversations</h1>
          <p className="text-xl text-blue-100">Secure messaging platform designed for meaningful business connections</p>
        </div>

        {/* Messages Interface */}
        <Card className="bg-white border border-gray-200 shadow-sm overflow-hidden">
          <CardContent className="p-0">
            <div className="grid lg:grid-cols-3 h-[600px]">
              {/* Conversations List */}
              <div className="border-r border-gray-200 bg-white">
                <div className="p-4 border-b border-gray-200 bg-navy">
                  <h3 className="font-semibold text-white text-lg">Messages</h3>
                  <p className="text-sm text-blue-100 mt-1">{uniqueConversations.length} conversations</p>
                </div>
                <div className="overflow-y-auto" style={{ height: 'calc(600px - 80px)' }}>
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
                  ) : uniqueConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-700 font-medium">No conversations yet</p>
                      <p className="text-sm text-gray-500 mt-2">Start connecting with professionals to begin messaging</p>
                    </div>
                  ) : (
                    <div>
                      {uniqueConversations.map(({ user, lastMessage, unreadCount }) => (
                        <div
                          key={user.id}
                          className={`p-4 cursor-pointer transition-colors border-b border-gray-100 ${
                            selectedUser?.id === user.id
                              ? 'bg-navy/10 border-l-4 border-l-navy'
                              : 'hover:bg-gray-50'
                          }`}
                          onClick={() => setSelectedUser(user)}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="relative">
                              <Avatar className="w-12 h-12 border-2 border-gray-200">
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
                                <p className="font-semibold text-gray-900 text-sm truncate">
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

            {/* Chat Interface */}
            <div className="lg:col-span-2">
              {selectedUser && currentUser ? (
                <MessageInterface
                  currentUser={currentUser}
                  otherUser={selectedUser}
                  messages={selectedConversation || []}
                  onSendMessage={handleSendMessage}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <div className="text-center">
                    <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a conversation</h3>
                    <p className="text-gray-500">Choose a contact to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  );
}
