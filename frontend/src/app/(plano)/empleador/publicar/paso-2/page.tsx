import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
import { Paso } from "@/components/paso";
import { CampoMaqueta } from "../campo-maqueta";
import { PASOS_EMPLEADOR, TOTAL_PASOS_EMPLEADOR } from "@/lib/mock/empleador";

const PASO = PASOS_EMPLEADOR[1];

/** Asistente del empleador, paso 2 [MAQUETA]: datos del puesto. */
export default function PasoEmpleador2() {
  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />
      <Paso
        actual={PASO.numero}
        total={TOTAL_PASOS_EMPLEADOR}
        titulo={PASO.titulo}
        subtitulo={PASO.subtitulo}
      />

      <div className="flex flex-col gap-4">
        <CampoMaqueta id="pue-titulo" etiqueta="Título del puesto" />
        <CampoMaqueta id="pue-modalidad" etiqueta="Modalidad" />
        <CampoMaqueta id="pue-ubicacion" etiqueta="Ubicación" />
      </div>

      <div className="flex gap-3">
        <Boton href="/empleador/publicar/paso-1" variante="secundario">
          Atrás
        </Boton>
        <Boton href="/empleador/publicar/paso-3" tamano="lg" anchoCompleto>
          Siguiente
        </Boton>
      </div>
    </section>
  );
}
