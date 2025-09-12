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
  firstName: z.string().min(1, "Please enter your first name"),
  lastName: z.string().min(1, "Please enter your last name"),
  email: z.string()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address (like name@example.com)"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

// Schema for login form
const loginSchema = z.object({
  email: z.string()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address (like name@example.com)"),
  password: z.string().min(1, "Please enter your password"),
});

// Schema for password reset request
const forgotPasswordSchema = z.object({
  email: z.string()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address"),
});

// Schema for password reset completion
const resetPasswordSchema = z.object({
  email: z.string()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address"),
  resetToken: z.string().min(1, "Please enter the reset token"),
  newPassword: z.string().min(8, "Password must be at least 8 characters long"),
});

type SignupForm = z.infer<typeof signupSchema>;
type LoginForm = z.infer<typeof loginSchema>;
type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export default function SignupLogin() {
  const [location] = useLocation();
  // Default to signup if on /signup route, otherwise login
  const [isSignup, setIsSignup] = useState(location === "/signup");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocationHook] = useLocation();

  // Redirect if already authenticated
  if (user) {
    setLocationHook("/");
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
    mode: "onChange",
  });

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const resetPasswordForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      resetToken: "",
      newPassword: "",
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: SignupForm) => {
      setAuthError(null);
      console.log('🔍 SIGNUPLOGIN DEBUG: Starting signup process', { 
        email: data.email, 
        firstName: data.firstName, 
        lastName: data.lastName,
        endpoint: "/api/auth/signup"
      });
      
      try {
        const result = await apiRequest("/api/auth/signup", "POST", data);
        console.log('🔍 SIGNUPLOGIN DEBUG: Success response', result);
        return result;
      } catch (error) {
        console.log('🔍 SIGNUPLOGIN DEBUG: API request failed', {
          error,
          errorMessage: error?.message,
          errorType: typeof error
        });
        throw error;
      }
    },
    onSuccess: async () => {
      setAuthError(null);
      toast({
        title: "Account created successfully!",
        description: "Welcome to STAK Sync. Let's set up your profile.",
      });
      
      // Wait a moment for auth to update
      setTimeout(() => {
        // New users always go to interview
        window.location.href = "/interview";
      }, 500);
    },
    onError: (error: any) => {
      console.error('🔍 SIGNUPLOGIN DEBUG: Signup error caught', {
        error,
        errorMessage: error?.message,
        errorSuggestion: error?.suggestion,
        errorAction: error?.action,
        fullError: JSON.stringify(error, null, 2)
      });
      
      let errorMessage = "Failed to create account. Please try again.";
      
      // Handle structured error responses from server
      if (error.suggestion) {
        errorMessage = `${error.message || error.error}. ${error.suggestion}`;
      } else if (error.message) {
        console.log('🔍 SIGNUPLOGIN DEBUG: Processing error message', error.message);
        
        if (error.message.includes("already exists")) {
          errorMessage = "An account with this email already exists. Please try signing in instead, or use the 'Forgot Password' option if you can't remember your password.";
        } else if (error.message.includes("invalid email") || error.message.includes("email address")) {
          errorMessage = "Please enter a valid email address (like name@example.com)";
        } else if (error.message.includes("password")) {
          errorMessage = "Password must be at least 8 characters long";
        } else if (error.message.includes("pattern")) {
          errorMessage = "Please check your email format. It should look like name@example.com";
        } else {
          errorMessage = error.message;
        }
      }
      
      console.log('🔍 SIGNUPLOGIN DEBUG: Final error message to user', errorMessage);
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
    onSuccess: async () => {
      setAuthError(null);
      
      // Check profile status to determine where to redirect
      try {
        // Wait for auth to be set
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const profileStatus = await apiRequest("/api/interview/status", "GET");
        console.log('Profile status after login:', profileStatus);
        
        if (profileStatus.profileStatus === 'new' || profileStatus.profileStatus === 'incomplete') {
          toast({
            title: "Welcome back!",
            description: profileStatus.profileStatus === 'new' ? 
              "Let's set up your profile to get started." : 
              "Let's finish setting up your profile.",
          });
          
          // Redirect to interview
          setTimeout(() => {
            window.location.href = "/interview";
          }, 500);
        } else {
          toast({
            title: "Welcome back!",
            description: "You're now logged in to STAK Sync.",
          });
          
          // Redirect to home for complete profiles
          window.location.href = "/";
        }
      } catch (error) {
        console.error('Error checking profile status:', error);
        // If we can't check status, just go to home
        window.location.href = "/";
      }
    },
    onError: (error: any) => {
      console.error('Login error details:', error);
      let errorMessage = "Invalid email or password";
      
      // Handle structured error responses from server
      if (error.suggestion) {
        errorMessage = `${error.message || error.error}. ${error.suggestion}`;
      } else if (error.message) {
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

  // Forgot password mutation
  const forgotPasswordMutation = useMutation({
    mutationFn: async (data: ForgotPasswordForm) => {
      setAuthError(null);
      return apiRequest("/api/auth/forgot-password", "POST", data);
    },
    onSuccess: (data: any) => {
      setResetToken(data.resetToken); // For demo purposes
      setShowForgotPassword(false);
      setShowResetPassword(true);
      resetPasswordForm.setValue('email', forgotPasswordForm.getValues('email'));
      if (data.resetToken) {
        resetPasswordForm.setValue('resetToken', data.resetToken);
      }
      toast({
        title: "Reset link sent",
        description: data.message + (data.resetToken ? ` Your reset token is: ${data.resetToken}` : ''),
      });
    },
    onError: (error: any) => {
      setAuthError(error.message || "Failed to send reset email");
      toast({
        title: "Error",
        description: error.message || "Failed to send reset email",
        variant: "destructive",
      });
    },
  });

  // Reset password mutation
  const resetPasswordMutation = useMutation({
    mutationFn: async (data: ResetPasswordForm) => {
      setAuthError(null);
      return apiRequest("/api/auth/reset-password", "POST", data);
    },
    onSuccess: (data: any) => {
      setShowResetPassword(false);
      setShowForgotPassword(false);
      setResetToken(null);
      // Reset forms
      forgotPasswordForm.reset();
      resetPasswordForm.reset();
      toast({
        title: "Password reset successful",
        description: data.message,
      });
    },
    onError: (error: any) => {
      setAuthError(error.message || "Failed to reset password");
      toast({
        title: "Error",
        description: error.message || "Failed to reset password",
        variant: "destructive",
      });
    },
  });

  const onForgotPassword = (data: ForgotPasswordForm) => {
    forgotPasswordMutation.mutate(data);
  };

  const onResetPassword = (data: ResetPasswordForm) => {
    resetPasswordMutation.mutate(data);
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
              {showForgotPassword 
                ? "Reset Password" 
                : showResetPassword 
                ? "Set New Password"
                : isSignup 
                ? "Create Account" 
                : "Sign In"}
            </CardTitle>
            <CardDescription>
              {showForgotPassword 
                ? "Enter your email to receive a password reset link" 
                : showResetPassword
                ? "Enter your reset token and new password"
                : isSignup 
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
            {showForgotPassword ? (
              <>
              <Form {...forgotPasswordForm}>
                <form onSubmit={forgotPasswordForm.handleSubmit(onForgotPassword)} className="space-y-4">
                  <FormField
                    control={forgotPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-forgot-email"
                            type="email" 
                            placeholder="Enter your email address" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    data-testid="button-forgot-password-submit"
                    type="submit" 
                    className="w-full" 
                    disabled={forgotPasswordMutation.isPending}
                  >
                    {forgotPasswordMutation.isPending ? "Sending..." : "Send Reset Link"}
                  </Button>

                  <Button
                    data-testid="button-back-to-login"
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setShowForgotPassword(false);
                      setAuthError(null);
                    }}
                  >
                    Back to Sign In
                  </Button>
                </form>
              </Form>
              </>
            ) : showResetPassword ? (
              <>
              <Form {...resetPasswordForm}>
                <form onSubmit={resetPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                  <FormField
                    control={resetPasswordForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-reset-email"
                            type="email" 
                            placeholder="Enter your email address" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetPasswordForm.control}
                    name="resetToken"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reset Token</FormLabel>
                        <FormControl>
                          <Input 
                            data-testid="input-reset-token"
                            type="text" 
                            placeholder="Enter the reset token" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={resetPasswordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input 
                              data-testid="input-new-password"
                              type={showPassword ? "text" : "password"}
                              placeholder="Enter your new password" 
                              {...field} 
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                              onClick={() => setShowPassword(!showPassword)}
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
                    data-testid="button-reset-password-submit"
                    type="submit" 
                    className="w-full" 
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? "Resetting..." : "Reset Password"}
                  </Button>

                  <Button
                    data-testid="button-back-to-forgot"
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setShowResetPassword(false);
                      setShowForgotPassword(true);
                      setAuthError(null);
                    }}
                  >
                    Back to Password Reset
                  </Button>
                </form>
              </Form>
              </>
            ) : isSignup ? (
              <Form {...signupForm}>
                <form onSubmit={signupForm.handleSubmit((data) => {
                  console.log('🔍 SIGNUPLOGIN DEBUG: Form submit triggered', data);
                  console.log('🔍 SIGNUPLOGIN DEBUG: Form errors', signupForm.formState.errors);
                  onSignup(data);
                })} className="space-y-4">
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
                            autoComplete="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
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
                            autoComplete="email"
                            autoCapitalize="none"
                            autoCorrect="off"
                            spellCheck="false"
                            {...field}
                            value={field.value || ""}
                            onChange={(e) => {
                              field.onChange(e.target.value);
                            }}
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

                  {/* Forgot Password Link */}
                  <div className="text-center">
                    <button
                      data-testid="button-forgot-password-link"
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setAuthError(null);
                      }}
                      className="text-sm text-blue-600 hover:text-blue-500"
                    >
                      Forgot your password?
                    </button>
                  </div>
                </form>
              </Form>
            )}

            {/* Switch between signup and login */}
            <div className="text-center text-sm">
              <button
                data-testid="button-switch-mode"
                type="button"
                onClick={() => {
                  const newMode = !isSignup;
                  setIsSignup(newMode);
                  setAuthError(null); // Clear any errors when switching
                  // Update URL to match the mode
                  setLocationHook(newMode ? "/signup" : "/login");
                }}
                className="text-blue-600 hover:text-blue-500"
              >
                {isSignup 
                  ? "Already have an account? Sign in" 
                  : "Need an account? Sign up"
                }
              </button>
            </div>

            {/* Quick Test User Access */}
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500 mb-2">Quick test access:</p>
              <div className="space-y-2">
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
                  className="w-full"
                >
                  Login as Test User
                </Button>
                <Button
                  data-testid="button-colin-login"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    loginForm.setValue("email", "colinbehring@gmail.com");
                    loginForm.setValue("password", "staktest123");
                    loginForm.handleSubmit(onLogin)();
                  }}
                  disabled={loginMutation.isPending}
                  className="w-full"
                >
                  Login as Colin (STAK Founder)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}