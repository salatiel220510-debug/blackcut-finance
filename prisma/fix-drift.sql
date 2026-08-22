ALTER TABLE "ServiceType" DROP COLUMN IF EXISTS "durationMinutes";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20260805035337_add_service_duration';