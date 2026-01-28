-- Add DEFAULT so id is auto-generated when inserting via raw SQL, Prisma Studio, or other tools.
-- Prisma already uses @default(uuid()) for create(); this ensures the DB also has a default.
ALTER TABLE "Composition" ALTER COLUMN "id" SET DEFAULT gen_random_uuid()::text;
