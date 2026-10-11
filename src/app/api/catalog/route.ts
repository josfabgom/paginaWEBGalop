import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const items = await prisma.catalogItem.findMany({
        orderBy: { categoria: 'asc' }
    });
    const settings = await prisma.catalogSetting.findFirst();

    return NextResponse.json({
      success: true,
      items,
      settings: settings || {
        vendedorNombre: "GaLop S.R.L.",
        vendedorRol: "Asesor Comercial",
        vendedorPhone: "5493765224717",
        categoriaInicial: "LIBRERÍA",
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
