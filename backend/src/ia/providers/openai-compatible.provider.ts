import type { PeticionIa, ProveedorIa, RespuestaIa } from '../ia.types.js';
import { fetchJson } from './http.js';

interface RespuestaOpenAI {
  choices: { message: { content: string } }[];
}

/**
 * Adaptador para APIs compatibles con OpenAI (OpenRouter, Groq y otros).
 * Reutilizable cambiando baseUrl, modelo y clave.
 */
export class OpenAICompatibleProvider implements ProveedorIa {
  constructor(
    readonly nombre: string,
    readonly modelo: string,
    private readonly apiKey: string,
    private readonly baseUrl: string,
  ) {}

  async completar(peticion: PeticionIa): Promise<RespuestaIa> {
    const inicio = Date.now();
    const data = await fetchJson<RespuestaOpenAI>(`${this.baseUrl}/chat/completions`, {
      proveedor: this.nombre,
      cabeceras: { authorization: `Bearer ${this.apiKey}` },
      cuerpo: {
        model: this.modelo,
        temperature: peticion.temperatura ?? 0.3,
        max_tokens: peticion.maxTokens ?? 1500,
        messages: peticion.mensajes.map((m) => ({ role: m.rol, content: m.contenido })),
      },
    });
    return {
      texto: data.choices?.[0]?.message?.content?.trim() ?? '',
      proveedor: this.nombre,
      modelo: this.modelo,
      latenciaMs: Date.now() - inicio,
    };
  }
}
