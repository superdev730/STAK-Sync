import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  Users,
  Calendar,
  Lightbulb,
  Send,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export default function ConnectRequest() {
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  const [isCommonGroundOpen, setIsCommonGroundOpen] = useState(false);
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

  if (!userId || userLoading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-32"></div>
            <div className="bg-gray-100 rounded-lg p-4 h-20"></div>
            <div className="bg-gray-100 rounded-lg p-4 h-32"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/matches')}
            className="mb-4"
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
    <div className="min-h-screen bg-white">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        {/* Compact Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/matches')}
            size="sm"
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-lg font-bold text-stak-black">Connect with {user.firstName}</h1>
          <div className="w-16"></div>
        </div>

        {/* Compact User Preview */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center space-x-3">
              <Avatar className="w-12 h-12">
                <AvatarImage 
                  src={user.profileImageUrl || ""} 
                  alt={`${user.firstName} ${user.lastName}`} 
                />
                <AvatarFallback className="bg-stak-copper/10 text-stak-copper font-semibold">
                  {user.firstName?.[0]}{user.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-stak-black truncate">
                  {user.firstName} {user.lastName}
                </h2>
                <div className="text-sm text-gray-600 space-y-0.5">
                  {user.title && (
                    <div className="flex items-center">
                      <Briefcase className="h-3 w-3 mr-1 shrink-0" />
                      <span className="truncate">{user.title}{user.company && ` at ${user.company}`}</span>
                    </div>
                  )}
                  {user.location && (
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1 shrink-0" />
                      <span className="truncate">{user.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Collapsible AI Insights */}
        {commonGround && !aiLoading && (
          <Collapsible open={isCommonGroundOpen} onOpenChange={setIsCommonGroundOpen}>
            <Card className="border border-stak-copper/30 bg-gradient-to-r from-stak-copper/5 to-stak-forest/5">
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-stak-copper/10 transition-colors p-3">
                  <CardTitle className="text-sm font-medium text-stak-black flex items-center justify-between">
                    <div className="flex items-center">
                      <Lightbulb className="h-4 w-4 mr-2 text-stak-copper" />
                      AI Insights ({Object.keys(commonGround).filter(key => commonGround[key]?.length > 0).length} connections found)
                    </div>
                    {isCommonGroundOpen ? (
                      <ChevronUp className="h-4 w-4 text-stak-copper" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-stak-copper" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="pt-0 pb-3 space-y-3">
                  {commonGround.sharedEvents && commonGround.sharedEvents.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-stak-black mb-1 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Events ({commonGround.sharedEvents.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {commonGround.sharedEvents.slice(0, 3).map((event: string, index: number) => (
                          <Badge key={index} variant="outline" className="border-stak-copper text-stak-copper bg-white text-xs py-0">
                            {event}
                          </Badge>
                        ))}
                        {commonGround.sharedEvents.length > 3 && (
                          <Badge variant="outline" className="border-gray-300 text-gray-600 bg-white text-xs py-0">
                            +{commonGround.sharedEvents.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {commonGround.sharedIndustries && commonGround.sharedIndustries.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-stak-black mb-1 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        Industries ({commonGround.sharedIndustries.length})
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {commonGround.sharedIndustries.slice(0, 3).map((industry: string, index: number) => (
                          <Badge key={index} variant="outline" className="border-stak-forest text-stak-forest bg-white text-xs py-0">
                            {industry}
                          </Badge>
                        ))}
                        {commonGround.sharedIndustries.length > 3 && (
                          <Badge variant="outline" className="border-gray-300 text-gray-600 bg-white text-xs py-0">
                            +{commonGround.sharedIndustries.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {commonGround.suggestedMessages && commonGround.suggestedMessages.length > 0 && (
                    <div>
                      <h4 className="text-xs font-medium text-stak-black mb-2">Message Templates</h4>
                      <div className="space-y-2">
                        {commonGround.suggestedMessages.slice(0, 2).map((suggestion: string, index: number) => (
                          <div key={index} className="bg-white p-2 rounded border border-stak-copper/20">
                            <p className="text-xs text-gray-700 mb-2 line-clamp-2">{suggestion}</p>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => useSuggestedMessage(suggestion)}
                              className="border-stak-copper text-stak-copper hover:bg-stak-copper hover:text-white text-xs h-6 px-2"
                            >
                              Use Template
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}

        {/* Compact Message Section */}
        <Card className="border border-gray-200 shadow-sm">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="message" className="font-medium text-stak-black">
                Your Message
              </Label>
              <span className="text-xs text-gray-500">
                {message.length}/500
              </span>
            </div>
            <Textarea
              id="message"
              placeholder={`Hi ${user.firstName}, I'd love to connect because...`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              className="min-h-[80px] border-gray-300 focus:border-stak-copper resize-none text-sm"
            />
            <p className="text-xs text-gray-500">
              💡 Mention shared interests or goals for better response rates
            </p>

            {/* Action Buttons */}
            <div className="flex space-x-2 pt-2">
              <Button
                onClick={handleSendRequest}
                disabled={connectMutation.isPending || !message.trim()}
                className="flex-1 bg-stak-copper hover:bg-stak-copper/90 text-white"
              >
                {connectMutation.isPending ? (
                  "Sending..."
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Request
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation('/matches')}
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
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