import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ChevronLeft, CheckCircle, Briefcase, TrendingUp, Award, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EXPERTISE_AREAS = [
  "Sales & Business Development",
  "Marketing & Growth",
  "Product Management",
  "Engineering & Development",
  "Design & UX",
  "Operations & Process",
  "Finance & Accounting",
  "Human Resources",
  "Legal & Compliance",
  "Data & Analytics",
  "Customer Success",
  "Strategy & Planning",
  "Supply Chain",
  "Security & Infrastructure",
  "Quality Assurance",
  "Content & Communications",
  "International Expansion",
  "Partnerships",
  "Community Building",
  "Research & Development"
];

const INDUSTRIES = [
  "Technology", "Healthcare", "Finance", "E-commerce", "SaaS",
  "Consumer Products", "Manufacturing", "Retail", "Education",
  "Entertainment", "Real Estate", "Transportation", "Energy",
  "Agriculture", "Hospitality", "Non-Profit", "Government",
  "Telecommunications", "Biotechnology", "Pharmaceuticals"
];

const LOOKING_FOR = [
  "Full-time opportunities",
  "Part-time roles",
  "Contract/Freelance work",
  "Advisory positions",
  "Board positions",
  "Consulting opportunities",
  "Speaking engagements",
  "Mentorship opportunities",
  "Investment opportunities",
  "Partnership opportunities",
  "Networking",
  "Knowledge sharing",
  "Industry insights",
  "Career transition support"
];

const CAREER_STAGE = [
  "Early Career (0-3 years)",
  "Mid-Level (3-7 years)",
  "Senior (7-12 years)",
  "Executive (12-20 years)",
  "C-Suite/VP Level",
  "Board Member",
  "Advisor/Consultant",
  "Career Transition"
];

const stage4OperatorSchema = z.object({
  currentCompany: z.string().min(1, "Current company is required"),
  currentRole: z.string().min(1, "Current role is required"),
  careerStage: z.string().min(1, "Please select your career stage"),
  yearsExperience: z.string().min(1, "Years of experience is required"),
  industries: z.array(z.string()).min(1, "Please select at least one industry"),
  expertiseAreas: z.array(z.string()).min(1, "Please select at least one area of expertise"),
  notableAchievements: z.string()
    .min(30, "Please share at least one notable achievement (min 30 characters)")
    .max(800, "Achievements description is too long (max 800 characters)"),
  skillset: z.string()
    .min(20, "Please describe your key skills (min 20 characters)")
    .max(500, "Skills description is too long (max 500 characters)"),
  lookingFor: z.array(z.string()).min(1, "Please select what you're looking for"),
  idealNextRole: z.string()
    .min(20, "Please describe your ideal next opportunity (min 20 characters)")
    .max(500, "Description is too long (max 500 characters)"),
  portfolioUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  personalWebsite: z.string().optional(),
  availableForMentoring: z.boolean().default(false),
  openToRelocation: z.boolean().default(false),
  preferredWorkStyle: z.string().min(1, "Please select your preferred work style"),
});

type Stage4OperatorData = z.infer<typeof stage4OperatorSchema>;

interface Stage4OperatorProfileProps {
  onNext: (data: Stage4OperatorData) => void;
  onBack?: () => void;
  initialData?: Partial<Stage4OperatorData>;
  showBackButton?: boolean;
  isLastStage?: boolean;
}

export default function Stage4OperatorProfile({
  onNext,
  onBack,
  initialData,
  showBackButton = false,
  isLastStage = true,
}: Stage4OperatorProfileProps) {
  const form = useForm<Stage4OperatorData>({
    resolver: zodResolver(stage4OperatorSchema),
    defaultValues: {
      currentCompany: initialData?.currentCompany || "",
      currentRole: initialData?.currentRole || "",
      careerStage: initialData?.careerStage || "",
      yearsExperience: initialData?.yearsExperience || "",
      industries: initialData?.industries || [],
      expertiseAreas: initialData?.expertiseAreas || [],
      notableAchievements: initialData?.notableAchievements || "",
      skillset: initialData?.skillset || "",
      lookingFor: initialData?.lookingFor || [],
      idealNextRole: initialData?.idealNextRole || "",
      portfolioUrl: initialData?.portfolioUrl || "",
      githubUrl: initialData?.githubUrl || "",
      personalWebsite: initialData?.personalWebsite || "",
      availableForMentoring: initialData?.availableForMentoring || false,
      openToRelocation: initialData?.openToRelocation || false,
      preferredWorkStyle: initialData?.preferredWorkStyle || "",
    },
  });

  const handleSubmit = (data: Stage4OperatorData) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stak-black">Professional Profile</h2>
          <p className="text-gray-600">
            Help us understand your expertise and career goals
          </p>
        </div>

        {/* Current Position */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-stak-copper" />
              Current Position
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentCompany"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Company *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Acme Corp" data-testid="input-current-company" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Role *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., VP of Engineering" data-testid="input-current-role" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="careerStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Career Stage *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-career-stage">
                          <SelectValue placeholder="Select career stage" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CAREER_STAGE.map((stage) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
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
                name="yearsExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="e.g., 10" data-testid="input-years-experience" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="preferredWorkStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Preferred Work Style *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-work-style">
                        <SelectValue placeholder="Select work style" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="remote">Fully Remote</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                      <SelectItem value="onsite">On-site</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Expertise & Experience */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-stak-copper" />
              Expertise & Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="industries"
              render={() => (
                <FormItem>
                  <FormLabel>Industries *</FormLabel>
                  <FormDescription>Select all industries you have experience in</FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {INDUSTRIES.map((industry) => (
                      <FormField
                        key={industry}
                        control={form.control}
                        name="industries"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(industry)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), industry]
                                      : field.value?.filter((v) => v !== industry) || [];
                                    field.onChange(newValue);
                                  }}
                                  data-testid={`checkbox-industry-${industry.toLowerCase().replace(/\s+/g, '-')}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {industry}
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
              name="expertiseAreas"
              render={() => (
                <FormItem>
                  <FormLabel>Areas of Expertise *</FormLabel>
                  <FormDescription>Select your primary areas of expertise</FormDescription>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                    {EXPERTISE_AREAS.map((area) => (
                      <FormField
                        key={area}
                        control={form.control}
                        name="expertiseAreas"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(area)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), area]
                                      : field.value?.filter((v) => v !== area) || [];
                                    field.onChange(newValue);
                                  }}
                                  data-testid={`checkbox-expertise-${area.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {area}
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
              name="skillset"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Skills & Technologies *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="List your key skills, tools, and technologies you're proficient in..."
                      className="min-h-[80px]"
                      data-testid="textarea-skillset"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Achievements & Portfolio */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-stak-copper" />
              Achievements & Portfolio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="notableAchievements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notable Achievements *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share your key accomplishments, successful projects, metrics you've improved, teams you've built..."
                      className="min-h-[120px]"
                      data-testid="textarea-notable-achievements"
                    />
                  </FormControl>
                  <FormDescription>
                    Help others understand your impact and expertise (30-800 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="portfolioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Portfolio link" data-testid="input-portfolio-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="GitHub profile" data-testid="input-github-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="personalWebsite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Website</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Your website" data-testid="input-personal-website" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Career Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="w-5 h-5 text-stak-copper" />
              Career Goals & Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="lookingFor"
              render={() => (
                <FormItem>
                  <FormLabel>What You're Looking For *</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {LOOKING_FOR.map((item) => (
                      <FormField
                        key={item}
                        control={form.control}
                        name="lookingFor"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(item)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), item]
                                      : field.value?.filter((v) => v !== item) || [];
                                    field.onChange(newValue);
                                  }}
                                  data-testid={`checkbox-looking-${item.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {item}
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
              name="idealNextRole"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ideal Next Opportunity *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your ideal next role, company type, or opportunity..."
                      className="min-h-[80px]"
                      data-testid="textarea-ideal-next-role"
                    />
                  </FormControl>
                  <FormDescription>
                    Help recruiters and founders understand what you're seeking (20-500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="availableForMentoring"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-available-mentoring"
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Available for mentoring
                    </FormLabel>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="openToRelocation"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-open-relocation"
                      />
                    </FormControl>
                    <FormLabel className="font-normal cursor-pointer">
                      Open to relocation
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
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