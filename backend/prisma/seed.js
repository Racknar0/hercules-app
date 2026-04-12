import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is required to run the seed.');
}

const adapter = new PrismaMariaDb(process.env.DATABASE_URL);
const prisma = new PrismaClient({ adapter });

const DEFAULT_PASSWORD = 'Hercules123!';

async function upsertUser({ email, fullName, role, passwordHash }) {
  return prisma.user.upsert({
    where: { email },
    update: {
      fullName,
      role,
      passwordHash,
      status: 'ACTIVE',
    },
    create: {
      email,
      fullName,
      role,
      passwordHash,
      status: 'ACTIVE',
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, 12);

  const organization = await prisma.organization.upsert({
    where: { id: 'org_default_hercules_seed' },
    update: {
      name: 'Hercules Demo Organization',
      status: 'ACTIVE',
    },
    create: {
      id: 'org_default_hercules_seed',
      name: 'Hercules Demo Organization',
      status: 'ACTIVE',
    },
  });

  const superAdmin = await upsertUser({
    email: 'superadmin@hercules.local',
    fullName: 'Super Admin',
    role: 'SUPER_ADMIN',
    passwordHash,
  });

  const owner = await upsertUser({
    email: 'owner@hercules.local',
    fullName: 'Organization Owner',
    role: 'OWNER',
    passwordHash,
  });

  const user = await upsertUser({
    email: 'user@hercules.local',
    fullName: 'Regular User',
    role: 'USER',
    passwordHash,
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: owner.id,
      },
    },
    update: {
      role: 'OWNER',
      status: 'ACTIVE',
    },
    create: {
      organizationId: organization.id,
      userId: owner.id,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    update: {
      role: 'MEMBER',
      status: 'ACTIVE',
    },
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: 'MEMBER',
      status: 'ACTIVE',
    },
  });

  console.log('Seed completed.');
  console.log('Demo users (password for all):', DEFAULT_PASSWORD);
  console.log('- superadmin@hercules.local => SUPER_ADMIN');
  console.log('- owner@hercules.local => OWNER');
  console.log('- user@hercules.local => USER');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
