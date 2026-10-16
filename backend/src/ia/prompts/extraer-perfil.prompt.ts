import { z } from 'zod';
import type { MensajeIa } from '../ia.types.js';

/** Versión del prompt. Subir al cambiar el comportamiento (para trazabilidad). */
export const EXTRAER_PERFIL_VERSION = '1.0.0';

/** Esquema de salida validado. El extractor NUNCA inventa: si falta, omite. */
export const perfilExtraidoSchema = z.object({
  habilidades: z.array(z.object({ nombre: z.string(), nivel: z.string().optional() })),
  experiencias: z.array(
    z.object({
      cargo: z.string(),
      empresa: z.string().optional(),
      descripcion: z.string(),
      logros: z.array(z.string()),
    }),
  ),
  certificaciones: z.array(
    z.object({ nombre: z.string(), emisor: z.string().optional(), anio: z.string().optional() }),
  ),
  idiomas: z.array(z.object({ idioma: z.string(), nivel: z.string().optional() })),
});

export type PerfilExtraido = z.infer<typeof perfilExtraidoSchema>;

const SISTEMA = `Eres un asistente que estructura la información de un CV en datos.
Reglas estrictas:
- Extrae SOLO lo que aparezca explícitamente en el texto. NUNCA inventes
  habilidades, logros, cargos, fechas ni datos que no estén.
- Si un dato no está, omítelo (no rellenes con suposiciones).
- No infieras ni uses la edad de la persona para nada.
- Responde ÚNICAMENTE con un objeto JSON válido con esta forma:
  {
    "habilidades": [{ "nombre": string, "nivel"?: string }],
    "experiencias": [{ "cargo": string, "empresa"?: string, "descripcion": string, "logros": string[] }],
    "certificaciones": [{ "nombre": string, "emisor"?: string, "anio"?: string }],
    "idiomas": [{ "idioma": string, "nivel"?: string }]
  }
- Sin texto adicional, sin explicaciones, solo el JSON.`;

export function construirPromptExtraerPerfil(textoCv: string): MensajeIa[] {
  return [
    { rol: 'system', contenido: SISTEMA },
    { rol: 'user', contenido: `Texto del CV:\n"""\n${textoCv}\n"""` },
  ];
}
