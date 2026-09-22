import { useState } from "react";
import {
  BookOpen,
  Check,
  ChevronDown,
  History,
  House,
  LayoutGrid,
  LibraryBig,
  Menu,
  ScrollText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { languageOptions, themeLabels, uiCopy } from "@/data/i18n";
import { themeOptions } from "@/data/themes";
import { HeaderUserControls } from "@/components/HeaderUserControls";
import type { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import type { AppPage, LanguageCode, ThemeId } from "@/types/tarot";

type CopyKey = keyof typeof uiCopy.pt;

const navigation: Array<{ page: AppPage; icon: LucideIcon; labelKey: CopyKey }> = [
  { page: "home", icon: House, labelKey: "home" },
  { page: "reading", icon: LayoutGrid, labelKey: "reading" },
  { page: "history", icon: History, labelKey: "history" },
  { page: "journal", icon: ScrollText, labelKey: "journal" },
  { page: "arcana", icon: LibraryBig, labelKey: "arcana" },
  { page: "learn", icon: BookOpen, labelKey: "learn" },
  { page: "settings", icon: SlidersHorizontal, labelKey: "account" },
  { page: "news-admin", icon: ShieldCheck, labelKey: "newsNavLabel" },
];

const themeSwatches: Record<ThemeId, [string, string, string]> = {
  classic: ["#1a1a1c", "#7a6a9a", "#71717a"],
  lunar: ["#12162a", "#a8b8e8", "#5ec8d4"],
  golden: ["#201a12", "#dcb564", "#57bfa2"],
  minimal: ["#fafafa", "#18181b", "#a1a1aa"],
  solar: ["#2a1a0c", "#f5b84d", "#56c6aa"],
  forest: ["#121f1a", "#a8cc7d", "#5ec6a8"],
  rose: ["#26141e", "#eba8c0", "#7cd4c4"],
  abyss: ["#0c1018", "#84a8f0", "#60d4c0"],
  aurora: ["#101820", "#a0e8c0", "#b0a0f0"],
  ritual: ["#1a1014", "#dca864", "#6cc4b0"],
};

type AppNavigationProps = {
  fixed?: boolean;
  activePage: AppPage;
  language: LanguageCode;
  themeId: ThemeId;
  soundEnabled: boolean;
  isLoggedIn: boolean;
  canManageNews: boolean;
  auth: ReturnType<typeof useAuth>;
  cloudError: string | null;
  syncError: string | null;
  installPrompt: Event | null;
  onNavigate: (page: AppPage) => void;
  onOpenSearch: () => void;
  onSetTheme: (theme: ThemeId) => void;
  onSetLanguage: (language: LanguageCode) => void;
  onToggleSound: () => void;
  onInstallApp: () => void;
};

export function AppNavigation({
  fixed = false,
  activePage,
  language,
  themeId,
  soundEnabled,
  isLoggedIn,
  canManageNews,
  auth,
  cloudError,
  syncError,
  installPrompt,
  onNavigate,
  onOpenSearch,
  onSetTheme,
  onSetLanguage,
  onToggleSound,
  onInstallApp,
}: AppNavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const copy = uiCopy[language];

  const visibleNavigation = navigation.filter((item) => {
    if (item.page === "news-admin") {
      return canManageNews;
    }
    return isLoggedIn || !["history", "journal", "settings"].includes(item.page);
  });

  const handleNavigate = (page: AppPage) => {
    onNavigate(page);
    setMobileOpen(false);
  };

  return (
    <header className={cn("app-nav top-0 z-50", fixed ? "fixed left-0 right-0" : "sticky")}>
      <div className="app-nav__inner">
        <button type="button" onClick={() => handleNavigate("home")} className="app-nav__brand">
          <span aria-hidden="true" className="app-nav__brand-mark">
            XVIII
          </span>
          {copy.appBrand}
        </button>

        <nav className="hidden items-center gap-6 xl:gap-8 lg:flex" aria-label={copy.mainNav}>
          {visibleNavigation.map((item) => (
            <button
              key={item.page}
              type="button"
              onClick={() => handleNavigate(item.page)}
              className={cn("app-nav__link", activePage === item.page && "is-active")}
              aria-current={activePage === item.page ? "page" : undefined}
            >
              {copy[item.labelKey]}
            </button>
          ))}
        </nav>

        <div className="hidden items-center gap-1.5 md:flex">
          <Button
            variant="ghost"
            size="icon"
            className="app-nav__control"
            onClick={onOpenSearch}
            aria-label={copy.searchArcanaShortcut}
          >
            <Search className="icon-md" strokeWidth={1.5} />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1 rounded-[var(--radius-sm)] tracking-[0.08em]">
                {themeLabels[language][themeId]}
                <ChevronDown className="icon-sm" strokeWidth={1.5} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {themeOptions.map((theme) => {
                const swatch = themeSwatches[theme.id];
                const isActive = theme.id === themeId;
                return (
                  <DropdownMenuItem
                    key={theme.id}
                    onClick={() => onSetTheme(theme.id)}
                    className="gap-2"
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-full border border-border"
                      style={{
                        background: `linear-gradient(135deg, ${swatch[0]}, ${swatch[1]}, ${swatch[2]})`,
                      }}
                    />
                    <span className="flex-1">{themeLabels[language][theme.id]}</span>
                    {isActive ? <Check className="icon-sm" strokeWidth={1.5} /> : null}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          <Select value={language} onValueChange={(value) => onSetLanguage(value as LanguageCode)}>
            <SelectTrigger className="h-8 w-[5.25rem] rounded-[var(--radius-sm)] tracking-[0.08em]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="icon"
            className="app-nav__control"
            onClick={onToggleSound}
            aria-label={soundEnabled ? copy.soundOn : copy.soundOff}
          >
            {soundEnabled ? (
              <Volume2 className="icon-md" strokeWidth={1.5} />
            ) : (
              <VolumeX className="icon-md" strokeWidth={1.5} />
            )}
          </Button>

          <HeaderUserControls
            auth={auth}
            copy={copy}
            cloudError={cloudError}
            syncError={syncError}
            onOpenSettings={() => {
              onNavigate("settings");
            }}
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={() => setMobileOpen((value) => !value)}
          aria-expanded={mobileOpen}
          aria-label={copy.mobileMenu}
        >
          {mobileOpen ? (
            <X className="icon-md" strokeWidth={1.5} />
          ) : (
            <Menu className="icon-md" strokeWidth={1.5} />
          )}
        </Button>
      </div>

      {mobileOpen ? (
        <div className="app-nav__mobile-panel lg:hidden">
          <div className="space-y-1 px-5 py-5">
            {visibleNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.page}
                  type="button"
                  onClick={() => handleNavigate(item.page)}
                  className={cn(
                    "app-nav__link app-nav__mobile-link",
                    activePage === item.page && "is-active",
                  )}
                  aria-current={activePage === item.page ? "page" : undefined}
                >
                  <Icon className="icon-sm shrink-0 opacity-55" strokeWidth={1.25} aria-hidden="true" />
                  {copy[item.labelKey]}
                </button>
              );
            })}

            <div className="space-y-3 border-t border-border pt-4">
              <Button
                variant="outline"
                className="w-full justify-start gap-2 rounded-[var(--radius-sm)]"
                onClick={() => {
                  onOpenSearch();
                  setMobileOpen(false);
                }}
              >
                <Search className="icon-md" strokeWidth={1.5} />
                {copy.searchArcanaShortcut}
              </Button>

              <p className="page-kicker mb-0">{copy.themeAria}</p>
              <div className="grid gap-1">
                {themeOptions.map((theme) => {
                  const swatch = themeSwatches[theme.id];
                  const isActive = theme.id === themeId;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => onSetTheme(theme.id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-2 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                        isActive
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
                      )}
                    >
                      <span
                        className="h-3.5 w-3.5 rounded-full border border-border"
                        style={{
                          background: `linear-gradient(135deg, ${swatch[0]}, ${swatch[1]}, ${swatch[2]})`,
                        }}
                        aria-hidden="true"
                      />
                      <span className="flex-1">{themeLabels[language][theme.id]}</span>
                      {isActive ? <Check className="icon-sm" strokeWidth={1.5} /> : null}
                    </button>
                  );
                })}
              </div>

              <Select value={language} onValueChange={(value) => onSetLanguage(value as LanguageCode)}>
                <SelectTrigger className="rounded-[var(--radius-sm)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {languageOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-[var(--radius-sm)]"
                  onClick={onToggleSound}
                  aria-label={soundEnabled ? copy.soundOn : copy.soundOff}
                >
                  {soundEnabled ? (
                    <Volume2 className="icon-md" strokeWidth={1.5} />
                  ) : (
                    <VolumeX className="icon-md" strokeWidth={1.5} />
                  )}
                </Button>
              </div>

              <HeaderUserControls
                auth={auth}
                copy={copy}
                cloudError={cloudError}
                syncError={syncError}
                onOpenSettings={() => {
                  onNavigate("settings");
                  setMobileOpen(false);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
