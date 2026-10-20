import type { ZodType } from 'zod';
import { EntradaMatchInvalidaError } from '../errores.js';

/**
 * Valida `datos` contra `schema`. Si pasa, devuelve el valor ya tipado. Si falla,
 * lanza `EntradaMatchInvalidaError` con un mensaje en español simple armado a
 * partir de los problemas de Zod (campo + motivo), sin filtrar el stack ni
 * detalles internos de la librería.
 *
 * Es el validador PROPIO del módulo match: NO reutiliza el de vacante, para no
 * acoplar los módulos ni mezclar sus errores de dominio.
 */
export function validarCon<T>(schema: ZodType<T>, datos: unknown): T {
  const resultado = schema.safeParse(datos);
  if (resultado.success) {
    return resultado.data;
  }

  const detalle = resultado.error.issues
    .map((problema) => {
      const campo = problema.path.join('.') || 'el formulario';
      return `${campo}: ${problema.message}`;
    })
    .join('; ');

  throw new EntradaMatchInvalidaError(`Revisa estos datos: ${detalle}.`);
}
