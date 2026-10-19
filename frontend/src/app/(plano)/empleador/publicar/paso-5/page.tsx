"use client";

import { useState } from "react";
import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
import { Chip } from "@/components/chip";
import { PantallaExito } from "@/components/pantalla-exito";
import { Paso } from "@/components/paso";
import { Tarjeta } from "@/components/tarjeta";
import {
  PASOS_EMPLEADOR,
  TOTAL_PASOS_EMPLEADOR,
  VACANTE_EMPLEADOR_EJEMPLO,
} from "@/lib/mock/empleador";

const PASO = PASOS_EMPLEADOR[4];

/**
 * Asistente del empleador, paso 5 [MAQUETA]: revisar y publicar. Muestra la
 * vacante de ejemplo y, al "publicar", una pantalla de éxito. No hay backend de
 * empleador: la publicación es solo visual. Client Component para alternar el
 * estado de confirmación.
 */
export default function PasoEmpleador5() {
  const [publicada, setPublicada] = useState(false);
  const vacante = VACANTE_EMPLEADOR_EJEMPLO;

  if (publicada) {
    return (
      <section className="flex flex-col gap-6">
        <AvisoDemo />
        <PantallaExito
          titulo="¡Vacante publicada!"
          mensaje="Tu vacante de ejemplo quedó lista. En esta demostración no se guarda en ningún servidor."
          acciones={
            <Boton href="/inicio" tamano="lg" anchoCompleto>
              Ir al inicio
            </Boton>
          }
        />
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />
      <Paso
        actual={PASO.numero}
        total={TOTAL_PASOS_EMPLEADOR}
        titulo={PASO.titulo}
        subtitulo={PASO.subtitulo}
      />

      <Tarjeta>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-texto">{vacante.titulo}</h2>
          <p className="text-base text-texto-suave">
            {vacante.empresa} · {vacante.ubicacion}
          </p>
          <dl className="flex flex-col gap-2 text-base">
            <div className="flex justify-between gap-2">
              <dt className="text-texto-suave">Modalidad</dt>
              <dd className="text-texto">{vacante.modalidad}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-texto-suave">Salario</dt>
              <dd className="text-texto">{vacante.salario}</dd>
            </div>
          </dl>
          <div className="flex flex-col gap-2">
            <span className="text-sm text-texto-suave">
              Competencias requeridas:
            </span>
            <div className="flex flex-wrap gap-2">
              {vacante.competenciasRequeridas.map((c) => (
                <Chip key={c}>{c}</Chip>
              ))}
            </div>
          </div>
        </div>
      </Tarjeta>

      <div className="flex gap-3">
        <Boton href="/empleador/publicar/paso-4" variante="secundario">
          Atrás
        </Boton>
        <Boton
          onClick={() => setPublicada(true)}
          tamano="lg"
          anchoCompleto
        >
          Publicar vacante
        </Boton>
      </div>
    </section>
  );
}
