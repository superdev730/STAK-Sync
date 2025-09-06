import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export default function VerificationSuccess() {
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const success = urlParams.get('success');
  const errorParam = urlParams.get('error');

  useEffect(() => {
    // Simulate a brief loading state to show the verification is being processed
    const timer = setTimeout(() => {
      setIsLoading(false);
      
      if (success === 'true') {
        setIsVerified(true);
      } else if (errorParam) {
        setError(decodeURIComponent(errorParam));
      } else {
        setError('Unknown verification status');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [success, errorParam]);

  const handleContinue = () => {
    // Redirect to login page
    window.location.href = '/login';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <Card className="border-gray-700 bg-white shadow-xl">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <Loader2 className="mx-auto w-12 h-12 text-[#CD853F] animate-spin" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Verifying Your Email</h3>
                  <p className="text-sm text-gray-600 mt-1">Please wait while we confirm your account...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-2">STAK Sync</h1>
            <p className="text-gray-400">Get in Sync, Cut the Noise</p>
          </div>

          <Card className="border-gray-700 bg-white shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Email Verified!</CardTitle>
              <CardDescription className="text-gray-600">
                Your STAK Sync account has been successfully verified
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-green-800">
                    <p className="font-medium mb-2">🎉 Welcome to STAK Sync!</p>
                    <p className="text-sm">
                      Your account is now active and you can start networking with the STAK ecosystem.
                    </p>
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-2">
                  <p>✓ Email verification complete</p>
                  <p>✓ Account activated</p>
                  <p>✓ AI matching enabled</p>
                  <p>✓ Profile visibility enabled</p>
                </div>
                
                <Button 
                  onClick={handleContinue}
                  className="w-full bg-[#CD853F] hover:bg-[#b8753a] text-white"
                  data-testid="button-continue-to-app"
                >
                  Continue to STAK Sync
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Error state
  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">STAK Sync</h1>
          <p className="text-gray-400">Get in Sync, Cut the Noise</p>
        </div>

        <Card className="border-gray-700 bg-white shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">Verification Failed</CardTitle>
            <CardDescription className="text-gray-600">
              There was a problem verifying your email address
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {error || "The verification link is invalid or has expired."}
              </AlertDescription>
            </Alert>
            
            <div className="text-center space-y-4">
              <div className="text-sm text-gray-600 space-y-2">
                <p>This could happen if:</p>
                <p>• The verification link has expired (24 hour limit)</p>
                <p>• The link has already been used</p>
                <p>• The link was damaged when copied</p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => window.location.href = '/signup'}
                  className="w-full bg-[#CD853F] hover:bg-[#b8753a] text-white"
                  data-testid="button-try-again"
                >
                  Try Signing Up Again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/login'}
                  className="w-full"
                  data-testid="button-back-to-login"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}