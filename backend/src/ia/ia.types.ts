import type { ZodType } from 'zod';

/** Un mensaje de conversación con el modelo. */
export interface MensajeIa {
  rol: 'system' | 'user' | 'assistant';
  contenido: string;
}

/** Petición de completado al proveedor. */
export interface PeticionIa {
  mensajes: MensajeIa[];
  temperatura?: number;
  maxTokens?: number;
}

/** Respuesta normalizada de cualquier proveedor. */
export interface RespuestaIa {
  texto: string;
  proveedor: string;
  modelo: string;
  latenciaMs: number;
}

/**
 * Contrato que implementa cada adaptador de proveedor LLM (Gemini, OpenRouter,
 * Groq…). Permite intercambiar el proveedor sin tocar la lógica de negocio.
 */
export interface ProveedorIa {
  readonly nombre: string;
  readonly modelo: string;
  completar(peticion: PeticionIa): Promise<RespuestaIa>;
}

/**
 * Error normalizado de IA. `recuperable` indica si tiene sentido reintentar o
 * conmutar de proveedor (rate limit, red) frente a un error de petición.
 */
export class IaError extends Error {
  constructor(
    message: string,
    readonly tipo: 'rate_limit' | 'auth' | 'red' | 'servidor' | 'peticion' | 'desconocido',
    readonly proveedor: string,
    readonly recuperable: boolean,
  ) {
    super(message);
    this.name = 'IaError';
  }
}

/** Opciones para pedir una salida JSON validada por esquema. */
export interface OpcionesJson<T> {
  esquema: ZodType<T>;
  /** Nº de reintentos si el JSON no valida (el modelo a veces se equivoca). */
  reintentos?: number;
}
