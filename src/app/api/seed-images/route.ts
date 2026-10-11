import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const IMAGENES_INCRUSTADAS: Record<string, string> = {
  "10011": "/assets/images/10011.jpeg",
  "10040": "/assets/images/10040.jpeg",
  "10041": "/assets/images/10041.jpeg",
  "10043": "/assets/images/10043.jpeg",
  "10063": "/assets/images/10063.jpeg",
  "10072": "/assets/images/10072.jpeg",
  "10078": "/assets/images/10078.jpeg",
  "10235": "/assets/images/10235.jpeg",
  "10236": "/assets/images/10236.jpeg",
  "10280": "/assets/images/10280.jpeg",
  "10333": "/assets/images/10333.jpeg",
  "10334": "/assets/images/10334.jpeg",
  "10335": "/assets/images/10335.jpeg",
  "10336": "/assets/images/10336.jpeg",
  "10341": "/assets/images/10341.jpeg",
  "10345": "/assets/images/10345.jpeg",
  "10346": "/assets/images/10346.jpeg",
  "10347": "/assets/images/10347.jpeg",
  "10348": "/assets/images/10348.jpeg",
  "10349": "/assets/images/10349.jpeg",
  "10351": "/assets/images/10351.jpeg",
  "10352": "/assets/images/10352.jpeg",
  "10353": "/assets/images/10353.jpeg",
  "10363": "/assets/images/10363.jpeg",
  "10383": "/assets/images/10383.jpeg"
};

export async function GET() {
    for (const [codigo, url] of Object.entries(IMAGENES_INCRUSTADAS)) {
        try {
            await prisma.catalogItem.updateMany({
                where: { codigo: codigo },
                data: { foto1: url }
            });
        } catch (e) {
            console.error(e);
        }
    }

    return NextResponse.json({ success: true, message: "Imágenes migradas" });
}
