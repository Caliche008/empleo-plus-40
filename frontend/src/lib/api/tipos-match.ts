/**
 * Tipos de la capa de API del match (compatibilidad candidato ↔ vacante).
 * Reflejan EXACTAMENTE el contrato de los endpoints del backend
 * (`backend/src/match/match.controller.ts`: POST /match y GET /match/:id).
 * La edad/nombre/género NO aparecen en ningún tipo (compliance §2): el match se
 * calcula sobre habilidades/experiencia/sector/ubicación-modalidad/salario,
 * nunca sobre datos de la persona.
 */

/** Criterios de compatibilidad que pondera el motor de match. */
export type CriterioMatch =
  | "habilidades"
  | "experiencia"
  | "sector"
  | "ubicacion-modalidad"
  | "salario";

/** Recomendación final del match, en lenguaje simple y sin alarmismo. */
export type RecomendacionMatch = "postular" | "postular-ajustes" | "descartar";

/** Origen de la señal semántica: embeddings reales o el respaldo determinista. */
export type FuenteSemantica = "embeddings" | "respaldo";

/**
 * Aporte de un criterio al puntaje final. `valor` es la señal normalizada
 * (0..1); `pesoBase` es el peso nominal y `pesoEfectivo` el peso tras una posible
 * redistribución cuando falta un dato; `aporte` es la contribución final.
 */
export interface CriterioDesglose {
  criterio: CriterioMatch;
  valor: number;
  pesoBase: number;
  pesoEfectivo: number;
  aporte: number;
  datoPresente: boolean;
}

/**
 * Desglose del cálculo. `pesosRedistribuidos` indica que al menos un criterio sin
 * dato cedió su peso a los demás; `fuenteSemantica` dice si la similitud vino de
 * embeddings o del respaldo determinista.
 */
export interface DesgloseMatch {
  criterios: CriterioDesglose[];
  fuenteSemantica: FuenteSemantica;
  pesosRedistribuidos: boolean;
}

/**
 * Un requisito que el candidato no cubre. `obligatorio` distingue las brechas que
 * bloquean de las deseables; `sugerencia` (si la IA la dio) propone cómo cerrarla.
 */
export interface BrechaMatch {
  requisito: string;
  obligatorio: boolean;
  sugerencia?: string;
}

/** Comentario de la IA sobre un criterio concreto, en lenguaje simple. */
export interface ComentarioCriterio {
  criterio: string;
  comentario: string;
}

/** Brecha tal como la redacta la IA en la explicación detallada. */
export interface BrechaExplicada {
  requisito: string;
  sugerencia?: string;
}

/**
 * Explicación en lenguaje simple del match. La redacta la IA (o una plantilla de
 * respaldo determinista si la IA no está disponible). Solo describe compatibilidad
 * profesional; nunca menciona edad/nombre/género.
 */
export interface ExplicacionMatch {
  resumen: string;
  porCriterio: ComentarioCriterio[];
  brechas: BrechaExplicada[];
}

/**
 * Resultado del match persistido por el backend. POST /match devuelve además
 * `explicacionDetallada` (la `ExplicacionMatch` completa para la UI rica); GET
 * /match/:id devuelve el mismo registro SIN ese campo (no se persiste). El campo
 * `explicacion` es solo el resumen guardado en columna String.
 */
export interface ResultadoMatch {
  id: string;
  candidatoId: string;
  vacanteId: string;
  /** Entero 0..100. Mide compatibilidad profesional, nunca edad. */
  puntaje: number;
  desglose: DesgloseMatch;
  cubiertos: string[];
  brechas: BrechaMatch[];
  recomendacion: RecomendacionMatch;
  /** Solo el resumen (texto guardado en la columna String del Match). */
  explicacion: string;
  /** Fecha ISO de creación del registro. */
  creadoEn: string;
  /**
   * Explicación rica para la UI. Solo viene en la respuesta de POST /match (no se
   * persiste ni aparece en GET); por eso es opcional.
   */
  explicacionDetallada?: ExplicacionMatch;
}
