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

    const data = await req.json();
    
    let settings = await prisma.catalogSetting.findFirst();
    if (settings) {
        settings = await prisma.catalogSetting.update({
            where: { id: settings.id },
            data: {
                vendedorNombre: data.vendedorNombre,
                vendedorRol: data.vendedorRol,
                vendedorPhone: data.vendedorPhone,
                categoriaInicial: data.categoriaInicial
            }
        });
    } else {
        settings = await prisma.catalogSetting.create({
            data: {
                vendedorNombre: data.vendedorNombre,
                vendedorRol: data.vendedorRol,
                vendedorPhone: data.vendedorPhone,
                categoriaInicial: data.categoriaInicial
            }
        });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
