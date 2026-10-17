import { Injectable } from '@nestjs/common';
import { IaService } from '../ia/ia.service.js';
import {
  construirPromptExtraerPerfil,
  perfilExtraidoSchema,
  type PerfilExtraido,
} from '../ia/prompts/extraer-perfil.prompt.js';
import { FormatoNoSoportadoError, SinTextoLegibleError } from './errores.js';
import { OcrService } from './ocr.service.js';
import { ParsingService } from './parsing.service.js';

/** Tipos MIME de imagen que requieren OCR en lugar de parseo de texto. */
const MIMES_IMAGEN = new Set(['image/png', 'image/jpeg', 'image/jpg']);

/**
 * Extrae un perfil estructurado a partir de texto o de un archivo de hoja de
 * vida. Reutiliza la capa de IA existente (prompt versionado + esquema Zod) sin
 * relajar la regla de no inventar: la salida se valida contra
 * `perfilExtraidoSchema`, de modo que cualquier campo fuera del esquema que el
 * modelo intente colar queda descartado.
 *
 * El perfil devuelto es un BORRADOR pendiente de confirmación por la persona.
 * El guardado real contra la base de datos es una fase posterior (fuera de
 * alcance en esta fase).
 */
@Injectable()
export class PerfilExtractorService {
  constructor(
    private readonly ia: IaService,
    private readonly parsing: ParsingService,
    private readonly ocr: OcrService,
  ) {}

  /**
   * Extrae el perfil a partir de texto plano del CV. La salida se valida contra
   * `perfilExtraidoSchema`; los campos ajenos al esquema se descartan (no se
   * inventa ni se conserva nada fuera de la forma acordada).
   */
  async extraerDeTexto(texto: string): Promise<PerfilExtraido> {
    return this.ia.completarJson(
      { mensajes: construirPromptExtraerPerfil(texto) },
      { esquema: perfilExtraidoSchema },
    );
  }

  /**
   * Extrae el perfil a partir de un archivo subido, orquestando parseo y OCR:
   *  1. Si el archivo es una imagen (PNG/JPG), va directo a OCR.
   *  2. Si no, se parsea con `ParsingService`; si el resultado no trae texto
   *     legible (p. ej. un PDF escaneado), se reintenta con OCR como respaldo.
   *  3. Si tras el OCR sigue sin haber texto legible, se lanza
   *     `SinTextoLegibleError`.
   *  4. Con el texto obtenido se llama a `extraerDeTexto`.
   *
   * El resultado es un borrador pendiente de confirmación; el guardado contra
   * la base de datos es una fase posterior.
   */
  async extraerDeArchivo(buffer: Buffer, mimeType: string): Promise<PerfilExtraido> {
    const mime = mimeType.trim().toLowerCase();

    let resultado;
    if (MIMES_IMAGEN.has(mime)) {
      resultado = await this.ocr.extraerTextoDeImagen(buffer, mime);
    } else {
      resultado = await this.parsing.extraerTexto(buffer, mime);
      if (!resultado.textoLegible) {
        // El documento se abrió pero no arrojó texto (p. ej. PDF escaneado):
        // intentamos OCR como respaldo. Si el OCR no admite este tipo de
        // archivo, lo tratamos como "sin texto legible" en vez de propagar un
        // error de formato, para dar un mensaje útil a la persona.
        try {
          resultado = await this.ocr.extraerTextoDeImagen(buffer, mime);
        } catch (e) {
          if (e instanceof FormatoNoSoportadoError) {
            throw new SinTextoLegibleError();
          }
          throw e;
        }
      }
    }

    if (!resultado.textoLegible || resultado.texto.length === 0) {
      throw new SinTextoLegibleError();
    }

    return this.extraerDeTexto(resultado.texto);
  }
}
