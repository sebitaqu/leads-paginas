"use client";

import { useState } from "react";

interface SearchFormProps {
  onSearchComplete: () => void;
}

const RADIOS = [
  { label: "1 km", metros: 1000 },
  { label: "3 km", metros: 3000 },
  { label: "5 km", metros: 5000 },
  { label: "10 km", metros: 10000 },
];

export function SearchForm({ onSearchComplete }: SearchFormProps) {
  const [rubro, setRubro] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [radio, setRadio] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultado(null);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: rubro,
          location: ubicacion,
          rubro,
          radius: radio,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error en la búsqueda");
        return;
      }

      setResultado(
        `Encontrados: ${data.totalEncontrados} · Guardados: ${data.guardados} · Sin teléfono: ${data.descartadosSinTelefono} · Con website: ${data.descartadosConWebsite}`
      );
      onSearchComplete();
    } catch {
      setError("Error de red al buscar");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">Rubro</label>
        <input
          type="text"
          required
          value={rubro}
          onChange={(e) => setRubro(e.target.value)}
          placeholder="ej: restaurantes"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">Ubicación</label>
        <input
          type="text"
          required
          value={ubicacion}
          onChange={(e) => setUbicacion(e.target.value)}
          placeholder="ej: Providencia, Santiago"
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Radio</label>
        <select
          value={radio}
          onChange={(e) => setRadio(Number(e.target.value))}
          className="mt-1 rounded border border-gray-300 px-3 py-2 text-sm"
        >
          {RADIOS.map((r) => (
            <option key={r.metros} value={r.metros}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Buscando..." : "Buscar"}
      </button>
      {resultado && <p className="text-sm text-green-700 sm:ml-3">{resultado}</p>}
      {error && <p className="text-sm text-red-700 sm:ml-3">{error}</p>}
    </form>
  );
}
