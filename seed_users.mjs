import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const pwd1 = await bcrypt.hash('galop2026', 10);
  await prisma.user.upsert({
      where: { email: 'gerencia@galopsrl.com.ar' },
      update: { passwordHash: pwd1, role: 'ADMIN' },
      create: { name: 'Gerencia GaLop', email: 'gerencia@galopsrl.com.ar', passwordHash: pwd1, role: 'ADMIN' }
  });

  const pwd2 = await bcrypt.hash('catalogo2026', 10);
  await prisma.user.upsert({
      where: { email: 'catalogo@galopsrl.com.ar' },
      update: { passwordHash: pwd2, role: 'CLIENT' },
      create: { name: 'Editor de Catalogo', email: 'catalogo@galopsrl.com.ar', passwordHash: pwd2, role: 'CLIENT' }
  });

  console.log('Usuarios creados!');
}
main().catch(console.error).finally(() => prisma.$disconnect());
