import { normalizar } from './normalizar.js';
import type { EntradaMatch, Modalidad } from '../tipos.js';

/**
 * Proyección anti-sesgo. Recibe el perfil y la vacante y produce `EntradaMatch`,
 * copiando SOLO datos permitidos. Nunca copia nombre, teléfono, fechas
 * (`desde`/`hasta`) ni año de certificación: el tipo de salida hace imposible
 * colar edad/nombre/género al cálculo (compliance §2, R2).
 *
 * Los parámetros se tipan de forma estructural (no se importa el cliente Prisma)
 * para mantener el motor PURO y trivialmente testeable.
 */

/** Forma mínima de una experiencia que el cálculo puede ver. */
export interface ExperienciaEntrada {
  cargo: string;
  descripcion: string;
  logros: string[];
}

/** Forma mínima del perfil (Candidato con sus relaciones) que se proyecta. */
export interface PerfilEntrada {
  habilidades: { nombre: string }[];
  experiencias: ExperienciaEntrada[];
  objetivo?: {
    sector?: string | null;
    ubicacion?: string | null;
    salarioMin?: number | null;
    modalidad?: string | null;
  } | null;
}

/** Forma mínima de la vacante analizada que se proyecta. */
export interface VacanteEntrada {
  obligatorios: string[];
  deseables: string[];
  habilidades: string[];
  experienciaPedida?: string | null;
  cargo: string;
  ubicacion?: string | null;
  salario?: string | null;
  modalidad?: string | null;
}

/** Separador entre los campos de una experiencia al construir su texto. */
const SEPARADOR_EXPERIENCIA = ' ';

/**
 * Sanea una modalidad en texto libre a la unión cerrada. Usa `normalizar` para
 * tolerar tildes/mayúsculas ("Híbrido" → "hibrido"). Valor no reconocido →
 * `undefined` (no inventa modalidad).
 */
export function sanearModalidad(texto?: string | null): Modalidad | undefined {
  if (!texto) {
    return undefined;
  }
  const terminos = normalizar(texto);
  if (terminos.includes('remoto') || terminos.includes('teletrabajo')) {
    return 'remoto';
  }
  if (terminos.includes('hibrido') || terminos.includes('mixto')) {
    return 'hibrido';
  }
  if (terminos.includes('presencial')) {
    return 'presencial';
  }
  return undefined;
}

/** Convierte una experiencia en un único texto: cargo + descripción + logros. */
function textoExperiencia(exp: ExperienciaEntrada): string {
  return [exp.cargo, exp.descripcion, ...exp.logros]
    .filter((parte) => parte && parte.trim().length > 0)
    .join(SEPARADOR_EXPERIENCIA);
}

export function proyectarEntrada(perfil: PerfilEntrada, vacante: VacanteEntrada): EntradaMatch {
  return {
    perfil: {
      habilidades: perfil.habilidades.map((h) => h.nombre),
      experiencia: perfil.experiencias.map(textoExperiencia),
      sector: perfil.objetivo?.sector ?? undefined,
      ubicacion: perfil.objetivo?.ubicacion ?? undefined,
      salarioMin: perfil.objetivo?.salarioMin ?? undefined,
      modalidad: sanearModalidad(perfil.objetivo?.modalidad),
    },
    vacante: {
      obligatorios: vacante.obligatorios,
      deseables: vacante.deseables,
      habilidades: vacante.habilidades,
      experienciaPedida: vacante.experienciaPedida ?? undefined,
      cargo: vacante.cargo,
      ubicacion: vacante.ubicacion ?? undefined,
      salario: vacante.salario ?? undefined,
      modalidad: sanearModalidad(vacante.modalidad),
    },
  };
}
