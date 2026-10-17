import type {
  MensajeIa,
  PeticionIa,
  PeticionVision,
  ProveedorIa,
  RespuestaIa,
} from '../ia.types.js';
import { fetchJson } from './http.js';

interface RespuestaGemini {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

/** Separa el/los mensaje(s) de sistema del resto (Gemini los trata aparte). */
function separarSistema(mensajes: MensajeIa[]): { sistema: string; resto: MensajeIa[] } {
  const sistema = mensajes
    .filter((m) => m.rol === 'system')
    .map((m) => m.contenido)
    .join('\n\n');
  return { sistema, resto: mensajes.filter((m) => m.rol !== 'system') };
}

/** Adaptador para Google Gemini (Generative Language API). */
export class GeminiProvider implements ProveedorIa {
  readonly nombre = 'gemini';

  constructor(
    readonly modelo: string,
    private readonly apiKey: string,
  ) {}

  async completar(peticion: PeticionIa): Promise<RespuestaIa> {
    const inicio = Date.now();
    const { sistema, resto } = separarSistema(peticion.mensajes);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelo}:generateContent?key=${this.apiKey}`;

    const data = await fetchJson<RespuestaGemini>(url, {
      proveedor: this.nombre,
      cuerpo: {
        systemInstruction: sistema ? { parts: [{ text: sistema }] } : undefined,
        contents: resto.map((m) => ({
          role: m.rol === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.contenido }],
        })),
        generationConfig: {
          temperature: peticion.temperatura ?? 0.3,
          maxOutputTokens: peticion.maxTokens ?? 1500,
        },
      },
    });

    const texto =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? '';
    return { texto, proveedor: this.nombre, modelo: this.modelo, latenciaMs: Date.now() - inicio };
  }

  /**
   * Completado multimodal: envía el prompt de texto junto a una imagen embebida
   * en base64. En el formato REST de Gemini, `contents[].parts` admite objetos
   * `{ inlineData: { mimeType, data } }` junto a `{ text }`.
   */
  async completarVision(peticion: PeticionVision): Promise<RespuestaIa> {
    const inicio = Date.now();
    const { sistema, resto } = separarSistema(peticion.prompt);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelo}:generateContent?key=${this.apiKey}`;

    // El texto del prompt y la imagen viajan en el último turno del usuario.
    const partesTexto = resto.map((m) => ({ text: m.contenido }));
    const parts = [
      ...partesTexto,
      {
        inlineData: {
          mimeType: peticion.imagen.mimeType,
          data: peticion.imagen.datosBase64,
        },
      },
    ];

    const data = await fetchJson<RespuestaGemini>(url, {
      proveedor: this.nombre,
      cuerpo: {
        systemInstruction: sistema ? { parts: [{ text: sistema }] } : undefined,
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: peticion.temperatura ?? 0.1,
          maxOutputTokens: peticion.maxTokens ?? 2000,
        },
      },
    });

    const texto =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? '';
    return { texto, proveedor: this.nombre, modelo: this.modelo, latenciaMs: Date.now() - inicio };
  }
}
