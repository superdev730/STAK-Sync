import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ChevronLeft, CheckCircle, Rocket, Users, DollarSign, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const INDUSTRIES = [
  "AI/ML", "B2B SaaS", "Biotech", "Climate Tech", "Consumer",
  "Crypto/Web3", "Cybersecurity", "Data/Analytics", "DeepTech",
  "Developer Tools", "E-commerce", "EdTech", "Enterprise",
  "FinTech", "Gaming", "Hardware", "HealthTech", "HR Tech",
  "Infrastructure", "InsurTech", "IoT", "Legal Tech", "Logistics",
  "MarketPlaces", "Marketing Tech", "Media", "PropTech", "Robotics",
  "Security", "Social", "Space Tech", "Supply Chain", "Travel"
];

const FUNDING_NEEDS = [
  "Angel/Pre-seed funding ($50K-$500K)",
  "Seed funding ($500K-$2M)",
  "Series A ($2M-$15M)",
  "Series B ($15M-$50M)",
  "Series C+ ($50M+)",
  "Bridge round",
  "Strategic investment",
  "Grant funding",
  "Revenue-based financing",
  "Debt financing"
];

const SUPPORT_NEEDS = [
  "Product development",
  "Go-to-market strategy",
  "Sales & distribution",
  "Marketing & branding",
  "Technical expertise",
  "Regulatory guidance",
  "International expansion",
  "Team building & hiring",
  "Board members",
  "Strategic advisors",
  "Customer introductions",
  "Investor introductions",
  "Partnership opportunities",
  "Operations optimization"
];

const stage4FounderSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  companyStage: z.string().min(1, "Please select your company stage"),
  companyWebsite: z.string().optional(),
  industry: z.string().min(1, "Please select your industry"),
  targetMarket: z.string().min(10, "Please describe your target market"),
  teamSize: z.string().min(1, "Please enter your team size"),
  foundingTeam: z.string().min(20, "Please describe your founding team (min 20 characters)"),
  revenueStatus: z.string().min(1, "Please select your revenue status"),
  monthlyRevenue: z.string().optional(),
  previousFunding: z.string().optional(),
  currentRunway: z.string().optional(),
  burnRate: z.string().optional(),
  pitchDeck: z.string().optional(),
  companyDescription: z.string()
    .min(50, "Please provide a meaningful company description (min 50 characters)")
    .max(1000, "Company description is too long (max 1000 characters)"),
  fundingNeeds: z.array(z.string()).min(1, "Please select at least one funding need"),
  supportNeeds: z.array(z.string()).min(1, "Please select at least one support need"),
  biggestChallenge: z.string()
    .min(30, "Please describe your biggest challenge (min 30 characters)")
    .max(500, "Challenge description is too long (max 500 characters)"),
});

type Stage4FounderData = z.infer<typeof stage4FounderSchema>;

interface Stage4FounderProfileProps {
  onNext: (data: Stage4FounderData) => void;
  onBack?: () => void;
  initialData?: Partial<Stage4FounderData>;
  showBackButton?: boolean;
  isLastStage?: boolean;
}

export default function Stage4FounderProfile({
  onNext,
  onBack,
  initialData,
  showBackButton = false,
  isLastStage = true,
}: Stage4FounderProfileProps) {
  const form = useForm<Stage4FounderData>({
    resolver: zodResolver(stage4FounderSchema),
    defaultValues: {
      companyName: initialData?.companyName || "",
      companyStage: initialData?.companyStage || "",
      companyWebsite: initialData?.companyWebsite || "",
      industry: initialData?.industry || "",
      targetMarket: initialData?.targetMarket || "",
      teamSize: initialData?.teamSize || "",
      foundingTeam: initialData?.foundingTeam || "",
      revenueStatus: initialData?.revenueStatus || "",
      monthlyRevenue: initialData?.monthlyRevenue || "",
      previousFunding: initialData?.previousFunding || "",
      currentRunway: initialData?.currentRunway || "",
      burnRate: initialData?.burnRate || "",
      pitchDeck: initialData?.pitchDeck || "",
      companyDescription: initialData?.companyDescription || "",
      fundingNeeds: initialData?.fundingNeeds || [],
      supportNeeds: initialData?.supportNeeds || [],
      biggestChallenge: initialData?.biggestChallenge || "",
    },
  });

  const handleSubmit = (data: Stage4FounderData) => {
    onNext(data);
  };

  const revenueStatus = form.watch("revenueStatus");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stak-black">Founder Profile</h2>
          <p className="text-gray-600">
            Help investors and advisors understand your startup journey
          </p>
        </div>

        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Rocket className="w-5 h-5 text-stak-copper" />
              Company Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="companyName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Acme Inc." data-testid="input-company-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="companyStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Stage *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-company-stage">
                          <SelectValue placeholder="Select stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="idea">Idea Stage</SelectItem>
                        <SelectItem value="mvp">MVP/Prototype</SelectItem>
                        <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                        <SelectItem value="seed">Seed</SelectItem>
                        <SelectItem value="series-a">Series A</SelectItem>
                        <SelectItem value="series-b">Series B</SelectItem>
                        <SelectItem value="series-c">Series C+</SelectItem>
                        <SelectItem value="growth">Growth Stage</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="companyWebsite"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Website</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://www.example.com" data-testid="input-company-website" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="industry"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry/Vertical *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-industry">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetMarket"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Market *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your target customers and market segment..."
                      className="min-h-[80px]"
                      data-testid="textarea-target-market"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="companyDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What does your company do? What problem are you solving? What makes you unique?..."
                      className="min-h-[120px]"
                      data-testid="textarea-company-description"
                    />
                  </FormControl>
                  <FormDescription>
                    Help people understand your mission and value proposition (50-1000 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Team Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-stak-copper" />
              Team Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="teamSize"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Team Size *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 5" type="number" data-testid="input-team-size" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="revenueStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Revenue Status *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-revenue-status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="pre-revenue">Pre-Revenue</SelectItem>
                        <SelectItem value="revenue-generating">Revenue Generating</SelectItem>
                        <SelectItem value="profitable">Profitable</SelectItem>
                        <SelectItem value="cashflow-positive">Cashflow Positive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="foundingTeam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Founding Team *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Brief background of founding team members and their roles..."
                      className="min-h-[80px]"
                      data-testid="textarea-founding-team"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {revenueStatus !== "pre-revenue" && (
              <FormField
                control={form.control}
                name="monthlyRevenue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Recurring Revenue (MRR)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $10,000" data-testid="input-monthly-revenue" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </CardContent>
        </Card>

        {/* Funding Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-stak-copper" />
              Funding Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="previousFunding"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Previous Funding</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $500K pre-seed" data-testid="input-previous-funding" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentRunway"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Runway</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., 12 months" data-testid="input-current-runway" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="burnRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Burn Rate</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $25,000" data-testid="input-burn-rate" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pitchDeck"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pitch Deck URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Link to pitch deck" data-testid="input-pitch-deck" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Needs & Support */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-stak-copper" />
              What You're Looking For
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="fundingNeeds"
              render={() => (
                <FormItem>
                  <FormLabel>Funding Needs *</FormLabel>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {FUNDING_NEEDS.map((need) => (
                      <FormField
                        key={need}
                        control={form.control}
                        name="fundingNeeds"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(need)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), need]
                                      : field.value?.filter((v) => v !== need) || [];
                                    field.onChange(newValue);
                                  }}
                                  data-testid={`checkbox-funding-${need.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {need}
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="supportNeeds"
              render={() => (
                <FormItem>
                  <FormLabel>Support Needs *</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SUPPORT_NEEDS.map((need) => (
                      <FormField
                        key={need}
                        control={form.control}
                        name="supportNeeds"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(need)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), need]
                                      : field.value?.filter((v) => v !== need) || [];
                                    field.onChange(newValue);
                                  }}
                                  data-testid={`checkbox-support-${need.toLowerCase().replace(/\s+/g, '-')}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {need}
                              </FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="biggestChallenge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Biggest Current Challenge *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What's the biggest challenge you're facing right now?..."
                      className="min-h-[80px]"
                      data-testid="textarea-biggest-challenge"
                    />
                  </FormControl>
                  <FormDescription>
                    Help potential advisors and investors understand how they can help (30-500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          {showBackButton && onBack && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex items-center gap-2"
              data-testid="button-back"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>
          )}
          <Button
            type="submit"
            className="ml-auto bg-stak-copper hover:bg-stak-dark-copper flex items-center gap-2"
            data-testid="button-submit"
          >
            {isLastStage ? (
              <>
                Complete Interview
                <CheckCircle className="w-4 h-4" />
              </>
            ) : (
              <>
                Continue
                <ChevronLeft className="w-4 h-4 rotate-180" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}