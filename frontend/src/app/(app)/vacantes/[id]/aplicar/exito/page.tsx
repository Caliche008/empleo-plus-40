"use client";

import { Suspense, use } from "react";
import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
import { PantallaExito } from "@/components/pantalla-exito";

/**
 * Confirmación de postulación [MAQUETA]. Muestra "¡Felicitaciones!" con
 * PantallaExito. El id llega por la URL (use(params) dentro de <Suspense>).
 * No llama a ningún backend.
 */
export default function ExitoAplicar({
  params,
}: PageProps<"/vacantes/[id]/aplicar/exito">) {
  return (
    <Suspense fallback={null}>
      <Contenido params={params} />
    </Suspense>
  );
}

function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />
      <PantallaExito
        titulo="¡Felicitaciones!"
        mensaje="Enviaste tu postulación. La empresa recibirá tu perfil y te avisaremos de cualquier novedad."
        acciones={
          <>
            <Boton href="/postulaciones" tamano="lg" anchoCompleto>
              Ver mis postulaciones
            </Boton>
            <Boton href={`/vacantes/${id}`} variante="secundario">
              Volver a la vacante
            </Boton>
            <Boton href="/inicio" variante="fantasma">
              Buscar más vacantes
            </Boton>
          </>
        }
      />
    </section>
  );
}
