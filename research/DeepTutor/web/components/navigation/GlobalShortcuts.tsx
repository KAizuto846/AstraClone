"use client";

/**
 * Global keyboard navigation for DeepTutor.
 *
 *  - Ctrl/Cmd + K   → open the command palette (jump to any section)
 *  - Ctrl/Cmd + P   → alias for the palette
 *  - Ctrl/Cmd + 1..6 → switch to the main workspace sections
 *  - Ctrl/Cmd + ,   → open Settings
 *  - Esc            → close the palette
 *
 * Mounted once in AppShell so it covers both the (workspace) and (utility)
 * route groups.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Bot,
  Command,
  FileText,
  GraduationCap,
  HeartHandshake,
  House,
  LayoutGrid,
  Library,
  PenLine,
  Search,
  Settings,
  Target,
  type LucideIcon,
} from "lucide-react";

interface NavDestination {
  href: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  group: string;
}

const NAV_DESTINATIONS: NavDestination[] = [
  { href: "/chat", label: "Home (Chat)", hint: "Iniciar una conversación", icon: House, group: "Principal" },
  { href: "/partners", label: "Partners", hint: "Conversaciones de socio", icon: HeartHandshake, group: "Principal" },
  { href: "/learning", label: "Personalized Learning", hint: "Centro de aprendizaje", icon: GraduationCap, group: "Principal" },
  { href: "/learning/books", label: "Books", hint: "Libros de texto", icon: BookOpen, group: "Aprendizaje" },
  { href: "/learning/practice", label: "Practice", hint: "Práctica", icon: Target, group: "Aprendizaje" },
  { href: "/learning/mastery", label: "Mastery", hint: "Rutas de dominio", icon: GraduationCap, group: "Aprendizaje" },
  { href: "/learning/reading", label: "Reading", hint: "Lectura inmersiva", icon: BookOpen, group: "Aprendizaje" },
  { href: "/learning/watching", label: "Watching", hint: "Video inmersivo", icon: FileText, group: "Aprendizaje" },
  { href: "/space", label: "Learning Space", hint: "Tu espacio", icon: LayoutGrid, group: "Principal" },
  { href: "/co-writer", label: "Co-Writer", hint: "Redacción asistida", icon: PenLine, group: "Principal" },
  { href: "/agents", label: "My Agents", hint: "Agentes", icon: Bot, group: "Principal" },
  { href: "/memory", label: "Memory", hint: "Memoria persistente", icon: Library, group: "Utilidades" },
  { href: "/notebooks", label: "Notebooks", hint: "Cuadernos", icon: FileText, group: "Utilidades" },
  { href: "/knowledge-bases", label: "Knowledge Bases", hint: "Bases de conocimiento", icon: Library, group: "Utilidades" },
  { href: "/courses", label: "Courses", hint: "Cursos", icon: GraduationCap, group: "Utilidades" },
  { href: "/settings", label: "Settings", hint: "Configuración", icon: Settings, group: "Utilidades" },
];

/** Main sections, reachable with Ctrl/Cmd + 1..6. */
const MAIN_SECTION_SHORTCUTS: { key: string; href: string }[] = [
  { key: "1", href: "/chat" },
  { key: "2", href: "/partners" },
  { key: "3", href: "/learning" },
  { key: "4", href: "/space" },
  { key: "5", href: "/co-writer" },
  { key: "6", href: "/agents" },
];

const MOD_KEY = (e: KeyboardEvent) => e.ctrlKey || e.metaKey;

function normalize(query: string, text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function GlobalShortcuts() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = normalize(query.trim(), "");
    if (!q) return NAV_DESTINATIONS;
    return NAV_DESTINATIONS.filter((d) =>
      normalize(query, `${d.label} ${d.hint ?? ""} ${d.group}`).includes(q),
    );
  }, [query]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      setQuery("");
      router.push(href);
    },
    [router],
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Keep the selected index inside bounds without a state-sync effect: derive
  // a safe index at render time so Arrow/Enter always act on a valid row.
  const safeSelected = filtered.length === 0 ? -1 : Math.min(selected, filtered.length - 1);
  const effectiveSelected = safeSelected === -1 ? 0 : safeSelected;

  useEffect(() => {
    if (open) {
      // Restore focus to the filter input after mount.
      const id = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
  }, [open]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Palette opens anywhere, including inside inputs.
      if (MOD_KEY(e) && (e.key === "k" || e.key === "K" || e.key === "p" || e.key === "P")) {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      // Global section shortcuts only when the palette is closed and we're not
      // typing inside a text field.
      if (!open && MOD_KEY(e) && /^[1-6]$/.test(e.key)) {
        const target = MAIN_SECTION_SHORTCUTS.find((s) => s.key === e.key);
        if (target) {
          e.preventDefault();
          go(target.href);
        }
        return;
      }
      if (!open && MOD_KEY(e) && e.key === ",") {
        e.preventDefault();
        go("/settings");
        return;
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, go]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Navegación rápida"
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 pt-[12vh] p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-2xl">
        {/* Filter input */}
        <div className="flex items-center gap-2 border-b border-[var(--border)] px-3">
          <Search size={16} className="shrink-0 text-[var(--muted-foreground)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, filtered.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                const item = filtered[effectiveSelected];
                if (item) go(item.href);
              } else if (e.key === "Escape") {
                e.preventDefault();
                close();
              }
            }}
            placeholder="Navegar a… (escribe para filtrar)"
            className="h-12 w-full bg-transparent text-[15px] outline-none placeholder:text-[var(--muted-foreground)]"
          />
          <kbd className="hidden shrink-0 items-center gap-1 rounded border border-[var(--border)] px-1.5 py-0.5 text-[11px] text-[var(--muted-foreground)] sm:inline-flex">
            <Command size={11} /> K
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
              Sin resultados
            </p>
          ) : (
            filtered.map((item, index) => {
              const Icon = item.icon;
              const isSelected = index === effectiveSelected;
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={() => go(item.href)}
                  onMouseEnter={() => setSelected(index)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                    isSelected
                      ? "bg-[var(--muted)]/60"
                      : "hover:bg-[var(--muted)]/30"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${
                      isSelected ? "bg-[var(--primary)]/15" : "bg-[var(--muted)]/40"
                    }`}
                  >
                    <Icon
                      size={15}
                      className={isSelected ? "text-[var(--primary)]" : "text-[var(--muted-foreground)]"}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[var(--foreground)]">
                      {item.label}
                    </span>
                    {item.hint ? (
                      <span className="block truncate text-xs text-[var(--muted-foreground)]">
                        {item.hint}
                      </span>
                    ) : null}
                  </span>
                  <span className="shrink-0 text-[11px] uppercase tracking-wide text-[var(--muted-foreground)]">
                    {item.group}
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer hints */}
        <div className="flex items-center gap-4 border-t border-[var(--border)] px-3 py-2 text-[11px] text-[var(--muted-foreground)]">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--border)] px-1">↑↓</kbd> navegar
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--border)] px-1">↵</kbd> ir
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-[var(--border)] px-1">esc</kbd> cerrar
          </span>
          <span className="ml-auto flex items-center gap-1">
            <kbd className="rounded border border-[var(--border)] px-1">Ctrl+1..6</kbd> secciones
          </span>
        </div>
      </div>
    </div>
  );
}
