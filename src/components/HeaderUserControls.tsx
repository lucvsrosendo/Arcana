import type { AuthStatus } from "../hooks/useAuth";
import { useUserProfile } from "../hooks/useUserProfile";
import { AuthPanel } from "./AuthPanel";
import { UserXpBar } from "./UserXpBar";

type HeaderUserControlsProps = {
  auth: AuthStatus;
  copy: Record<string, string>;
  cloudError: string | null;
  syncError: string | null;
  onOpenSettings: () => void;
};

export function HeaderUserControls({
  auth,
  copy,
  cloudError,
  syncError,
  onOpenSettings,
}: HeaderUserControlsProps) {
  const { profile, xpTotal } = useUserProfile();
  const displayName =
    profile?.displayName?.trim() ||
    (auth.user?.user_metadata?.display_name as string | undefined)?.trim() ||
    auth.user?.email?.split("@")[0] ||
    copy.account;

  return (
    <>
      {auth.session ? (
        <UserXpBar
          xpTotal={xpTotal}
          label={copy.xpLabel}
          ariaLabel={`${copy.xpLabel} ${xpTotal}`}
        />
      ) : null}
      <AuthPanel
        auth={auth}
        copy={copy}
        cloudError={cloudError}
        syncError={syncError}
        displayName={displayName}
        avatarUrl={profile?.avatarUrl ?? null}
        xpTotal={xpTotal}
        onOpenSettings={onOpenSettings}
      />
    </>
  );
}
