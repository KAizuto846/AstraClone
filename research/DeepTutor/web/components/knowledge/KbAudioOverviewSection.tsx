"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AudioLines, Loader2, Mic2, Radio, Sparkles } from "lucide-react";

function postAudioOverview(
  kbName: string,
  body: {
    topic: string;
    target_minutes: number;
    language: string;
  },
): Promise<{
  title: string;
  transcript: string;
  audio_url: string;
  transcript_url: string;
  citations: { source_id: string; title: string; locator: string }[];
}> {
  return fetch(`/api/audio-overview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kb_name: kbName, ...body }),
  }).then(async (response) => {
    if (!response.ok) {
      let detail = "";
      try {
        detail = ((await response.json()) as { detail?: string }).detail ?? "";
      } catch {
        /* keep empty */
      }
      throw new Error(detail || `HTTP ${response.status}`);
    }
    return (await response.json()) as {
      title: string;
      transcript: string;
      audio_url: string;
      transcript_url: string;
      citations: { source_id: string; title: string; locator: string }[];
    };
  });
}

/**
 * Astra-style "audio overview" — turn this knowledge base into a two-voice
 * podcast with transcript, powered by the native audio_overview pipeline.
 */
export default function KbAudioOverviewSection({
  kbName,
}: {
  kbName: string;
}) {
  const { t } = useTranslation();
  const [topic, setTopic] = useState("");
  const [minutes, setMinutes] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    title: string;
    transcript: string;
    audio_url: string;
    transcript_url: string;
    citations: { source_id: string; title: string; locator: string }[];
  } | null>(null);

  const audioUrl = useMemo(() => {
    if (!result?.audio_url) return "";
    return result.audio_url.startsWith("http")
      ? result.audio_url
      : result.audio_url;
  }, [result]);

  const generate = async () => {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const outcome = await postAudioOverview(kbName, {
        topic: topic.trim(),
        target_minutes: minutes,
        language: "es",
      });
      setResult(outcome);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : t("Could not generate the podcast. Try again."),
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6">
      <div className="flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
          <AudioLines className="h-4.5 w-4.5" />
        </div>
        <div>
          <div className="text-[14px] font-semibold text-[var(--foreground)]">
            {t("Audio overview")}
          </div>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--muted-foreground)]">
            {t(
              "Turn this knowledge base into a two-voice podcast with transcript — like NotebookLM.",
            )}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_110px]">
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            {t("Topic (optional)")}
          </span>
          <input
            type="text"
            value={topic}
            onChange={(event) => setTopic(event.target.value)}
            placeholder={t("e.g. Limites y derivadas — resumen para el examen")}
            maxLength={500}
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-3 text-[13px] text-[var(--foreground)] outline-none transition-colors placeholder:text-[var(--muted-foreground)]/60 focus:border-[var(--primary)]/50"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[var(--muted-foreground)]">
            {t("Minutes")}
          </span>
          <select
            value={minutes}
            onChange={(event) => setMinutes(Number(event.target.value))}
            className="h-10 w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-2 text-[13px] text-[var(--foreground)] outline-none focus:border-[var(--primary)]/50"
          >
            {[3, 5, 8, 10, 15].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={() => void generate()}
        disabled={busy}
        className="mt-4 inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-[13px] font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {busy ? t("Writing script and voices…") : t("Generate podcast")}
      </button>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-6 rounded-2xl border border-[var(--primary)]/20 bg-[var(--primary)]/5 p-4">
          <div className="flex items-center gap-2 text-[13px] font-semibold text-[var(--foreground)]">
            <Mic2 className="h-4 w-4 text-[var(--primary)]" />
            <span className="min-w-0 flex-1 truncate">{result.title}</span>
          </div>

          {audioUrl && (
            <div className="mt-3">
              <audio
                controls
                preload="none"
                src={audioUrl}
                className="h-10 w-full"
              />
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted-foreground)]">
              <Radio className="h-3 w-3" />
              {result.transcript.split("\n").length} {t("lines")} ·{" "}
              {result.citations.length} {t("sources")}
            </span>
          </div>

          <details className="mt-3">
            <summary className="cursor-pointer text-[12px] font-medium text-[var(--primary)] hover:underline">
              {t("View transcript")}
            </summary>
            <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-[var(--background)] p-3 text-[12px] leading-relaxed text-[var(--foreground)]">
              {result.transcript}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
}