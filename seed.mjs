import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  const data = JSON.parse(fs.readFileSync('./productos.json', 'utf8'));
  console.log('Loading ' + data.length + ' products...');
  
  await prisma.catalogItem.deleteMany();
  
  for (const item of data) {
      await prisma.catalogItem.create({
          data: {
              codigo: item.codigo || Math.random().toString(36).substring(7),
              descripcion: item.descripcion,
              categoria: item.categoria,
              precio: item.precio || 'Consultar',
              foto1: item.foto1 || null
          }
      });
  }
  console.log('Done!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
