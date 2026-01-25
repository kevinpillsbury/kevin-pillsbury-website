// src/lib/prisma.ts
import { PrismaClient } from '../generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'
import ws from 'ws'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient(): PrismaClient {
  // Get DATABASE_URL at runtime, not at module load time
  const connectionString = process.env.DATABASE_URL

  console.log('DATABASE_URL:', connectionString);

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your Vercel environment variables.')
  }

  // Configure Neon for Node.js serverless environments
  if (process.env.NODE_ENV === 'production') {
    neonConfig.webSocketConstructor = ws
  }

  // Create the Neon pool and adapter
  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool as any)

  return new PrismaClient({ adapter })
}

const prisma = globalForPrisma.prisma || getPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma