import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  CalendarDays, MapPin, Users, TrendingUp, 
  AlertCircle, Sparkles, UserCircle, ArrowRight, 
  Clock, CheckCircle, Star
} from "lucide-react";
import { format } from "date-fns";

interface TeaserMatch {
  handle: string;
  location: string;
  score: number;
  reasons: string[];
}

interface TeaserData {
  event: {
    title: string;
    date: string;
    location: string;
  };
  matches: TeaserMatch[];
  expiresAt: string;
}

export default function TeaserPage() {
  const { token } = useParams<{ token: string }>();

  const { data, isLoading, error } = useQuery<TeaserData>({
    queryKey: [`/api/teaser/${token}`],
    retry: false,
    enabled: !!token
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    const errorMessage = error?.message || "Failed to load preview";
    const isExpired = errorMessage.includes("expired");
    const isInvalid = errorMessage.includes("Invalid") || errorMessage.includes("not found");
    const isUsed = errorMessage.includes("already used");

    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <CardTitle className="text-2xl">
                {isExpired ? "Link Expired" : isUsed ? "Link Already Used" : "Invalid Link"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {isExpired ? (
                  "This invitation link has expired. Please contact the event organizer for a new invitation."
                ) : isUsed ? (
                  "This invitation has already been activated. Please log in to your account to access the event."
                ) : (
                  "This invitation link is invalid. Please check the link or contact the event organizer."
                )}
              </AlertDescription>
            </Alert>
            <div className="mt-6 space-y-3">
              <Button asChild className="w-full" variant="outline">
                <Link href="/login">
                  Go to Login
                </Link>
              </Button>
              <Button asChild className="w-full" variant="ghost">
                <Link href="/">
                  Return Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate days until expiry
  const expiresAt = new Date(data.expiresAt);
  const now = new Date();
  const hoursUntilExpiry = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60)));
  const isExpiringSoon = hoursUntilExpiry < 24;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header with STAK Sync branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-[#CD853F]" />
            <h1 className="text-3xl font-bold text-gray-900">STAK Sync</h1>
          </div>
          <p className="text-gray-600">Your AI-Powered Networking Concierge</p>
        </div>

        {/* Expiry warning */}
        {isExpiringSoon && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 font-medium">
              This invitation expires in {hoursUntilExpiry} hour{hoursUntilExpiry !== 1 ? 's' : ''}. 
              Activate now to secure your spot!
            </AlertDescription>
          </Alert>
        )}

        {/* Event Details Card */}
        <Card className="mb-8 border-2 border-[#CD853F]/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[#CD853F]/10 to-[#CD853F]/5">
            <CardTitle className="text-2xl flex items-center gap-2">
              <CalendarDays className="h-6 w-6 text-[#CD853F]" />
              You're Invited!
            </CardTitle>
            <CardDescription className="text-lg mt-2">
              {data.event.title}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarDays className="h-5 w-5 text-[#CD853F]" />
                <span>{format(new Date(data.event.date), "MMMM d, yyyy 'at' h:mm a")}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-5 w-5 text-[#CD853F]" />
                <span>{data.event.location}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Matches Preview */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#CD853F]" />
                  Your AI-Curated Matches
                </CardTitle>
                <CardDescription className="mt-1">
                  We've analyzed the attendee list and found your top networking opportunities
                </CardDescription>
              </div>
              <Badge className="bg-[#CD853F] text-white">
                {data.matches.length} Matches
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.matches.map((match, index) => (
                <div 
                  key={index} 
                  className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#CD853F]/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#CD853F]/20 to-[#CD853F]/10 rounded-full flex items-center justify-center">
                        <UserCircle className="w-6 h-6 text-[#CD853F]" />
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900 mb-1">
                          {match.handle}
                        </div>
                        <div className="text-sm text-gray-600 mb-2">
                          {match.location}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {match.reasons.slice(0, 3).map((reason, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {reason}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-[#CD853F] font-bold text-lg">
                        <TrendingUp className="w-5 h-5" />
                        {Math.round(match.score)}%
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Match Score</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Progress value={match.score} className="h-2" />
                  </div>
                </div>
              ))}
            </div>

            {/* Blur overlay for additional matches */}
            {data.matches.length > 0 && (
              <div className="relative mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                <div className="absolute inset-0 backdrop-blur-sm bg-white/60 z-10 flex items-center justify-center">
                  <div className="text-center">
                    <Star className="w-8 h-8 text-[#CD853F] mx-auto mb-2" />
                    <p className="font-semibold text-gray-900">More Matches Available</p>
                    <p className="text-sm text-gray-600 mt-1">Activate to see complete profiles</p>
                  </div>
                </div>
                <div className="blur-sm pointer-events-none">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full" />
                    <div className="flex-1">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-gray-200 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CTA Section */}
        <Card className="bg-gradient-to-r from-[#CD853F]/10 to-[#CD853F]/5 border-2 border-[#CD853F]/20">
          <CardContent className="p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              Ready to Network Smarter?
            </h3>
            <p className="text-gray-700 mb-6 max-w-2xl mx-auto">
              Activate your invitation to unlock full profiles, send connection requests, 
              and access AI-powered conversation starters tailored to each match.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                asChild 
                size="lg" 
                className="bg-[#CD853F] hover:bg-[#B8732F] text-white font-semibold"
              >
                <Link href={`/activate/${token}`}>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Activate & See Full Profiles
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No payment required • Takes less than 2 minutes
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>By activating, you agree to STAK Sync's Terms of Service and Privacy Policy</p>
          <div className="mt-2">
            <Link href="/opt-out" className="text-[#CD853F] hover:underline">
              Prefer not to receive invitations?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}