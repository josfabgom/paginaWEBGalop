import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { items } = await req.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ success: false, error: "Invalid data format" }, { status: 400 });
    }

    // Replace all items
    await prisma.catalogItem.deleteMany();
    await prisma.catalogItem.createMany({
      data: items.map((item: any) => ({
        codigo: item.codigo || item.id || Math.random().toString(36).substring(7),
        descripcion: item.descripcion,
        categoria: item.categoria,
        precio: item.precio || "Consultar",
        foto1: item.foto1 || null,
      })),
    });

    return NextResponse.json({ success: true, count: items.length });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
