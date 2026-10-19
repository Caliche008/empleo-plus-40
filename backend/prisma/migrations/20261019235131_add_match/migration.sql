-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "vacanteId" TEXT NOT NULL,
    "puntaje" INTEGER NOT NULL,
    "desglose" JSONB NOT NULL,
    "cubiertos" TEXT[],
    "brechas" JSONB NOT NULL,
    "recomendacion" TEXT NOT NULL,
    "explicacion" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Match_candidatoId_idx" ON "Match"("candidatoId");

-- CreateIndex
CREATE INDEX "Match_vacanteId_idx" ON "Match"("vacanteId");

-- Columna vectorial de PREPARACIÓN para búsquedas semánticas futuras. NULLable
-- (sin NOT NULL): en esta fase siempre queda NULL; el cálculo compara vectores
-- en memoria y no persiste ningún embedding. Administrada con SQL crudo porque
-- Prisma no tiene un tipo escalar nativo `vector`.
ALTER TABLE "Match" ADD COLUMN "embedding" vector(768);
