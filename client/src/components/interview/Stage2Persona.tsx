import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChevronLeft, ChevronRight, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  selectedPersonas: z.array(z.string()).min(1, "Please select at least one persona"),
  primaryPersona: z.string().optional(),
}).refine((data) => {
  // If multiple personas selected, primary is required
  if (data.selectedPersonas.length > 1 && !data.primaryPersona) {
    return false;
  }
  // Primary persona must be one of the selected personas
  if (data.primaryPersona && !data.selectedPersonas.includes(data.primaryPersona)) {
    return false;
  }
  return true;
}, {
  message: "Please select a primary persona from your selected personas",
  path: ["primaryPersona"],
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
  const [selectedPersonas, setSelectedPersonas] = useState<string[]>(
    initialData?.selectedPersonas || []
  );

  const form = useForm<Stage2Data>({
    resolver: zodResolver(stage2Schema),
    defaultValues: {
      selectedPersonas: initialData?.selectedPersonas || [],
      primaryPersona: initialData?.primaryPersona || "",
    },
  });

  const handlePersonaToggle = (persona: string, checked: boolean) => {
    const newSelectedPersonas = checked
      ? [...selectedPersonas, persona]
      : selectedPersonas.filter(p => p !== persona);
    
    setSelectedPersonas(newSelectedPersonas);
    form.setValue("selectedPersonas", newSelectedPersonas);
    
    // If only one persona is selected, set it as primary automatically
    if (newSelectedPersonas.length === 1) {
      form.setValue("primaryPersona", newSelectedPersonas[0]);
    }
    // If the removed persona was the primary, clear primary
    if (!checked && form.getValues("primaryPersona") === persona) {
      form.setValue("primaryPersona", "");
    }
  };

  const handleSubmit = (data: Stage2Data) => {
    // If only one persona selected, set it as primary
    if (data.selectedPersonas.length === 1) {
      data.primaryPersona = data.selectedPersonas[0];
    }
    onNext(data);
  };

  const needsPrimarySelection = selectedPersonas.length > 1;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stak-black">Your Professional Persona</h2>
          <p className="text-gray-600">
            Select all roles that describe you. This helps us connect you with the right people.
          </p>
        </div>

        {/* Persona Selection */}
        <FormField
          control={form.control}
          name="selectedPersonas"
          render={() => (
            <FormItem>
              <FormLabel>Select Your Personas</FormLabel>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {PERSONAS.map((persona) => (
                  <Card
                    key={persona.value}
                    className={`cursor-pointer transition-all ${
                      selectedPersonas.includes(persona.value)
                        ? "border-stak-copper bg-stak-copper/5"
                        : "border-gray-200 hover:border-stak-copper/50"
                    }`}
                    onClick={() => {
                      const isChecked = selectedPersonas.includes(persona.value);
                      handlePersonaToggle(persona.value, !isChecked);
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={selectedPersonas.includes(persona.value)}
                          onCheckedChange={(checked) => 
                            handlePersonaToggle(persona.value, checked as boolean)
                          }
                          onClick={(e) => e.stopPropagation()}
                          data-testid={`checkbox-persona-${persona.value.toLowerCase()}`}
                        />
                        <div className="flex-1">
                          <Label className="font-medium cursor-pointer">
                            {persona.label}
                          </Label>
                          <p className="text-sm text-gray-600 mt-0.5">
                            {persona.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Primary Persona Selection */}
        {needsPrimarySelection && (
          <Card className="border-stak-copper/30 bg-stak-copper/5">
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="primaryPersona"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-lg font-semibold">
                      Select Your Primary Persona *
                    </FormLabel>
                    <Alert className="mt-2 mb-4">
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Since you selected multiple personas, please choose your primary role.
                        This will be how you're primarily identified in the network.
                      </AlertDescription>
                    </Alert>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <div className="space-y-3">
                          {selectedPersonas.map((personaValue) => {
                            const persona = PERSONAS.find(p => p.value === personaValue);
                            if (!persona) return null;
                            
                            return (
                              <div key={persona.value} className="flex items-center space-x-3">
                                <RadioGroupItem 
                                  value={persona.value} 
                                  id={`primary-${persona.value}`}
                                  data-testid={`radio-primary-${persona.value.toLowerCase()}`}
                                />
                                <Label
                                  htmlFor={`primary-${persona.value}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  <span className="font-medium">{persona.label}</span>
                                  <span className="text-sm text-gray-600 ml-2">
                                    - {persona.description}
                                  </span>
                                </Label>
                              </div>
                            );
                          })}
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Selected Count Display */}
        {selectedPersonas.length > 0 && (
          <div className="bg-stak-copper/10 rounded-lg p-4">
            <p className="text-sm font-medium text-stak-black">
              {selectedPersonas.length} persona{selectedPersonas.length !== 1 ? 's' : ''} selected
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedPersonas.map((personaValue) => {
                const persona = PERSONAS.find(p => p.value === personaValue);
                return (
                  <span
                    key={personaValue}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-stak-copper/20 text-stak-black"
                  >
                    {persona?.label}
                    {form.getValues("primaryPersona") === personaValue && (
                      <span className="ml-1 text-xs font-semibold">(Primary)</span>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
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