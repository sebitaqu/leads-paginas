"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { LeadsTable } from "@/components/LeadsTable";

function LogoMark() {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="2" />
        <path
          d="M20 20l-4.3-4.3"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="11" cy="11" r="2" fill="currentColor" />
      </svg>
    </div>
  );
}

export default function Home() {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="min-h-screen bg-surface-muted">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="flex items-center gap-4">
          <LogoMark />
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-ink sm:text-3xl">
              Buscador de Leads
            </h1>
            <p className="mt-0.5 text-sm text-muted">
              Negocios locales sin página web, listos para contactar.
            </p>
          </div>
        </header>

        <section className="mt-8 rounded-2xl border border-border bg-surface p-5 shadow-[0_1px_2px_rgba(23,36,31,0.04),0_8px_24px_-12px_rgba(23,36,31,0.12)] sm:p-6">
          <SearchForm onSearchComplete={() => setReloadKey((k) => k + 1)} />
        </section>

        <section className="mt-8">
          <LeadsTable reloadKey={reloadKey} />
        </section>
      </main>
    </div>
  );
}
