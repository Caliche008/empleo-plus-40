"use client";

import { useMemo, useState } from "react";
import { AvisoDemo } from "@/components/aviso-demo";
import { CampoTexto } from "@/components/campo-texto";
import { Chip } from "@/components/chip";
import { EstadoVacio } from "@/components/estado-vacio";
import { Tarjeta } from "@/components/tarjeta";
import { VACANTES_EJEMPLO } from "@/lib/mock/vacantes";

const ETIQUETA_MODALIDAD: Record<string, string> = {
  presencial: "Presencial",
  hibrido: "Híbrido",
  remoto: "Remoto",
};

/**
 * Inicio / buscar vacantes [MAQUETA]. Lista las vacantes de ejemplo y permite
 * filtrarlas por texto (título, empresa o competencia). El filtro NO usa edad ni
 * ningún campo demográfico.
 */
export default function Inicio() {
  const [busqueda, setBusqueda] = useState("");

  const resultados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (texto.length === 0) {
      return VACANTES_EJEMPLO;
    }
    return VACANTES_EJEMPLO.filter((vacante) => {
      const campos = [
        vacante.titulo,
        vacante.empresa,
        vacante.ubicacion,
        ...vacante.competenciasRequeridas,
      ]
        .join(" ")
        .toLowerCase();
      return campos.includes(texto);
    });
  }, [busqueda]);

  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />
      <h1 className="text-2xl font-bold text-texto">Vacantes para ti</h1>

      <CampoTexto
        id="buscar"
        etiqueta="Buscar por puesto, empresa o competencia"
        valor={busqueda}
        onCambio={setBusqueda}
      />

      {resultados.length === 0 ? (
        <EstadoVacio
          titulo="No encontramos vacantes"
          mensaje="Prueba con otra palabra de búsqueda."
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {resultados.map((vacante) => (
            <li key={vacante.id}>
              <Tarjeta comoBoton href={`/vacantes/${vacante.id}`}>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xl font-bold text-texto">
                      {vacante.titulo}
                    </h2>
                    {vacante.guardada && (
                      <span
                        className="text-sm text-texto-suave"
                        aria-label="Vacante guardada"
                      >
                        🔖
                      </span>
                    )}
                  </div>
                  <p className="text-base text-texto-suave">
                    {vacante.empresa} · {vacante.ubicacion}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Chip>{ETIQUETA_MODALIDAD[vacante.modalidad]}</Chip>
                    {vacante.competenciasRequeridas.slice(0, 2).map((c) => (
                      <Chip key={c}>{c}</Chip>
                    ))}
                  </div>
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
