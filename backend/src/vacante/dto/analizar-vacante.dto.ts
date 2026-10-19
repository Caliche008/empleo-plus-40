import { z } from 'zod';

/**
 * Esquema Zod del cuerpo de `POST /vacante/analizar`. Se valida en el borde:
 * `.strict()` rechaza cualquier campo desconocido para que no se cuele nada
 * ajeno al análisis de TEXTO. La longitud mínima NO se valida aquí sino en el
 * servicio (regla de negocio), para distinguir "campo ausente/no-string" de
 * "texto demasiado corto"; ambos acaban en 400.
 */
export const analizarVacanteSchema = z
  .object({
    texto: z.string(),
  })
  .strict();

export type AnalizarVacanteDto = z.infer<typeof analizarVacanteSchema>;
