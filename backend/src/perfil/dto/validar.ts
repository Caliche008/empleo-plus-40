import type { ZodType } from 'zod';
import { DatosInvalidosError } from '../errores.js';

/**
 * Valida `datos` contra `schema`. Si pasa, devuelve el valor ya tipado y con los
 * valores por defecto aplicados. Si falla, lanza `DatosInvalidosError` con un
 * mensaje en español simple armado a partir de los problemas de Zod (campo +
 * motivo), sin filtrar el stack ni detalles internos de la librería.
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

  throw new DatosInvalidosError(`Revisa estos datos: ${detalle}.`);
}
