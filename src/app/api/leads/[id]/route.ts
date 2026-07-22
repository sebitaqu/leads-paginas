import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const ESTADOS_VALIDOS = ["nuevo", "contactado", "respondio", "cliente"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { estado } = body as { estado?: string };

  if (!estado || !ESTADOS_VALIDOS.includes(estado)) {
    return NextResponse.json(
      { error: `estado debe ser uno de: ${ESTADOS_VALIDOS.join(", ")}` },
      { status: 400 }
    );
  }

  try {
    const lead = await prisma.lead.update({
      where: { id },
      data: { estado },
    });
    return NextResponse.json({ lead });
  } catch {
    return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
  }
}
