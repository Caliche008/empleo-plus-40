import { Injectable } from '@nestjs/common';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import {
  ArchivoDemasiadoGrandeError,
  FormatoNoSoportadoError,
  SinTextoLegibleError,
  type ResultadoParsing,
} from './errores.js';

/** Tamaño máximo admitido para un archivo subido: 10 MB. */
const MAX_BYTES = 10 * 1024 * 1024;

/** Formatos de texto que este servicio sabe leer. */
type FormatoTexto = 'pdf' | 'docx' | 'txt';

/**
 * Extrae texto plano de un archivo subido (hoja de vida) según su tipo:
 *  - PDF: `pdf-parse` sobre el buffer en memoria.
 *  - DOCX: `mammoth.extractRawText`.
 *  - TXT: decodificación UTF-8 tolerante.
 *
 * No llama al LLM ni hace peticiones de red: su única responsabilidad es sacar
 * el texto del binario y validar tamaño y formato. La decisión de aplicar OCR
 * cuando no hay texto legible vive en el servicio orquestador.
 */
@Injectable()
export class ParsingService {
  async extraerTexto(
    buffer: Buffer,
    nombreOrMime: string,
  ): Promise<ResultadoParsing> {
    if (buffer.length > MAX_BYTES) {
      throw new ArchivoDemasiadoGrandeError();
    }

    const formato = this.detectarFormato(nombreOrMime);
    if (formato === null) {
      throw new FormatoNoSoportadoError();
    }

    switch (formato) {
      case 'pdf':
        return this.extraerPdf(buffer);
      case 'docx':
        return this.extraerDocx(buffer);
      case 'txt':
        return this.extraerTxt(buffer);
    }
  }

  /**
   * Determina el formato a partir del nombre de archivo (por su extensión) o de
   * un tipo MIME. Devuelve `null` si no es un formato de texto admitido.
   */
  private detectarFormato(nombreOrMime: string): FormatoTexto | null {
    const valor = nombreOrMime.trim().toLowerCase();

    // Coincidencia por tipo MIME.
    if (valor === 'application/pdf') return 'pdf';
    if (
      valor ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      valor === 'application/msword'
    ) {
      return 'docx';
    }
    if (valor === 'text/plain') return 'txt';

    // Coincidencia por extensión del nombre de archivo.
    if (valor.endsWith('.pdf')) return 'pdf';
    if (valor.endsWith('.docx') || valor.endsWith('.doc')) return 'docx';
    if (valor.endsWith('.txt')) return 'txt';

    return null;
  }

  /** Extrae texto de un PDF. Un PDF sin texto no es un error: `textoLegible:false`. */
  private async extraerPdf(buffer: Buffer): Promise<ResultadoParsing> {
    if (buffer.length === 0) {
      throw new SinTextoLegibleError();
    }
    let texto: string;
    try {
      const resultado = await pdfParse(buffer);
      texto = resultado.text.trim();
    } catch {
      // PDF cifrado, corrupto o ilegible: lo tratamos como "sin texto", no como crash.
      throw new SinTextoLegibleError();
    }
    return { texto, textoLegible: texto.length > 0 };
  }

  /** Extrae texto de un DOCX con mammoth. */
  private async extraerDocx(buffer: Buffer): Promise<ResultadoParsing> {
    if (buffer.length === 0) {
      throw new SinTextoLegibleError();
    }
    let texto: string;
    try {
      const resultado = await mammoth.extractRawText({ buffer });
      texto = resultado.value.trim();
    } catch {
      throw new SinTextoLegibleError();
    }
    return { texto, textoLegible: texto.length > 0 };
  }

  /** Decodifica texto plano con reemplazo tolerante para bytes no UTF-8. */
  private extraerTxt(buffer: Buffer): ResultadoParsing {
    if (buffer.length === 0) {
      throw new SinTextoLegibleError();
    }
    const texto = new TextDecoder('utf-8', { fatal: false })
      .decode(buffer)
      .trim();
    return { texto, textoLegible: texto.length > 0 };
  }
}
