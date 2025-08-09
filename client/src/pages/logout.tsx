import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Logout() {
  const { user, isAuthenticated } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // If user is not authenticated, redirect to home
    if (!isAuthenticated && !isLoggingOut) {
      window.location.href = "/";
    }
  }, [isAuthenticated, isLoggingOut]);

  const handleLogout = () => {
    setIsLoggingOut(true);
    // Small delay to show the logging out state
    setTimeout(() => {
      window.location.href = "/api/logout";
    }, 1000);
  };

  const handleCancel = () => {
    window.history.back();
  };

  if (isLoggingOut) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center">
                <CheckCircle className="h-12 w-12 text-green-600 animate-pulse" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Signing Out...</h2>
              <p className="text-gray-600">
                You are being signed out of STAK Sync. Thank you for using our platform!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <LogOut className="h-12 w-12 text-gray-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Sign Out of STAK Sync
          </CardTitle>
          <CardDescription className="text-gray-600">
            Are you sure you want to sign out? You'll need to sign in again to access your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {user && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Currently signed in as:</p>
              <p className="font-medium text-gray-900">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
          )}
          
          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Yes, Sign Me Out
            </Button>
            <Button 
              onClick={handleCancel}
              variant="outline" 
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}