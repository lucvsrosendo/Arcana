import { zodResolver } from "@hookform/resolvers/zod";
import { OTPInput, OTPInputContext } from "input-otp";
import { useEffect, useId, useRef, useState, useContext } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ChevronDown, LogIn, LogOut, UserPlus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { isGoogleAuthEnabled } from "../lib/authRedirect";
import { getPasswordStrength } from "../lib/passwordStrength";
import { updateUserProfile } from "../lib/userProfileCloud";
import { XP_RULES } from "../data/xpRules";
import type { AuthStatus } from "../hooks/useAuth";

type AuthIntent = "sign-in" | "sign-up";

type AuthPanelProps = {
  auth: AuthStatus;
  copy: Record<string, string>;
  cloudError: string | null;
  syncError: string | null;
  displayName?: string;
  avatarUrl?: string | null;
  xpTotal?: number;
  onOpenSettings?: () => void;
};

const createAuthSchema = (copy: Record<string, string>) =>
  z.object({
    email: z
      .string()
      .trim()
      .min(1, copy.authErrorEmail)
      .email(copy.authErrorEmail),
    password: z.string().min(1, copy.authErrorPasswordRequired),
    displayName: z.string(),
    confirmPassword: z.string(),
  });

type AuthFormValues = z.infer<ReturnType<typeof createAuthSchema>>;

function OtpSlot({ index, className }: { index: number; className?: string }) {
  const inputOTPContext = useContext(OTPInputContext);
  const { char, hasFakeCaret, isActive } = inputOTPContext.slots[index];

  return (
    <div
      className={cn(
        "relative flex h-10 w-10 items-center justify-center rounded-md border border-input text-sm",
        isActive && "ring-2 ring-ring ring-offset-2 ring-offset-background",
        className,
      )}
    >
      {char}
      {hasFakeCaret ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-4 w-px animate-pulse bg-foreground" />
        </div>
      ) : null}
    </div>
  );
}

const getFriendlyAuthError = (
  message: string,
  copy: Record<string, string>,
) => {
  const normalizedMessage = message.toLowerCase();

  if (
    normalizedMessage.includes("invalid login") ||
    normalizedMessage.includes("invalid credentials")
  ) {
    return copy.authErrorInvalidCredentials;
  }

  if (normalizedMessage.includes("email")) {
    return copy.authErrorEmail;
  }

  if (normalizedMessage.includes("password")) {
    return copy.authErrorPasswordPolicy;
  }

  if (
    normalizedMessage.includes("rate") ||
    normalizedMessage.includes("too many")
  ) {
    return copy.authErrorRateLimit;
  }

  if (
    normalizedMessage.includes("provider is not enabled") ||
    normalizedMessage.includes("unsupported provider")
  ) {
    return copy.authErrorOAuthProviderDisabled;
  }

  if (normalizedMessage.includes("popup-blocked")) {
    return copy.authErrorOAuthPopupBlocked;
  }

  if (
    normalizedMessage.includes("supabase unreachable") ||
    normalizedMessage.includes("failed to fetch") ||
    normalizedMessage.includes("enotfound") ||
    normalizedMessage.includes("err_name_not_resolved")
  ) {
    return copy.authErrorSupabaseUnreachable;
  }

  return copy.authErrorGeneric;
};

function AuthPopoverHeader({
  title,
  titleId,
  kicker,
}: {
  title: string;
  titleId?: string;
  kicker?: string;
}) {
  return (
    <header className="auth-zen-header">
      <span className="auth-zen-header-mark" aria-hidden="true" />
      <div className="auth-zen-header-copy">
        {kicker ? <p className="auth-zen-header-kicker">{kicker}</p> : null}
        <h2 className="auth-zen-header-title" id={titleId}>
          {title}
        </h2>
      </div>
    </header>
  );
}

export function AuthPanel({
  auth,
  copy,
  cloudError,
  syncError,
  displayName,
  avatarUrl,
  xpTotal = 0,
  onOpenSettings,
}: AuthPanelProps) {
  const titleId = useId();
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const authSchema = createAuthSchema(copy);
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      displayName: "",
      confirmPassword: "",
    },
  });
  const passwordValue = form.watch("password");
  const passwordStrength = getPasswordStrength(passwordValue);
  const passwordStrengthLabel =
    passwordStrength.level === "strong"
      ? copy.authPasswordStrengthStrong
      : passwordStrength.level === "ok"
        ? copy.authPasswordStrengthOk
        : copy.authPasswordStrengthWeak;
  const [notice, setNotice] = useState<string | null>(null);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthIntent>("sign-in");
  const previousSessionId = useRef<string | null>(auth.session?.access_token ?? null);

  const resetSignUpFields = () => {
    form.setValue("displayName", "");
    form.setValue("confirmPassword", "");
    setAcceptedTerms(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);

    if (!open) {
      setAuthMode("sign-in");
      setAcceptedTerms(false);
      setFormError(null);
      setNotice(null);
      form.reset({
        email: "",
        password: "",
        displayName: "",
        confirmPassword: "",
      });
    }
  };

  useEffect(() => {
    const currentSessionId = auth.session?.access_token ?? null;

    if (!previousSessionId.current && currentSessionId) {
      setIsOpen(false);
      form.resetField("password");
      setFormError(null);
    }

    previousSessionId.current = currentSessionId;
  }, [auth.session, form]);

  const clearErrors = () => {
    setFormError(null);
    setNotice(null);
    auth.clearError();
  };

  const handleSubmit = form.handleSubmit(async (values, event) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)
      ?.submitter as HTMLButtonElement | null;
    const intent: AuthIntent =
      submitter?.value === "sign-up" ? "sign-up" : "sign-in";

    if (
      intent === "sign-up" &&
      (values.password.length < 8 ||
        !/[a-z]/i.test(values.password) ||
        !/\d/.test(values.password))
    ) {
      setFormError(copy.authErrorPasswordPolicy);
      return;
    }

    if (intent === "sign-up") {
      const trimmedName = values.displayName.trim();

      if (trimmedName.length < 2) {
        setFormError(copy.authErrorDisplayNameRequired);
        return;
      }

      if (values.password !== values.confirmPassword) {
        setFormError(copy.authErrorPasswordMismatch);
        return;
      }

      if (!acceptedTerms) {
        setFormError(copy.legalConsentRequired);
        return;
      }

      const { userId, error: signUpError } = await auth.signUp(
        values.email.trim(),
        values.password,
        {
          displayName: trimmedName,
        },
      );

      if (signUpError) {
        return;
      }

      if (userId) {
        try {
          await updateUserProfile(userId, { displayName: trimmedName });
        } catch {
          // Metadata is already stored during sign-up when user_profiles is unavailable.
        }
      }

      setShowOtpVerification(true);
      setNotice(copy.authOtpStubNotice);
      return;
    }

    await auth.signIn(values.email.trim(), values.password);
  });

  if (!auth.isConfigured) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="auth-zen-trigger">
            <UserRound className="h-4 w-4" aria-hidden="true" />
            <span>{copy.account}</span>
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="auth-zen-popover"
          align="end"
          sideOffset={12}
          aria-labelledby={titleId}
        >
          <AuthPopoverHeader title={copy.account} titleId={titleId} />
          <p className="auth-zen-profile-meta">
            {copy.authConfigMissing}
          </p>
        </PopoverContent>
      </Popover>
    );
  }

  if (auth.session) {
    const profileLabel = displayName?.trim() || copy.account;
    const profileInitial = profileLabel.charAt(0).toUpperCase();

    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <button type="button" className="auth-zen-trigger signed">
            <span className="auth-zen-trigger-avatar" aria-hidden="true">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" width={28} height={28} loading="lazy" decoding="async" />
              ) : (
                profileInitial || <UserRound className="h-3.5 w-3.5" />
              )}
            </span>
            <span className="auth-zen-trigger-name">{profileLabel}</span>
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="auth-zen-popover"
          align="end"
          sideOffset={12}
          aria-labelledby={titleId}
        >
          <div className="auth-zen-profile">
            <AuthPopoverHeader title={profileLabel} titleId={titleId} />
            <p className="auth-zen-profile-meta">
              {copy.signedInAs} {auth.user?.email}
            </p>
            <div className="auth-zen-xp">
              <span className="zen-xp-mark" aria-hidden="true" />
              <span>
                {copy.xpLabel} {xpTotal}
              </span>
            </div>
            <ul className="auth-zen-xp-rules">
              <li>{copy.xpRuleComment.replace("{points}", String(XP_RULES.commentCreated))}</li>
              <li>{copy.xpRuleLike.replace("{points}", String(XP_RULES.likeGiven))}</li>
              <li>
                {copy.xpRuleLikeReceived.replace("{points}", String(XP_RULES.likeReceived))}
              </li>
              <li>
                {copy.xpRuleFavorite.replace("{points}", String(XP_RULES.favoriteGiven))}
              </li>
            </ul>
            {onOpenSettings ? (
              <Button
                type="button"
                variant="outline"
                className="auth-zen-signup w-full"
                onClick={() => {
                  onOpenSettings();
                  setIsOpen(false);
                }}
              >
                {copy.xpDetailsLink}
              </Button>
            ) : null}
            {cloudError ? (
              <p className="auth-zen-error">{copy.cloudLoadError}</p>
            ) : null}
            {syncError ? (
              <p className="auth-zen-error">{copy.cloudSyncError}</p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="auth-zen-signup w-full"
              onClick={auth.signOut}
              disabled={auth.isLoading}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {copy.signOut}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="auth-zen-signup w-full"
              onClick={auth.signOutAll}
              disabled={auth.isLoading}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              {copy.signOutAll}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  const displayedError =
    formError ??
    form.formState.errors.email?.message ??
    form.formState.errors.password?.message ??
    (auth.error ? getFriendlyAuthError(auth.error, copy) : null);

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button type="button" className="auth-zen-trigger">
          <UserRound className="h-4 w-4" aria-hidden="true" />
          <span>{copy.account}</span>
          <ChevronDown className="h-4 w-4" aria-hidden="true" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="auth-zen-popover"
        align="end"
        sideOffset={12}
        aria-labelledby={titleId}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <form className="auth-zen-form" onSubmit={handleSubmit} aria-labelledby={titleId}>
          <AuthPopoverHeader
            title={authMode === "sign-up" ? copy.authSignUpTitle : copy.account}
            titleId={titleId}
          />

          {authMode === "sign-up" ? (
            <p className="auth-zen-lede">{copy.authSignUpHint}</p>
          ) : null}

          {authMode === "sign-up" ? (
            <div className="auth-zen-field">
              <Label htmlFor="auth-display-name">{copy.authDisplayNameLabel}</Label>
              <Input
                id="auth-display-name"
                type="text"
                placeholder={copy.displayNamePlaceholder}
                autoComplete="name"
                aria-invalid={Boolean(displayedError)}
                {...form.register("displayName", {
                  onChange: () => clearErrors(),
                })}
              />
            </div>
          ) : null}

          <div className="auth-zen-field">
            <Label htmlFor="auth-email">{copy.email}</Label>
            <Input
              id="auth-email"
              type="email"
              placeholder={copy.authEmailPlaceholder}
              autoComplete="email"
              aria-invalid={Boolean(displayedError)}
              {...form.register("email", {
                onChange: () => clearErrors(),
              })}
            />
          </div>

          <div className="auth-zen-field">
            <Label htmlFor="auth-password">{copy.password}</Label>
            <Input
              id="auth-password"
              type="password"
              placeholder={copy.authPasswordPlaceholder}
              autoComplete={authMode === "sign-up" ? "new-password" : "current-password"}
              minLength={authMode === "sign-up" ? 8 : undefined}
              aria-invalid={Boolean(displayedError)}
              {...form.register("password", {
                onChange: () => clearErrors(),
              })}
            />
          </div>

          {authMode === "sign-up" && passwordValue ? (
            <div className="auth-zen-field space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{passwordStrengthLabel}</span>
                <span>{passwordStrength.score}%</span>
              </div>
              <Progress value={passwordStrength.score} className="h-1.5" aria-hidden="true" />
            </div>
          ) : null}

          {authMode === "sign-up" ? (
            <div className="auth-zen-field">
              <Label htmlFor="auth-confirm-password">{copy.authConfirmPassword}</Label>
              <Input
                id="auth-confirm-password"
                type="password"
                placeholder={copy.authPasswordPlaceholder}
                autoComplete="new-password"
                minLength={8}
                aria-invalid={Boolean(displayedError)}
                {...form.register("confirmPassword", {
                  onChange: () => clearErrors(),
                })}
              />
            </div>
          ) : null}

          {displayedError ? <p className="auth-zen-error">{displayedError}</p> : null}
          {notice ? <p className="auth-zen-notice">{notice}</p> : null}

          {showOtpVerification ? (
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {copy.authOtpTitle}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{copy.authOtpHint}</p>
              <OTPInput
                maxLength={6}
                value={otpValue}
                onChange={setOtpValue}
                containerClassName="auth-zen-otp"
              >
                {Array.from({ length: 6 }).map((_, index) => (
                  <OtpSlot key={index} index={index} />
                ))}
              </OTPInput>
              <div className="mt-3 grid gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={otpValue.length < 6}
                  onClick={() => {
                    setNotice(copy.authOtpStubNotice);
                    setShowOtpVerification(false);
                    setOtpValue("");
                  }}
                >
                  {copy.authOtpVerify}
                </Button>
                <button
                  type="button"
                  className="auth-zen-reset"
                  onClick={() => setNotice(copy.checkEmailNotice)}
                >
                  {copy.authOtpResend}
                </button>
              </div>
            </div>
          ) : null}

          {authMode === "sign-up" ? (
            <label className="auth-zen-consent">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => {
                  setAcceptedTerms(event.target.checked);
                  clearErrors();
                }}
              />
              <span>
                {copy.legalConsentLabel}{" "}
                <a href="/privacy" onClick={() => setIsOpen(false)}>
                  {copy.legalPrivacy}
                </a>{" "}
                {copy.legalAnd}{" "}
                <a href="/terms" onClick={() => setIsOpen(false)}>
                  {copy.legalTerms}
                </a>
              </span>
            </label>
          ) : null}

          {authMode === "sign-in" ? (
            <div className="auth-zen-actions">
              <Button
                type="submit"
                name="auth-intent"
                value="sign-in"
                disabled={auth.isLoading}
                className="auth-zen-submit w-full"
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {copy.signIn}
              </Button>

              {isGoogleAuthEnabled() ? (
                <>
                  <div className="auth-zen-divider" role="separator">
                    <span>{copy.authOAuthOr}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="auth-zen-google w-full"
                    disabled={auth.isLoading}
                    onClick={() => void auth.signInWithOAuth("google")}
                  >
                    {copy.authGoogleSignIn}
                  </Button>
                </>
              ) : null}

              <div className="auth-zen-footer">
                <button
                  type="button"
                  className="auth-zen-reset"
                  disabled={auth.isLoading || !form.getValues("email").trim()}
                  onClick={async () => {
                    await auth.resetPassword(form.getValues("email").trim());
                    setNotice(copy.checkEmailNotice);
                  }}
                >
                  {copy.resetPassword}
                </button>
                <span className="auth-zen-footer-sep" aria-hidden="true">
                  ·
                </span>
                <button
                  type="button"
                  className="auth-zen-switch"
                  disabled={auth.isLoading}
                  onClick={() => {
                    setAuthMode("sign-up");
                    clearErrors();
                  }}
                >
                  {copy.signUp}
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-zen-actions">
              <Button
                type="submit"
                name="auth-intent"
                value="sign-up"
                disabled={auth.isLoading}
                className="auth-zen-submit w-full"
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {copy.signUp}
              </Button>

              {isGoogleAuthEnabled() ? (
                <>
                  <div className="auth-zen-divider" role="separator">
                    <span>{copy.authOAuthOr}</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="auth-zen-google w-full"
                    disabled={auth.isLoading}
                    onClick={() => void auth.signInWithOAuth("google")}
                  >
                    {copy.authGoogleSignIn}
                  </Button>
                </>
              ) : null}

              <div className="auth-zen-footer">
                <button
                  type="button"
                  className="auth-zen-switch"
                  disabled={auth.isLoading}
                  onClick={() => {
                    setAuthMode("sign-in");
                    resetSignUpFields();
                    clearErrors();
                  }}
                >
                  {copy.signIn}
                </button>
              </div>
            </div>
          )}
        </form>
      </PopoverContent>
    </Popover>
  );
}
