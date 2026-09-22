import { Component, inject } from "@angular/core";
import { RouterLink, RouterLinkActive, RouterOutlet } from "@angular/router";
import { RouteMeta } from "@analogjs/router";
import { ButtonModule } from "primeng/button";
import { newsAuthGuard } from "../../guards/news-auth.guard";
import { SupabaseService } from "../../services/supabase.service";

export const routeMeta: RouteMeta = {
  title: "Admin",
  canActivate: [newsAuthGuard],
};

@Component({
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule],
  template: `
    <div class="admin-shell">
      <aside class="admin-sidebar">
        <div class="admin-brand">Tarot News Admin</div>

        <nav class="admin-nav">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <i class="pi pi-home"></i>
            Dashboard
          </a>
          <a routerLink="/admin/news" routerLinkActive="active">
            <i class="pi pi-file-edit"></i>
            News
          </a>
          <a routerLink="/admin/comments" routerLinkActive="active">
            <i class="pi pi-comments"></i>
            Comments
          </a>
          <a routerLink="/admin/reports" routerLinkActive="active">
            <i class="pi pi-flag"></i>
            Reports
          </a>
          <a routerLink="/admin/engagement" routerLinkActive="active">
            <i class="pi pi-chart-bar"></i>
            Engagement
          </a>
        </nav>

        <p-button
          label="Sign out"
          icon="pi pi-sign-out"
          severity="secondary"
          [text]="true"
          (onClick)="signOut()"
        />
      </aside>

      <main class="admin-main">
        <router-outlet />
      </main>
    </div>
  `,
})
export default class AdminLayoutComponent {
  private readonly supabase = inject(SupabaseService);

  async signOut() {
    await this.supabase.signOut();
    window.location.href = "/login";
  }
}
