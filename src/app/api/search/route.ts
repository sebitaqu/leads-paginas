import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { geocodeLocation, searchOsmPlaces, throttle } from "@/lib/osm";

const RADIO_DEFECTO_METROS = 5000;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { query, location, radius, rubro } = body as {
    query?: string;
    location?: string;
    radius?: number;
    rubro?: string;
  };

  if (!query || !location) {
    return NextResponse.json(
      { error: "query y location son requeridos" },
      { status: 400 }
    );
  }

  let geo;
  try {
    geo = await geocodeLocation(location);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error geocodificando con Nominatim" },
      { status: 502 }
    );
  }

  if (!geo) {
    return NextResponse.json(
      { error: `No se pudo geocodificar la ubicación "${location}"` },
      { status: 404 }
    );
  }

  await throttle();

  let lugares;
  try {
    lugares = await searchOsmPlaces(
      query,
      geo.lat,
      geo.lon,
      radius ?? RADIO_DEFECTO_METROS
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error consultando Overpass API" },
      { status: 502 }
    );
  }

  const nuevos = [];
  let descartadosSinTelefono = 0;
  let descartadosConWebsite = 0;

  for (const lugar of lugares) {
    if (lugar.tieneWebsite) {
      descartadosConWebsite++;
      continue;
    }

    if (!lugar.telefono) {
      descartadosSinTelefono++;
      continue;
    }

    const lead = await prisma.lead.upsert({
      where: { osmId: lugar.osmId },
      update: {
        nombre: lugar.nombre,
        direccion: lugar.direccion,
        comuna: lugar.comuna,
        telefono: lugar.telefono,
        tieneWebsite: lugar.tieneWebsite,
      },
      create: {
        osmId: lugar.osmId,
        nombre: lugar.nombre,
        rubro: rubro ?? query,
        direccion: lugar.direccion,
        comuna: lugar.comuna,
        telefono: lugar.telefono,
        email: lugar.email,
        tieneWebsite: lugar.tieneWebsite,
      },
    });

    nuevos.push(lead);
  }

  return NextResponse.json({
    totalEncontrados: lugares.length,
    guardados: nuevos.length,
    descartadosSinTelefono,
    descartadosConWebsite,
    leads: nuevos,
  });
}
