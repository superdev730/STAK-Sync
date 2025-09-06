import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Schema for signup form
const signupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// Schema for login form
const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type SignupForm = z.infer<typeof signupSchema>;
type LoginForm = z.infer<typeof loginSchema>;

export default function SignupLogin() {
  const [isSignup, setIsSignup] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if already authenticated
  if (user) {
    setLocation("/");
    return null;
  }

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupForm) => {
      setAuthError(null);
      console.log('Signup attempt with data:', { email: data.email, firstName: data.firstName, lastName: data.lastName });
      return apiRequest("/api/auth/signup", "POST", data);
    },
    onSuccess: () => {
      setAuthError(null);
      toast({
        title: "Account created successfully!",
        description: "Welcome to STAK Sync. You're now logged in.",
      });
      // Reload page to refresh auth state
      window.location.href = "/";
    },
    onError: (error: any) => {
      console.error('Signup error details:', error);
      const errorMessage = error.message || "Failed to create account";
      setAuthError(errorMessage);
      toast({
        title: "Signup failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      setAuthError(null);
      console.log('Login attempt with email:', data.email);
      return apiRequest("/api/auth/login", "POST", data);
    },
    onSuccess: () => {
      setAuthError(null);
      toast({
        title: "Welcome back!",
        description: "You're now logged in to STAK Sync.",
      });
      // Reload page to refresh auth state
      window.location.href = "/";
    },
    onError: (error: any) => {
      console.error('Login error details:', error);
      let errorMessage = "Invalid email or password";
      
      if (error.message) {
        if (error.message.includes('Email and password are required')) {
          errorMessage = "Please fill in both email and password fields";
        } else if (error.message.includes('Invalid email or password')) {
          errorMessage = "The email or password you entered is incorrect. Please check your credentials and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setAuthError(errorMessage);
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const onSignup = (data: SignupForm) => {
    signupMutation.mutate(data);
  };

  const onLogin = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">STAK Sync</h1>
          <p className="mt-2 text-gray-600">Get in Sync, Cut the Noise</p>
        </div>

        <Card data-testid="auth-card">
          <CardHeader className="text-center">
            <CardTitle data-testid="auth-title">
              {isSignup ? "Create Account" : "Sign In"}
            </CardTitle>
            <CardDescription>
              {isSignup 
                ? "Join the STAK ecosystem and start networking" 
                : "Welcome back to STAK Sync"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Error Display */}
            {authError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription data-testid="error-message">
                  {authError}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Replit OAuth Option */}
            <Button 
              data-testid="button-replit-auth"
              onClick={() => window.location.href = "/api/login"}
              variant="outline" 
              className="w-full"
            >
              Continue with Replit
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>

            {/* General Auth Forms */}
            {isSignup ? (
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit(onSignup)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={signupForm.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input 
                              data-testid="input-first-name"
                              placeholder="John" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={signupForm.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input 
                              data-testid="input-last-name"
                              placeholder="Doe" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={signupForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-email"
                            type="email" 
                            placeholder="john@example.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={signupForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              data-testid="input-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="At least 8 characters" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    data-testid="button-signup"
                    type="submit" 
                    className="w-full" 
                    disabled={signupMutation.isPending}
                  >
                    {signupMutation.isPending ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </Form>
            ) : (
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-email"
                            type="email" 
                            placeholder="john@example.com" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              data-testid="input-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your password" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    data-testid="button-login"
                    type="submit" 
                    className="w-full" 
                    disabled={loginMutation.isPending}
                  >
                    {loginMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </Form>
            )}

            {/* Switch between signup and login */}
            <div className="text-center text-sm">
              <button
                data-testid="button-switch-mode"
                type="button"
                onClick={() => setIsSignup(!isSignup)}
                className="text-blue-600 hover:text-blue-500"
              >
                {isSignup 
                  ? "Already have an account? Sign in" 
                  : "Need an account? Sign up"
                }
              </button>
            </div>

            {/* Quick Test User Access */}
            <div className="text-center">
              <p className="text-xs text-gray-500 mb-2">Quick test access:</p>
              <Button
                data-testid="button-test-login"
                variant="outline"
                size="sm"
                onClick={() => {
                  loginForm.setValue("email", "test@example.com");
                  loginForm.setValue("password", "test123");
                  loginForm.handleSubmit(onLogin)();
                }}
                disabled={loginMutation.isPending}
              >
                Login as Test User
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}