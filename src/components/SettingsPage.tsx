import {
  BookOpenCheck,
  Download,
  LogOut,
  RotateCcw,
  Save,
  Shield,
  Trash2,
  Upload,
  Volume2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { PageShell } from "@/components/layout/PageShell";
import { useToast } from "@/components/ToastProvider";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AchievementUnlocked } from "@/components/trophy/AchievementUnlocked";
import { LeaderboardCard } from "@/components/trophy/LeaderboardCard";
import { PointsChartCard } from "@/components/trophy/PointsChartCard";
import { XpBar } from "@/components/trophy/XpBar";
import { Toggle } from "@/components/ui/toggle";
import { XP_RULES, XP_LEVELS, getXpLevel } from "@/data/xpRules";
import { useStreakCloud } from "@/hooks/useStreakCloud";
import { dateLocaleByLanguage, languageOptions, themeLabels, uiCopy } from "@/data/i18n";
import { themeOptions } from "@/data/themes";
import { useAuth } from "@/hooks/useAuth";
import { useTarot } from "@/hooks/useTarot";
import { useUserProfile } from "@/hooks/useUserProfile";
import type { XpEvent } from "@/lib/userProfileCloud";
import {
  deleteAccountData,
  downloadAccountDataJson,
  exportAccountData,
} from "@/lib/accountDataCloud";
import { fetchCommentsByUserId, type UserCommentWithNews } from "@/lib/myCommentsCloud";

const formatXpEventLabel = (event: XpEvent, copy: Record<string, string>) => {
  const labels: Record<string, string> = {
    comment_created: copy.xpEventCommentCreated,
    like_given: copy.xpEventLikeGiven,
    like_received: copy.xpEventLikeReceived,
    favorite_given: copy.xpEventFavoriteGiven,
    favorite_received: copy.xpEventFavoriteReceived,
    article_read_complete: copy.xpEventArticleReadComplete,
    journal_entry: copy.xpEventJournalEntry,
  };

  return labels[event.eventType] ?? event.eventType;
};

const buildXpChartData = (events: XpEvent[], locale: string) => {
  const byDay = new Map<string, number>();

  for (const event of [...events].reverse()) {
    const day = new Date(event.createdAt).toLocaleDateString(locale, {
      month: "short",
      day: "numeric",
    });
    byDay.set(day, (byDay.get(day) ?? 0) + event.points);
  }

  let running = 0;
  return [...byDay.entries()].map(([day, points]) => {
    running += points;
    return { day, points, total: running };
  });
};

const BADGE_MARKS = [
  { id: "reader" as const, roman: "I", arcana: "Magician" },
  { id: "sage" as const, roman: "IX", arcana: "Hermit" },
  { id: "oracle" as const, roman: "II", arcana: "High Priestess" },
];

export function SettingsPage() {
  const language = useTarot((state) => state.language);
  const themeId = useTarot((state) => state.themeId);
  const soundEnabled = useTarot((state) => state.soundEnabled);
  const learningMode = useTarot((state) => state.learningMode);
  const reversalsMode = useTarot((state) => state.reversalsMode);
  const setLanguage = useTarot((state) => state.setLanguage);
  const setTheme = useTarot((state) => state.setTheme);
  const toggleSound = useTarot((state) => state.toggleSound);
  const toggleLearningMode = useTarot((state) => state.toggleLearningMode);
  const toggleReversalsMode = useTarot((state) => state.toggleReversalsMode);
  const clearHistory = useTarot((state) => state.clearHistory);
  const clearJournal = useTarot((state) => state.clearJournal);
  const auth = useAuth();
  const {
    profile,
    xpTotal,
    xpEvents,
    uploadAvatar,
    removeAvatar,
    updateDisplayName: updateProfileDisplayName,
    refresh,
  } = useUserProfile();
  const { pushToast } = useToast();
  const { leaderboard, streak, setLeaderboardOptIn, isCloudEnabled } = useStreakCloud();
  const xpLevel = getXpLevel(xpTotal);
  const [displayName, setDisplayName] = useState(
    auth.user?.user_metadata?.display_name ?? "",
  );
  const [myComments, setMyComments] = useState<UserCommentWithNews[]>([]);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [unlockedAchievement, setUnlockedAchievement] = useState<{
    title: string;
    description: string;
  } | null>(null);
  const copy = uiCopy[language];
  const isLoggedIn = Boolean(auth.session);

  useEffect(() => {
    // Reader is minXp 0 — do not treat it as an "unlocked" celebration.
    const milestones = [...XP_LEVELS]
      .filter((level) => level.minXp > 0)
      .sort((a, b) => b.minXp - a.minXp)
      .map((level) => ({
        minXp: level.minXp,
        title:
          level.id === "oracle"
            ? copy.xpBadgeOracle
            : level.id === "sage"
              ? copy.xpBadgeSage
              : copy.xpBadgeReader,
        description:
          level.id === "oracle"
            ? copy.xpBadgeOracleDesc
            : level.id === "sage"
              ? copy.xpBadgeSageDesc
              : copy.xpBadgeReaderDesc,
      }));
    const unlocked = milestones.find((milestone) => xpTotal >= milestone.minXp);
    setUnlockedAchievement(
      unlocked
        ? { title: unlocked.title, description: unlocked.description }
        : null,
    );
  }, [
    copy.xpBadgeOracle,
    copy.xpBadgeOracleDesc,
    copy.xpBadgeReader,
    copy.xpBadgeReaderDesc,
    copy.xpBadgeSage,
    copy.xpBadgeSageDesc,
    xpTotal,
  ]);

  useEffect(() => {
    setDisplayName(
      profile?.displayName ||
        (auth.user?.user_metadata?.display_name as string | undefined) ||
        "",
    );
  }, [auth.user, profile?.displayName]);

  useEffect(() => {
    if (!auth.user?.id) {
      setMyComments([]);
      return;
    }

    let isMounted = true;
    setIsCommentsLoading(true);

    void fetchCommentsByUserId(auth.user.id, auth.user.id)
      .then((comments) => {
        if (isMounted) {
          setMyComments(comments);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsCommentsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [auth.user?.id]);

  const profileLabel =
    displayName.trim() ||
    profile?.displayName?.trim() ||
    auth.user?.email?.split("@")[0] ||
    "User";
  const profileInitial = profileLabel.charAt(0).toUpperCase();
  const xpChartData = useMemo(
    () => buildXpChartData(xpEvents, dateLocaleByLanguage[language]),
    [language, xpEvents],
  );

  const xpRuleItems = [
    { label: copy.xpRuleComment, points: XP_RULES.commentCreated },
    { label: copy.xpRuleLike, points: XP_RULES.likeGiven },
    { label: copy.xpRuleLikeReceived, points: XP_RULES.likeReceived },
    { label: copy.xpRuleFavorite, points: XP_RULES.favoriteGiven },
    { label: copy.xpRuleFavoriteReceived, points: XP_RULES.favoriteReceived },
    { label: copy.xpRuleArticleRead, points: XP_RULES.articleReadComplete },
    { label: copy.xpRuleJournalEntry, points: XP_RULES.journalEntry },
  ];

  const badgeItems = BADGE_MARKS.map((mark) => {
    const level = XP_LEVELS.find((item) => item.id === mark.id)!;
    const label =
      mark.id === "oracle"
        ? copy.xpBadgeOracle
        : mark.id === "sage"
          ? copy.xpBadgeSage
          : copy.xpBadgeReader;
    const desc =
      mark.id === "oracle"
        ? copy.xpBadgeOracleDesc
        : mark.id === "sage"
          ? copy.xpBadgeSageDesc
          : copy.xpBadgeReaderDesc;
    return { ...mark, minXp: level.minXp, label, desc };
  });

  const handleSaveProfile = async () => {
    const trimmedName = displayName.trim();
    await auth.updateDisplayName(trimmedName);
    if (auth.user?.id) {
      await updateProfileDisplayName(trimmedName);
    }
    await refresh();
    pushToast(copy.profileUpdated, "success");
  };

  const handleAvatarChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    try {
      await uploadAvatar(file);
      pushToast(copy.profileAvatarUpdated, "success");
    } catch (error) {
      const detail =
        error && typeof error === "object" && "message" in error
          ? String((error as { message?: unknown }).message ?? "")
          : error instanceof Error
            ? error.message
            : "";
      const detailLower = detail.toLowerCase();

      let message = copy.profileAvatarError;
      if (detail === "avatar-too-large") {
        message = copy.profileAvatarTooLarge;
      } else if (
        detailLower.includes("bucket not found") ||
        (detailLower.includes("not found") && detailLower.includes("avatars"))
      ) {
        message = copy.profileAvatarBucketMissing;
      } else if (
        detailLower.includes("row-level security") ||
        detailLower.includes("violates row-level security")
      ) {
        message = copy.profileAvatarRlsDenied;
      } else if (detail && detail !== "invalid-avatar-type") {
        message = `${copy.profileAvatarError} ${detail}`;
      }

      pushToast(message, "error");
    }
  };

  const avatarDropzone = useDropzone({
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    maxFiles: 1,
    disabled: !isLoggedIn,
    onDrop: (acceptedFiles) => {
      void handleAvatarChange(acceptedFiles[0] ?? null);
    },
  });

  const handleExportData = async () => {
    if (!auth.user?.id) {
      return;
    }

    try {
      const payload = await exportAccountData(auth.user.id);
      downloadAccountDataJson(payload);
      pushToast(copy.dataExportSuccess, "success");
    } catch {
      pushToast(copy.dataExportError, "error");
    }
  };

  const handleDeleteData = async () => {
    if (!window.confirm(copy.dataDeleteConfirm)) {
      return;
    }

    if (!window.confirm(copy.dataDeleteFinalConfirm)) {
      return;
    }

    try {
      await deleteAccountData();
      await auth.signOut();
      pushToast(copy.dataDeleteSuccess, "success");
    } catch {
      pushToast(copy.dataDeleteError, "error");
    }
  };

  const formatCommentDate = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return value;
    }
    return parsed.toLocaleString(dateLocaleByLanguage[language], {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const arcanaByLevel: Record<string, { roman: string; name: string }> = {
    Reader: { roman: "I", name: "Magician" },
    Sage: { roman: "IX", name: "Hermit" },
    Oracle: { roman: "II", name: "High Priestess" },
  };
  const levelArcana = arcanaByLevel[xpLevel.label];

  return (
    <PageShell>
      <TooltipProvider>
        <div className="settings-page">
          <header className="settings-hero">
            <p className="settings-hero-kicker mb-3 text-muted-foreground">{copy.account}</p>
            <h1 className="font-display text-3xl font-light tracking-[-0.02em] md:text-5xl">
              {copy.settingsTitle}
            </h1>
            <p className="settings-hero-lede">{copy.settingsSubtitle}</p>
          </header>

          {isLoggedIn ? (
            <Tabs defaultValue="profile" className="settings-tabs">
              <TabsList>
                <TabsTrigger value="profile">{copy.settingsTabProfile}</TabsTrigger>
                <TabsTrigger value="activity">{copy.settingsTabActivity}</TabsTrigger>
                <TabsTrigger value="comments">{copy.settingsTabMyComments}</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="settings-tab-panel">
                <section id="profile-section" className="settings-cabinet">
                  <div className="settings-identity">
                    <div className="settings-identity-head">
                      <Avatar className="settings-avatar">
                        {profile?.avatarUrl ? (
                          <AvatarImage src={profile.avatarUrl} alt="" loading="lazy" />
                        ) : null}
                        <AvatarFallback>{profileInitial}</AvatarFallback>
                      </Avatar>
                      <div className="settings-identity-meta">
                        <h2 className="settings-identity-name">{profileLabel}</h2>
                        <p className="settings-identity-email">{auth.user?.email}</p>
                        <div className="settings-identity-actions">
                          <div
                            {...avatarDropzone.getRootProps()}
                            className={[
                              "settings-avatar-drop",
                              avatarDropzone.isDragActive ? "is-active" : "",
                            ].join(" ")}
                          >
                            <input {...avatarDropzone.getInputProps()} />
                            <button type="button" className="settings-quiet-action">
                              <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                              {copy.profileAvatarUpload}
                            </button>
                          </div>
                          {profile?.avatarUrl ? (
                            <button
                              type="button"
                              className="settings-quiet-action"
                              onClick={async () => {
                                await removeAvatar();
                                pushToast(copy.profileAvatarRemoved, "success");
                              }}
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                              {copy.profileAvatarRemove}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="settings-field">
                      <Label htmlFor="display-name">{copy.title}</Label>
                      <Input
                        id="display-name"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder={copy.displayNamePlaceholder}
                        className="settings-field-input"
                      />
                    </div>
                    <Button
                      type="button"
                      className="settings-primary-action"
                      onClick={() => void handleSaveProfile()}
                    >
                      <Save className="h-4 w-4" aria-hidden="true" />
                      {copy.updateEntry}
                    </Button>
                  </div>

                  <aside className="settings-xp-panel">
                    <p className="settings-rail-kicker">{copy.profileXpSection}</p>
                    <XpBar xpTotal={xpTotal} levelLabel={xpLevel.label} />
                    {levelArcana ? (
                      <p className="settings-arcana-ref">
                        {levelArcana.roman} {levelArcana.name}
                      </p>
                    ) : null}
                    <p className="settings-xp-hint">{copy.settingsXpBarHint}</p>
                    <ul className="settings-xp-rules">
                      {xpRuleItems.map((rule) => (
                        <li key={rule.label}>
                          <span>
                            {rule.label.replace(/\s*:\s*\+\{points\}(\s*XP)?/i, "").trim()}
                          </span>
                          <span className="settings-xp-points">+{rule.points}</span>
                        </li>
                      ))}
                    </ul>
                  </aside>
                </section>
              </TabsContent>

              <TabsContent value="activity" className="settings-tab-panel">
                <div className="settings-cabinet settings-cabinet--stack">
                  {unlockedAchievement ? (
                    <div className="settings-rail-block">
                      <AchievementUnlocked
                        title={unlockedAchievement.title}
                        description={unlockedAchievement.description}
                        labelText={copy.achievementUnlocked}
                        className="settings-achievement"
                      />
                    </div>
                  ) : null}

                  <div className="settings-rail-block">
                    <PointsChartCard
                      title={copy.settingsActivityChartTitle}
                      subtitle={copy.settingsXpRecentSubtitle}
                      emptyLabel={copy.settingsActivityChartEmpty}
                      data={xpChartData}
                      className="settings-surface-flush"
                    />
                  </div>

                  <div className="settings-rail-block">
                    <div className="settings-action-row">
                      <div>
                        <p className="settings-action-title">{copy.leaderboardOptInTitle}</p>
                        <p className="settings-action-desc">{copy.leaderboardOptInDesc}</p>
                      </div>
                      <Switch
                        checked={Boolean(streak?.leaderboardOptIn)}
                        disabled={!isLoggedIn || !isCloudEnabled}
                        onCheckedChange={(checked) => {
                          void setLeaderboardOptIn(checked)
                            .then(() => {
                              pushToast(
                                checked
                                  ? copy.leaderboardOptInEnabled
                                  : copy.leaderboardOptInDisabled,
                                "success",
                              );
                            })
                            .catch(() => {
                              pushToast(copy.leaderboardOptInError, "error");
                            });
                        }}
                        aria-label={copy.leaderboardOptInTitle}
                      />
                    </div>
                    <LeaderboardCard
                      entries={leaderboard}
                      title={copy.leaderboardTitle}
                      emptyLabel={
                        streak?.leaderboardOptIn
                          ? copy.leaderboardEmpty
                          : copy.leaderboardOptInRequired
                      }
                      className="settings-surface-flush"
                    />
                  </div>

                  <div className="settings-rail-block">
                    <p className="settings-rail-kicker">{copy.xpBadgesTitle}</p>
                    <ol className="settings-badge-marks">
                      {badgeItems.map((badge) => {
                        const unlocked = (profile?.xpTotal ?? 0) >= badge.minXp;
                        return (
                          <Tooltip key={badge.id}>
                            <TooltipTrigger asChild>
                              <li
                                className={[
                                  "settings-badge-mark",
                                  unlocked ? "is-unlocked" : "is-locked",
                                ].join(" ")}
                              >
                                <span className="settings-badge-roman" aria-hidden="true">
                                  {badge.roman}
                                </span>
                                <div>
                                  <p className="settings-badge-label">{badge.label}</p>
                                  <p className="settings-arcana-ref">
                                    {badge.roman} {badge.arcana}
                                  </p>
                                  <p className="settings-badge-desc">{badge.desc}</p>
                                </div>
                              </li>
                            </TooltipTrigger>
                            <TooltipContent>
                              {unlocked ? badge.label : `${badge.label} - ${badge.desc}`}
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </ol>
                  </div>

                  {xpEvents.length > 0 ? (
                    <div className="settings-rail-block">
                      <p className="settings-rail-kicker">{copy.profileXpRecent}</p>
                      <ul className="settings-event-list">
                        {xpEvents.map((event) => (
                          <li key={event.id}>
                            <span>{formatXpEventLabel(event, copy)}</span>
                            <span className="settings-xp-points">+{event.points}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </TabsContent>

              <TabsContent value="comments" className="settings-tab-panel">
                <section className="settings-cabinet settings-cabinet--stack">
                  <header className="settings-rail-block settings-rail-head">
                    <p className="settings-rail-kicker">{copy.settingsTabMyComments}</p>
                  </header>
                  <div className="settings-rail-block">
                    {isCommentsLoading ? (
                      <p className="settings-empty">{copy.loadingShort}</p>
                    ) : myComments.length === 0 ? (
                      <p className="settings-empty">{copy.settingsMyCommentsEmpty}</p>
                    ) : (
                      <ul className="settings-comment-list">
                        {myComments.map((comment, index) => (
                          <li key={comment.id} className="settings-comment-row">
                            <span className="settings-comment-index" aria-hidden="true">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <div className="settings-comment-body">
                              <div className="settings-comment-meta">
                                <span className="settings-comment-title">{comment.newsTitle}</span>
                                <time dateTime={comment.createdAt}>
                                  {formatCommentDate(comment.createdAt)}
                                </time>
                              </div>
                              <p>{comment.body}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              </TabsContent>
            </Tabs>
          ) : (
            <aside className="settings-guest-plate">
              <p>{copy.authHint}</p>
            </aside>
          )}

          <section className="settings-cabinet settings-cabinet--stack settings-prefs">
            <header className="settings-rail-block settings-rail-head">
              <p className="settings-rail-kicker">{copy.settingsPreferencesTitle}</p>
              <p className="settings-rail-lede">{copy.settingsPreferencesSubtitle}</p>
            </header>

            <div className="settings-rail-block settings-row-grid">
              <div className="settings-row">
                <Label htmlFor="theme-select">{copy.themeAria}</Label>
                <Select value={themeId} onValueChange={(value) => setTheme(value as typeof themeId)}>
                  <SelectTrigger id="theme-select" className="settings-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {themeOptions.map((theme) => (
                      <SelectItem key={theme.id} value={theme.id}>
                        {themeLabels[language][theme.id]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="settings-row">
                <Label htmlFor="language-select">{copy.languageAria}</Label>
                <Select
                  value={language}
                  onValueChange={(value) => setLanguage(value as typeof language)}
                >
                  <SelectTrigger id="language-select" className="settings-select">
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
              </div>
            </div>

            <div className="settings-rail-block">
              <p className="settings-rail-kicker">{copy.settingsReadingExperience}</p>
              <div className="settings-action-row">
                <div className="settings-action-copy">
                  <Volume2 className="h-4 w-4" aria-hidden="true" />
                  <Label htmlFor="sound-switch">{copy.soundLabel}</Label>
                </div>
                <Switch
                  id="sound-switch"
                  checked={soundEnabled}
                  onCheckedChange={toggleSound}
                  aria-label={copy.soundLabel}
                />
              </div>
              <div className="settings-mode-toggles">
                <Toggle
                  variant="outline"
                  pressed={learningMode}
                  onPressedChange={toggleLearningMode}
                  aria-label={copy.learningMode}
                  className="settings-mode-toggle"
                >
                  <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
                  {copy.learningMode}
                </Toggle>
                <Toggle
                  variant="outline"
                  pressed={reversalsMode}
                  onPressedChange={toggleReversalsMode}
                  aria-label={copy.reversalsMode}
                  className="settings-mode-toggle"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {copy.reversalsMode}
                </Toggle>
              </div>
            </div>
          </section>

          {isLoggedIn ? (
            <section className="settings-cabinet settings-cabinet--stack">
              <header className="settings-rail-block settings-rail-head">
                <p className="settings-rail-kicker">{copy.settingsSessionTitle}</p>
              </header>
              <div className="settings-rail-block">
                <div className="settings-action-row">
                  <div>
                    <p className="settings-action-title">{copy.signOutAll}</p>
                    <p className="settings-action-desc">{copy.settingsSignOutAllDesc}</p>
                  </div>
                  <button type="button" className="settings-row-action" onClick={auth.signOutAll}>
                    <LogOut className="h-4 w-4" aria-hidden="true" />
                    {copy.signOut}
                  </button>
                </div>
                <div className="settings-action-row">
                  <div>
                    <p className="settings-action-title">{copy.clear}</p>
                    <p className="settings-action-desc">{copy.settingsClearLocalDesc}</p>
                  </div>
                  <button
                    type="button"
                    className="settings-row-action"
                    onClick={() => {
                      clearHistory();
                      clearJournal();
                      pushToast(copy.clear, "success");
                    }}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    {copy.clear}
                  </button>
                </div>
              </div>
            </section>
          ) : null}

          {isLoggedIn ? (
            <Accordion type="single" collapsible className="settings-privacy">
              <AccordionItem value="privacy" className="border-b-0">
                <AccordionTrigger className="settings-privacy-trigger hover:no-underline">
                  <div className="settings-privacy-head">
                    <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <div>
                      <span className="settings-action-title">{copy.dataPrivacySection}</span>
                      <p className="settings-action-desc">{copy.settingsPrivacySubtitle}</p>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="settings-privacy-body">
                  <p className="settings-action-desc">{copy.dataPrivacyHint}</p>
                  <div className="settings-action-row">
                    <div>
                      <p className="settings-action-title">{copy.dataExport}</p>
                      <p className="settings-action-desc">{copy.settingsExportDesc}</p>
                    </div>
                    <button
                      type="button"
                      className="settings-row-action"
                      onClick={() => void handleExportData()}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                      {copy.dataExport}
                    </button>
                  </div>
                  <div className="settings-action-row">
                    <div>
                      <p className="settings-action-title is-danger">{copy.dataDelete}</p>
                      <p className="settings-action-desc">{copy.settingsDeleteDesc}</p>
                    </div>
                    <button
                      type="button"
                      className="settings-row-action is-danger"
                      onClick={() => void handleDeleteData()}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                      {copy.dataDelete}
                    </button>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null}
        </div>
      </TooltipProvider>
    </PageShell>
  );
}
