import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ChevronLeft, CheckCircle, DollarSign, TrendingUp, Globe, Briefcase } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const SECTORS = [
  "AI/ML", "B2B SaaS", "Biotech", "Climate Tech", "Consumer",
  "Crypto/Web3", "Cybersecurity", "Data/Analytics", "DeepTech",
  "Developer Tools", "E-commerce", "EdTech", "Enterprise",
  "FinTech", "Gaming", "Hardware", "HealthTech", "HR Tech",
  "Infrastructure", "InsurTech", "IoT", "Legal Tech", "Logistics",
  "MarketPlaces", "Marketing Tech", "Media", "PropTech", "Robotics",
  "Security", "Social", "Space Tech", "Supply Chain", "Travel"
];

const GEOGRAPHY = [
  "San Francisco Bay Area", "New York", "Los Angeles", "Boston",
  "Austin", "Seattle", "Denver", "Miami", "Chicago", "Atlanta",
  "Remote/Global", "Europe", "Asia", "Latin America", "Africa",
  "Middle East", "Canada", "Australia/NZ"
];

const STAGES = [
  "Pre-seed", "Seed", "Series A", "Series B", "Series C+",
  "Growth", "Late Stage", "Pre-IPO"
];

const stage4Schema = z.object({
  aum: z.string().optional(),
  fundStage: z.string().optional(),
  checkSizeMin: z.string().optional(),
  checkSizeMax: z.string().optional(),
  investmentThesis: z.string()
    .min(50, "Please provide a meaningful investment thesis (min 50 characters)")
    .max(1000, "Investment thesis is too long (max 1000 characters)"),
  sectors: z.array(z.string())
    .min(1, "Please select at least one sector")
    .max(10, "Maximum 10 sectors allowed"),
  geography: z.array(z.string())
    .min(1, "Please select at least one geography")
    .max(20, "Maximum 20 geographies allowed"),
  stages: z.array(z.string())
    .min(1, "Please select at least one stage")
    .max(10, "Maximum 10 stages allowed"),
  portfolioCount: z.coerce.number().optional().or(z.literal("")),
  notableWins: z.string().optional(),
  diligenceStyle: z.string().optional(),
});

type Stage4Data = z.infer<typeof stage4Schema>;

interface Stage4VCProfileProps {
  onNext: (data: Stage4Data) => void;
  onBack?: () => void;
  initialData?: Partial<Stage4Data>;
  showBackButton?: boolean;
  isLastStage?: boolean;
}

export default function Stage4VCProfile({
  onNext,
  onBack,
  initialData,
  showBackButton = false,
  isLastStage = true,
}: Stage4VCProfileProps) {
  const form = useForm<Stage4Data>({
    resolver: zodResolver(stage4Schema),
    defaultValues: {
      aum: initialData?.aum || "",
      fundStage: initialData?.fundStage || "",
      checkSizeMin: initialData?.checkSizeMin || "",
      checkSizeMax: initialData?.checkSizeMax || "",
      investmentThesis: initialData?.investmentThesis || "",
      sectors: initialData?.sectors || [],
      geography: initialData?.geography || [],
      stages: initialData?.stages || [],
      portfolioCount: initialData?.portfolioCount || "",
      notableWins: initialData?.notableWins || "",
      diligenceStyle: initialData?.diligenceStyle || "",
    },
  });

  const handleSubmit = (data: Stage4Data) => {
    // The schema now handles the conversion with z.coerce.number()
    // Empty string will be converted to undefined by our schema
    const processedData = {
      ...data,
      portfolioCount: data.portfolioCount === "" ? undefined : data.portfolioCount
    };
    
    console.log('Submitting Stage 4 VC data:', processedData);
    onNext(processedData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stak-black">Investor Profile</h2>
          <p className="text-gray-600">
            Help founders understand your investment focus and style
          </p>
        </div>

        {/* Fund Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-stak-copper" />
              Fund Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="aum"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>AUM (Assets Under Management)</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $50M" data-testid="input-aum" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="fundStage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fund Stage</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., Fund III" data-testid="input-fund-stage" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="checkSizeMin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Check Size</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $100K" data-testid="input-check-min" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="checkSizeMax"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Check Size</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g., $2M" data-testid="input-check-max" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Investment Thesis */}
        <FormField
          control={form.control}
          name="investmentThesis"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Investment Thesis *</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Describe your investment focus, what types of companies excite you, and what unique value you bring to founders..."
                  className="min-h-[120px]"
                  data-testid="textarea-investment-thesis"
                />
              </FormControl>
              <FormDescription>
                Help founders understand what you're looking for (50-1000 characters)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Sectors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-stak-copper" />
              Sectors of Interest * (max 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="sectors"
              render={() => (
                <FormItem>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {SECTORS.map((sector) => (
                      <FormField
                        key={sector}
                        control={form.control}
                        name="sectors"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(sector)}
                                  disabled={!field.value?.includes(sector) && field.value?.length >= 10}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), sector]
                                      : field.value?.filter((v) => v !== sector) || [];
                                    field.onChange(newValue);
                                  }}
                                  data-testid={`checkbox-sector-${sector.toLowerCase().replace(/\s+/g, '-')}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {sector}
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
          </CardContent>
        </Card>

        {/* Geography */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="w-5 h-5 text-stak-copper" />
              Geographic Focus * (max 20)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="geography"
              render={() => (
                <FormItem>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {GEOGRAPHY.map((geo) => (
                      <FormField
                        key={geo}
                        control={form.control}
                        name="geography"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(geo)}
                                  disabled={!field.value?.includes(geo) && field.value?.length >= 20}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), geo]
                                      : field.value?.filter((v) => v !== geo) || [];
                                    field.onChange(newValue);
                                  }}
                                  data-testid={`checkbox-geo-${geo.toLowerCase().replace(/\s+/g, '-')}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {geo}
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
          </CardContent>
        </Card>

        {/* Investment Stages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-stak-copper" />
              Investment Stages * (max 10)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="stages"
              render={() => (
                <FormItem>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {STAGES.map((stage) => (
                      <FormField
                        key={stage}
                        control={form.control}
                        name="stages"
                        render={({ field }) => (
                          <FormItem>
                            <div className="flex items-center space-x-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(stage)}
                                  disabled={!field.value?.includes(stage) && field.value?.length >= 10}
                                  onCheckedChange={(checked) => {
                                    const newValue = checked
                                      ? [...(field.value || []), stage]
                                      : field.value?.filter((v) => v !== stage) || [];
                                    field.onChange(newValue);
                                  }}
                                  data-testid={`checkbox-stage-${stage.toLowerCase().replace(/\s+/g, '-')}`}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                {stage}
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
          </CardContent>
        </Card>

        {/* Portfolio & Style */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Portfolio & Style</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="portfolioCount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Portfolio Companies</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number"
                      placeholder="e.g., 25" 
                      data-testid="input-portfolio-count" 
                    />
                  </FormControl>
                  <FormDescription>
                    Enter the number of active portfolio companies
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notableWins"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notable Portfolio Companies</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="List a few of your successful investments or notable portfolio companies..."
                      className="min-h-[80px]"
                      data-testid="textarea-notable-wins"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="diligenceStyle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diligence Style</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your diligence process and typical timeline for making investment decisions..."
                      className="min-h-[80px]"
                      data-testid="textarea-diligence-style"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
            className="bg-green-600 hover:bg-green-700 text-white font-medium ml-auto"
            data-testid="button-complete"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Complete Interview
          </Button>
        </div>
      </form>
    </Form>
  );
}