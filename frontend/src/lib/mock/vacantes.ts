/**
 * Datos de EJEMPLO (maqueta) para las pantallas de vacantes. No salen del
 * cliente ni se envian al backend: son provisionales para construir la cascara
 * visual. Cada objeto lleva `esEjemplo: true` y las pantallas que los usan
 * muestran <AvisoDemo/>.
 *
 * COMPLIANCE: ninguna vacante declara edad ni ningun campo demografico. El
 * "match" se calcula SOLO comparando `competenciasRequeridas` con las
 * habilidades declaradas del perfil (ver `calcularCoincidencia`); nunca con
 * edad, nombre ni genero.
 */

export type ModalidadVacante = "presencial" | "hibrido" | "remoto";

export interface VacanteMock {
  id: string;
  titulo: string;
  empresa: string;
  ubicacion: string;
  modalidad: ModalidadVacante;
  descripcion: string;
  /** Competencias que pide la vacante; base del match (solo strings). */
  competenciasRequeridas: string[];
  guardada: boolean;
  /** Marcador visible de que es un dato provisional de demostracion. */
  esEjemplo: true;
}

export const VACANTES_EJEMPLO: VacanteMock[] = [
  {
    id: "vac-001",
    titulo: "Auxiliar administrativo",
    empresa: "Distribuidora El Roble",
    ubicacion: "Bogotá, Colombia",
    modalidad: "presencial",
    descripcion:
      "Apoyo a la gestión documental, atención telefónica y organización de " +
      "archivos. Buscamos a alguien ordenado y con trato amable.",
    competenciasRequeridas: ["Atención al cliente", "Organización", "Excel"],
    guardada: false,
    esEjemplo: true,
  },
  {
    id: "vac-002",
    titulo: "Asesor comercial",
    empresa: "Seguros Confianza",
    ubicacion: "Medellín, Colombia",
    modalidad: "hibrido",
    descripcion:
      "Asesoría a clientes sobre pólizas, seguimiento de cartera y cierre de " +
      "ventas. Valoramos la experiencia en trato con personas.",
    competenciasRequeridas: ["Ventas", "Atención al cliente", "Negociación"],
    guardada: true,
    esEjemplo: true,
  },
  {
    id: "vac-003",
    titulo: "Operario de bodega",
    empresa: "Logística Andina",
    ubicacion: "Cali, Colombia",
    modalidad: "presencial",
    descripcion:
      "Recepción, almacenamiento y despacho de mercancía. Importa la " +
      "responsabilidad y el cuidado en el manejo de inventario.",
    competenciasRequeridas: ["Manejo de inventario", "Trabajo en equipo"],
    guardada: false,
    esEjemplo: true,
  },
  {
    id: "vac-004",
    titulo: "Recepcionista",
    empresa: "Clínica Santa Clara",
    ubicacion: "Barranquilla, Colombia",
    modalidad: "presencial",
    descripcion:
      "Recibir a pacientes, agendar citas y coordinar la agenda médica. " +
      "Buscamos amabilidad y buena comunicación.",
    competenciasRequeridas: ["Atención al cliente", "Agenda", "Comunicación"],
    guardada: false,
    esEjemplo: true,
  },
  {
    id: "vac-005",
    titulo: "Soporte técnico remoto",
    empresa: "RedPunto",
    ubicacion: "Remoto (Colombia)",
    modalidad: "remoto",
    descripcion:
      "Atención a usuarios por chat y teléfono, resolución de incidencias " +
      "básicas y registro de casos. Formación a cargo de la empresa.",
    competenciasRequeridas: ["Atención al cliente", "Informática", "Paciencia"],
    guardada: true,
    esEjemplo: true,
  },
];

/** Devuelve una vacante de ejemplo por id, o undefined si no existe. */
export function obtenerVacanteEjemplo(id: string): VacanteMock | undefined {
  return VACANTES_EJEMPLO.find((vacante) => vacante.id === id);
}

/**
 * Coincidencia de competencias (maqueta). SOLO compara las competencias que pide
 * la vacante con las habilidades declaradas (strings), sin distinguir mayusculas
 * ni espacios. NUNCA usa edad, nombre ni genero. Es una estimacion de
 * demostracion, no una puntuacion real.
 */
export interface Coincidencia {
  /** Porcentaje 0..100 de competencias cubiertas. */
  porcentaje: number;
  /** Competencias de la vacante que la persona ya declara. */
  cubiertas: string[];
  /** Competencias de la vacante que faltan. */
  faltantes: string[];
}

function normalizar(texto: string): string {
  return texto.trim().toLowerCase();
}

export function calcularCoincidencia(
  competenciasRequeridas: string[],
  habilidadesDeclaradas: string[],
): Coincidencia {
  const declaradas = new Set(habilidadesDeclaradas.map(normalizar));
  const cubiertas: string[] = [];
  const faltantes: string[] = [];

  for (const competencia of competenciasRequeridas) {
    if (declaradas.has(normalizar(competencia))) {
      cubiertas.push(competencia);
    } else {
      faltantes.push(competencia);
    }
  }

  const total = competenciasRequeridas.length;
  const porcentaje =
    total === 0 ? 0 : Math.round((cubiertas.length / total) * 100);

  return { porcentaje, cubiertas, faltantes };
}
