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

// value debe coincidir con una clave de RUBRO_TAGS en src/lib/osm.ts
const RUBROS = [
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

export function SearchForm({ onSearchComplete }: SearchFormProps) {
  const [rubro, setRubro] = useState(RUBROS[0].value);
  const [comuna, setComuna] = useState(COMUNAS.find((c) => c === "Santiago") ?? COMUNAS[0]);
  const [radio, setRadio] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResultado(null);

    const rubroLabel = RUBROS.find((r) => r.value === rubro)?.label ?? rubro;
    const location = `${comuna}, Santiago, Chile`;

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
          {COMUNAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
