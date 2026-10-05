"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, Check, Loader2, Target, TimerReset, TrendingUp } from "lucide-react";

import type { ExamPlan, MasteryRoadmap } from "@/lib/learning-api";

const MODE_LABELS: Record<string, { en: string; zh: string }> = {
  reading: { en: "Reading", zh: "阅读" },
  watching: { en: "Watching", zh: "观看" },
  practicing: { en: "Practicing", zh: "练习" },
  listening: { en: "Listening", zh: "听" },
};

/**
 * Astra-style exam follow-up card: countdown to the exam date, target grade
 * and the learner's preferred mode, with per-topic priority toggles that
 * persist through PATCH /topics/{id}/exam-plan.
 */
export function ExamPlanCard({
  examPlan,
  onSave,
  saving,
}: {
  examPlan: ExamPlan | null;
  onSave: (plan: ExamPlan) => void;
  saving: boolean;
}) {
  const { t } = useTranslation();

  const countdown = useMemo(() => {
    if (!examPlan?.exam_date) return null;
    const days = Math.ceil(
      (examPlan.exam_date * 1000 - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return days;
  }, [examPlan]);

  if (!examPlan || (!examPlan.exam_date && !examPlan.learning_mode && !examPlan.target_grade)) {
    return null;
  }

  const modeLabel = examPlan.learning_mode
    ? (MODE_LABELS[examPlan.learning_mode] ?? { en: examPlan.learning_mode, zh: "" })
    : null;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-[var(--primary)]">
        <CalendarDays className="h-3.5 w-3.5" />
        {t("Exam plan")}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        {examPlan.exam_date && (
          <div className="rounded-lg bg-[var(--accent)] p-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
              <TimerReset className="h-3 w-3" />
              {t("Days left")}
            </div>
            <div className="mt-0.5 text-xl font-semibold text-[var(--foreground)]">
              {countdown !== null ? countdown : "—"}
            </div>
          </div>
        )}
        {examPlan.target_grade && (
          <div className="rounded-lg bg-[var(--accent)] p-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)]">
              <Target className="h-3 w-3" />
              {t("Target")}
            </div>
            <div className="mt-0.5 text-xl font-semibold text-[var(--foreground)]">
              {examPlan.target_grade}
            </div>
          </div>
        )}
      </div>
      {modeLabel && (
        <div className="mt-2 flex items-center gap-2 text-xs text-[var(--muted-foreground)]">
          <TrendingUp className="h-3 w-3 text-[var(--primary)]" />
          {t("Mode")}: <span className="font-medium text-[var(--foreground)]">{t(modeLabel.en)}</span>
        </div>
      )}
    </section>
  );
}

/** Interactive weekly roadmap counting down to the exam date. */
export function RoadmapCard({
  roadmap,
  loading,
  onOpenTopic,
}: {
  roadmap: MasteryRoadmap | null;
  loading: boolean;
  onOpenTopic: (id: string) => void;
}) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--primary)]">
          <CalendarDays className="h-3.5 w-3.5" />
          {t("Roadmap")}
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-8 animate-pulse rounded-lg bg-[var(--accent)]" />
          <div className="h-20 animate-pulse rounded-lg bg-[var(--accent)]" />
        </div>
      </section>
    );
  }

  if (!roadmap || roadmap.plan.length === 0) {
    return null;
  }

  const masteredCount = roadmap.plan
    .flatMap((week) => week.items)
    .filter((item) => item.status === "mastered").length;
  const totalCount = roadmap.plan.flatMap((week) => week.items).length;

  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-medium text-[var(--primary)]">
          <CalendarDays className="h-3.5 w-3.5" />
          {t("Exam roadmap")}
        </div>
        {roadmap.days_left !== null && (
          <span className="rounded-full bg-[var(--primary)]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[var(--primary)]">
            {t("{{count}} days left", { count: roadmap.days_left })}
          </span>
        )}
      </div>

      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px] text-[var(--muted-foreground)]">
          <span>
            {totalCount > 0
              ? t("{{mastered}} of {{total}} topics", {
                  mastered: masteredCount,
                  total: totalCount,
                })
              : t("No topics yet")}
          </span>
          <span>
            {Math.round(totalCount > 0 ? (masteredCount / totalCount) * 100 : 0)}%
          </span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--accent)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all"
            style={{
              width: `${totalCount > 0 ? (masteredCount / totalCount) * 100 : 0}%`,
            }}
          />
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {roadmap.plan.map((week) => {
          const weekMastered = week.items.filter(
            (item) => item.status === "mastered",
          ).length;
          const done = week.items.length > 0 && weekMastered === week.items.length;
          return (
            <div key={week.week}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
                  {t("Week {{week}}", { week: week.week })}
                  {week.days_left !== null && (
                    <span className="ml-1.5 font-normal normal-case text-[var(--muted-foreground)]/70">
                      · {t("{{days}} days before", { days: week.days_left })}
                    </span>
                  )}
                </span>
                {done && (
                  <span className="text-[11px] font-medium text-[var(--primary)]">
                    ✓ {t("Complete")}
                  </span>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {week.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onOpenTopic(item.id)}
                    className={`inline-flex max-w-full items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] transition hover:border-[var(--primary)]/40 ${
                      item.status === "mastered"
                        ? "border-[var(--primary)]/30 bg-[var(--primary)]/5 text-[var(--muted-foreground)] line-through"
                        : item.priority >= 4
                          ? "border-[var(--primary)]/40 bg-[var(--primary)]/10 font-medium text-[var(--foreground)]"
                          : "border-[var(--border)] bg-[var(--accent)] text-[var(--foreground)]"
                    }`}
                    title={`${item.module} · ${t("priority")} ${item.priority}/5`}
                  >
                    {item.priority >= 4 && <TrendingUp className="h-3 w-3 shrink-0 text-[var(--primary)]" />}
                    <span className="truncate">{item.name}</span>
                  </button>
                ))}
                {week.items.length === 0 && (
                  <span className="text-[11px] italic text-[var(--muted-foreground)]/60">
                    {t("Rest / buffer")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

/** Priority editor used by the topic page — one row per knowledge point. */
export function ExamPriorityEditor({
  examPlan,
  topicNames,
  onSave,
  saving,
  busy,
}: {
  examPlan: ExamPlan | null;
  topicNames: string[];
  onSave: (plan: ExamPlan) => void;
  saving: boolean;
  busy: boolean;
}) {
  const { t } = useTranslation();
  const priorities = examPlan?.topic_priorities ?? {};
  const [draft, setDraft] = useState<Record<string, number>>(priorities);

  const setPriority = (name: string, level: number) => {
    setDraft((previous) => ({ ...previous, [name]: level }));
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-[var(--primary)]">
        <TrendingUp className="h-3.5 w-3.5" />
        {t("Topic priorities")}
      </div>
      <p className="mt-1 text-[11px] leading-4 text-[var(--muted-foreground)]">
        {t("Mark the topics that matter most for your exam.")}
      </p>
      <div className="mt-3 space-y-2">
        {topicNames.map((name) => {
          const level = draft[name] ?? 3;
          return (
            <div
              key={name}
              className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] px-3 py-2"
            >
              <span className="min-w-0 flex-1 truncate text-xs text-[var(--foreground)]">
                {name}
              </span>
              <div className="flex shrink-0 items-center gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPriority(name, value)}
                    aria-pressed={level === value}
                    aria-label={`${name}: ${value}`}
                    className={`h-5 w-5 rounded-md text-[10px] font-semibold transition ${
                      value <= level
                        ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                        : "bg-[var(--accent)] text-[var(--muted-foreground)] hover:bg-[var(--border)]"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <button
        type="button"
        disabled={saving || busy}
        onClick={() =>
          onSave({ ...examPlan, topic_priorities: draft } as ExamPlan)
        }
        className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] text-xs font-medium text-[var(--primary-foreground)] disabled:opacity-50"
      >
        {saving ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        {t("Save priorities")}
      </button>
    </div>
  );
}
