import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Plus,
  Edit2,
  Trash2,
  ExternalLink,
  Users,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Sponsor, InsertSponsor } from "@shared/schema";

export default function AdminSponsors() {
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState<Sponsor | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch sponsors
  const { data: sponsors = [], isLoading } = useQuery<Sponsor[]>({
    queryKey: ["/api/sponsors"],
  });

  // Create sponsor mutation
  const createMutation = useMutation({
    mutationFn: async (data: InsertSponsor) => {
      const response = await apiRequest("POST", "/api/sponsors", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      setCreateDialog(false);
      toast({
        title: "Success",
        description: "Sponsor created successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create sponsor",
        variant: "destructive",
      });
    },
  });

  // Update sponsor mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: InsertSponsor }) => {
      const response = await apiRequest("PUT", `/api/sponsors/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      setEditDialog(false);
      setEditingSponsor(null);
      toast({
        title: "Success",
        description: "Sponsor updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update sponsor",
        variant: "destructive",
      });
    },
  });

  // Delete sponsor mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/sponsors/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sponsors"] });
      toast({
        title: "Success",
        description: "Sponsor deleted successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete sponsor",
        variant: "destructive",
      });
    },
  });

  const handleCreateSponsor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const sponsorData: InsertSponsor = {
      name: formData.get("name") as string,
      tier: formData.get("tier") as string,
      logoUrl: (formData.get("logoUrl") as string) || null,
      websiteUrl: (formData.get("websiteUrl") as string) || null,
      description: (formData.get("description") as string) || null,
      contactEmail: (formData.get("contactEmail") as string) || null,
      isActive: formData.get("isActive") === "true",
    };

    createMutation.mutate(sponsorData);
  };

  const handleEditSponsor = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingSponsor) return;

    const formData = new FormData(e.currentTarget);

    const sponsorData: InsertSponsor = {
      name: formData.get("name") as string,
      tier: formData.get("tier") as string,
      logoUrl: (formData.get("logoUrl") as string) || null,
      websiteUrl: (formData.get("websiteUrl") as string) || null,
      description: (formData.get("description") as string) || null,
      contactEmail: (formData.get("contactEmail") as string) || null,
      isActive: formData.get("isActive") === "true",
    };

    updateMutation.mutate({ id: editingSponsor.id, data: sponsorData });
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "title":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "presenting":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "gold":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "silver":
        return "bg-gray-100 text-gray-800 border-gray-200";
      case "bronze":
        return "bg-orange-100 text-orange-800 border-orange-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case "title":
        return "Title Sponsor";
      case "presenting":
        return "Presenting Sponsor";
      case "gold":
        return "Gold Sponsor";
      case "silver":
        return "Silver Sponsor";
      case "bronze":
        return "Bronze Sponsor";
      case "host_partner":
        return "Host Partner";
      default:
        return tier;
    }
  };

  const SponsorForm = ({
    sponsor,
    onSubmit,
    isLoading,
  }: {
    sponsor?: Sponsor | null;
    onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
    isLoading: boolean;
  }) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Company Name *</Label>
          <Input
            id="name"
            name="name"
            required
            defaultValue={sponsor?.name || ""}
            placeholder="ACME Corporation"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tier">Sponsorship Tier *</Label>
          <Select name="tier" defaultValue={sponsor?.tier || ""}>
            <SelectTrigger>
              <SelectValue placeholder="Select tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">Title Sponsor</SelectItem>
              <SelectItem value="presenting">Presenting Sponsor</SelectItem>
              <SelectItem value="gold">Gold Sponsor</SelectItem>
              <SelectItem value="silver">Silver Sponsor</SelectItem>
              <SelectItem value="bronze">Bronze Sponsor</SelectItem>
              <SelectItem value="host_partner">Host Partner</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="logoUrl">Logo URL</Label>
          <Input
            id="logoUrl"
            name="logoUrl"
            type="url"
            defaultValue={sponsor?.logoUrl || ""}
            placeholder="https://company.com/logo.png"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="websiteUrl">Website URL</Label>
          <Input
            id="websiteUrl"
            name="websiteUrl"
            type="url"
            defaultValue={sponsor?.websiteUrl || ""}
            placeholder="https://company.com"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="contactEmail">Contact Email</Label>
        <Input
          id="contactEmail"
          name="contactEmail"
          type="email"
          defaultValue={sponsor?.contactEmail || ""}
          placeholder="contact@company.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Company Description</Label>
        <Textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={sponsor?.description || ""}
          placeholder="Brief description of the company and what they do..."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="isActive">Status</Label>
        <Select
          name="isActive"
          defaultValue={sponsor?.isActive ? "true" : "false"}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="true">Active</SelectItem>
            <SelectItem value="false">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setCreateDialog(false);
            setEditDialog(false);
            setEditingSponsor(null);
          }}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : sponsor
              ? "Update Sponsor"
              : "Create Sponsor"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-navy">Sponsor Management</h1>
          <p className="text-gray-600 mt-2">
            Manage corporate sponsors and brand partnerships
          </p>
        </div>

        {/* Create Sponsor Dialog */}
        <Dialog open={createDialog} onOpenChange={setCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Sponsor
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Sponsor</DialogTitle>
            </DialogHeader>
            <SponsorForm
              onSubmit={handleCreateSponsor}
              isLoading={createMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-stak-copper" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Sponsors
                </p>
                <p className="text-2xl font-bold text-navy">
                  {sponsors.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Active Sponsors
                </p>
                <p className="text-2xl font-bold text-navy">
                  {sponsors.filter((s) => s.isActive).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-amber-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Title Sponsors
                </p>
                <p className="text-2xl font-bold text-navy">
                  {sponsors.filter((s) => s.tier === "title").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Building2 className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Host Partners
                </p>
                <p className="text-2xl font-bold text-navy">
                  {sponsors.filter((s) => s.tier === "host_partner").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sponsors List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-200 rounded"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : sponsors.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-600 mb-2">
                No sponsors yet
              </h3>
              <p className="text-gray-500 mb-4">
                Create your first sponsor to start building partnerships.
              </p>
            </CardContent>
          </Card>
        ) : (
          sponsors.map((sponsor) => (
            <Card
              key={sponsor.id}
              className="luxury-card hover:shadow-lg transition-shadow"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {sponsor.logoUrl && (
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                        <img
                          src={sponsor.logoUrl}
                          alt={`${sponsor.name} logo`}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-semibold text-navy">
                          {sponsor.name}
                        </h3>
                        <Badge className={getTierColor(sponsor.tier)}>
                          {getTierName(sponsor.tier)}
                        </Badge>
                        <Badge
                          variant={sponsor.isActive ? "default" : "secondary"}
                        >
                          {sponsor.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>

                      {sponsor.description && (
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {sponsor.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        {sponsor.contactEmail && (
                          <span>Contact: {sponsor.contactEmail}</span>
                        )}
                      </div>

                      {sponsor.websiteUrl && (
                        <div className="mt-3">
                          <a
                            href={sponsor.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-stak-copper hover:text-stak-copper/80"
                          >
                            <ExternalLink className="w-4 h-4 mr-1" />
                            Visit Website
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingSponsor(sponsor);
                        setEditDialog(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (
                          confirm(
                            `Are you sure you want to delete ${sponsor.name}?`,
                          )
                        ) {
                          deleteMutation.mutate(sponsor.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Sponsor Dialog */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Sponsor</DialogTitle>
          </DialogHeader>
          <SponsorForm
            sponsor={editingSponsor}
            onSubmit={handleEditSponsor}
            isLoading={updateMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
