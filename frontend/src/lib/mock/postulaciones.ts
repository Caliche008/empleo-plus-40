/**
 * Datos de EJEMPLO (maqueta) para la pantalla de postulaciones. Provisionales,
 * no salen del cliente ni se envian al backend. Cada objeto lleva
 * `esEjemplo: true` y la pantalla que los usa muestra <AvisoDemo/>.
 *
 * COMPLIANCE: ningun dato demografico (sin edad, nombre completo ni genero).
 */

export type EstadoPostulacion = "enviada" | "en-revision" | "entrevista";

export interface PostulacionMock {
  id: string;
  /** Vacante a la que se postuló (titulo + empresa de ejemplo). */
  vacanteTitulo: string;
  empresa: string;
  estado: EstadoPostulacion;
  /** Fecha de ejemplo en formato ISO (solo para mostrar). */
  fecha: string;
  esEjemplo: true;
}

/** Etiqueta legible en español para cada estado. */
export const ETIQUETA_ESTADO: Record<EstadoPostulacion, string> = {
  enviada: "Enviada",
  "en-revision": "En revisión",
  entrevista: "Entrevista",
};

/**
 * Fecha ISO (yyyy-mm-dd) de hace `dias` días respecto a hoy. Las fechas de
 * ejemplo se calculan relativas al momento actual para que la demo siempre se
 * vea reciente y no quede anclada a un año pasado.
 */
function haceDias(dias: number): string {
  const fecha = new Date();
  fecha.setDate(fecha.getDate() - dias);
  return fecha.toISOString().slice(0, 10);
}

export const POSTULACIONES_EJEMPLO: PostulacionMock[] = [
  {
    id: "post-001",
    vacanteTitulo: "Asesor comercial",
    empresa: "Seguros Confianza",
    estado: "en-revision",
    fecha: haceDias(3),
    esEjemplo: true,
  },
  {
    id: "post-002",
    vacanteTitulo: "Auxiliar administrativo",
    empresa: "Distribuidora El Roble",
    estado: "entrevista",
    fecha: haceDias(6),
    esEjemplo: true,
  },
  {
    id: "post-003",
    vacanteTitulo: "Soporte técnico remoto",
    empresa: "RedPunto",
    estado: "enviada",
    fecha: haceDias(1),
    esEjemplo: true,
  },
];
