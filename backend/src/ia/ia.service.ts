import { Injectable } from '@nestjs/common';
import type { OpcionesJson, PeticionIa, ProveedorIa, RespuestaIa } from './ia.types.js';
import { IaError } from './ia.types.js';
import { GeminiProvider } from './providers/gemini.provider.js';
import { OpenAICompatibleProvider } from './providers/openai-compatible.provider.js';
import { loadEnv } from '../common/config/env.js';

/**
 * Fachada de IA. Única puerta a los modelos. Selecciona el proveedor por
 * configuración y ofrece dos operaciones:
 *  - completar(): texto libre.
 *  - completarJson(): salida JSON validada por esquema Zod, con reintentos.
 */
@Injectable()
export class IaService {
  private readonly proveedor: ProveedorIa;

  constructor(proveedor?: ProveedorIa) {
    this.proveedor = proveedor ?? IaService.crearDesdeEntorno();
  }

  /** Crea el proveedor activo según las variables de entorno. */
  static crearDesdeEntorno(): ProveedorIa {
    const env = loadEnv();
    switch (env.IA_PROVIDER) {
      case 'openrouter':
        return new OpenAICompatibleProvider(
          'openrouter',
          env.OPENROUTER_MODEL,
          env.OPENROUTER_API_KEY,
          'https://openrouter.ai/api/v1',
        );
      case 'groq':
        return new OpenAICompatibleProvider(
          'groq',
          env.GROQ_MODEL,
          env.GROQ_API_KEY,
          'https://api.groq.com/openai/v1',
        );
      case 'gemini':
      default:
        return new GeminiProvider(env.IA_MODEL, env.GEMINI_API_KEY);
    }
  }

  completar(peticion: PeticionIa): Promise<RespuestaIa> {
    return this.proveedor.completar(peticion);
  }

  /**
   * Pide una respuesta y la valida contra un esquema Zod. Si el modelo devuelve
   * JSON inválido, reintenta pidiendo corrección hasta `reintentos` veces.
   * Lanza IaError('peticion') si no logra un JSON válido.
   */
  async completarJson<T>(peticion: PeticionIa, opciones: OpcionesJson<T>): Promise<T> {
    const reintentos = opciones.reintentos ?? 2;
    let ultimoError = '';
    const mensajes = [...peticion.mensajes];

    for (let intento = 0; intento <= reintentos; intento++) {
      const res = await this.proveedor.completar({ ...peticion, mensajes });
      const json = extraerJson(res.texto);
      if (json !== undefined) {
        const parsed = opciones.esquema.safeParse(json);
        if (parsed.success) return parsed.data;
        ultimoError = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
      } else {
        ultimoError = 'la respuesta no contenía JSON';
      }
      // Reintento: pedimos al modelo que corrija entregando SOLO JSON válido.
      mensajes.push({ rol: 'assistant', contenido: res.texto });
      mensajes.push({
        rol: 'user',
        contenido: `Tu respuesta no fue JSON válido (${ultimoError}). Responde ÚNICAMENTE con el JSON pedido, sin texto adicional ni explicaciones.`,
      });
    }

    throw new IaError(
      `No se obtuvo JSON válido tras ${reintentos + 1} intentos: ${ultimoError}`,
      'peticion',
      this.proveedor.nombre,
      false,
    );
  }
}

/**
 * Extrae un objeto/array JSON de un texto. Soporta respuestas envueltas en
 * bloques ```json ... ``` o con texto alrededor.
 */
export function extraerJson(texto: string): unknown {
  const limpio = texto.trim();
  // 1) Intento directo.
  try {
    return JSON.parse(limpio);
  } catch {
    /* sigue */
  }
  // 2) Bloque ```json ... ```
  const bloque = limpio.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (bloque) {
    try {
      return JSON.parse(bloque[1].trim());
    } catch {
      /* sigue */
    }
  }
  // 3) Primer { ... } o [ ... ] balanceado del texto.
  const inicio = limpio.search(/[[{]/);
  if (inicio !== -1) {
    const abre = limpio[inicio];
    const cierra = abre === '{' ? '}' : ']';
    let nivel = 0;
    for (let i = inicio; i < limpio.length; i++) {
      if (limpio[i] === abre) nivel++;
      else if (limpio[i] === cierra) {
        nivel--;
        if (nivel === 0) {
          try {
            return JSON.parse(limpio.slice(inicio, i + 1));
          } catch {
            return undefined;
          }
        }
      }
    }
  }
  return undefined;
}
