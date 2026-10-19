"use client";

import { Suspense, use, useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/boton";
import { BandaError } from "@/components/banda-error";
import { Spinner } from "@/components/spinner";
import { Tarjeta } from "@/components/tarjeta";
import { ErrorApi } from "@/lib/api/cliente";
import { eliminarPerfil } from "@/lib/api/perfil";
import { CLAVE_PERFIL_ID } from "@/lib/puente-perfil";

/**
 * Eliminar perfil [CONECTADA]. El `id` llega por la URL (dato de runtime), asI
 * que el contenido que lo consume va dentro de <Suspense> para que el shell se
 * prerenderice con Cache Components y el resto entre por streaming.
 */
export default function EliminarPerfil({
  params,
}: PageProps<"/perfil/[id]/eliminar">) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner tamano={32} />
        </div>
      }
    >
      <Contenido params={params} />
    </Suspense>
  );
}

/**
 * Confirmacion explicita en un solo paso (R6): la persona debe pulsar
 * "Eliminar" (boton variante peligro). Al eliminar borra el id del puente
 * provisional y vuelve a /perfil (que mostrara EstadoVacio).
 */
function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmar() {
    setEliminando(true);
    setError(null);
    try {
      await eliminarPerfil(id);
      // Limpia el id del puente para que /perfil muestre el estado vacio.
      sessionStorage.removeItem(CLAVE_PERFIL_ID);
      router.push("/perfil");
    } catch (fallo) {
      setEliminando(false);
      const api = fallo instanceof ErrorApi ? fallo : null;
      // Un 404 significa que ya no existe: tambien limpiamos y volvemos.
      if (api?.estado === 404) {
        sessionStorage.removeItem(CLAVE_PERFIL_ID);
        router.push("/perfil");
        return;
      }
      setError(
        api?.message ?? "Ocurrió un error. Inténtalo de nuevo en un momento.",
      );
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-texto">Eliminar mi perfil</h1>

      <Tarjeta>
        <div className="flex flex-col gap-3">
          <p className="text-base text-texto">
            Vas a eliminar tu perfil y toda su información. Esta acción no se
            puede deshacer.
          </p>
          <p className="text-base text-texto-suave">
            Si cambias de opinión, puedes volver sin eliminar nada.
          </p>
        </div>
      </Tarjeta>

      {error && <BandaError mensaje={error} />}

      <div className="flex flex-col gap-3">
        <Boton
          onClick={confirmar}
          variante="peligro"
          cargando={eliminando}
          anchoCompleto
          tamano="lg"
        >
          Sí, eliminar mi perfil
        </Boton>
        <Boton href="/perfil" variante="secundario" anchoCompleto>
          Cancelar
        </Boton>
      </div>
    </section>
  );
}
