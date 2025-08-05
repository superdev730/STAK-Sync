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
      <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Avatar className="w-12 h-12">
            <AvatarImage src={otherUser.profileImageUrl || ""} alt={otherUser.firstName || ""} />
            <AvatarFallback className="bg-navy text-white font-semibold">
              {otherUser.firstName?.[0]}{otherUser.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-gray-900 text-lg">
              {otherUser.firstName} {otherUser.lastName}
            </p>
            <p className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
              {isOnline ? '● Online' : '○ Offline'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="ghost" size="icon">
            <Calendar className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
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
