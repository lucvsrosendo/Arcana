import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { SupabaseService } from "../services/supabase.service";

export const newsAuthGuard: CanActivateFn = async () => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (!supabase.isConfigured) {
    console.warn("[newsAuthGuard] Supabase env vars are missing.");
    return router.createUrlTree(["/login"], {
      queryParams: { error: "config" },
    });
  }

  const session = await supabase.getSession();
  if (!session?.user) {
    return router.createUrlTree(["/login"], {
      queryParams: { redirect: router.url || "/admin" },
    });
  }

  const hasRole = await supabase.hasNewsEditorRole(session.user.id);
  if (!hasRole) {
    await supabase.signOut();
    return router.createUrlTree(["/login"], {
      queryParams: { error: "unauthorized" },
    });
  }

  return true;
};
