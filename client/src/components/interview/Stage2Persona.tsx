import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const PERSONAS = [
  { value: "VC", label: "Venture Capitalist", description: "Institutional investor in startups" },
  { value: "Angel", label: "Angel Investor", description: "Individual startup investor" },
  { value: "Family Office", label: "Family Office", description: "Private wealth management" },
  { value: "Founder", label: "Founder", description: "Startup founder or co-founder" },
  { value: "Operator", label: "Operator", description: "Startup executive or manager" },
  { value: "Engineer", label: "Engineer", description: "Software or hardware engineer" },
  { value: "Designer", label: "Designer", description: "Product or visual designer" },
  { value: "Product", label: "Product Manager", description: "Product strategy and execution" },
  { value: "Data/AI", label: "Data/AI Specialist", description: "Data science or AI/ML expert" },
  { value: "Creator", label: "Content Creator", description: "Influencer or content producer" },
  { value: "Researcher", label: "Researcher", description: "Academic or industry researcher" },
  { value: "Student", label: "Student", description: "Currently in school" },
  { value: "Recruiter", label: "Recruiter", description: "Talent acquisition specialist" },
  { value: "Community/Events", label: "Community/Events", description: "Community builder or event organizer" },
  { value: "Service Provider", label: "Service Provider", description: "Professional services (legal, accounting, etc.)" },
  { value: "Other", label: "Other", description: "Something else not listed" },
];

const stage2Schema = z.object({
  primaryPersona: z.string().min(1, "Please select your primary persona"),
  secondaryPersonas: z.array(z.string()).optional(),
});

type Stage2Data = z.infer<typeof stage2Schema>;

interface Stage2PersonaProps {
  onNext: (data: Stage2Data) => void;
  onBack?: () => void;
  initialData?: Partial<Stage2Data>;
  showBackButton?: boolean;
}

export default function Stage2Persona({
  onNext,
  onBack,
  initialData,
  showBackButton = false,
}: Stage2PersonaProps) {
  const form = useForm<Stage2Data>({
    resolver: zodResolver(stage2Schema),
    defaultValues: {
      primaryPersona: initialData?.primaryPersona || "",
      secondaryPersonas: initialData?.secondaryPersonas || [],
    },
  });

  const handleSubmit = (data: Stage2Data) => {
    // Create the personas array that includes the primary persona
    const personas = [data.primaryPersona];
    if (data.secondaryPersonas && data.secondaryPersonas.length > 0) {
      personas.push(...data.secondaryPersonas);
    }
    
    // Send data in the format the backend expects
    const formattedData = {
      ...data,
      personas, // Add the complete personas array
    };
    
    onNext(formattedData);
  };

  const primaryPersona = form.watch("primaryPersona");
  const secondaryPersonas = form.watch("secondaryPersonas") || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stak-black">Your Professional Persona</h2>
          <p className="text-gray-600">
            Select your primary role and any additional roles that describe you
          </p>
        </div>

        {/* Primary Persona Selection */}
        <FormField
          control={form.control}
          name="primaryPersona"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Primary Persona *</FormLabel>
              <FormDescription>
                Select your main professional identity
              </FormDescription>
              <FormControl>
                <ToggleGroup
                  type="single"
                  value={field.value}
                  onValueChange={field.onChange}
                  className="flex flex-wrap gap-2 justify-start"
                >
                  {PERSONAS.map((persona) => (
                    <ToggleGroupItem
                      key={persona.value}
                      value={persona.value}
                      className="data-[state=on]:bg-stak-copper data-[state=on]:text-white border-stak-copper/30 hover:bg-stak-copper/10"
                      data-testid={`chip-primary-${persona.value.toLowerCase()}`}
                    >
                      {persona.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Secondary Personas Selection */}
        <FormField
          control={form.control}
          name="secondaryPersonas"
          render={({ field }) => (
            <FormItem className="space-y-3">
              <FormLabel>Secondary Personas (Optional)</FormLabel>
              <FormDescription>
                Select any additional roles that describe you
              </FormDescription>
              <FormControl>
                <ToggleGroup
                  type="multiple"
                  value={field.value || []}
                  onValueChange={(value) => {
                    // Don't allow selecting the primary persona as secondary
                    const filtered = value.filter(v => v !== primaryPersona);
                    field.onChange(filtered);
                  }}
                  className="flex flex-wrap gap-2 justify-start"
                >
                  {PERSONAS.filter(p => p.value !== primaryPersona).map((persona) => (
                    <ToggleGroupItem
                      key={persona.value}
                      value={persona.value}
                      className="data-[state=on]:bg-stak-copper/20 data-[state=on]:text-stak-black border-stak-copper/30 hover:bg-stak-copper/10"
                      data-testid={`chip-secondary-${persona.value.toLowerCase()}`}
                    >
                      {persona.label}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Selected Summary */}
        {(primaryPersona || secondaryPersonas.length > 0) && (
          <Card className="border-stak-copper/30 bg-stak-copper/5">
            <CardContent className="pt-6">
              <h3 className="text-sm font-semibold text-stak-black mb-3">Your Professional Identity</h3>
              <div className="space-y-2">
                {primaryPersona && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">Primary:</span>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-stak-copper text-white">
                      {PERSONAS.find(p => p.value === primaryPersona)?.label}
                    </span>
                  </div>
                )}
                {secondaryPersonas.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-medium text-gray-600 mt-1">Secondary:</span>
                    <div className="flex flex-wrap gap-1">
                      {secondaryPersonas.map((personaValue) => {
                        const persona = PERSONAS.find(p => p.value === personaValue);
                        return (
                          <span
                            key={personaValue}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-stak-copper/20 text-stak-black"
                          >
                            {persona?.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

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