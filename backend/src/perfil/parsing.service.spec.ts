import { vi } from 'vitest';
import {
  ArchivoDemasiadoGrandeError,
  FormatoNoSoportadoError,
  SinTextoLegibleError,
} from './errores.js';

/**
 * El PDF se prueba simulando el módulo `pdf-parse/lib/pdf-parse.js`. La librería
 * (pdf.js v1.10 que empaqueta pdf-parse 1.1.1) no acepta PDFs mínimos
 * sintéticos aunque su tabla xref sea byte-exacta, así que un fixture PDF
 * "a mano" resultaría frágil y no probaría nuestro código sino su parser.
 * Simular el parser mantiene la prueba en memoria, sin red, y verifica lo que
 * nos corresponde: enrutado por formato, recorte, bandera `textoLegible` y la
 * traducción de fallos a errores de dominio. DOCX y TXT usan buffers reales.
 */
const pdfParseMock = vi.fn();
vi.mock('pdf-parse/lib/pdf-parse.js', () => ({
  default: (buffer: Buffer) => pdfParseMock(buffer),
}));

// La importación va después del mock para que el servicio reciba el doble.
const { ParsingService } = await import('./parsing.service.js');

/**
 * DOCX mínimo real generado en memoria con JSZip (Office Open XML) y embebido en
 * base64. Contiene el texto "Hoja de vida de prueba DOCX".
 */
const DOCX_BASE64 =
  'UEsDBAoAAAAIAFq+UF3JTxqw6wAAAK4BAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbH1QvU7DMBDeeQrLK4odGBBCSTrwMwJDeYCTfUks7LPlc0v79jht6YAK4933q69b7YIXW8zsIvXyRrVSIJloHU29/Fi/NPdScAGy4CNhL/fIcjVcdet9QhZVTNzLuZT0oDWbGQOwigmpImPMAUo986QTmE+YUN+27Z02kQpSacriIYfuCUfY+CKed/V9LJLRsxSPR+KS1UtIyTsDpeJ6S/ZXSnNKUFV54PDsEl9XgtQXExbk74CT7q0uk51F8Q65vEKoLP0Vs9U2mk2oSvW/zYWecRydwbN+cUs5GmSukwevzkgARz/99WHu4RtQSwMECgAAAAAAWr5QXQAAAAAAAAAAAAAAAAYAAABfcmVscy9QSwMECgAAAAgAWr5QXbmBRHGwAAAAKgEAAAsAAABfcmVscy8ucmVsc43POw7CMAwG4J1TRN5pWgaEUJMuCKkrKgeIEjeNaB5KwqO3JwMDIAZG278/y233sDO5YUzGOwZNVQNBJ70yTjM4D8f1DkjKwikxe4cMFkzQ8VV7wlnkspMmExIpiEsMppzDntIkJ7QiVT6gK5PRRytyKaOmQciL0Eg3db2l8d0A/mGSXjGIvWqADEvAf2w/jkbiwcurRZd/nPhKFFlEjZnB3UdF1atdFRYob+nHi/wJUEsDBAoAAAAAAFq+UF0AAAAAAAAAAAAAAAAFAAAAd29yZC9QSwMECgAAAAgAWr5QXXu3JqeuAAAA5QAAABEAAAB3b3JkL2RvY3VtZW50LnhtbEWOPQ+CMBCGd39F012KDsYQPgaNcXPRxLXQEzD0rmkLyL+3xcHleXN5L89dXn30wCawrics+C5JOQNsSPXYFvxxv2yPnDkvUcmBEAq+gONVucnnTFEzakDPggFdNhe8895kQrimAy1dQgYwdC+yWvow2lbMZJWx1IBz4YAexD5ND0LLHnkZlDWpJaaJsBG+vNJbMgVs6tWaxo5QS3a+nZ65iAuRdqVZ+ZOI/4PlF1BLAQIUAAoAAAAIAFq+UF3JTxqw6wAAAK4BAAATAAAAAAAAAAAAAAAAAAAAAABbQ29udGVudF9UeXBlc10ueG1sUEsBAhQACgAAAAAAWr5QXQAAAAAAAAAAAAAAAAYAAAAAAAAAAAAQAAAAHAEAAF9yZWxzL1BLAQIUAAoAAAAIAFq+UF25gURxsAAAACoBAAALAAAAAAAAAAAAAAAAAEABAABfcmVscy8ucmVsc1BLAQIUAAoAAAAAAFq+UF0AAAAAAAAAAAAAAAAFAAAAAAAAAAAAEAAAABkCAAB3b3JkL1BLAQIUAAoAAAAIAFq+UF17tyanrgAAAOUAAAARAAAAAAAAAAAAAAAAADwCAAB3b3JkL2RvY3VtZW50LnhtbFBLBQYAAAAABQAFACABAAAZAwAAAAA=';

function docxBuffer(): Buffer {
  return Buffer.from(DOCX_BASE64, 'base64');
}

describe('ParsingService', () => {
  let servicio: InstanceType<typeof ParsingService>;

  beforeEach(() => {
    servicio = new ParsingService();
    pdfParseMock.mockReset();
  });

  it('P1. TXT UTF-8 → devuelve el texto con textoLegible:true', async () => {
    const buffer = Buffer.from(
      'Soy una hoja de vida en texto plano. áéíóú ñ',
      'utf-8',
    );

    const resultado = await servicio.extraerTexto(buffer, 'cv.txt');

    expect(resultado.textoLegible).toBe(true);
    expect(resultado.texto).toBe(
      'Soy una hoja de vida en texto plano. áéíóú ñ',
    );
  });

  it('P2. DOCX mínimo real → extrae texto con textoLegible:true', async () => {
    const resultado = await servicio.extraerTexto(docxBuffer(), 'cv.docx');

    expect(resultado.textoLegible).toBe(true);
    expect(resultado.texto).toBe('Hoja de vida de prueba DOCX');
  });

  it('P3. PDF con texto → extrae texto con textoLegible:true', async () => {
    pdfParseMock.mockResolvedValue({ text: '  Hola mundo PDF  ' });

    const resultado = await servicio.extraerTexto(
      Buffer.from('%PDF-1.4 ...'),
      'cv.pdf',
    );

    expect(resultado.textoLegible).toBe(true);
    expect(resultado.texto).toBe('Hola mundo PDF');
    expect(pdfParseMock).toHaveBeenCalledOnce();
  });

  it('P4. PDF sin texto → textoLegible:false sin lanzar excepción', async () => {
    pdfParseMock.mockResolvedValue({ text: '   ' });

    const resultado = await servicio.extraerTexto(
      Buffer.from('%PDF-1.4 ...'),
      'cv.pdf',
    );

    expect(resultado.textoLegible).toBe(false);
    expect(resultado.texto).toBe('');
  });

  it('P4b. PDF cifrado/corrupto (el parser lanza) → SinTextoLegibleError', async () => {
    pdfParseMock.mockRejectedValue(new Error('bad XRef entry'));

    await expect(
      servicio.extraerTexto(Buffer.from('%PDF-1.4 roto'), 'cv.pdf'),
    ).rejects.toThrow(SinTextoLegibleError);
  });

  it('P5. Archivo > 10 MB → ArchivoDemasiadoGrandeError con mensaje claro', async () => {
    const grande = Buffer.alloc(10 * 1024 * 1024 + 1, 0x20);

    await expect(
      servicio.extraerTexto(grande, 'cv.txt'),
    ).rejects.toBeInstanceOf(ArchivoDemasiadoGrandeError);
    try {
      await servicio.extraerTexto(grande, 'cv.txt');
    } catch (e) {
      expect((e as Error).message).toContain('10 MB');
    }
  });

  it('P6. Formato no soportado → FormatoNoSoportadoError con mensaje claro', async () => {
    const buffer = Buffer.from('MZ...binario...');

    await expect(
      servicio.extraerTexto(buffer, 'programa.exe'),
    ).rejects.toBeInstanceOf(FormatoNoSoportadoError);
    await expect(
      servicio.extraerTexto(buffer, 'application/zip'),
    ).rejects.toBeInstanceOf(FormatoNoSoportadoError);
  });

  it('P7. Buffer vacío → error de dominio claro, no excepción interna', async () => {
    const vacio = Buffer.alloc(0);

    await expect(servicio.extraerTexto(vacio, 'cv.txt')).rejects.toBeInstanceOf(
      SinTextoLegibleError,
    );
    await expect(servicio.extraerTexto(vacio, 'cv.pdf')).rejects.toBeInstanceOf(
      SinTextoLegibleError,
    );
    await expect(
      servicio.extraerTexto(vacio, 'cv.docx'),
    ).rejects.toBeInstanceOf(SinTextoLegibleError);
    // El PDF no debe llegar siquiera al parser con un buffer vacío.
    expect(pdfParseMock).not.toHaveBeenCalled();
  });

  it('P8. Encoding no UTF-8 en TXT → no revienta; decodifica con reemplazo', async () => {
    // Bytes 0xFF 0xFE no son UTF-8 válidos; TextDecoder no-fatal los reemplaza.
    const buffer = Buffer.from([0x48, 0x6f, 0x6c, 0x61, 0xff, 0xfe, 0x21]);

    const resultado = await servicio.extraerTexto(buffer, 'cv.txt');

    expect(resultado.textoLegible).toBe(true);
    expect(resultado.texto).toContain('Hola');
    // Contiene el carácter de reemplazo de Unicode, sin lanzar.
    expect(resultado.texto).toContain('\uFFFD');
  });

  it('acepta el tipo MIME además de la extensión', async () => {
    const buffer = Buffer.from('texto por MIME', 'utf-8');

    const resultado = await servicio.extraerTexto(buffer, 'text/plain');

    expect(resultado.texto).toBe('texto por MIME');
  });
});
