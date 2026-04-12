import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { env } from '../config/env.js';

const globalForPrisma = globalThis;

if (!env.databaseUrl) {
  throw new Error('DATABASE_URL is required to initialize PrismaClient.');
}

const adapter = new PrismaMariaDb(env.databaseUrl);

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
