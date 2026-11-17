import { Suspense, lazy } from "react";
import { ChevronDown, UserRound } from "lucide-react";
import type { AuthStatus } from "../hooks/useAuth";
import { useUserProfile } from "../hooks/useUserProfile";
import { UserXpBar } from "./UserXpBar";

const AuthPanel = lazy(() =>
  import("./AuthPanel").then((module) => ({ default: module.AuthPanel })),
);

type HeaderUserControlsProps = {
  auth: AuthStatus;
  copy: Record<string, string>;
  cloudError: string | null;
  syncError: string | null;
  onOpenSettings: () => void;
};

function AuthTriggerPlaceholder({ label }: { label: string }) {
  return (
    <button type="button" className="auth-zen-trigger" disabled aria-busy="true">
      <UserRound className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
      <ChevronDown className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

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
      <Suspense fallback={<AuthTriggerPlaceholder label={copy.account} />}>
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
      </Suspense>
    </>
  );
}
