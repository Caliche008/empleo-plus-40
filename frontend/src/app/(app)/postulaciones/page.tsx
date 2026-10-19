import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
import { Chip } from "@/components/chip";
import { EstadoVacio } from "@/components/estado-vacio";
import { Tarjeta } from "@/components/tarjeta";
import {
  ETIQUETA_ESTADO,
  POSTULACIONES_EJEMPLO,
} from "@/lib/mock/postulaciones";

// Formatea una fecha ISO (yyyy-mm-dd) a texto legible en español.
function formatearFecha(iso: string): string {
  const fecha = new Date(`${iso}T00:00:00`);
  return fecha.toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Mis postulaciones [MAQUETA]. Lista las postulaciones de ejemplo con su estado.
 * Es un Server Component: solo muestra datos de ejemplo, sin estado ni eventos.
 */
export default function Postulaciones() {
  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />
      <h1 className="text-2xl font-bold text-texto">Mis postulaciones</h1>

      {POSTULACIONES_EJEMPLO.length === 0 ? (
        <EstadoVacio
          titulo="Aún no te has postulado"
          mensaje="Cuando apliques a una vacante, la verás aquí."
          icono="📨"
          accion={
            <Boton href="/inicio" anchoCompleto tamano="lg">
              Buscar vacantes
            </Boton>
          }
        />
      ) : (
        <ul className="flex flex-col gap-4">
          {POSTULACIONES_EJEMPLO.map((postulacion) => (
            <li key={postulacion.id}>
              <Tarjeta>
                <div className="flex flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <h2 className="text-xl font-bold text-texto">
                      {postulacion.vacanteTitulo}
                    </h2>
                    <Chip activo>{ETIQUETA_ESTADO[postulacion.estado]}</Chip>
                  </div>
                  <p className="text-base text-texto-suave">
                    {postulacion.empresa}
                  </p>
                  <p className="text-sm text-texto-suave">
                    Enviada el {formatearFecha(postulacion.fecha)}
                  </p>
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
