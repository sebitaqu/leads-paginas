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

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">Rubro</label>
        <select
          value={rubro}
          onChange={(e) => setRubro(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        >
          {RUBROS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1">
        <label className="block text-sm font-medium text-gray-700">Ubicación</label>
        <select
          value={comuna}
          onChange={(e) => setComuna(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
        >
          <option value={TODA_LA_RM}>Toda la Región Metropolitana</option>
          {COMUNAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        {muestraAvisoRm && (
          <p className="mt-1 text-xs text-amber-700">
            Buscar en toda la RM puede tardar más de lo normal.
          </p>
        )}
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
        className="flex items-center justify-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading && <Spinner />}
        {loading ? "Buscando..." : "Buscar"}
      </button>
      {resultado && <p className="text-sm text-green-700 sm:ml-3">{resultado}</p>}
      {error && <p className="text-sm text-red-700 sm:ml-3">{error}</p>}
    </form>
  );
}
