"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CalendarDays, FileText, Loader2, Search, Target } from "lucide-react";

import type { SearchResult } from "@/app/api/search/route";

const iconByType = {
  interview: CalendarDays,
  resume: FileText,
  goal: Target
} as const;

export function DashboardSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`);
        if (!response.ok) return;
        const payload = await response.json();
        setResults(payload.results ?? []);
      } catch {
        // Silently ignore: a failed search shouldn't disrupt the dashboard.
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const trimmedQuery = query.trim();
  const showDropdown = isOpen && trimmedQuery.length >= 2;

  return (
    <div ref={containerRef} className="relative sm:w-72">
      <label className="flex h-11 min-w-0 items-center gap-3 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm text-muted-foreground focus-within:border-primary/50">
        <Search className="size-4 shrink-0" aria-hidden="true" />
        <input
          type="text"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
              (event.target as HTMLInputElement).blur();
            }
          }}
          placeholder="Search interviews, resumes, goals..."
          className="w-full min-w-0 bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {isLoading ? <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden="true" /> : null}
      </label>

      {showDropdown ? (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-white/10 bg-card/95 p-2 shadow-2xl shadow-black/40 backdrop-blur">
          {results.length === 0 && !isLoading ? (
            <p className="p-3 text-sm text-muted-foreground">No results for &ldquo;{trimmedQuery}&rdquo;.</p>
          ) : (
            results.map((result) => {
              const Icon = iconByType[result.type];
              return (
                <Link
                  key={`${result.type}-${result.id}`}
                  href={result.href}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.06]"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{result.title}</span>
                    <span className="block truncate text-xs text-muted-foreground">{result.subtitle}</span>
                  </span>
                </Link>
              );
            })
          )}
        </div>
      ) : null}
    </div>
  );
}