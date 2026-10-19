import type { ZodType } from 'zod';
import { TextoVacanteInvalidoError } from '../errores.js';

/**
 * Valida `datos` contra `schema`. Si pasa, devuelve el valor ya tipado. Si falla,
 * lanza `TextoVacanteInvalidoError` con un mensaje en español simple armado a
 * partir de los problemas de Zod (campo + motivo), sin filtrar el stack ni
 * detalles internos de la librería.
 *
 * Se usa un único tipo de error de entrada (`TextoVacanteInvalidoError`) para que
 * el controller mapee tanto el fallo de forma como el de longitud mínima a 400.
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

  throw new TextoVacanteInvalidoError(`Revisa estos datos: ${detalle}.`);
}
