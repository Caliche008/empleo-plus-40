"use client";

import { useEffect, useState } from "react";
import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
import { Tarjeta } from "@/components/tarjeta";
import { leerPerfilId } from "@/lib/puente-perfil";

/**
 * Ajustes [MAQUETA]. La mayoría de controles son de demostración (notificaciones,
 * idioma). El enlace a "Eliminar mi perfil" SÍ es conectado: lleva a
 * /perfil/[id]/eliminar (DELETE real). Lee el id del perfil desde sessionStorage
 * (puente provisional sin auth), por eso es Client Component.
 */
export default function Ajustes() {
  const [perfilId, setPerfilId] = useState<string | null>(null);

  useEffect(() => {
    // Lee el id del perfil confirmado (puente sin auth en sessionStorage).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPerfilId(leerPerfilId());
  }, []);

  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />
      <h1 className="text-2xl font-bold text-texto">Ajustes</h1>

      <Tarjeta>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-texto">Preferencias</h2>
          <p className="text-base text-texto-suave">
            Las notificaciones y el idioma son opciones de demostración en esta
            versión.
          </p>
          <label className="flex items-center justify-between gap-3">
            <span className="text-base text-texto">
              Avisarme de nuevas vacantes
            </span>
            <input
              type="checkbox"
              defaultChecked
              className="h-6 w-6 rounded border-borde focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco"
            />
          </label>
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-texto">Tu perfil</h2>
          <Boton href="/perfil" variante="secundario" anchoCompleto>
            Ver mi perfil
          </Boton>
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-texto">Eliminar mi perfil</h2>
          <p className="text-base text-texto-suave">
            Borra tus datos de forma permanente. Esta acción no se puede
            deshacer.
          </p>
          {perfilId ? (
            <Boton
              href={`/perfil/${encodeURIComponent(perfilId)}/eliminar`}
              variante="peligro"
              anchoCompleto
            >
              Eliminar mi perfil
            </Boton>
          ) : (
            <p className="text-sm text-texto-suave">
              Aún no tienes un perfil guardado que eliminar.
            </p>
          )}
        </div>
      </Tarjeta>
    </section>
  );
}
