"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ProfileUpdateInput } from "@safestop/validation";

import { useAuth } from "@/hooks/use-auth";

import { getProfile } from "../services/get-profile";
import { updateProfile } from "../services/update-profile";
import { PROFILE_QUERY_KEY, type Profile } from "../types";

export function useProfile() {
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const queryClient = useQueryClient();
  const userId = user?.id;

  const query = useQuery({
    queryKey: [PROFILE_QUERY_KEY, userId],
    queryFn: getProfile,
    enabled: isAuthenticated && userId !== undefined && !isAuthLoading,
  });

  const mutation = useMutation({
    mutationFn: (input: ProfileUpdateInput) => updateProfile(input),
    onSuccess: (updatedProfile: Profile) => {
      queryClient.setQueryData<Profile | null>([PROFILE_QUERY_KEY, userId], updatedProfile);
    },
  });

  return {
    profile: query.data,
    isLoading: isAuthLoading || query.isLoading,
    isError: query.isError,
    error: query.error,
    isNotFound: query.isSuccess && query.data === null,
    updateProfile: mutation.mutateAsync,
    isUpdating: mutation.isPending,
    updateError: mutation.error,
    isUpdateSuccess: mutation.isSuccess,
    resetUpdateState: mutation.reset,
  };
}
