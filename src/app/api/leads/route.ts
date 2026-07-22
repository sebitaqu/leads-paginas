import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const rubro = searchParams.get("rubro");
  const comuna = searchParams.get("comuna");
  const estado = searchParams.get("estado");

  const leads = await prisma.lead.findMany({
    where: {
      ...(rubro ? { rubro: { contains: rubro } } : {}),
      ...(comuna ? { comuna: { contains: comuna } } : {}),
      ...(estado ? { estado } : {}),
    },
    orderBy: { fechaCreacion: "desc" },
  });

  return NextResponse.json({ leads });
}
