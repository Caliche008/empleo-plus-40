/**
 * Datos de EJEMPLO (maqueta) para el asistente de publicación del empleador
 * (5 pasos). Provisionales, no salen del cliente ni existe backend de empleador
 * en esta fase. Las pantallas que los usan muestran <AvisoDemo/>.
 *
 * COMPLIANCE: ninguna plantilla ni campo de ejemplo pide o insinúa la edad del
 * candidato; el perfil de vacante se describe por competencias.
 */

export interface PasoEmpleador {
  /** Numero de paso (1..5). */
  numero: number;
  /** Ruta de la pantalla del paso. */
  ruta: string;
  titulo: string;
  subtitulo: string;
}

export const PASOS_EMPLEADOR: PasoEmpleador[] = [
  {
    numero: 1,
    ruta: "/empleador/publicar/paso-1",
    titulo: "Datos de la empresa",
    subtitulo: "Cuéntanos quién publica la vacante.",
  },
  {
    numero: 2,
    ruta: "/empleador/publicar/paso-2",
    titulo: "Datos del puesto",
    subtitulo: "Título, modalidad y ubicación del trabajo.",
  },
  {
    numero: 3,
    ruta: "/empleador/publicar/paso-3",
    titulo: "Competencias requeridas",
    subtitulo: "Qué sabe hacer la persona ideal (nunca su edad).",
  },
  {
    numero: 4,
    ruta: "/empleador/publicar/paso-4",
    titulo: "Condiciones",
    subtitulo: "Jornada, salario y beneficios.",
  },
  {
    numero: 5,
    ruta: "/empleador/publicar/paso-5",
    titulo: "Revisar y publicar",
    subtitulo: "Confirma que todo está correcto.",
  },
];

export const TOTAL_PASOS_EMPLEADOR = PASOS_EMPLEADOR.length;

/** Vacante de ejemplo que el asistente ayuda a construir (maqueta). */
export interface BorradorVacanteEjemplo {
  empresa: string;
  titulo: string;
  modalidad: string;
  ubicacion: string;
  competenciasRequeridas: string[];
  salario: string;
  esEjemplo: true;
}

export const VACANTE_EMPLEADOR_EJEMPLO: BorradorVacanteEjemplo = {
  empresa: "Distribuidora El Roble",
  titulo: "Auxiliar administrativo",
  modalidad: "Presencial",
  ubicacion: "Bogotá, Colombia",
  competenciasRequeridas: ["Atención al cliente", "Organización", "Excel"],
  salario: "$1.500.000 mensuales",
  esEjemplo: true,
};
