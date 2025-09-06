import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, Mail, AlertCircle, Loader2 } from "lucide-react";

const signupSchema = z.object({
  firstName: z.string().min(1, "Please enter your first name").max(50, "First name must be less than 50 characters"),
  lastName: z.string().min(1, "Please enter your last name").max(50, "Last name must be less than 50 characters"),
  email: z.string()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address (like name@example.com)")
    .toLowerCase(),
});

type SignupForm = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>("");

  const form = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
    mode: "onChange", // Enable real-time validation
  });

  // Add form validation error logging
  const formErrors = form.formState.errors;
  if (Object.keys(formErrors).length > 0) {
    console.log("🔍 FORM DEBUG: Validation errors", formErrors);
  }

  const onSubmit = async (data: SignupForm) => {
    setIsSubmitting(true);
    setError(null);

    console.log("🔍 SIGNUP DEBUG: Starting signup process", { 
      email: data.email, 
      firstName: data.firstName, 
      lastName: data.lastName,
      endpoint: "/api/signup"
    });

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      console.log("🔍 SIGNUP DEBUG: Response received", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const result = await response.json();
      console.log("🔍 SIGNUP DEBUG: Response body", result);

      if (!response.ok) {
        // Handle structured error responses with suggestions
        let errorMessage = result.error || "Failed to create account";
        
        if (result.suggestion) {
          errorMessage = `${result.error}. ${result.suggestion}`;
        } else if (result.error && result.error.includes("already exists")) {
          errorMessage = "An account with this email already exists. Would you like to sign in instead?";
        } else if (result.error && result.error.includes("invalid email")) {
          errorMessage = "Please enter a valid email address (like name@example.com)";
        } else if (result.error && result.error.includes("required")) {
          errorMessage = "Please fill in all required fields";
        }
        
        throw new Error(errorMessage);
      }

      setUserEmail(data.email);
      setSuccess(true);
      
    } catch (err) {
      console.error("🔍 SIGNUP DEBUG: Caught error", err);
      console.error("🔍 SIGNUP DEBUG: Error type", typeof err);
      console.error("🔍 SIGNUP DEBUG: Error details", {
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace',
        name: err instanceof Error ? err.name : 'Unknown name'
      });
      
      let errorMessage = "Something went wrong. Please try again.";
      
      if (err instanceof Error) {
        errorMessage = err.message;
        console.log("🔍 SIGNUP DEBUG: Processing error message", errorMessage);
        
        // Handle common error cases
        if (errorMessage.includes("already exists")) {
          errorMessage += " Please try signing in instead, or use a different email address.";
        }
      }
      
      console.log("🔍 SIGNUP DEBUG: Final error message to user", errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!userEmail) return;
    
    try {
      const response = await fetch("/api/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: userEmail }),
        credentials: "include",
      });

      const result = await response.json();
      
      if (response.ok) {
        setError(null);
        // Show success message briefly
        setError("Verification email sent! Please check your inbox.");
        setTimeout(() => setError(null), 3000);
      } else {
        setError(result.error || "Failed to resend verification email");
      }
    } catch (err) {
      setError("Failed to resend verification email. Please try again.");
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          <Card className="border-gray-700 bg-white shadow-xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold text-gray-900">Check Your Email</CardTitle>
              <CardDescription className="text-gray-600">
                We've sent a verification link to <strong>{userEmail}</strong>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-center space-x-2 text-blue-800">
                    <Mail className="w-5 h-5" />
                    <span className="font-medium">Verification Required</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-2">
                    Please click the verification link in your email to complete your registration and access STAK Sync.
                  </p>
                </div>
                
                <div className="text-sm text-gray-600 space-y-2">
                  <p>• Check your spam folder if you don't see the email</p>
                  <p>• The verification link expires in 24 hours</p>
                  <p>• You can only access STAK Sync after verifying your email</p>
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={handleResendVerification}
                  className="w-full"
                  data-testid="button-resend-verification"
                >
                  Resend Verification Email
                </Button>
                
                {error && (
                  <Alert className={error.includes("sent") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                    <AlertCircle className={`h-4 w-4 ${error.includes("sent") ? "text-green-600" : "text-red-600"}`} />
                    <AlertDescription className={error.includes("sent") ? "text-green-800" : "text-red-800"}>
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141414] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">STAK Sync</h1>
          <p className="text-gray-400">Get in Sync, Cut the Noise</p>
        </div>

        {/* Signup Form */}
        <Card className="border-gray-700 bg-white shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Create Your Account
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Join the exclusive STAK networking platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="John" 
                            {...field} 
                            data-testid="input-firstName"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Doe" 
                            {...field} 
                            data-testid="input-lastName"
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="john@example.com" 
                          {...field} 
                          data-testid="input-email"
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-[#CD853F] hover:bg-[#b8753a] text-white"
                  disabled={isSubmitting}
                  data-testid="button-signup"
                  onClick={(e) => {
                    console.log("🔍 FORM DEBUG: Submit button clicked");
                    console.log("🔍 FORM DEBUG: Current form values", form.getValues());
                    console.log("🔍 FORM DEBUG: Current form errors", form.formState.errors);
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <a href="/login" className="text-[#CD853F] hover:underline font-medium">
                  Sign in here
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
        
        <div className="text-center">
          <p className="text-xs text-gray-500">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}