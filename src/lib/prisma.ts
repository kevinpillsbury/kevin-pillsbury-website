// src/lib/prisma.ts
import { PrismaClient } from '../generated/prisma/client'

// Add prisma to the NodeJS global type
interface CustomNodeJsGlobal extends NodeJS.Global {
  prisma: PrismaClient
}

// Prevent multiple instances of Prisma Client in development
declare const global: CustomNodeJsGlobal

const prisma = 
  global.prisma || 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV === 'development') {
  global.prisma = prisma
}

export default prisma
