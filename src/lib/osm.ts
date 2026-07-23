const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

const USER_AGENT =
  "BuscadorDeLeads/1.0 (contacto: s.andres.diaz.benucci@gmail.com)";

/** Overpass y Nominatim piden respetar max ~1 req/seg. */
async function throttle() {
  await new Promise((resolve) => setTimeout(resolve, 1100));
}

/** Mapa de rubros comunes en español a tags de OpenStreetMap. */
const RUBRO_TAGS: Record<string, { key: string; value: string }> = {
  restaurante: { key: "amenity", value: "restaurant" },
  restaurantes: { key: "amenity", value: "restaurant" },
  cafe: { key: "amenity", value: "cafe" },
  cafeteria: { key: "amenity", value: "cafe" },
  bar: { key: "amenity", value: "bar" },
  bares: { key: "amenity", value: "bar" },
  panaderia: { key: "shop", value: "bakery" },
  pasteleria: { key: "shop", value: "pastry" },
  peluqueria: { key: "shop", value: "hairdresser" },
  peluquerias: { key: "shop", value: "hairdresser" },
  gimnasio: { key: "leisure", value: "fitness_centre" },
  gimnasios: { key: "leisure", value: "fitness_centre" },
  farmacia: { key: "amenity", value: "pharmacy" },
  farmacias: { key: "amenity", value: "pharmacy" },
  ferreteria: { key: "shop", value: "hardware" },
  veterinaria: { key: "amenity", value: "veterinary" },
  veterinarias: { key: "amenity", value: "veterinary" },
  supermercado: { key: "shop", value: "supermarket" },
  supermercados: { key: "shop", value: "supermarket" },
  zapateria: { key: "shop", value: "shoes" },
  libreria: { key: "shop", value: "books" },
  floreria: { key: "shop", value: "florist" },
  lavanderia: { key: "shop", value: "laundry" },
  taller: { key: "shop", value: "car_repair" },
  dentista: { key: "amenity", value: "dentist" },
  dentistas: { key: "amenity", value: "dentist" },
  hotel: { key: "tourism", value: "hotel" },
  hoteles: { key: "tourism", value: "hotel" },
  ropa: { key: "shop", value: "clothes" },
  carniceria: { key: "shop", value: "butcher" },
  optica: { key: "shop", value: "optician" },
  inmobiliaria: { key: "office", value: "estate_agent" },
  abogado: { key: "office", value: "lawyer" },
  abogados: { key: "office", value: "lawyer" },
  contador: { key: "office", value: "accountant" },
  almacen: { key: "shop", value: "convenience" },
  minimarket: { key: "shop", value: "convenience" },
  kinesiologo: { key: "healthcare", value: "physiotherapist" },
  fisioterapeuta: { key: "healthcare", value: "physiotherapist" },
};

export const TODOS_RUBROS = "__todos__";

function tagsUnicos(): { key: string; value: string }[] {
  const vistos = new Set<string>();
  const unicos: { key: string; value: string }[] = [];

  for (const tag of Object.values(RUBRO_TAGS)) {
    const clave = `${tag.key}=${tag.value}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    unicos.push(tag);
  }

  return unicos;
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[̀-ͯ]", "g"), "")
    .trim();
}

export interface GeoLocation {
  lat: number;
  lon: number;
}

export async function geocodeLocation(
  location: string
): Promise<GeoLocation | null> {
  const url = `${NOMINATIM_URL}?format=json&limit=1&q=${encodeURIComponent(location)}`;

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });

  if (!res.ok) {
    throw new Error(`Nominatim error ${res.status}`);
  }

  const data = (await res.json()) as { lat: string; lon: string }[];
  if (data.length === 0) return null;

  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
}

interface OverpassElement {
  type: "node" | "way" | "relation";
  id: number;
  tags?: Record<string, string>;
}

interface OverpassResponse {
  elements: OverpassElement[];
}

export interface OsmPlace {
  osmId: string;
  nombre: string;
  direccion: string;
  comuna: string | null;
  telefono: string | null;
  email: string | null;
  tieneWebsite: boolean;
  categoria: string | null;
}

const CLAVES_CATEGORIA = [
  "amenity",
  "shop",
  "office",
  "leisure",
  "tourism",
  "healthcare",
];

function detectarCategoria(tags: Record<string, string>): string | null {
  for (const clave of CLAVES_CATEGORIA) {
    if (tags[clave]) return tags[clave];
  }
  return null;
}

function buildOverpassQuery(
  rubro: string,
  lat: number,
  lon: number,
  radius: number
): string {
  const around = `(around:${radius},${lat},${lon})`;

  if (rubro === TODOS_RUBROS) {
    const clausulas = tagsUnicos()
      .flatMap((tag) => [
        `  node["${tag.key}"="${tag.value}"]${around};`,
        `  way["${tag.key}"="${tag.value}"]${around};`,
      ])
      .join("\n");

    return `[out:json][timeout:60];
(
${clausulas}
);
out center tags;`;
  }

  const tag = RUBRO_TAGS[normalizar(rubro)];

  if (tag) {
    return `[out:json][timeout:25];
(
  node["${tag.key}"="${tag.value}"]${around};
  way["${tag.key}"="${tag.value}"]${around};
);
out center tags;`;
  }

  // Sin mapeo conocido: busca por nombre entre categorías comunes de negocio.
  const nombreEscapado = rubro.replace(/"/g, "");
  return `[out:json][timeout:25];
(
  node["shop"]${around}["name"~"${nombreEscapado}",i];
  node["amenity"]${around}["name"~"${nombreEscapado}",i];
  node["office"]${around}["name"~"${nombreEscapado}",i];
  way["shop"]${around}["name"~"${nombreEscapado}",i];
  way["amenity"]${around}["name"~"${nombreEscapado}",i];
  way["office"]${around}["name"~"${nombreEscapado}",i];
);
out center tags;`;
}

export async function searchOsmPlaces(
  rubro: string,
  lat: number,
  lon: number,
  radius: number
): Promise<OsmPlace[]> {
  const query = buildOverpassQuery(rubro, lat, lon, radius);

  const res = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Overpass API error ${res.status}: ${body}`);
  }

  const data: OverpassResponse = await res.json();

  return data.elements
    .filter((el) => el.tags?.name)
    .map((el) => {
      const tags = el.tags!;
      const direccion = [tags["addr:street"], tags["addr:housenumber"]]
        .filter(Boolean)
        .join(" ");

      return {
        osmId: `${el.type}/${el.id}`,
        nombre: tags.name,
        direccion: direccion || "Sin dirección",
        comuna: tags["addr:city"] ?? tags["addr:suburb"] ?? null,
        telefono: tags.phone ?? tags["contact:phone"] ?? null,
        email: tags.email ?? tags["contact:email"] ?? null,
        tieneWebsite: Boolean(tags.website || tags["contact:website"]),
        categoria: detectarCategoria(tags),
      };
    });
}

export { throttle };
