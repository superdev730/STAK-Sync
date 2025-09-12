import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Sparkles, Eye, EyeOff, AlertCircle, CheckCircle, 
  ArrowRight, CalendarDays, MapPin, UserCheck, Loader2 
} from "lucide-react";
import { format } from "date-fns";

// Schema for activation form
const activationSchema = z.object({
  email: z.string()
    .min(1, "Please enter your email address")
    .email("Please enter a valid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "Please enter your first name"),
  lastName: z.string().min(1, "Please enter your last name"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions to continue"
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

type ActivationForm = z.infer<typeof activationSchema>;

interface TeaserData {
  event: {
    title: string;
    date: string;
    location: string;
  };
  matches: Array<{
    handle: string;
    location: string;
    score: number;
    reasons: string[];
  }>;
  expiresAt: string;
}

export default function ActivationPage() {
  const { token } = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  // Fetch teaser data to pre-fill and show event info
  const { data: teaserData, isLoading: teaserLoading, error: teaserError } = useQuery<TeaserData>({
    queryKey: [`/api/teaser/${token}`],
    retry: false,
    enabled: !!token
  });

  const form = useForm<ActivationForm>({
    resolver: zodResolver(activationSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      acceptTerms: false
    },
    mode: "onChange"
  });

  // Pre-fill email if available from teaser data
  useEffect(() => {
    if (teaserData?.event) {
      // If we had email in the response, we would set it here
      // form.setValue("email", teaserData.email);
    }
  }, [teaserData, form]);

  const activationMutation = useMutation({
    mutationFn: async (data: ActivationForm) => {
      const payload = {
        token,
        password: data.password,
        acceptTerms: data.acceptTerms,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName
      };
      
      return apiRequest("/api/activate", "POST", payload);
    },
    onSuccess: (response) => {
      toast({
        title: "Account Activated!",
        description: "Your account has been successfully created. Redirecting to the event...",
      });
      
      // Redirect to the event deep-link URL
      setTimeout(() => {
        if (response.redirectUrl) {
          window.location.href = response.redirectUrl;
        } else {
          window.location.href = "/";
        }
      }, 1500);
    },
    onError: (error: any) => {
      let errorMessage = "Failed to activate account. Please try again.";
      
      if (error.message) {
        if (error.message.includes("expired")) {
          errorMessage = "This invitation has expired. Please contact the event organizer for a new invitation.";
        } else if (error.message.includes("already used")) {
          errorMessage = "This invitation has already been used. Please log in to your account.";
        } else if (error.message.includes("Invalid token")) {
          errorMessage = "This invitation link is invalid. Please check the link or contact support.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Activation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: ActivationForm) => {
    activationMutation.mutate(data);
  };

  // Loading state
  if (teaserLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state for invalid/expired token
  if (teaserError || !teaserData) {
    const errorMessage = teaserError?.message || "Failed to load invitation";
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
                {isExpired ? "Invitation Expired" : isUsed ? "Already Activated" : "Invalid Invitation"}
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
                <a href="/login">
                  Go to Login
                </a>
              </Button>
              <Button asChild className="w-full" variant="ghost">
                <a href="/">
                  Return Home
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        
        {/* Header with STAK Sync branding */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="h-8 w-8 text-[#CD853F]" />
            <h1 className="text-3xl font-bold text-gray-900">STAK Sync</h1>
          </div>
          <p className="text-gray-600">Activate Your Invitation</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Left Column - Event Info and Benefits */}
          <div className="space-y-6">
            {/* Event Details Card */}
            <Card className="border-2 border-[#CD853F]/20">
              <CardHeader className="bg-gradient-to-r from-[#CD853F]/10 to-[#CD853F]/5">
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-[#CD853F]" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-lg mb-3">{teaserData.event.title}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <CalendarDays className="h-4 w-4 text-[#CD853F]" />
                    <span>{format(new Date(teaserData.event.date), "MMMM d, yyyy 'at' h:mm a")}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 text-[#CD853F]" />
                    <span>{teaserData.event.location}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What You'll Get Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What You'll Unlock</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Full Profile Access</div>
                      <div className="text-sm text-gray-600">See complete profiles of your {teaserData.matches.length} AI-matched attendees</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Direct Messaging</div>
                      <div className="text-sm text-gray-600">Connect and schedule meetings before the event</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">AI Conversation Starters</div>
                      <div className="text-sm text-gray-600">Personalized icebreakers for each connection</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                    <div>
                      <div className="font-medium">Event Preparation Tools</div>
                      <div className="text-sm text-gray-600">Mission board to maximize your networking success</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Activation Form */}
          <div>
            <Card className="border-2 border-gray-200">
              <CardHeader>
                <CardTitle className="text-2xl">Create Your Account</CardTitle>
                <CardDescription>
                  Complete your profile to access your AI-matched connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    
                    {/* Name Fields */}
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
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Email Field */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="john.doe@example.com" 
                              {...field} 
                              data-testid="input-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Password Field */}
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a strong password"
                                {...field} 
                                data-testid="input-password"
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                data-testid="button-toggle-password"
                              >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Must be 8+ characters with uppercase, lowercase, and numbers
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Confirm Password Field */}
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type={showConfirmPassword ? "text" : "password"}
                                placeholder="Re-enter your password"
                                {...field} 
                                data-testid="input-confirmPassword"
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                data-testid="button-toggle-confirmPassword"
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Terms Checkbox */}
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 bg-gray-50">
                          <FormControl>
                            <Checkbox 
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-acceptTerms"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I accept the{" "}
                              <a href="/terms" className="text-[#CD853F] hover:underline" target="_blank">
                                Terms of Service
                              </a>{" "}
                              and{" "}
                              <a href="/privacy" className="text-[#CD853F] hover:underline" target="_blank">
                                Privacy Policy
                              </a>
                            </FormLabel>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Submit Button */}
                    <Button 
                      type="submit" 
                      className="w-full bg-[#CD853F] hover:bg-[#B8732F] text-white font-semibold"
                      size="lg"
                      disabled={activationMutation.isPending || !form.formState.isValid}
                      data-testid="button-activate"
                    >
                      {activationMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Creating Account...
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-5 h-5 mr-2" />
                          Activate Account
                          <ArrowRight className="w-5 h-5 ml-2" />
                        </>
                      )}
                    </Button>

                    {/* Alternative Actions */}
                    <div className="text-center text-sm text-gray-600 pt-4 border-t">
                      <p>
                        Already have an account?{" "}
                        <a href="/login" className="text-[#CD853F] hover:underline font-medium">
                          Log in instead
                        </a>
                      </p>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Security Note */}
            <div className="mt-4 text-center text-xs text-gray-500">
              <p>🔒 Your information is encrypted and secure</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}