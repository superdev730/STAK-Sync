import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ChevronLeft, ChevronRight, Globe, Linkedin, Twitter, Github, Briefcase } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const stage1Schema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  preferredDisplayName: z.string().optional(),
  headline: z.string().min(10, "Please provide a meaningful headline (min 10 characters)"),
  city: z.string().min(1, "City is required"),
  region: z.string().min(1, "State/Region is required"),
  timezone: z.string().optional(),
  phone: z.string().optional(),
  socialLinks: z.object({
    linkedinUrl: z.string().url().optional().or(z.literal("")),
    linkedinVisible: z.boolean().default(true),
    twitterUrl: z.string().url().optional().or(z.literal("")),
    twitterVisible: z.boolean().default(true),
    githubUrl: z.string().url().optional().or(z.literal("")),
    githubVisible: z.boolean().default(false),
    personalWebsite: z.string().url().optional().or(z.literal("")),
    personalWebsiteVisible: z.boolean().default(true),
    portfolioUrl: z.string().url().optional().or(z.literal("")),
    portfolioVisible: z.boolean().default(true),
  }),
});

type Stage1Data = z.infer<typeof stage1Schema>;

interface Stage1IdentityProps {
  onNext: (data: Stage1Data) => void;
  onBack?: () => void;
  initialData?: Partial<Stage1Data>;
  showBackButton?: boolean;
}

export default function Stage1Identity({
  onNext,
  onBack,
  initialData,
  showBackButton = false,
}: Stage1IdentityProps) {
  const form = useForm<Stage1Data>({
    resolver: zodResolver(stage1Schema),
    defaultValues: {
      firstName: initialData?.firstName || "",
      lastName: initialData?.lastName || "",
      preferredDisplayName: initialData?.preferredDisplayName || "",
      headline: initialData?.headline || "",
      city: initialData?.city || "",
      region: initialData?.region || "",
      timezone: initialData?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      phone: initialData?.phone || "",
      socialLinks: {
        linkedinUrl: initialData?.socialLinks?.linkedinUrl || "",
        linkedinVisible: initialData?.socialLinks?.linkedinVisible ?? true,
        twitterUrl: initialData?.socialLinks?.twitterUrl || "",
        twitterVisible: initialData?.socialLinks?.twitterVisible ?? true,
        githubUrl: initialData?.socialLinks?.githubUrl || "",
        githubVisible: initialData?.socialLinks?.githubVisible ?? false,
        personalWebsite: initialData?.socialLinks?.personalWebsite || "",
        personalWebsiteVisible: initialData?.socialLinks?.personalWebsiteVisible ?? true,
        portfolioUrl: initialData?.socialLinks?.portfolioUrl || "",
        portfolioVisible: initialData?.socialLinks?.portfolioVisible ?? true,
      },
    },
  });

  const handleSubmit = (data: Stage1Data) => {
    onNext(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stak-black">Your Identity</h2>
          <p className="text-gray-600">
            Let's start with some basic information about you
          </p>
        </div>

        {/* Personal Information */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="John" data-testid="input-first-name" />
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
                  <FormLabel>Last Name *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Doe" data-testid="input-last-name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="preferredDisplayName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Display Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Johnny (optional)" data-testid="input-display-name" />
                </FormControl>
                <FormDescription>
                  How you'd like to be addressed (leave blank to use first name)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="headline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Professional Headline *</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Founder & CEO at TechStartup | Building the future of AI"
                    data-testid="input-headline"
                  />
                </FormControl>
                <FormDescription>
                  A brief description of who you are professionally
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="San Francisco" data-testid="input-city" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="region"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Region *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="CA" data-testid="input-region" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="+1 (555) 123-4567" type="tel" data-testid="input-phone" />
                </FormControl>
                <FormDescription>
                  Optional - for important connection requests
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Social Links */}
        <Card className="border-stak-copper/20">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Social & Professional Links</h3>
            <div className="space-y-4">
              {/* LinkedIn */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-blue-600" />
                    LinkedIn
                  </Label>
                  <FormField
                    control={form.control}
                    name="socialLinks.linkedinVisible"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="text-sm text-gray-600">Visible</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-linkedin-visible"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="socialLinks.linkedinUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="https://linkedin.com/in/yourprofile" data-testid="input-linkedin-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Twitter/X */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Twitter className="w-4 h-4 text-black" />
                    Twitter/X
                  </Label>
                  <FormField
                    control={form.control}
                    name="socialLinks.twitterVisible"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="text-sm text-gray-600">Visible</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-twitter-visible"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="socialLinks.twitterUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="https://x.com/yourhandle" data-testid="input-twitter-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* GitHub */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    GitHub
                  </Label>
                  <FormField
                    control={form.control}
                    name="socialLinks.githubVisible"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="text-sm text-gray-600">Visible</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-github-visible"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="socialLinks.githubUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="https://github.com/yourusername" data-testid="input-github-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Personal Website */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gray-600" />
                    Personal Website
                  </Label>
                  <FormField
                    control={form.control}
                    name="socialLinks.personalWebsiteVisible"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="text-sm text-gray-600">Visible</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-website-visible"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="socialLinks.personalWebsite"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="https://yourwebsite.com" data-testid="input-website-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Portfolio */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-gray-600" />
                    Portfolio
                  </Label>
                  <FormField
                    control={form.control}
                    name="socialLinks.portfolioVisible"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormLabel className="text-sm text-gray-600">Visible</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-portfolio-visible"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="socialLinks.portfolioUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="https://yourportfolio.com" data-testid="input-portfolio-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-4">
          {showBackButton && (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="border-stak-copper text-stak-copper"
              data-testid="button-back"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          )}
          <Button
            type="submit"
            className="bg-stak-copper hover:bg-stak-dark-copper text-stak-black font-medium ml-auto"
            data-testid="button-next"
          >
            Continue
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );
}