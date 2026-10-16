import { z } from 'zod';
import type { MensajeIa } from '../ia.types.js';

export const TRADUCIR_EXPERIENCIA_VERSION = '1.0.0';

/**
 * Traductor de experiencia +40: convierte trayectoria "antigua" en competencias
 * vigentes y demandadas, SIN cambiar el hecho real. Diferenciador del producto.
 * Cada propuesta cita la frase original que la respalda (`origen`).
 */
export const traduccionSchema = z.object({
  traducciones: z.array(
    z.object({
      origen: z.string(), // frase original del CV (respaldo obligatorio)
      original: z.string(), // cómo estaba redactado
      vigente: z.string(), // redacción en competencias actuales
      competencias: z.array(z.string()), // competencias actuales que refleja
    }),
  ),
  advertencias: z.array(z.string()), // p. ej. "no hay suficiente detalle para traducir X"
});

export type TraduccionExperiencia = z.infer<typeof traduccionSchema>;

const SISTEMA = `Eres un experto en recursos humanos especializado en ayudar a
profesionales mayores de 40 años a presentar su experiencia de forma vigente,
combatiendo el edadismo laboral.

Tu tarea: traducir descripciones de experiencia "antigua" a competencias actuales
y demandadas, SIN inventar ni exagerar. El hecho real no cambia; solo su redacción.

Ejemplos de traducción (estilo):
- "coordiné inventarios en Excel" → "gestión de datos y control de procesos con hojas de cálculo"
- "manejé la caja y cuadre diario" → "control financiero operativo y conciliación de cuentas"
- "atendí llamadas de clientes" → "gestión de relación con clientes y soporte"

Reglas estrictas:
- NUNCA inventes tecnologías, cifras, cargos ni logros que no estén en el texto.
- Cada traducción DEBE citar en "origen" la frase original que la respalda.
- Si una frase no tiene suficiente detalle para traducir con honestidad, NO la
  traduzcas: añádela a "advertencias".
- No menciones ni uses la edad de la persona.
- No uses lenguaje que suene a relleno o inflado; mantén la dignidad y la verdad.
- Responde ÚNICAMENTE con JSON:
  {
    "traducciones": [{ "origen": string, "original": string, "vigente": string, "competencias": string[] }],
    "advertencias": string[]
  }`;

export function construirPromptTraducir(experienciaTexto: string): MensajeIa[] {
  return [
    { rol: 'system', contenido: SISTEMA },
    {
      rol: 'user',
      contenido: `Experiencia a traducir (de un CV real):\n"""\n${experienciaTexto}\n"""`,
    },
  ];
}
