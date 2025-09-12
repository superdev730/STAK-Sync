import { Link } from "wouter";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Users, Gift, Home, Calendar } from "lucide-react";

export default function EventRecap() {
  const { eventId } = useParams();
  
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Recap</h1>
          <p className="text-gray-600">Thanks for joining us! Here's everything from the event.</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#CD853F]" />
                Session Materials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Presentation slides</li>
                <li>• Recording links</li>
                <li>• Speaker notes</li>
                <li>• Resource downloads</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#CD853F]" />
                Follow-up Intros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Pending connection requests</li>
                <li>• Recommended matches from the event</li>
                <li>• Attendee directory</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-[#CD853F]" />
                Sponsor Offers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-gray-600">
                <li>• Exclusive discounts</li>
                <li>• Free trials</li>
                <li>• Partner benefits</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 flex gap-4">
          <Link href="/">
            <Button variant="outline" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Back to STAK Sync
            </Button>
          </Link>
          <Link href="/events">
            <Button variant="outline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Browse More Events
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}