import { Component, inject, signal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouteMeta } from "@analogjs/router";
import { TranslatePipe, TranslateService } from "@ngx-translate/core";
import { getXpLevel, type LanguageCode, type ThemeId } from "@tarot/core";
import { LeaderboardCardComponent } from "../components/leaderboard-card.component";
import { AuthService } from "../services/auth.service";
import { ProfileService } from "../services/profile.service";
import { StreakService } from "../services/streak.service";
import { TarotStateService } from "../services/tarot-state.service";

export const routeMeta: RouteMeta = {
  title: "Settings",
  meta: [
    {
      name: "description",
      content: "Profile, XP, themes, OAuth login, and cloud sync preferences.",
    },
  ],
};

@Component({
  standalone: true,
  imports: [FormsModule, TranslatePipe, LeaderboardCardComponent],
  template: `
    <section class="grid gap-4 max-w-2xl">
      <header>
        <p class="zen-eyebrow m-0">{{ 'nav.settings' | translate }}</p>
        <h1 class="m-0 mt-1 font-display text-3xl">Preferences</h1>
      </header>

      <div class="zen-card p-4 grid gap-4">
        <label class="text-sm text-tarot-muted">
          Language
          <select
            class="zen-input mt-1"
            [ngModel]="tarotState.language()"
            (ngModelChange)="setLanguage($event)"
            name="language"
          >
            <option value="pt">Português</option>
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
        </label>

        <label class="text-sm text-tarot-muted">
          Theme
          <select
            class="zen-input mt-1"
            [ngModel]="tarotState.themeId()"
            (ngModelChange)="tarotState.setTheme($event)"
            name="theme"
          >
            @for (theme of themes; track theme) {
              <option [value]="theme">{{ theme }}</option>
            }
          </select>
        </label>

        <label class="flex items-center gap-2 text-sm text-tarot-muted">
          <input
            type="checkbox"
            [checked]="tarotState.learningMode()"
            (change)="tarotState.toggleLearningMode()"
          />
          Learning mode
        </label>

        <label class="flex items-center gap-2 text-sm text-tarot-muted">
          <input
            type="checkbox"
            [checked]="tarotState.reversalsMode()"
            (change)="tarotState.toggleReversalsMode()"
          />
          Reversed cards
        </label>

        <label class="text-sm text-tarot-muted">
          Display name
          <input
            class="zen-input mt-1"
            [ngModel]="displayName"
            (ngModelChange)="updateDisplayName($event)"
            name="displayName"
          />
        </label>

        <label class="text-sm text-tarot-muted">
          Avatar
          <input class="zen-input mt-1" type="file" accept="image/*" (change)="onAvatarSelected($event)" />
        </label>
      </div>

      <div class="zen-card p-4 grid gap-3">
        <p class="m-0 text-sm text-tarot-muted">XP total</p>
        <p class="m-0 mt-1 text-2xl font-semibold text-tarot-brand">
          {{ profile.xpTotal() }} XP · {{ xpLevel().label }}
        </p>

        @if (auth.isAuthenticated()) {
          <p class="m-0 text-sm">Signed in as {{ auth.getDisplayName() }}</p>
          <label class="flex items-center gap-2 text-sm text-tarot-muted">
            <input type="checkbox" [checked]="leaderboardOptIn()" (change)="toggleLeaderboardOptIn($event)" />
            Show me on the public leaderboard
          </label>
          <button class="zen-btn zen-btn-ghost w-fit" type="button" (click)="auth.signOut()">
            Sign out
          </button>
        } @else {
          <p class="m-0 text-sm text-tarot-muted">Sign in for cloud sync, avatar upload, and streak backup.</p>

          <form class="grid gap-2" (submit)="signIn($event)">
            <input class="zen-input" [(ngModel)]="email" name="email" type="email" placeholder="Email" required />
            <input
              class="zen-input"
              [(ngModel)]="password"
              name="password"
              type="password"
              placeholder="Password"
              required
            />
            <div class="flex flex-wrap gap-2">
              <button class="zen-btn" type="submit">Sign in</button>
              <button class="zen-btn zen-btn-ghost" type="button" (click)="signUp()">Create account</button>
            </div>
          </form>

          <div class="flex flex-wrap gap-2">
            <button class="zen-btn zen-btn-ghost" type="button" (click)="auth.signInWithGoogle()">
              Google
            </button>
            <button class="zen-btn zen-btn-ghost" type="button" (click)="auth.signInWithGitHub()">
              GitHub
            </button>
          </div>

          <form class="grid gap-2" (submit)="verifyOtp($event)">
            <p class="m-0 text-xs text-tarot-muted">Email verification OTP</p>
            <input class="zen-input" [(ngModel)]="otpEmail" name="otpEmail" type="email" placeholder="Email" />
            <input class="zen-input" [(ngModel)]="otpToken" name="otpToken" maxlength="6" placeholder="6-digit code" />
            <button class="zen-btn zen-btn-ghost w-fit" type="submit">Verify OTP</button>
          </form>
        }

        @if (authError()) {
          <p class="text-sm text-tarot-warm m-0">{{ authError() }}</p>
        }
      </div>

      <app-leaderboard-card />
    </section>
  `,
})
export default class SettingsPage {
  readonly tarotState = inject(TarotStateService);
  readonly profile = inject(ProfileService);
  readonly auth = inject(AuthService);
  private readonly streak = inject(StreakService);
  private readonly translate = inject(TranslateService);

  readonly themes: ThemeId[] = [
    "classic",
    "lunar",
    "golden",
    "minimal",
    "solar",
    "forest",
    "rose",
    "abyss",
    "aurora",
    "ritual",
  ];

  displayName = this.profile.profile()?.displayName ?? "Reader";
  email = "";
  password = "";
  otpEmail = "";
  otpToken = "";
  readonly authError = signal<string | null>(null);
  readonly leaderboardOptIn = signal(false);

  readonly xpLevel = () => getXpLevel(this.profile.xpTotal());

  setLanguage(language: LanguageCode) {
    this.tarotState.setLanguage(language);
    this.translate.use(language);
  }

  updateDisplayName(value: string) {
    this.displayName = value;
    const userId = this.auth.user()?.id;
    if (userId) {
      void this.profile.updateCloudProfile(userId, { displayName: value });
      return;
    }

    this.profile.updateProfile({ displayName: value });
  }

  async onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    const userId = this.auth.user()?.id;

    if (!file || !userId) {
      return;
    }

    try {
      await this.profile.uploadAvatar(userId, file);
    } catch (error) {
      this.authError.set(error instanceof Error ? error.message : "Avatar upload failed.");
    }
  }

  async signIn(event: Event) {
    event.preventDefault();
    this.authError.set(null);

    try {
      await this.auth.signIn(this.email, this.password);
    } catch (error) {
      this.authError.set(error instanceof Error ? error.message : "Sign in failed.");
    }
  }

  async signUp() {
    this.authError.set(null);

    try {
      await this.auth.signUp(this.email, this.password);
      this.authError.set("Check your email for a verification code.");
    } catch (error) {
      this.authError.set(error instanceof Error ? error.message : "Sign up failed.");
    }
  }

  async verifyOtp(event: Event) {
    event.preventDefault();
    this.authError.set(null);

    try {
      await this.auth.verifyOtp(this.otpEmail, this.otpToken);
    } catch (error) {
      this.authError.set(error instanceof Error ? error.message : "OTP verification failed.");
    }
  }

  async toggleLeaderboardOptIn(event: Event) {
    const userId = this.auth.user()?.id;
    if (!userId) {
      return;
    }

    const checked = (event.target as HTMLInputElement).checked;
    this.leaderboardOptIn.set(checked);
    await this.streak.setLeaderboardOptIn(userId, checked);
  }
}
