-- CreateTable
CREATE TABLE "Candidato" (
    "id" TEXT NOT NULL,
    "telefono" TEXT,
    "nombre" TEXT,
    "pais" TEXT NOT NULL DEFAULT 'CO',
    "consentimiento" BOOLEAN NOT NULL DEFAULT false,
    "mostrarFechasAntiguas" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObjetivoLaboral" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "rol" TEXT NOT NULL,
    "sector" TEXT,
    "salarioMin" INTEGER,
    "modalidad" TEXT,
    "ubicacion" TEXT,
    "disponibilidad" TEXT,

    CONSTRAINT "ObjetivoLaboral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experiencia" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "empresa" TEXT,
    "descripcion" TEXT NOT NULL,
    "logros" TEXT[],
    "desde" TEXT,
    "hasta" TEXT,

    CONSTRAINT "Experiencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Habilidad" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nivel" TEXT,

    CONSTRAINT "Habilidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificacion" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "emisor" TEXT,
    "anio" TEXT,

    CONSTRAINT "Certificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Idioma" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "idioma" TEXT NOT NULL,
    "nivel" TEXT,

    CONSTRAINT "Idioma_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidato_telefono_key" ON "Candidato"("telefono");

-- CreateIndex
CREATE UNIQUE INDEX "ObjetivoLaboral_candidatoId_key" ON "ObjetivoLaboral"("candidatoId");

-- AddForeignKey
ALTER TABLE "ObjetivoLaboral" ADD CONSTRAINT "ObjetivoLaboral_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experiencia" ADD CONSTRAINT "Experiencia_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Habilidad" ADD CONSTRAINT "Habilidad_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificacion" ADD CONSTRAINT "Certificacion_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idioma" ADD CONSTRAINT "Idioma_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_candidatoId_fkey" FOREIGN KEY ("candidatoId") REFERENCES "Candidato"("id") ON DELETE CASCADE ON UPDATE CASCADE;
