/**
 * Errores de dominio del módulo de vacante. Son errores propios (no excepciones
 * HTTP de Nest) para mantener el servicio desacoplado del transporte y probable
 * sin levantar la aplicación. Cada mensaje está en español y en lenguaje simple,
 * sin tecnicismos ni detalles internos.
 */

/**
 * Longitud mínima razonable del texto de una oferta para poder analizarla. Un
 * texto más corto casi nunca es una oferta real (p. ej. una palabra suelta), así
 * que se rechaza en el servicio ANTES de llamar a la IA (no gasta la red).
 */
export const LONGITUD_MINIMA_TEXTO = 40;

/**
 * El texto de la vacante está vacío o es demasiado corto para analizarlo. Se usa
 * tanto para la validación de forma (Zod) como para la regla de longitud mínima,
 * de modo que ambos casos acaben en un 400 con un mensaje claro.
 */
export class TextoVacanteInvalidoError extends Error {
  constructor(
    mensaje = 'El texto de la vacante es muy corto. Pega la oferta completa para analizarla.',
  ) {
    super(mensaje);
    this.name = 'TextoVacanteInvalidoError';
  }
}

/**
 * No se pudo analizar la vacante por un fallo de la IA (proveedor caído, JSON no
 * válido tras reintentos, etc.). Traduce el error interno a un mensaje amable sin
 * filtrar nada del proveedor ni el stack.
 */
export class AnalisisFallidoError extends Error {
  constructor() {
    super('No pudimos analizar la vacante ahora mismo. Inténtalo de nuevo en un momento.');
    this.name = 'AnalisisFallidoError';
  }
}
