import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import { authOptions } from "../../auth/[...nextauth]/route";

const prisma = new PrismaClient();

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const users = await prisma.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true }
    });
    return NextResponse.json({ success: true, users });
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const data = await req.json();
    
    if (data.id) {
        // Edit
        const updateData: any = {
            name: data.name,
            email: data.email,
            role: data.role
        };
        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }
        const user = await prisma.user.update({
            where: { id: data.id },
            data: updateData
        });
        return NextResponse.json({ success: true });
    } else {
        // Create
        if (!data.password) return NextResponse.json({ success: false, error: "Contraseña requerida" });
        const existing = await prisma.user.findUnique({ where: { email: data.email } });
        if (existing) return NextResponse.json({ success: false, error: "El email ya está en uso" });

        const user = await prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                role: data.role,
                passwordHash: await bcrypt.hash(data.password, 10)
            }
        });
        return NextResponse.json({ success: true });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ success: false, error: "ID req" });

    // Prevent deleting oneself
    if (id === session.user.id) return NextResponse.json({ success: false, error: "No puedes eliminarte a ti mismo" });

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
}
