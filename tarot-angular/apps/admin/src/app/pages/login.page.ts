import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute, Router } from "@angular/router";
import { RouteMeta } from "@analogjs/router";
import { MessageService } from "primeng/api";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { InputTextModule } from "primeng/inputtext";
import { PasswordModule } from "primeng/password";
import { ToastModule } from "primeng/toast";
import { SupabaseService } from "../services/supabase.service";

export const routeMeta: RouteMeta = {
  title: "Login",
};

@Component({
  standalone: true,
  providers: [MessageService],
  imports: [
    FormsModule,
    CardModule,
    InputTextModule,
    PasswordModule,
    ButtonModule,
    ToastModule,
  ],
  template: `
    <p-toast />

    <div class="login-page">
      <p-card class="login-card" header="Tarot News Admin">
        <p class="mt-0 mb-4 text-muted-color">
          Sign in with a Supabase account that has news admin or moderator access.
        </p>

        @if (configError()) {
          <p class="text-red-400">Supabase environment variables are missing.</p>
        } @else if (authError()) {
          <p class="text-red-400">{{ authError() }}</p>
        }

        <form class="flex flex-col gap-3" (ngSubmit)="submit()">
          <label for="email">Email</label>
          <input id="email" pInputText type="email" autocomplete="username" [(ngModel)]="email" name="email" required />

          <label for="password">Password</label>
          <p-password
            inputId="password"
            [(ngModel)]="password"
            name="password"
            [feedback]="false"
            [toggleMask]="true"
            autocomplete="current-password"
            styleClass="w-full"
            inputStyleClass="w-full"
          />

          <p-button
            type="submit"
            label="Sign in"
            icon="pi pi-sign-in"
            [loading]="isSubmitting()"
            styleClass="w-full"
          />
        </form>
      </p-card>
    </div>
  `,
})
export default class LoginPage {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly messages = inject(MessageService);

  email = "";
  password = "";
  readonly isSubmitting = signal(false);
  readonly authError = signal<string | null>(null);
  readonly configError = signal(false);

  constructor() {
    const error = this.route.snapshot.queryParamMap.get("error");
    if (error === "config") {
      this.configError.set(true);
    } else if (error === "unauthorized") {
      this.authError.set("This account does not have news moderation access.");
    }
  }

  async submit() {
    if (!this.email.trim() || !this.password) {
      this.messages.add({
        severity: "warn",
        summary: "Email and password are required",
      });
      return;
    }

    this.isSubmitting.set(true);
    this.authError.set(null);

    try {
      const session = await this.supabase.signInWithPassword(
        this.email.trim(),
        this.password,
      );

      if (!session?.user) {
        throw new Error("No active session returned.");
      }

      const hasRole = await this.supabase.hasNewsEditorRole(session.user.id);
      if (!hasRole) {
        await this.supabase.signOut();
        this.authError.set("This account does not have news moderation access.");
        return;
      }

      const redirect = this.route.snapshot.queryParamMap.get("redirect") ?? "/admin";
      await this.router.navigateByUrl(redirect);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not sign in.";
      this.authError.set(message);
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
