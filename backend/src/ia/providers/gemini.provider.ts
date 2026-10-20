import type {
  MensajeIa,
  PeticionEmbedding,
  PeticionIa,
  PeticionVision,
  ProveedorIa,
  RespuestaEmbedding,
  RespuestaIa,
} from '../ia.types.js';
import { fetchJson } from './http.js';

interface RespuestaGemini {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

interface RespuestaEmbedGemini {
  embedding?: { values?: number[] };
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
    // Modelo de embeddings (p. ej. text-embedding-004). Separado del modelo de
    // texto porque Gemini los expone en endpoints distintos.
    private readonly modeloEmbed = 'text-embedding-004',
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
          maxOutputTokens: peticion.maxTokens ?? 4096,
          // Desactivamos el "pensamiento" (thinking) de los modelos Gemini 3.x:
          // para extracción a JSON estructurado no aporta y, en cambio, consumía
          // el presupuesto de tokens (dejando el JSON incompleto) y disparaba la
          // latencia por encima del timeout. Con budget 0 la respuesta es directa.
          thinkingConfig: { thinkingBudget: 0 },
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
          maxOutputTokens: peticion.maxTokens ?? 4096,
          // Sin "pensamiento": el OCR es transcripción directa, no razonamiento.
          thinkingConfig: { thinkingBudget: 0 },
        },
      },
    });

    const texto =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('').trim() ?? '';
    return { texto, proveedor: this.nombre, modelo: this.modelo, latenciaMs: Date.now() - inicio };
  }

  /**
   * Genera embeddings con el modelo de embeddings de Gemini (`:embedContent`).
   * Hace una llamada HTTP por texto (con pocos textos el batch no aporta) y
   * arma `vectores` en el MISMO orden que `peticion.textos`. Usa `taskType`
   * SEMANTIC_SIMILARITY en todos los textos para que los cosenos sean
   * comparables. fetchJson no reintenta en red (timeout 90s); la resiliencia la
   * da el respaldo determinista de la capa semántica. La clave nunca se loguea.
   */
  async generarEmbedding(peticion: PeticionEmbedding): Promise<RespuestaEmbedding> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modeloEmbed}:embedContent?key=${this.apiKey}`;

    const vectores: number[][] = [];
    for (const texto of peticion.textos) {
      const data = await fetchJson<RespuestaEmbedGemini>(url, {
        proveedor: this.nombre,
        cuerpo: {
          content: { parts: [{ text: texto }] },
          taskType: 'SEMANTIC_SIMILARITY',
        },
      });
      vectores.push(data.embedding?.values ?? []);
    }

    return {
      vectores,
      proveedor: this.nombre,
      modelo: this.modeloEmbed,
      dimension: vectores[0]?.length ?? 0,
    };
  }
}
