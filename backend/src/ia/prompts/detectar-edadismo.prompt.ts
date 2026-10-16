import { z } from 'zod';
import type { MensajeIa } from '../ia.types.js';

/** Versión del prompt. Subir al cambiar el comportamiento (para trazabilidad). */
export const DETECTAR_EDADISMO_VERSION = '1.0.0';

/**
 * Detector de edadismo en el TEXTO de una oferta/vacante. Analiza el texto, no
 * personas: nunca usa la edad de nadie. Cada señal cita el `fragmento` literal
 * de la oferta que la respalda y explica el `motivo`. El detector NUNCA inventa.
 */
export const edadismoSchema = z.object({
  hayIndicios: z.boolean(), // true si existe al menos una señal
  senales: z.array(
    z.object({
      fragmento: z.string(), // texto literal de la oferta (respaldo obligatorio)
      motivo: z.string(), // por qué ese fragmento es una señal de edadismo
      gravedad: z.enum(['baja', 'media', 'alta']),
    }),
  ),
  resumen: z.string(), // síntesis + descargo de que NO es asesoría jurídica
});

export type DeteccionEdadismo = z.infer<typeof edadismoSchema>;

const SISTEMA = `Eres un asistente que analiza el TEXTO de una oferta de empleo o
vacante para detectar señales de edadismo (discriminación por edad).

Analizas el TEXTO de la oferta, NUNCA a personas: no uses ni infieras la edad de
nadie. Tu objetivo es señalar lenguaje que pueda excluir o desincentivar a
candidatos por su edad, especialmente a profesionales mayores de 40 años.

Ejemplos de señales de edadismo (orientativos, no exhaustivos):
- "nativo digital", "recién egresado", "recién titulado"
- "ambiente joven", "equipo joven", "energía juvenil"
- rangos de edad explícitos ("entre 20 y 30 años", "menores de 35")
- "máximo X años de experiencia" usado como tope encubierto de edad
- otras expresiones que asocien la idoneidad con ser joven

Reglas estrictas:
- NUNCA inventes fragmentos. Cada "fragmento" DEBE ser texto LITERAL de la
  oferta, copiado tal cual aparece.
- Si no hay señales, "senales" queda vacío y "hayIndicios" es false.
- "hayIndicios" es true solo si hay al menos una señal.
- Para cada señal explica en "motivo" por qué el fragmento es indicio de edadismo.
- No analices ni menciones la edad de ninguna persona; solo el texto de la oferta.
- El "resumen" DEBE incluir un descargo claro de que este análisis NO constituye
  asesoría jurídica.
- Responde ÚNICAMENTE con un objeto JSON válido con esta forma:
  {
    "hayIndicios": boolean,
    "senales": [{ "fragmento": string, "motivo": string, "gravedad": "baja" | "media" | "alta" }],
    "resumen": string
  }
- Sin texto adicional, sin explicaciones, solo el JSON.`;

export function construirPromptDetectarEdadismo(textoOferta: string): MensajeIa[] {
  return [
    { rol: 'system', contenido: SISTEMA },
    {
      rol: 'user',
      contenido: `Texto de la oferta/vacante a analizar:\n"""\n${textoOferta}\n"""`,
    },
  ];
}
