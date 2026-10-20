import { z } from 'zod';

/**
 * Esquema Zod del cuerpo de `POST /match`. Se valida en el borde: `.strict()`
 * rechaza cualquier campo desconocido para que no se cuele nada ajeno al cálculo
 * (en particular `edad`/`nombre`/`genero`). Ambos ids son strings no vacíos; la
 * existencia real del perfil/vacante la valida el servicio contra los servicios
 * de dominio (404), no el esquema.
 */
export const calcularMatchSchema = z
  .object({
    candidatoId: z.string().min(1),
    vacanteId: z.string().min(1),
  })
  .strict();

export type CalcularMatchDto = z.infer<typeof calcularMatchSchema>;
