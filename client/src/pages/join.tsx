import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function JoinPage() {
  const [email, setEmail] = useState("");
  const [eventId, setEventId] = useState("");
  const [processing, setProcessing] = useState(false);
  const [link, setLink] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();
  const { toast } = useToast();

  async function submit() {
    setProcessing(true);
    setError(undefined);
    setLink(undefined);
    
    try {
      const res = await fetch("/api/join/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, eventId })
      });
      
      const j = await res.json();
      
      if (!res.ok) {
        setError(j.error || "Could not find your registration");
      } else {
        setLink(j.url);
        toast({
          title: "Success!",
          description: "Your invite link has been generated.",
        });
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="container max-w-lg mx-auto py-10 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Join STAK Sync</CardTitle>
          <CardDescription>
            Enter the email you used to register for the event to preview your matches.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              placeholder="Event ID (optional)"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              disabled={processing}
            />
            <Input
              placeholder="Your event email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={processing}
              required
            />
          </div>
          
          <Button 
            onClick={submit} 
            disabled={processing || !email}
            className="w-full"
          >
            {processing ? "Checking…" : "Get my invite link"}
          </Button>
          
          {link && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription>
                Your link: <a href={link} className="text-green-600 underline hover:text-green-700">{link}</a>
              </AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}