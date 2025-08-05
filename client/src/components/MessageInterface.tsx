import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Calendar, MoreVertical } from "lucide-react";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Message, User } from "@shared/schema";

// Function to get match score based on user
function getMatchScore(user: User): number {
  const userMatches: Record<string, number> = {
    'demo-sarah': 92,
    'demo-michael': 89,
    'demo-jessica': 94,
    'demo-david': 87
  };
  return userMatches[user.id] || 85;
}

// Function to get contextual badges for each user
function getUserBadges(user: User) {
  const userBadges: Record<string, Array<{text: string, className: string}>> = {
    'demo-sarah': [
      { text: 'Engineering • AI/ML', className: 'bg-blue-100 text-blue-800' },
      { text: 'Scale-up Experience', className: 'bg-purple-100 text-purple-800' },
      { text: 'Both attending: STAK Summit 2025', className: 'bg-orange-100 text-orange-800' }
    ],
    'demo-michael': [
      { text: 'Venture Capital • Fintech', className: 'bg-blue-100 text-blue-800' },
      { text: 'Series A-C Investments', className: 'bg-purple-100 text-purple-800' },
      { text: 'Shared interest: Enterprise AI', className: 'bg-green-100 text-green-800' }
    ],
    'demo-jessica': [
      { text: 'Healthcare • B2B SaaS', className: 'bg-blue-100 text-blue-800' },
      { text: 'Looking for Series A', className: 'bg-purple-100 text-purple-800' },
      { text: 'Partnership Opportunity', className: 'bg-orange-100 text-orange-800' }
    ],
    'demo-david': [
      { text: 'Investment • Fintech Focus', className: 'bg-blue-100 text-blue-800' },
      { text: 'Portfolio Introductions', className: 'bg-purple-100 text-purple-800' },
      { text: 'STAK Ecosystem Member', className: 'bg-orange-100 text-orange-800' }
    ]
  };
  return userBadges[user.id] || [
    { text: 'Professional Networking', className: 'bg-gray-100 text-gray-800' }
  ];
}

interface MessageInterfaceProps {
  currentUser: User;
  otherUser: User;
  messages: (Message & { sender: User; receiver: User })[];
  onSendMessage: (content: string) => Promise<void>;
}

export default function MessageInterface({ 
  currentUser, 
  otherUser, 
  messages, 
  onSendMessage 
}: MessageInterfaceProps) {
  const [newMessage, setNewMessage] = useState("");
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await onSendMessage(newMessage);
      setNewMessage("");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="p-6 border-b border-gray-200 bg-white">
        <div className="flex items-start space-x-4">
          <Avatar className="w-12 h-12">
            <AvatarImage src={otherUser.profileImageUrl || ""} alt={otherUser.firstName || ""} />
            <AvatarFallback className="bg-gray-300 text-gray-600 font-semibold">
              {otherUser.firstName?.[0]}{otherUser.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="font-semibold text-xl text-black">
                {otherUser.firstName} {otherUser.lastName}
              </h2>
              <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Match: {getMatchScore(otherUser)}%
              </div>
              <span className="text-green-600 text-sm font-medium">● Online</span>
            </div>
            <div className="text-gray-600 mb-3">
              <span className="font-medium">{otherUser.title}</span>
              {otherUser.company && <span> at {otherUser.company}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              {getUserBadges(otherUser).map((badge, index) => (
                <span key={index} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}>
                  {badge.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            Start your conversation with {otherUser.firstName}
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.senderId === currentUser.id;
            return (
              <div
                key={message.id}
                className={`flex items-start space-x-3 ${
                  isOwnMessage ? 'justify-end' : ''
                }`}
              >
                {!isOwnMessage && (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={otherUser.profileImageUrl || ""} alt={otherUser.firstName || ""} />
                    <AvatarFallback className="bg-navy text-white text-xs">
                      {otherUser.firstName?.[0]}{otherUser.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-xs p-4 rounded-2xl ${
                    isOwnMessage
                      ? 'bg-navy text-white rounded-tr-sm shadow-sm'
                      : 'bg-white text-gray-900 rounded-tl-sm shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <p className={`text-xs mt-2 ${
                    isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                  }`}>
                    {message.createdAt && new Date(message.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 border-gray-300 focus:border-navy focus:ring-navy"
          />
          <Button
            onClick={handleSendMessage}
            className="bg-navy text-white p-2 rounded-full hover:bg-blue-800"
            disabled={!newMessage.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
