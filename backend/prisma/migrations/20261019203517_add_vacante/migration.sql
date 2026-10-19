-- CreateTable
CREATE TABLE "Vacante" (
    "id" TEXT NOT NULL,
    "candidatoId" TEXT,
    "cargo" TEXT NOT NULL,
    "textoOriginal" TEXT NOT NULL,
    "obligatorios" TEXT[],
    "deseables" TEXT[],
    "habilidades" TEXT[],
    "experienciaPedida" TEXT,
    "ubicacion" TEXT,
    "modalidad" TEXT,
    "salario" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vacante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alerta" (
    "id" TEXT NOT NULL,
    "vacanteId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "detalle" TEXT NOT NULL,

    CONSTRAINT "Alerta_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Alerta" ADD CONSTRAINT "Alerta_vacanteId_fkey" FOREIGN KEY ("vacanteId") REFERENCES "Vacante"("id") ON DELETE CASCADE ON UPDATE CASCADE;
