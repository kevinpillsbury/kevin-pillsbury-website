// src/lib/prisma.ts
import { PrismaClient } from '../generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'
import ws from 'ws'

// Prevent multiple instances of Prisma Client in development
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const connectionString = process.env.DATABASE_URL!

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// Configure Neon for Node.js
if (typeof window === 'undefined') {
  const { neonConfig } = require('@neondatabase/serverless')
  neonConfig.webSocketConstructor = ws
}

const pool = new Pool({ connectionString })
const adapter = new PrismaNeon(pool as any)

const prisma = globalForPrisma.prisma || new PrismaClient({ adapter })

if (process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = prisma
}

export default prisma
