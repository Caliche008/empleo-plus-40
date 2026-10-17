import { Injectable } from '@nestjs/common';
import { IaService } from '../ia/ia.service.js';
import {
  construirPromptOcrCv,
  ocrResultadoSchema,
} from '../ia/prompts/ocr-cv.prompt.js';
import { FormatoNoSoportadoError, type ResultadoParsing } from './errores.js';

/** Tipos MIME de imagen que aceptamos para OCR. */
const MIMES_IMAGEN = new Set(['image/png', 'image/jpeg', 'image/jpg']);

/**
 * Extrae texto de una imagen de hoja de vida usando la capacidad de visión del
 * proveedor de IA (OCR). Delega en `IaService.completarVisionJson` con un prompt
 * versionado y valida la salida con Zod. No hace red por sí mismo: el proveedor
 * (real o simulado) se inyecta vía IaService.
 */
@Injectable()
export class OcrService {
  constructor(private readonly ia: IaService) {}

  /**
   * Transcribe el texto visible de una imagen. Si la imagen no tiene texto
   * legible, devuelve `{ texto: '', textoLegible: false }` (resultado
   * distinguible, no excepción). Lanza `FormatoNoSoportadoError` si el
   * `mimeType` no es una imagen admitida (PNG/JPG).
   */
  async extraerTextoDeImagen(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ResultadoParsing> {
    const mime = mimeType.trim().toLowerCase();
    if (!MIMES_IMAGEN.has(mime)) {
      throw new FormatoNoSoportadoError();
    }

    const resultado = await this.ia.completarVisionJson(
      {
        prompt: construirPromptOcrCv(),
        imagen: { datosBase64: buffer.toString('base64'), mimeType: mime },
      },
      { esquema: ocrResultadoSchema },
    );

    const texto = resultado.texto.trim();
    return { texto, textoLegible: resultado.textoLegible && texto.length > 0 };
  }
}
