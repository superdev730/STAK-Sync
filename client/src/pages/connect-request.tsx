import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  Target, 
  Users,
  Calendar,
  Lightbulb,
  Send
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function ConnectRequest() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const searchParams = new URLSearchParams(window.location.search);
  const userId = searchParams.get('userId');
  const matchId = searchParams.get('matchId');

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/users", userId],
    enabled: !!userId,
  });

  const { data: commonGround, isLoading: aiLoading } = useQuery({
    queryKey: ["/api/ai/common-ground", userId],
    enabled: !!userId,
  });

  const connectMutation = useMutation({
    mutationFn: async (data: { userId: string; matchId?: string; message: string }) => {
      return await apiRequest("POST", "/api/connections/request", data);
    },
    onSuccess: () => {
      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      setLocation('/matches');
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Request",
        description: error.message || "Something went wrong while sending the connection request.",
        variant: "destructive",
      });
    },
  });

  const handleSendRequest = () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User information is missing.",
        variant: "destructive",
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: "Message Required",
        description: "Please add a personal message to your connection request.",
        variant: "destructive",
      });
      return;
    }

    connectMutation.mutate({
      userId: userId,
      matchId: matchId || undefined,
      message: message.trim()
    });
  };

  const useSuggestedMessage = (suggestedMessage: string) => {
    setMessage(suggestedMessage);
  };

  if (!userId) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-gray-600">User not found</p>
        </div>
      </div>
    );
  }

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-32 mb-6"></div>
            <div className="bg-white rounded-lg border border-gray-200 p-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-32"></div>
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/matches')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Matches
          </Button>
          <p className="text-center text-gray-600">User not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Send Connection Request</h1>
          <p className="text-gray-600">Connect with a fellow STAK Signal member</p>
        </div>

        {/* User Preview */}
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="w-16 h-16 border-2 border-gray-200">
                <AvatarImage 
                  src={user.profileImageUrl || ""} 
                  alt={`${user.firstName} ${user.lastName}`} 
                />
                <AvatarFallback className="bg-gray-300 text-gray-700 text-lg font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                {user.title && (
                  <div className="flex items-center text-gray-700 mt-1">
                    <Briefcase className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{user.title}</span>
                    {user.company && (
                      <span className="text-gray-600"> at {user.company}</span>
                    )}
                  </div>
                )}
                {user.location && (
                  <div className="flex items-center text-gray-600 mt-1">
                    <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                    <span>{user.location}</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Common Ground Suggestions */}
        {commonGround && !aiLoading && (
          <Card className="bg-blue-50 border border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-blue-900 flex items-center">
                <Lightbulb className="h-5 w-5 mr-2 text-blue-600" />
                AI Suggested Common Ground
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {commonGround.sharedEvents && commonGround.sharedEvents.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Shared Events
                  </h4>
                  <div className="space-y-1">
                    {commonGround.sharedEvents.map((event: any, index: number) => (
                      <p key={index} className="text-sm text-blue-700">• {event.title}</p>
                    ))}
                  </div>
                </div>
              )}
              
              {commonGround.sharedIndustries && commonGround.sharedIndustries.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Shared Industries
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {commonGround.sharedIndustries.map((industry: string, index: number) => (
                      <Badge key={index} variant="outline" className="border-blue-300 text-blue-700 bg-blue-100">
                        {industry}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {commonGround.suggestedMessages && commonGround.suggestedMessages.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-800 mb-2">AI Suggested Messages</h4>
                  <div className="space-y-2">
                    {commonGround.suggestedMessages.map((suggestion: string, index: number) => (
                      <div key={index} className="bg-white p-3 rounded border border-blue-200">
                        <p className="text-sm text-gray-700 mb-2">{suggestion}</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => useSuggestedMessage(suggestion)}
                          className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        >
                          Use This Message
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Connection Message */}
        <Card className="bg-white border border-gray-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Personal Message</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="message" className="text-gray-700">
                Introduce yourself and explain why you'd like to connect
              </Label>
              <Textarea
                id="message"
                placeholder="Hi [Name], I noticed we both work in [industry/have interest in X]. I'd love to connect and learn more about your experience with..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[120px] mt-2 border-gray-300 focus:border-blue-500"
              />
              <p className="text-sm text-gray-500 mt-2">
                Personalized messages get better response rates. Mention shared interests, events, or goals.
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleSendRequest}
                disabled={connectMutation.isPending || !message.trim()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              >
                {connectMutation.isPending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Connection Request
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/matches')}
                className="border-gray-300 text-gray-700"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}