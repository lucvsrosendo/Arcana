import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  ensureUserProfile,
  fetchRecentXpEvents,
  fetchUserProfile,
  removeUserAvatar,
  updateUserProfile,
  uploadUserAvatar,
  type UserProfile,
  type XpEvent,
} from "../lib/userProfileCloud";

export const userProfileQueryKey = (userId: string | null | undefined) =>
  ["user-profile", userId ?? null] as const;

type UserProfileData = {
  profile: UserProfile | null;
  xpEvents: XpEvent[];
};

const fetchUserProfileData = async (userId: string): Promise<UserProfileData> => {
  const profile = (await ensureUserProfile()) ?? (await fetchUserProfile(userId));
  const xpEvents = profile ? await fetchRecentXpEvents(userId) : [];

  return { profile, xpEvents };
};

type UserProfileContextValue = {
  profile: UserProfile | null;
  xpTotal: number;
  xpEvents: XpEvent[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

type UserProfileProviderProps = {
  user: User | null;
  children: ReactNode;
};

export function UserProfileProvider({ user, children }: UserProfileProviderProps) {
  const queryClient = useQueryClient();
  const userId = user?.id;
  const queryKey = useMemo(() => userProfileQueryKey(userId), [userId]);

  const profileQuery = useQuery({
    queryKey,
    queryFn: () => fetchUserProfileData(userId!),
    enabled: Boolean(userId),
  });

  const updateProfileCache = useCallback(
    (profile: UserProfile) => {
      queryClient.setQueryData<UserProfileData>(queryKey, (current) => ({
        profile,
        xpEvents: current?.xpEvents ?? [],
      }));
    },
    [queryClient, queryKey],
  );

  const updateDisplayNameMutation = useMutation({
    mutationFn: (displayName: string) => updateUserProfile(userId!, { displayName }),
    onSuccess: updateProfileCache,
  });

  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => uploadUserAvatar(userId!, file),
    onSuccess: updateProfileCache,
  });

  const removeAvatarMutation = useMutation({
    mutationFn: () => removeUserAvatar(userId!),
    onSuccess: updateProfileCache,
  });

  const refresh = useCallback(async () => {
    if (!userId) {
      return;
    }

    await profileQuery.refetch();
  }, [profileQuery, userId]);

  const updateDisplayName = useCallback(
    async (displayName: string) => {
      if (!userId) {
        return;
      }

      await updateDisplayNameMutation.mutateAsync(displayName);
    },
    [userId, updateDisplayNameMutation],
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!userId) {
        return;
      }

      await uploadAvatarMutation.mutateAsync(file);
    },
    [userId, uploadAvatarMutation],
  );

  const removeAvatar = useCallback(async () => {
    if (!userId) {
      return;
    }

    await removeAvatarMutation.mutateAsync();
  }, [userId, removeAvatarMutation]);

  const profile = userId ? (profileQuery.data?.profile ?? null) : null;
  const xpEvents = userId ? (profileQuery.data?.xpEvents ?? []) : [];
  const error =
    userId && profileQuery.error
      ? profileQuery.error instanceof Error
        ? profileQuery.error.message
        : "profile-load-error"
      : null;

  const value = useMemo(
    () => ({
      profile,
      xpTotal: profile?.xpTotal ?? 0,
      xpEvents,
      isLoading: userId ? profileQuery.isLoading : false,
      error,
      refresh,
      updateDisplayName,
      uploadAvatar,
      removeAvatar,
    }),
    [
      profile,
      xpEvents,
      userId,
      profileQuery.isLoading,
      error,
      refresh,
      updateDisplayName,
      uploadAvatar,
      removeAvatar,
    ],
  );

  return (
    <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>
  );
}

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (!context) {
    throw new Error("useUserProfile must be used within UserProfileProvider");
  }
  return context;
};
