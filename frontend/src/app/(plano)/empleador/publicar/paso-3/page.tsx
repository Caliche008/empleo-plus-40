import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
import { Paso } from "@/components/paso";
import { CampoMaqueta } from "../campo-maqueta";
import { PASOS_EMPLEADOR, TOTAL_PASOS_EMPLEADOR } from "@/lib/mock/empleador";

const PASO = PASOS_EMPLEADOR[2];

/**
 * Asistente del empleador, paso 3 [MAQUETA]: competencias requeridas. El puesto
 * se describe por competencias, NUNCA por edad ni datos demográficos.
 */
export default function PasoEmpleador3() {
  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />
      <Paso
        actual={PASO.numero}
        total={TOTAL_PASOS_EMPLEADOR}
        titulo={PASO.titulo}
        subtitulo={PASO.subtitulo}
      />

      <p className="text-base text-texto-suave">
        Describe qué sabe hacer la persona ideal. No se puede pedir una edad ni
        datos personales: la selección se basa solo en competencias.
      </p>

      <div className="flex flex-col gap-4">
        <CampoMaqueta
          id="comp-lista"
          etiqueta="Competencias (separadas por coma)"
          multilinea
        />
      </div>

      <div className="flex gap-3">
        <Boton href="/empleador/publicar/paso-2" variante="secundario">
          Atrás
        </Boton>
        <Boton href="/empleador/publicar/paso-4" tamano="lg" anchoCompleto>
          Siguiente
        </Boton>
      </div>
    </section>
  );
}
