"use client";

import { Suspense, use, useState } from "react";
import { useRouter } from "next/navigation";
import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
import { CampoTexto } from "@/components/campo-texto";
import { EstadoVacio } from "@/components/estado-vacio";
import { Tarjeta } from "@/components/tarjeta";
import { obtenerVacanteEjemplo } from "@/lib/mock/vacantes";

/**
 * Aplicar a vacante [MAQUETA]. El id llega por la URL (use(params) dentro de
 * <Suspense>). Es solo visual: valida un mensaje opcional en el cliente y navega
 * a la pantalla de éxito, SIN llamar a ningún backend.
 */
export default function AplicarVacante({
  params,
}: PageProps<"/vacantes/[id]/aplicar">) {
  return (
    <Suspense fallback={null}>
      <Contenido params={params} />
    </Suspense>
  );
}

function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const vacante = obtenerVacanteEjemplo(id);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

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

  function enviar() {
    // Maqueta: no hay backend de postulación; simulamos el envío y navegamos.
    setEnviando(true);
    router.push(`/vacantes/${id}/aplicar/exito`);
  }

  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-texto">Aplicar a la vacante</h1>
        <p className="text-base text-texto-suave">
          {vacante.titulo} · {vacante.empresa}
        </p>
      </header>

      <Tarjeta>
        <p className="text-base text-texto">
          Enviaremos tu perfil a la empresa. Puedes añadir un mensaje corto
          contando por qué te interesa el puesto.
        </p>
      </Tarjeta>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <CampoTexto
          id="mensaje"
          etiqueta="Mensaje para la empresa (opcional)"
          valor={mensaje}
          onCambio={setMensaje}
          multilinea
        />
        <Boton tipo="submit" tamano="lg" anchoCompleto cargando={enviando}>
          Enviar postulación
        </Boton>
        <Boton href={`/vacantes/${id}`} variante="secundario">
          Volver a la vacante
        </Boton>
      </form>
    </section>
  );
}
