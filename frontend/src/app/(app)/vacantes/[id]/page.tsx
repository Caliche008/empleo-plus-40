"use client";

import { Suspense, use } from "react";
import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
import { Chip } from "@/components/chip";
import { EstadoVacio } from "@/components/estado-vacio";
import { Tarjeta } from "@/components/tarjeta";
import {
  calcularCoincidencia,
  obtenerVacanteEjemplo,
} from "@/lib/mock/vacantes";

const ETIQUETA_MODALIDAD: Record<string, string> = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  remoto: "Remoto",
};

// Competencias declaradas de EJEMPLO (maqueta). En la app real vendrían del
// perfil de la persona; aquí son provisionales. NUNCA incluye edad ni datos
// demográficos: el match SOLO compara competencias.
const COMPETENCIAS_DECLARADAS_EJEMPLO = [
  "Atención al cliente",
  "Organización",
  "Trabajo en equipo",
];

/**
 * Detalle de vacante [MAQUETA]. El id llega por la URL (params es Promise, por
 * eso use(params) va dentro de <Suspense>). La coincidencia se calcula SOLO
 * comparando las competencias requeridas con las competencias declaradas; NUNCA
 * usa edad.
 */
export default function DetalleVacante({ params }: PageProps<"/vacantes/[id]">) {
  return (
    <Suspense fallback={null}>
      <Contenido params={params} />
    </Suspense>
  );
}

function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const vacante = obtenerVacanteEjemplo(id);

  if (!vacante) {
    return (
      <EstadoVacio
        titulo="No encontramos la vacante"
        mensaje="Es posible que ya no esté disponible."
        accion={
          <Boton href="/inicio" anchoCompleto tamano="lg">
            Ver otras vacantes
          </Boton>
        }
      />
    );
  }

  const coincidencia = calcularCoincidencia(
    vacante.competenciasRequeridas,
    COMPETENCIAS_DECLARADAS_EJEMPLO,
  );

  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />

      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-texto">{vacante.titulo}</h1>
        <p className="text-base text-texto-suave">
          {vacante.empresa} · {vacante.ubicacion}
        </p>
        <div className="flex flex-wrap gap-2">
          <Chip>{ETIQUETA_MODALIDAD[vacante.modalidad]}</Chip>
        </div>
      </header>

      <Tarjeta>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-texto">
            Coincidencia de competencias
          </h2>
          <p className="text-sm text-texto-suave">
            Estimación de demostración basada solo en tus competencias
            declaradas. No tiene en cuenta tu edad ni ningún otro dato personal.
          </p>
          <div
            role="progressbar"
            aria-valuenow={coincidencia.porcentaje}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Coincidencia de competencias: ${coincidencia.porcentaje}%`}
            className="h-3 w-full overflow-hidden rounded-full bg-superficie-alta"
          >
            <div
              className="h-full rounded-full bg-acento"
              style={{ width: `${coincidencia.porcentaje}%` }}
            />
          </div>
          <p className="text-base font-bold text-texto">
            {coincidencia.porcentaje}% de las competencias
          </p>

          {coincidencia.cubiertas.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-texto-suave">Ya tienes:</span>
              <div className="flex flex-wrap gap-2">
                {coincidencia.cubiertas.map((c) => (
                  <Chip key={c} activo>
                    {c}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {coincidencia.faltantes.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-sm text-texto-suave">Te faltaría:</span>
              <div className="flex flex-wrap gap-2">
                {coincidencia.faltantes.map((c) => (
                  <Chip key={c}>{c}</Chip>
                ))}
              </div>
            </div>
          )}
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-bold text-texto">Descripción</h2>
          <p className="text-base text-texto">{vacante.descripcion}</p>
        </div>
      </Tarjeta>

      <Boton href={`/vacantes/${vacante.id}/aplicar`} tamano="lg" anchoCompleto>
        Aplicar a esta vacante
      </Boton>
    </section>
  );
}
