import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Award, Flame, TrendingUp } from "lucide-react";
import type { Achievement, MomentumIndicator, StreakMetric, StreakTone } from "@/lib/streaks-achievements";
import { Card, EmptyState, ProgressBar, SectionTitle } from "@/components/ui";

function toneClasses(tone: StreakTone = "default") {
  const tones = {
    default: "border-line bg-surface text-muted",
    green: "border-evergreen/25 bg-evergreen/10 text-evergreen",
    blue: "border-mineral/25 bg-mineral/10 text-mineral",
    amber: "border-gold/25 bg-gold/10 text-gold",
    red: "border-ember/25 bg-ember/10 text-ember"
  };

  return tones[tone];
}

function mutedDate(value?: string) {
  if (!value) return "No completion yet";
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(`${value}T12:00:00`));
}

function StreakPill({ children, tone = "default" }: { children: ReactNode; tone?: StreakTone }) {
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClasses(tone)}`}>{children}</span>;
}

function unitLabel(value: number, unit: StreakMetric["unit"]) {
  return `${value} ${unit}${value === 1 ? "" : "s"}`;
}

export function CurrentStreaksWidget({ streaks, limit = 6 }: { streaks: StreakMetric[]; limit?: number }) {
  const visible = [...streaks].sort((a, b) => b.current - a.current || b.longest - a.longest).slice(0, limit);

  return (
    <Card>
      <div className="flex items-start gap-2">
        <Flame size={18} className="mt-1 shrink-0 text-mineral" />
        <SectionTitle title="Current Streaks" subtitle="Calculated from your private SelfOS logs. No manual badges to maintain." />
      </div>
      {visible.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {visible.map((streak) => (
            <Link key={streak.id} href={streak.href} className="focus-ring group rounded-lg border border-line bg-surface p-3 transition-colors hover:border-mineral/50 hover:bg-zinc-800/80">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-ink">{streak.label}</p>
                  <p className="mt-1 text-xs leading-5 text-muted">{streak.description}</p>
                </div>
                <StreakPill tone={streak.tone}>{unitLabel(streak.current, streak.unit)}</StreakPill>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted">
                <div>
                  <span className="block font-semibold text-ink">{unitLabel(streak.longest, streak.unit)}</span>
                  Longest
                </div>
                <div>
                  <span className="block font-semibold text-ink">{mutedDate(streak.lastCompletedDate)}</span>
                  Last completed
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No streaks yet" body="Log a meal, workout, check-in, habit, or review to start a quiet consistency streak." />
      )}
    </Card>
  );
}

export function RecentAchievementsWidget({
  achievements,
  nextAchievements,
  momentumIndicators
}: {
  achievements: Achievement[];
  nextAchievements: Achievement[];
  momentumIndicators: MomentumIndicator[];
}) {
  return (
    <Card>
      <div className="flex items-start gap-2">
        <Award size={18} className="mt-1 shrink-0 text-mineral" />
        <SectionTitle title="Recent Achievements" subtitle="Subtle milestones that mark consistency, not perfection." />
      </div>
      {momentumIndicators.length ? (
        <div className="mb-4 grid gap-2">
          {momentumIndicators.map((indicator) => (
            <div key={indicator.title} className={`rounded-lg border p-3 ${toneClasses(indicator.tone)}`}>
              <p className="text-sm font-semibold text-ink">{indicator.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{indicator.detail}</p>
            </div>
          ))}
        </div>
      ) : null}
      {achievements.length ? (
        <div className="space-y-3">
          {achievements.map((achievement) => (
            <Link key={achievement.id} href={achievement.href} className="focus-ring group block rounded-lg border border-line bg-surface p-3 transition-colors hover:border-mineral/50 hover:bg-zinc-800/80">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{achievement.title}</p>
                  <p className="mt-1 text-sm leading-6 text-muted">{achievement.description}</p>
                </div>
                <StreakPill tone={achievement.tone}>{mutedDate(achievement.unlockedAt)}</StreakPill>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No achievements unlocked yet" body="The first workout, meal, mood check-in, or weekly review will appear here." />
      )}
      {nextAchievements.length ? (
        <div className="mt-4 rounded-lg border border-line bg-panel/70 p-3">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink">
            <TrendingUp size={16} className="text-mineral" />
            Next quiet milestone
          </div>
          <div className="space-y-3">
            {nextAchievements.map((achievement) => (
              <Link key={achievement.id} href={achievement.href} className="focus-ring block rounded-md border border-line bg-surface p-3 transition-colors hover:bg-zinc-800/80">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-ink">{achievement.title}</p>
                  <ArrowRight size={14} className="text-muted" />
                </div>
                <ProgressBar value={(achievement.progress.current / achievement.progress.target) * 100} label={achievement.progress.label} />
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
