import { z } from 'zod';
import type { MensajeIa } from '../ia.types.js';
import type { BrechaMatch, DesgloseMatch } from '../../match/tipos.js';

/** Versión del prompt. Subir al cambiar el comportamiento (para trazabilidad). */
export const EXPLICAR_MATCH_VERSION = '1.0.0';

/**
 * Esquema de la explicación que redacta el LLM. SIN `.strict()`: Zod descarta
 * (strip) cualquier campo ajeno —en particular un `puntaje` si el modelo lo
 * devuelve—, de modo que el servicio usa SIEMPRE el puntaje ya calculado. El
 * esquema NO contiene `puntaje` a propósito: el modelo solo redacta.
 */
export const explicacionMatchSchema = z.object({
  resumen: z.string(),
  porCriterio: z.array(
    z.object({
      criterio: z.string(),
      comentario: z.string(),
    }),
  ),
  brechas: z.array(
    z.object({
      requisito: z.string(),
      sugerencia: z.string().optional(),
    }),
  ),
});

export type ExplicacionMatch = z.infer<typeof explicacionMatchSchema>;

const SISTEMA = `Eres un asistente que explica, en lenguaje simple y digno, el
resultado de una comparación entre el perfil de una persona que busca trabajo
(especialmente mayores de 40 años) y una vacante.

MUY IMPORTANTE: el puntaje y el desglose por criterio YA ESTÁN CALCULADOS y te
los entregan. Tu único trabajo es REDACTARLOS en palabras claras:

- NUNCA calcules, recalcules ni cambies el puntaje, los pesos ni los valores.
- NO inventes que la persona cumple algo que el cálculo dice que no cumple.
- Para cada brecha (requisito no cubierto) puedes sugerir UN curso o
  certificación concreto y realista como "sugerencia" (texto breve). Si no
  tienes una sugerencia útil, deja la sugerencia vacía o no la incluyas. No
  crees, quites ni reordenes brechas: usa exactamente las que se te entregan.
- NO menciones edad, nombre ni género de nadie.
- Tono respetuoso, sin paternalismo ni alarmismo, frases cortas y en español.

Responde ÚNICAMENTE con un objeto JSON válido con esta forma:
  {
    "resumen": string,
    "porCriterio": [{ "criterio": string, "comentario": string }],
    "brechas": [{ "requisito": string, "sugerencia"?: string }]
  }
Sin texto adicional, sin explicaciones fuera del JSON, y SIN campo "puntaje".`;

/** Datos ya calculados que recibe el prompt para redactar la explicación. */
export interface DatosExplicarMatch {
  puntaje: number;
  desglose: DesgloseMatch;
  cubiertos: string[];
  brechas: BrechaMatch[];
  recomendacion: string;
}

export function construirPromptExplicarMatch(datos: DatosExplicarMatch): MensajeIa[] {
  // Se entrega el resultado ya calculado como contexto; el modelo solo redacta.
  const contexto = JSON.stringify(
    {
      puntaje: datos.puntaje,
      recomendacion: datos.recomendacion,
      desglose: datos.desglose,
      cubiertos: datos.cubiertos,
      brechas: datos.brechas,
    },
    null,
    2,
  );

  return [
    { rol: 'system', contenido: SISTEMA },
    {
      rol: 'user',
      contenido: `Resultado del match YA CALCULADO (no lo recalcules, solo redáctalo):\n"""\n${contexto}\n"""`,
    },
  ];
}
