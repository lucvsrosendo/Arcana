import { Injectable, inject } from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";

@Injectable({ providedIn: "root" })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly router = inject(Router);

  private readonly siteName = "Tarot — Major Arcana";
  private readonly defaultDescription =
    "Tarot readings, journal, and learning with the 22 Major Arcana.";

  init() {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        const path = this.router.url.split("?")[0];
        this.applyForPath(path);
      });
  }

  applyForPath(path: string) {
    const pageTitle = this.titleForPath(path);
    const description = this.descriptionForPath(path);

    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: "description", content: description });
    this.meta.updateTag({ property: "og:title", content: pageTitle });
    this.meta.updateTag({ property: "og:description", content: description });
    this.meta.updateTag({ property: "og:type", content: "website" });
    this.meta.updateTag({
      property: "og:url",
      content: `${import.meta.env["VITE_SITE_URL"] ?? ""}${path}`,
    });
  }

  setArticleMeta(title: string, summary: string, path: string) {
    const pageTitle = `${title} | ${this.siteName}`;
    this.title.setTitle(pageTitle);
    this.meta.updateTag({ name: "description", content: summary });
    this.meta.updateTag({ property: "og:title", content: pageTitle });
    this.meta.updateTag({ property: "og:description", content: summary });
    this.meta.updateTag({ property: "og:type", content: "article" });
    this.meta.updateTag({
      property: "og:url",
      content: `${import.meta.env["VITE_SITE_URL"] ?? ""}${path}`,
    });
  }

  private titleForPath(path: string) {
    const map: Record<string, string> = {
      "/": "Home",
      "/reading": "Reading",
      "/history": "History",
      "/journal": "Journal",
      "/arcana": "Arcana",
      "/learn": "Learn",
      "/settings": "Settings",
      "/privacy": "Privacy",
      "/terms": "Terms",
      "/cookies": "Cookies",
    };

    const label = map[path] ?? "Tarot";
    return `${label} | ${this.siteName}`;
  }

  private descriptionForPath(path: string) {
    const map: Record<string, string> = {
      "/reading": "Draw Major Arcana spreads with swipe reveal and oracle chat.",
      "/history": "Review saved readings and frequent cards.",
      "/journal": "Encrypted journal entries linked to past readings.",
      "/settings": "Profile, XP, themes, and cloud sync preferences.",
    };

    return map[path] ?? this.defaultDescription;
  }
}
