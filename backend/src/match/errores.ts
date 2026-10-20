/**
 * Errores de dominio del módulo de match. Son errores propios (no excepciones
 * HTTP de Nest) para mantener el servicio desacoplado del transporte y probable
 * sin levantar la aplicación. Cada mensaje está en español y en lenguaje simple,
 * sin tecnicismos ni detalles internos (compliance §6). Espejo de
 * `vacante/errores.ts`: NO se reutilizan los de vacante para no acoplar módulos.
 */

/**
 * Los datos de entrada del match no son válidos (faltan ids, tipos erróneos o
 * campos ajenos). El detalle llega en español simple (lo arma el validador propio
 * del módulo) y nunca filtra el stack ni internos de Zod. Se mapea a 400.
 */
export class EntradaMatchInvalidaError extends Error {
  constructor(mensaje = 'Los datos para calcular el match no son válidos.') {
    super(mensaje);
    this.name = 'EntradaMatchInvalidaError';
  }
}

/**
 * No existe un match con el identificador pedido. El id se recibe solo para
 * contexto interno y nunca se expone con tecnicismos (mismo patrón que
 * `VacanteNoEncontradaError`). Se mapea a 404.
 */
export class MatchNoEncontradoError extends Error {
  constructor(_id?: string) {
    super('No encontramos el match que buscas.');
    this.name = 'MatchNoEncontradoError';
  }
}

/**
 * No se pudo completar una operación contra la base de datos por una causa que
 * no sabemos traducir a un mensaje concreto. El error crudo de Prisma/BD no se
 * filtra al cliente (compliance): solo guardamos un mensaje genérico y amable.
 * Se mapea a 500 genérico.
 */
export class OperacionFallidaError extends Error {
  constructor() {
    super('No pudimos completar la operación. Inténtalo de nuevo en un momento.');
    this.name = 'OperacionFallidaError';
  }
}
