"use client";

import { useState } from "react";

interface SearchFormProps {
  onSearchComplete: () => void;
}

// Debe coincidir exactamente con TODOS_RUBROS exportado en src/lib/osm.ts
const TODOS_RUBROS = "__todos__";
const TODA_LA_RM = "__rm__";

const RADIOS = [
  { label: "1 km", metros: 1000 },
  { label: "3 km", metros: 3000 },
  { label: "5 km", metros: 5000 },
  { label: "10 km", metros: 10000 },
];

// value debe coincidir con una clave de RUBRO_TAGS en src/lib/osm.ts
const RUBROS = [
  { label: "Todos los rubros", value: TODOS_RUBROS },
  { label: "Restaurantes", value: "restaurantes" },
  { label: "Panaderías", value: "panaderia" },
  { label: "Peluquerías / Barberías", value: "peluquerias" },
  { label: "Cafeterías", value: "cafeteria" },
  { label: "Almacenes / Minimarkets", value: "almacen" },
  { label: "Ferreterías", value: "ferreteria" },
  { label: "Farmacias", value: "farmacias" },
  { label: "Veterinarias", value: "veterinarias" },
  { label: "Gimnasios", value: "gimnasios" },
  { label: "Talleres mecánicos", value: "taller" },
  { label: "Lavanderías", value: "lavanderia" },
  { label: "Florerías", value: "floreria" },
  { label: "Librerías", value: "libreria" },
  { label: "Tiendas de ropa", value: "ropa" },
  { label: "Dentistas", value: "dentistas" },
  { label: "Kinesiólogos / Fisioterapeutas", value: "kinesiologo" },
  { label: "Bares", value: "bares" },
  { label: "Pastelerías", value: "pasteleria" },
  { label: "Supermercados", value: "supermercados" },
  { label: "Zapaterías", value: "zapateria" },
  { label: "Carnicerías", value: "carniceria" },
  { label: "Ópticas", value: "optica" },
  { label: "Hoteles", value: "hoteles" },
  { label: "Inmobiliarias", value: "inmobiliaria" },
  { label: "Abogados", value: "abogados" },
  { label: "Contadores", value: "contador" },
];

// Las 52 comunas de la Región Metropolitana de Santiago.
const COMUNAS = [
  "Alhué",
  "Buin",
  "Calera de Tango",
  "Cerrillos",
  "Cerro Navia",
  "Colina",
  "Conchalí",
  "Curacaví",
  "El Bosque",
  "El Monte",
  "Estación Central",
  "Huechuraba",
  "Independencia",
  "Isla de Maipo",
  "La Cisterna",
  "La Florida",
  "La Granja",
  "La Pintana",
  "La Reina",
  "Lampa",
  "Las Condes",
  "Lo Barnechea",
  "Lo Espejo",
  "Lo Prado",
  "Macul",
  "Maipú",
  "María Pinto",
  "Melipilla",
  "Ñuñoa",
  "Padre Hurtado",
  "Paine",
  "Pedro Aguirre Cerda",
  "Peñaflor",
  "Peñalolén",
  "Pirque",
  "Providencia",
  "Pudahuel",
  "Puente Alto",
  "Quilicura",
  "Quinta Normal",
  "Recoleta",
  "Renca",
  "San Bernardo",
  "San Joaquín",
  "San José de Maipo",
  "San Miguel",
  "San Pedro",
  "San Ramón",
  "Santiago",
  "Talagante",
  "Til Til",
  "Vitacura",
];

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
  );
}

export function SearchForm({ onSearchComplete }: SearchFormProps) {
  const [rubro, setRubro] = useState(RUBROS[1].value);
  const [comuna, setComuna] = useState<string>(
    COMUNAS.find((c) => c === "Santiago") ?? COMUNAS[0]
  );
  const [radio, setRadio] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function ejecutarBusqueda() {
    setLoading(true);
    setError(null);
    setResultado(null);

    const rubroLabel =
      RUBROS.find((r) => r.value === rubro)?.label ?? rubro;
    const location =
      comuna === TODA_LA_RM ? "Santiago, Chile" : `${comuna}, Santiago, Chile`;

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: rubro,
          location,
          rubro: rubroLabel,
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const ambosTodos = rubro === TODOS_RUBROS && comuna === TODA_LA_RM;

    if (ambosTodos) {
      const confirmado = window.confirm(
        "Vas a buscar TODOS los rubros en TODA la Región Metropolitana. Esto puede tardar bastante y traer muchos resultados. ¿Continuar?"
      );
      if (!confirmado) return;
    }

    ejecutarBusqueda();
  }

  const muestraAvisoRm = comuna === TODA_LA_RM;

  const selectClass =
    "peer w-full appearance-none rounded-lg border border-border bg-surface px-3 py-2.5 pr-9 text-sm text-ink transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
  const labelClass = "block text-xs font-medium uppercase tracking-wide text-muted";

  function SelectChevron() {
    return (
      <svg
        viewBox="0 0 20 20"
        className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted transition-colors peer-hover:text-primary peer-focus:text-primary"
        fill="none"
      >
        <path
          d="M5 8l5 5 5-5"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex-1 space-y-1.5">
          <label className={labelClass}>Rubro</label>
          <div className="relative">
            <select
              value={rubro}
              onChange={(e) => setRubro(e.target.value)}
              className={selectClass}
            >
              {RUBROS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>

        <div className="flex-1 space-y-1.5">
          <label className={labelClass}>Ubicación</label>
          <div className="relative">
            <select
              value={comuna}
              onChange={(e) => setComuna(e.target.value)}
              className={selectClass}
            >
              <option value={TODA_LA_RM}>Toda la Región Metropolitana</option>
              {COMUNAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
          {muestraAvisoRm && (
            <p className="text-xs text-amber">
              Buscar en toda la RM puede tardar más de lo normal.
            </p>
          )}
        </div>

        <div className="space-y-1.5 sm:w-32">
          <label className={labelClass}>Radio</label>
          <div className="relative">
            <select
              value={radio}
              onChange={(e) => setRadio(Number(e.target.value))}
              className={`${selectClass} font-mono`}
            >
              {RADIOS.map((r) => (
                <option key={r.metros} value={r.metros}>
                  {r.label}
                </option>
              ))}
            </select>
            <SelectChevron />
          </div>
        </div>

        <div className="space-y-1.5 sm:pt-[22px]">
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary-hover hover:shadow-md active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:shadow-sm sm:w-auto"
          >
            {loading && <Spinner />}
            {loading ? "Buscando…" : "Buscar"}
          </button>
        </div>
      </div>

      {resultado && (
        <p className="rounded-lg border border-emerald-soft bg-emerald-soft px-3 py-2 text-sm text-primary">
          {resultado}
        </p>
      )}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
