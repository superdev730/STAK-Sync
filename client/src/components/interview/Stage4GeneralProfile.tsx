import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ChevronLeft, CheckCircle, Building2, Star, Share2, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const EXPERTISE_AREAS = [
  "Academia & Research",
  "Arts & Culture",
  "Community Building",
  "Consulting",
  "Corporate Development",
  "Economic Development",
  "Education & Training",
  "Environmental Sustainability",
  "Government & Policy",
  "Healthcare Services",
  "Impact Investing",
  "International Development",
  "Legal Services",
  "Media & Journalism",
  "Non-Profit Management",
  "Public Relations",
  "Real Estate",
  "Social Impact",
  "Sports & Entertainment",
  "Venture Building"
];

const ORGANIZATION_TYPES = [
  "Corporation",
  "Startup",
  "Non-Profit",
  "Government Agency",
  "Academic Institution",
  "Research Organization",
  "Consulting Firm",
  "Law Firm",
  "Healthcare Organization",
  "Financial Institution",
  "Media Company",
  "Creative Agency",
  "Independent/Freelance",
  "Other"
];

const OFFERING_TO_NETWORK = [
  "Industry expertise",
  "Strategic advice",
  "Mentorship",
  "Business connections",
  "Partnership opportunities",
  "Investment capital",
  "Technical expertise",
  "Market insights",
  "Regulatory knowledge",
  "International connections",
  "Media exposure",
  "Research collaboration",
  "Speaking opportunities",
  "Board service",
  "Pro bono services"
];

const SEEKING_FROM_NETWORK = [
  "Business opportunities",
  "Strategic partnerships",
  "Investment opportunities",
  "Mentorship",
  "Industry insights",
  "Technical expertise",
  "Career opportunities",
  "Board positions",
  "Speaking engagements",
  "Research collaborations",
  "Client introductions",
  "Talent referrals",
  "Media connections",
  "International expansion",
  "Knowledge exchange"
];

const stage4GeneralSchema = z.object({
  organizationName: z.string().min(1, "Organization name is required"),
  organizationType: z.string().min(1, "Please select organization type"),
  currentRole: z.string().min(1, "Current role is required"),
  yearsInField: z.string().min(1, "Years in field is required"),
  expertiseAreas: z.array(z.string()).min(1, "Please select at least one area of expertise"),
  professionalSummary: z.string()
    .min(50, "Please provide a meaningful professional summary (min 50 characters)")
    .max(800, "Professional summary is too long (max 800 characters)"),
  keyAchievements: z.string()
    .min(30, "Please share your key achievements (min 30 characters)")
    .max(600, "Achievements description is too long (max 600 characters)"),
  offeringToNetwork: z.array(z.string()).min(1, "Please select what you can offer"),
  seekingFromNetwork: z.array(z.string()).min(1, "Please select what you're seeking"),
  networkingGoals: z.string()
    .min(30, "Please describe your networking goals (min 30 characters)")
    .max(500, "Goals description is too long (max 500 characters)"),
  availableForSpeaking: z.boolean().default(false),
  availableForAdvisory: z.boolean().default(false),
  availableForCollaboration: z.boolean().default(false),
  personalWebsite: z.string().optional(),
  publicationUrl: z.string().optional(),
});

type Stage4GeneralData = z.infer<typeof stage4GeneralSchema>;

interface Stage4GeneralProfileProps {
  onNext: (data: Stage4GeneralData) => void;
  onBack?: () => void;
  initialData?: Partial<Stage4GeneralData>;
  showBackButton?: boolean;
  isLastStage?: boolean;
}

export default function Stage4GeneralProfile({
  onNext,
  onBack,
  initialData,
  showBackButton = false,
  isLastStage = true,
}: Stage4GeneralProfileProps) {
  const form = useForm<Stage4GeneralData>({
    resolver: zodResolver(stage4GeneralSchema),
    defaultValues: {
      organizationName: initialData?.organizationName || "",
      organizationType: initialData?.organizationType || "",
      currentRole: initialData?.currentRole || "",
      yearsInField: initialData?.yearsInField || "",
      expertiseAreas: initialData?.expertiseAreas || [],
      professionalSummary: initialData?.professionalSummary || "",
      keyAchievements: initialData?.keyAchievements || "",
      offeringToNetwork: initialData?.offeringToNetwork || [],
      seekingFromNetwork: initialData?.seekingFromNetwork || [],
      networkingGoals: initialData?.networkingGoals || "",
      availableForSpeaking: initialData?.availableForSpeaking || false,
      availableForAdvisory: initialData?.availableForAdvisory || false,
      availableForCollaboration: initialData?.availableForCollaboration || false,
      personalWebsite: initialData?.personalWebsite || "",
      publicationUrl: initialData?.publicationUrl || "",
    },
  });

  const handleSubmit = (data: Stage4GeneralData) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stak-black">Professional Profile</h2>
          <p className="text-gray-600">
            Help us understand your professional background and networking goals
          </p>
        </div>

        {/* Organization Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-stak-copper" />
              Organization & Role
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Acme Corporation" data-testid="input-organization-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-organization-type">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ORGANIZATION_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="currentRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Role *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Director of Strategy" data-testid="input-current-role" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="yearsInField"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years in Field *</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="e.g., 10" data-testid="input-years-in-field" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="professionalSummary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Summary *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Provide an overview of your professional background, expertise, and what drives you..."
                      className="min-h-[120px]"
                      data-testid="textarea-professional-summary"
                    />
                  </FormControl>
                  <FormDescription>
                    Help others understand your professional journey (50-800 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Expertise & Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-stak-copper" />
              Expertise & Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="expertiseAreas"
              render={() => (
                <FormItem>
                  <FormLabel>Areas of Expertise *</FormLabel>
                  <FormDescription>Select all areas where you have significant expertise</FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
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
              name="keyAchievements"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Key Achievements *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Share your most significant professional achievements, awards, recognitions, or impact you've made..."
                      className="min-h-[100px]"
                      data-testid="textarea-key-achievements"
                    />
                  </FormControl>
                  <FormDescription>
                    Highlight your professional accomplishments (30-600 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="personalWebsite"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Personal Website</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://www.example.com" data-testid="input-personal-website" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="publicationUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Publications/Portfolio</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Link to publications or work" data-testid="input-publication-url" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Networking Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="w-5 h-5 text-stak-copper" />
              Networking & Collaboration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="offeringToNetwork"
              render={() => (
                <FormItem>
                  <FormLabel>What You Can Offer *</FormLabel>
                  <FormDescription>Select what you can contribute to the network</FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {OFFERING_TO_NETWORK.map((offering) => (
                      <FormField
                        key={offering}
                        control={form.control}
                        name="offeringToNetwork"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(offering)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), offering]
                                      : field.value?.filter((v) => v !== offering) || [];
                                    field.onChange(newValue);
                                  }}
                                  data-testid={`checkbox-offering-${offering.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {offering}
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
              name="seekingFromNetwork"
              render={() => (
                <FormItem>
                  <FormLabel>What You're Seeking *</FormLabel>
                  <FormDescription>Select what you hope to gain from the network</FormDescription>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {SEEKING_FROM_NETWORK.map((seeking) => (
                      <FormField
                        key={seeking}
                        control={form.control}
                        name="seekingFromNetwork"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(seeking)}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), seeking]
                                      : field.value?.filter((v) => v !== seeking) || [];
                                    field.onChange(newValue);
                                  }}
                                  data-testid={`checkbox-seeking-${seeking.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {seeking}
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
              name="networkingGoals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Networking Goals *</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="What do you hope to achieve through networking? What types of connections are most valuable to you?..."
                      className="min-h-[80px]"
                      data-testid="textarea-networking-goals"
                    />
                  </FormControl>
                  <FormDescription>
                    Share your networking objectives (30-500 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-3">
              <FormLabel>Availability</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="availableForSpeaking"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-available-speaking"
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Speaking engagements
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availableForAdvisory"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-available-advisory"
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Advisory roles
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availableForCollaboration"
                  render={({ field }) => (
                    <FormItem className="flex items-center space-x-2">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-available-collaboration"
                        />
                      </FormControl>
                      <FormLabel className="font-normal cursor-pointer">
                        Collaborations
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
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