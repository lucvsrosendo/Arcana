import { useEffect, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";

type NewsRoleState = {
  isAdmin: boolean;
  isModerator: boolean;
  isLoading: boolean;
};

export const useNewsRole = (): NewsRoleState => {
  const [state, setState] = useState<NewsRoleState>({
    isAdmin: false,
    isModerator: false,
    isLoading: true,
  });
  const hasResolvedOnceRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    const run = async () => {
      if (isMounted && !hasResolvedOnceRef.current) {
        setState((current) => ({ ...current, isLoading: true }));
      }

      if (!supabase) {
        if (!isMounted) {
          return;
        }
        setState({ isAdmin: false, isModerator: false, isLoading: false });
        return;
      }

      const { data: authData } = await supabase.auth.getUser();
      const userId = authData.user?.id;

      if (!userId) {
        if (!isMounted) {
          return;
        }
        setState({ isAdmin: false, isModerator: false, isLoading: false });
        return;
      }

      const [adminResult, moderatorResult] = await Promise.all([
        supabase
          .from("site_news_admins")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("site_news_moderators")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (!isMounted) {
        return;
      }

      hasResolvedOnceRef.current = true;
      setState({
        isAdmin: Boolean(adminResult.data?.user_id),
        isModerator: Boolean(moderatorResult.data?.user_id),
        isLoading: false,
      });
    };

    void run();

    const subscription = supabase?.auth.onAuthStateChange(() => {
      void run();
    });

    return () => {
      isMounted = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  return state;
};
