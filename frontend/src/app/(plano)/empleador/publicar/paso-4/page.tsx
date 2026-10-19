import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
import { Paso } from "@/components/paso";
import { CampoMaqueta } from "../campo-maqueta";
import { PASOS_EMPLEADOR, TOTAL_PASOS_EMPLEADOR } from "@/lib/mock/empleador";

const PASO = PASOS_EMPLEADOR[3];

/** Asistente del empleador, paso 4 [MAQUETA]: condiciones del puesto. */
export default function PasoEmpleador4() {
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
        <CampoMaqueta id="cond-jornada" etiqueta="Jornada" />
        <CampoMaqueta id="cond-salario" etiqueta="Salario" />
        <CampoMaqueta id="cond-beneficios" etiqueta="Beneficios" multilinea />
      </div>

      <div className="flex gap-3">
        <Boton href="/empleador/publicar/paso-3" variante="secundario">
          Atrás
        </Boton>
        <Boton href="/empleador/publicar/paso-5" tamano="lg" anchoCompleto>
          Siguiente
        </Boton>
      </div>
    </section>
  );
}
