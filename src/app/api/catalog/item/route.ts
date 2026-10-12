import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";

const prisma = new PrismaClient();

// Create or Update
export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    
    // Si manda un id existente, actualiza
    if (data.id) {
        const item = await prisma.catalogItem.update({
            where: { id: data.id },
            data: {
                codigo: data.codigo,
                descripcion: data.descripcion,
                categoria: data.categoria,
                precio: data.precio || "Consultar",
                foto1: data.foto1 || null,
                esOferta: Boolean(data.esOferta),
                textoOferta: data.textoOferta || (data.esOferta ? "🔥 OFERTA" : null)
            }
        });
        return NextResponse.json({ success: true, item });
    } else {
        // Sino, crea
        const item = await prisma.catalogItem.create({
            data: {
                codigo: data.codigo || Math.random().toString(36).substring(7),
                descripcion: data.descripcion,
                categoria: data.categoria,
                precio: data.precio || "Consultar",
                foto1: data.foto1 || null,
                esOferta: Boolean(data.esOferta),
                textoOferta: data.textoOferta || (data.esOferta ? "🔥 OFERTA" : null)
            }
        });
        return NextResponse.json({ success: true, item });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}

// Delete
export async function DELETE(req: Request) {
    try {
        const session = await getServerSession();
        if (!session) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ success: false, error: "ID required" }, { status: 400 });

        await prisma.catalogItem.delete({
            where: { id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
