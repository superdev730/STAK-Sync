import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Database, Users, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface ImportResults {
  imported: number;
  updated: number;
  skipped: number;
  errors: string[];
}

interface ImportResponse {
  success: boolean;
  message: string;
  results: ImportResults;
  totalUsers: number;
}

export function STAKReceptionImport() {
  const [connectionString, setConnectionString] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [connectionTest, setConnectionTest] = useState<{
    success: boolean;
    userCount?: number;
    message: string;
  } | null>(null);
  const [importResults, setImportResults] = useState<ImportResponse | null>(null);
  const { toast } = useToast();

  const testConnection = async () => {
    if (!connectionString.trim()) {
      toast({
        title: "Connection String Required",
        description: "Please enter a database connection string",
        variant: "destructive",
      });
      return;
    }

    setIsConnecting(true);
    setConnectionTest(null);

    try {
      const response = await apiRequest("POST", "/api/admin/import/stak-reception/test", {
        connectionString: connectionString.trim()
      });
      
      const result = await response.json();
      
      if (result.success) {
        setConnectionTest({
          success: true,
          userCount: result.userCount,
          message: result.message
        });
        toast({
          title: "Connection Successful",
          description: `Found ${result.userCount} users in STAK Reception App database`,
        });
      } else {
        setConnectionTest({
          success: false,
          message: result.message || "Connection failed"
        });
        toast({
          title: "Connection Failed",
          description: result.message || "Unable to connect to database",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionTest({
        success: false,
        message: "Failed to test connection"
      });
      toast({
        title: "Connection Error",
        description: "Unable to test database connection",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const startImport = async () => {
    if (!connectionTest?.success) {
      toast({
        title: "Test Connection First",
        description: "Please test the database connection before importing",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportResults(null);

    try {
      const response = await apiRequest("POST", "/api/admin/import/stak-reception", {
        connectionString: connectionString.trim()
      });
      
      const result = await response.json();
      
      setImportResults(result);
      
      if (result.success) {
        toast({
          title: "Import Completed",
          description: `Successfully imported ${result.results.imported} users and updated ${result.results.updated} existing users`,
        });
      } else {
        toast({
          title: "Import Failed",
          description: result.message || "Import process failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Import Error",
        description: "Unable to complete import process",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            STAK Reception App Import
          </CardTitle>
          <CardDescription>
            Connect to the STAK Reception App database and import all users into STAK Sync
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection String Input */}
          <div className="space-y-2">
            <label htmlFor="connection-string" className="text-sm font-medium">
              Database Connection String
            </label>
            <Input
              id="connection-string"
              type="password"
              placeholder="postgresql://username:password@host:port/database"
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-xs text-gray-500">
              Enter the PostgreSQL connection string for the STAK Reception App database
            </p>
          </div>

          {/* Test Connection Button */}
          <div className="flex gap-2">
            <Button
              onClick={testConnection}
              disabled={isConnecting || !connectionString.trim()}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Database className="h-4 w-4" />
              )}
              Test Connection
            </Button>

            {connectionTest?.success && (
              <Button
                onClick={startImport}
                disabled={isImporting}
                className="flex items-center gap-2"
              >
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Users className="h-4 w-4" />
                )}
                Import Users
              </Button>
            )}
          </div>

          {/* Connection Test Results */}
          {connectionTest && (
            <Alert className={connectionTest.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <div className="flex items-center gap-2">
                {connectionTest.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <AlertDescription className="flex-1">
                  {connectionTest.message}
                  {connectionTest.success && connectionTest.userCount && (
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {connectionTest.userCount} users found
                      </Badge>
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Importing users from STAK Reception App...</span>
              </div>
              <Progress value={undefined} className="w-full" />
            </div>
          )}

          {/* Import Results */}
          {importResults && (
            <div className="space-y-4">
              <Alert className={importResults.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className="flex items-center gap-2">
                  {importResults.success ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>
                    {importResults.message}
                  </AlertDescription>
                </div>
              </Alert>

              {importResults.success && importResults.results && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">
                        {importResults.results.imported}
                      </div>
                      <p className="text-xs text-gray-500">New Users Imported</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-blue-600">
                        {importResults.results.updated}
                      </div>
                      <p className="text-xs text-gray-500">Existing Users Updated</p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-gray-600">
                        {importResults.results.skipped}
                      </div>
                      <p className="text-xs text-gray-500">Users Skipped</p>
                    </CardContent>
                  </Card>
                </div>
              )}

              {importResults.results?.errors && importResults.results.errors.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm text-red-600">Import Errors</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {importResults.results.errors.map((error, index) => (
                        <div key={index} className="text-xs text-red-600 font-mono bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}