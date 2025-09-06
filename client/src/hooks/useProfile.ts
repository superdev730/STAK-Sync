import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";

export interface ProfileProvenance {
  source: 'db' | 'enrichment' | 'user';
  confidence: string;
  sources?: string[];
  lastUpdated?: string;
}

export interface EnhancedProfile extends User {
  // Provenance information
  _provenance?: {
    [field: string]: ProfileProvenance;
  };
  // Profile completeness
  _completeness?: {
    score: number;
    missingFields: string[];
    providedFields: string[];
  };
}

export interface ProfileUpdateData {
  [key: string]: any;
}

/**
 * Enhanced profile hook that provides merged profile data with provenance tracking
 */
export function useProfile(userId?: string) {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  
  const targetUserId = userId || currentUser?.id;
  const isOwnProfile = !userId || userId === currentUser?.id;

  // Enhanced profile query using /api/me endpoint  
  const profileQuery = useQuery<EnhancedProfile>({
    queryKey: userId ? ['/api/profile', userId] : ['/api/me'],
    enabled: !!targetUserId,
    staleTime: 30000, // Profile data is relatively stable
  });

  // Profile update mutation
  const updateMutation = useMutation({
    mutationFn: async (updates: ProfileUpdateData) => {
      const response = await apiRequest('/api/profile', 'PUT', updates);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate profile cache to refetch updated data
      queryClient.invalidateQueries({ queryKey: userId ? ['/api/profile', userId] : ['/api/me'] });
      queryClient.invalidateQueries({ queryKey: ['/api/profile'] }); // Legacy cache
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
    },
  });

  // Manual enrichment mutation
  const enrichMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/profile/ai/analyze${userId ? `/${userId}` : ''}`, 'POST');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate profile cache to show enriched data
      queryClient.invalidateQueries({ queryKey: userId ? ['/api/profile', userId] : ['/api/me'] });
    },
    onError: (error) => {
      console.error('Profile enrichment failed:', error);
    },
  });

  // Helper functions for profile analysis
  const getFieldProvenance = (fieldName: string): ProfileProvenance | null => {
    return profileQuery.data?._provenance?.[fieldName] || null;
  };

  const getFieldConfidence = (fieldName: string): number => {
    const provenance = getFieldProvenance(fieldName);
    return provenance ? parseFloat(provenance.confidence) : 0;
  };

  const isFieldFromEnrichment = (fieldName: string): boolean => {
    const provenance = getFieldProvenance(fieldName);
    return provenance?.source === 'enrichment';
  };

  const isFieldUserProvided = (fieldName: string): boolean => {
    const provenance = getFieldProvenance(fieldName);
    return provenance?.source === 'user';
  };

  const getUnknownFields = (): string[] => {
    return profileQuery.data?._completeness?.missingFields || [];
  };

  const getCompleteness = (): number => {
    return profileQuery.data?._completeness?.score || 0;
  };

  return {
    // Core data
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    error: profileQuery.error,
    isOwnProfile,
    
    // Mutations
    updateProfile: updateMutation.mutate,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,
    
    // Enrichment
    enrichProfile: enrichMutation.mutate,
    isEnriching: enrichMutation.isPending,
    enrichError: enrichMutation.error,
    
    // Provenance helpers
    getFieldProvenance,
    getFieldConfidence,
    isFieldFromEnrichment,
    isFieldUserProvided,
    getUnknownFields,
    getCompleteness,
    
    // Refetch function for manual refresh
    refetch: profileQuery.refetch,
  };
}