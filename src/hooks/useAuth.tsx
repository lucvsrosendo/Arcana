import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Provider, Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, normalizeSupabaseUrl, supabase } from "../lib/supabaseClient";
import {
  getAuthRedirectUrl,
  getOAuthCallbackUrl,
  isOAuthProviderDisabledError,
  probeSupabaseAuthReachable,
} from "../lib/authRedirect";
import { openOAuthPopup } from "../lib/oauthPopup";

export type AuthStatus = {
  user: User | null;
  session: Session | null;
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithOAuth: (provider: Provider) => Promise<void>;
  signUp: (
    email: string,
    password: string,
    options?: { displayName?: string },
  ) => Promise<{ userId: string | null; error: string | null }>;
  signOut: () => Promise<void>;
  signOutAll: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthStatus | null>(null);

const useAuthState = (): AuthStatus => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    let isMounted = true;

    if (!supabase) {
      return;
    }

    supabase.auth
      .getSession()
      .then(({ data, error: sessionError }) => {
        if (!isMounted) {
          return;
        }

        if (sessionError) {
          setError(sessionError.message);
        }

        setSession(data.session);
        setUser(data.session?.user ?? null);
      })
      .catch((sessionError: unknown) => {
        if (!isMounted) {
          return;
        }

        setError(
          sessionError instanceof Error
            ? sessionError.message
            : "Não foi possível carregar a sessão.",
        );
      });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    });

    const unsubscribe = () => data.subscription.unsubscribe();

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      setError("Configure o Supabase para ativar login.");
      return;
    }

    setError(null);
    setIsLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      }
    } catch (signInError: unknown) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : "Não foi possível entrar.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithOAuth = useCallback(async (provider: Provider) => {
    if (!supabase) {
      setError("Configure o Supabase para ativar login.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const supabaseUrl = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
      if (supabaseUrl) {
        const reachability = await probeSupabaseAuthReachable(supabaseUrl);
        if (!reachability.ok) {
          setError(reachability.error);
          return;
        }
      }

      const redirectTo = getOAuthCallbackUrl() ?? getAuthRedirectUrl();
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
          skipBrowserRedirect: true,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        return;
      }

      if (!data.url) {
        setError("OAuth redirect URL is missing.");
        return;
      }

      try {
        const probe = await fetch(data.url, { redirect: "manual" });

        if (!probe.ok && probe.status !== 0) {
          let providerMessage = "";

          try {
            const body = (await probe.json()) as { msg?: string; message?: string };
            providerMessage = body.msg ?? body.message ?? "";
          } catch {
            providerMessage = "";
          }

          if (isOAuthProviderDisabledError(providerMessage)) {
            setError(providerMessage);
            return;
          }

          if (providerMessage) {
            setError(providerMessage);
            return;
          }
        }
      } catch (probeError: unknown) {
        const probeMessage =
          probeError instanceof Error ? probeError.message : "supabase unreachable";
        if (
          probeMessage.toLowerCase().includes("failed to fetch") ||
          probeMessage.toLowerCase().includes("enotfound")
        ) {
          setError("supabase unreachable");
          return;
        }
      }

      const popupResult = await openOAuthPopup(data.url);

      if (popupResult.error === "popup-blocked") {
        setError("popup-blocked");
        return;
      }

      if (!popupResult.ok) {
        if (popupResult.error && popupResult.error !== "popup-closed") {
          setError(popupResult.error);
        }
        return;
      }

      await supabase.auth.getSession();
    } catch (oauthError: unknown) {
      const message =
        oauthError instanceof Error
          ? oauthError.message
          : "Não foi possível entrar com o provedor.";
      setError(
        message.toLowerCase().includes("failed to fetch")
          ? "supabase unreachable"
          : message,
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      options?: { displayName?: string },
    ) => {
      if (!supabase) {
        const message = "Configure o Supabase para ativar login.";
        setError(message);
        return { userId: null, error: message };
      }

      const displayName = options?.displayName?.trim();

      setError(null);
      setIsLoading(true);
      try {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: displayName
            ? {
                data: {
                  display_name: displayName,
                },
              }
            : undefined,
        });

        if (signUpError) {
          setError(signUpError.message);
          return { userId: null, error: signUpError.message };
        }

        return { userId: data.user?.id ?? null, error: null };
      } catch (signUpError: unknown) {
        const message =
          signUpError instanceof Error
            ? signUpError.message
            : "Não foi possível criar a conta.";
        setError(message);
        return { userId: null, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (!supabase) {
      return;
    }

    setError(null);
    setIsLoading(true);
    const { error: signOutError } = await supabase.auth.signOut({
      scope: "local",
    });
    setIsLoading(false);

    if (signOutError) {
      setError(signOutError.message);
    }
  }, []);

  const signOutAll = useCallback(async () => {
    if (!supabase) {
      return;
    }

    setError(null);
    setIsLoading(true);
    const { error: signOutError } = await supabase.auth.signOut({
      scope: "global",
    });
    setIsLoading(false);

    if (signOutError) {
      setError(signOutError.message);
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    if (!supabase) {
      setError("Configure o Supabase para ativar login.");
      return;
    }

    setError(null);
    setIsLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: typeof window === "undefined" ? undefined : window.location.origin,
    });
    setIsLoading(false);

    if (resetError) {
      setError(resetError.message);
    }
  }, []);

  const updateDisplayName = useCallback(async (displayName: string) => {
    if (!supabase) {
      return;
    }

    setError(null);
    setIsLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        display_name: displayName,
      },
    });
    setIsLoading(false);

    if (updateError) {
      setError(updateError.message);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return useMemo(
    () => ({
      user,
      session,
      isConfigured: isSupabaseConfigured,
      isLoading,
      error,
      signIn,
      signInWithOAuth,
      signUp,
      signOut,
      signOutAll,
      resetPassword,
      updateDisplayName,
      clearError,
    }),
    [
      user,
      session,
      isLoading,
      error,
      signIn,
      signInWithOAuth,
      signUp,
      signOut,
      signOutAll,
      resetPassword,
      updateDisplayName,
      clearError,
    ],
  );
};

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const value = useAuthState();
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthStatus => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
