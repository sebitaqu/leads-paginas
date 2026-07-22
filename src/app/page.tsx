"use client";

import { useState } from "react";
import { SearchForm } from "@/components/SearchForm";
import { LeadsTable } from "@/components/LeadsTable";

export default function Home() {
  const [reloadKey, setReloadKey] = useState(0);

  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10">
      <main className="mx-auto max-w-5xl">
        <h1 className="text-2xl font-semibold text-gray-900">
          Buscador de Leads
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Negocios locales sin página web, listos para contactar.
        </p>

        <div className="mt-6 rounded-lg border border-gray-200 bg-white p-4">
          <SearchForm onSearchComplete={() => setReloadKey((k) => k + 1)} />
        </div>

        <LeadsTable reloadKey={reloadKey} />
      </main>
    </div>
  );
}
