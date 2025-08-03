import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, X } from "lucide-react";
import type { Match, User } from "@shared/schema";

interface MatchCardProps {
  match: Match & { matchedUser: User };
  onConnect: (matchId: string) => void;
  onPass: (matchId: string) => void;
}

export default function MatchCard({ match, onConnect, onPass }: MatchCardProps) {
  const { matchedUser, matchScore } = match;

  return (
    <Card className="border border-gray-200 hover:border-gold transition-all hover:shadow-lg">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <Avatar className="w-16 h-16 rounded-xl">
            <AvatarImage src={matchedUser.profileImageUrl || ""} alt={matchedUser.firstName || ""} />
            <AvatarFallback className="rounded-xl bg-navy text-white">
              {matchedUser.firstName?.[0]}{matchedUser.lastName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-lg font-semibold text-charcoal">
                {matchedUser.firstName} {matchedUser.lastName}
              </h4>
              <Badge className="bg-prof-green text-white">
                {matchScore}% Match
              </Badge>
            </div>
            <p className="text-gold font-medium mb-2">{matchedUser.title}</p>
            {matchedUser.company && (
              <p className="text-sm text-gray-600 mb-2">at {matchedUser.company}</p>
            )}
            <p className="text-gray-600 mb-3 line-clamp-2">{matchedUser.bio}</p>
            <div className="flex items-center justify-between">
              <div className="flex space-x-2">
                {matchedUser.industries?.slice(0, 3).map((industry, index) => (
                  <Badge key={index} variant="secondary" className="bg-light-blue text-navy">
                    {industry}
                  </Badge>
                ))}
              </div>
              <div className="flex space-x-2">
                <Button 
                  onClick={() => onConnect(match.id)}
                  className="bg-navy text-white hover:bg-blue-800"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Connect
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onPass(match.id)}
                  className="border-gray-300 text-gray-600 hover:border-gray-400"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
