// src/lib/prisma.ts
import { PrismaClient } from '../generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool, neonConfig } from '@neondatabase/serverless'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function getPrismaClient(): PrismaClient {
  // Get DATABASE_URL at runtime, not at module load time
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set. Please check your Vercel environment variables.')
  }

  // Configure Neon for Node.js serverless environments
  // WebSocket is only needed for certain connection types
  // In serverless environments like Vercel, this may not be necessary
  if (typeof window === 'undefined' && typeof process !== 'undefined') {
    try {
      // Dynamically import ws only if available and needed
      const ws = require('ws')
      if (ws && typeof ws !== 'undefined') {
        neonConfig.webSocketConstructor = ws
      }
    } catch (error) {
      // WebSocket configuration is optional for serverless environments
      // Neon will use HTTP fetch API as fallback
    }
  }

  // Create the Neon pool and adapter
  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool as any)

  return new PrismaClient({ adapter })
}

const prisma = globalForPrisma.prisma || getPrismaClient()

if (process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = prisma
}

export default prisma
