"use client";

import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
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
 * Vacantes guardadas [MAQUETA]. Muestra las vacantes de ejemplo marcadas como
 * guardadas. Sin edad ni campos demográficos.
 */
export default function Guardados() {
  const guardadas = VACANTES_EJEMPLO.filter((vacante) => vacante.guardada);

  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />
      <h1 className="text-2xl font-bold text-texto">Vacantes guardadas</h1>

      {guardadas.length === 0 ? (
        <EstadoVacio
          titulo="Aún no has guardado vacantes"
          mensaje="Guarda las vacantes que te interesen para verlas aquí."
          icono="🔖"
          accion={
            <Boton href="/inicio" anchoCompleto tamano="lg">
              Buscar vacantes
            </Boton>
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {guardadas.map((vacante) => (
            <li key={vacante.id}>
              <Tarjeta comoBoton href={`/vacantes/${vacante.id}`}>
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-bold text-texto">
                    {vacante.titulo}
                  </h2>
                  <p className="text-base text-texto-suave">
                    {vacante.empresa} · {vacante.ubicacion}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Chip>{ETIQUETA_MODALIDAD[vacante.modalidad]}</Chip>
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
