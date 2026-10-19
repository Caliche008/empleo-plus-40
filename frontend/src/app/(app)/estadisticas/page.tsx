import { AvisoDemo } from "@/components/aviso-demo";
import { Tarjeta } from "@/components/tarjeta";
import { ESTADISTICAS_EJEMPLO } from "@/lib/mock/estadisticas";

/**
 * Estadísticas del candidato [MAQUETA]. Muestra cifras de ejemplo y un "radar"
 * de competencias representado con barras accesibles (sin dependencias de
 * gráficas). Ningún dato usa edad ni campos demográficos. Server Component.
 */
export default function Estadisticas() {
  const datos = ESTADISTICAS_EJEMPLO;

  const resumen = [
    { etiqueta: "Postulaciones enviadas", valor: datos.postulacionesEnviadas },
    { etiqueta: "Vacantes vistas", valor: datos.vacantesVistas },
    { etiqueta: "Entrevistas", valor: datos.entrevistas },
  ];

  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />
      <h1 className="text-2xl font-bold text-texto">Tus estadísticas</h1>

      <div className="grid grid-cols-3 gap-3">
        {resumen.map((item) => (
          <Tarjeta key={item.etiqueta}>
            <div className="flex flex-col items-center gap-1 text-center">
              <span className="text-3xl font-bold text-texto">
                {item.valor}
              </span>
              <span className="text-sm text-texto-suave">{item.etiqueta}</span>
            </div>
          </Tarjeta>
        ))}
      </div>

      <Tarjeta>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-texto">
            Tus competencias (ejemplo)
          </h2>
          <ul className="flex flex-col gap-3">
            {datos.radarCompetencias.map((eje) => (
              <li key={eje.etiqueta} className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-base text-texto">{eje.etiqueta}</span>
                  <span className="text-sm text-texto-suave">{eje.valor}%</span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={eje.valor}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${eje.etiqueta}: ${eje.valor}%`}
                  className="h-3 w-full overflow-hidden rounded-full bg-superficie-alta"
                >
                  <div
                    className="h-full rounded-full bg-acento"
                    style={{ width: `${eje.valor}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Tarjeta>
    </section>
  );
}
