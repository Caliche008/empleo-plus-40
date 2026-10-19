import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
import { Paso } from "@/components/paso";
import { CampoMaqueta } from "../campo-maqueta";
import { PASOS_EMPLEADOR, TOTAL_PASOS_EMPLEADOR } from "@/lib/mock/empleador";

const PASO = PASOS_EMPLEADOR[0];

/**
 * Asistente de publicación del empleador, paso 1 [MAQUETA]. Rutas hermanas
 * paso-1..paso-5; cada una enlaza al siguiente. No hay backend de empleador: los
 * campos son solo visuales (deshabilitados).
 */
export default function PasoEmpleador1() {
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
        <CampoMaqueta id="emp-nombre" etiqueta="Nombre de la empresa" />
        <CampoMaqueta id="emp-sector" etiqueta="Sector" />
      </div>

      <Boton href="/empleador/publicar/paso-2" tamano="lg" anchoCompleto>
        Siguiente
      </Boton>
    </section>
  );
}
