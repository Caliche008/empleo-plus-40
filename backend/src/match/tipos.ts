/**
 * Tipos del motor de cálculo del match. Son PUROS (sin NestJS, sin Prisma, sin
 * red). NINGÚN tipo contiene edad, nombre, género ni fecha de nacimiento: el
 * cálculo recibe exactamente lo permitido (compliance §2, R2).
 */

/** Modalidad saneada a una unión cerrada (texto libre → una de estas o nada). */
export type Modalidad = 'presencial' | 'hibrido' | 'remoto';

/**
 * Entrada anti-sesgo del cálculo. La proyección (`proyectarEntrada`) garantiza
 * por construcción que aquí no entran datos sensibles.
 */
export interface EntradaMatch {
  perfil: {
    /** Habilidades del candidato (nombres). */
    habilidades: string[];
    /** Experiencia como textos: cargo + descripción + logros, SIN fechas. */
    experiencia: string[];
    /** Sector declarado en el objetivo laboral. */
    sector?: string;
    /** Ubicación deseada. */
    ubicacion?: string;
    /** Salario mínimo pretendido (en la misma unidad que el de la vacante). */
    salarioMin?: number;
    /** Modalidad deseada, saneada. */
    modalidad?: Modalidad;
  };
  vacante: {
    obligatorios: string[];
    deseables: string[];
    habilidades: string[];
    experienciaPedida?: string;
    /** La vacante tiene `cargo` (no tiene `sector`): contra él se compara sector. */
    cargo: string;
    ubicacion?: string;
    /** Salario en texto libre; se intenta parsear a número. */
    salario?: string;
    /** Modalidad de la vacante, saneada. */
    modalidad?: Modalidad;
  };
}

/** Identificador estable de cada criterio del desglose. */
export type CriterioMatch = 'habilidades' | 'experiencia' | 'sector' | 'ubicacion-modalidad' | 'salario';

/** Desglose auditable de cómo se formó el puntaje. */
export interface DesgloseMatch {
  criterios: {
    criterio: CriterioMatch;
    /** Valor 0..1 del criterio. */
    valor: number;
    /** Peso original del criterio. */
    pesoBase: number;
    /** Peso tras la redistribución por datos faltantes. */
    pesoEfectivo: number;
    /** Aporte en puntos (pesoEfectivo × valor), 0..100. */
    aporte: number;
    /** `false` si el dato del criterio faltaba (su peso se redistribuyó). */
    datoPresente: boolean;
  }[];
  /** De dónde salió la similitud semántica. */
  fuenteSemantica: 'embeddings' | 'respaldo';
  /** `true` si al menos un peso se redistribuyó por dato faltante. */
  pesosRedistribuidos: boolean;
}

/** Un requisito de la vacante no cubierto por el perfil. */
export interface BrechaMatch {
  requisito: string;
  /** `true` si el requisito era obligatorio. */
  obligatorio: boolean;
  /** La rellena el LLM en la explicación; el cálculo la deja vacía. */
  sugerencia?: string;
}

/** Recomendación final sobre la postulación. */
export type Recomendacion = 'postular' | 'postular-ajustes' | 'descartar';

/** Resultado completo del motor de cálculo (lo orquesta y persiste FEAT-003). */
export interface ResultadoMatch {
  /** Puntaje entero 0..100. */
  puntaje: number;
  desglose: DesgloseMatch;
  /** Requisitos que el perfil SÍ cubre (explicabilidad, R5). */
  cubiertos: string[];
  brechas: BrechaMatch[];
  recomendacion: Recomendacion;
  /** Razón breve de la recomendación. */
  razon: string;
}
