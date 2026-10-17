import { z } from 'zod';
import type { MensajeIa } from '../ia.types.js';

/** Versión del prompt. Subir al cambiar el comportamiento (para trazabilidad). */
export const OCR_CV_VERSION = '1.0.0';

/**
 * Esquema de salida del OCR. Solo transcribe: `texto` es lo que se ve y
 * `textoLegible` indica si había texto legible en la imagen.
 */
export const ocrResultadoSchema = z.object({
  texto: z.string(),
  textoLegible: z.boolean(),
});

export type OcrResultado = z.infer<typeof ocrResultadoSchema>;

const SISTEMA = `Eres un transcriptor de imágenes de hojas de vida (CV).
Reglas estrictas:
- Transcribe FIELMENTE el texto visible en la imagen, respetando el orden de
  lectura. NUNCA inventes, completes ni corrijas datos que no aparezcan.
- No interpretes ni resumas: solo copia el texto tal cual se ve.
- No infieras ni uses la edad de la persona para nada.
- Si la imagen no contiene texto legible (está borrosa, en blanco o no es un
  documento con texto), devuelve "texto" como cadena vacía y "textoLegible": false.
- Responde ÚNICAMENTE con un objeto JSON válido con esta forma:
  { "texto": string, "textoLegible": boolean }
- Sin texto adicional, sin explicaciones, solo el JSON.`;

/** Construye el prompt de texto que acompaña a la imagen en la petición de visión. */
export function construirPromptOcrCv(): MensajeIa[] {
  return [
    { rol: 'system', contenido: SISTEMA },
    {
      rol: 'user',
      contenido:
        'Transcribe el texto visible de esta imagen de hoja de vida y devuelve el JSON pedido.',
    },
  ];
}
