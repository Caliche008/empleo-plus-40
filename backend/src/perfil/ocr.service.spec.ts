import { IaService } from '../ia/ia.service.js';
import { IaError } from '../ia/ia.types.js';
import type {
  PeticionIa,
  PeticionVision,
  ProveedorIa,
  RespuestaIa,
} from '../ia/ia.types.js';
import { FormatoNoSoportadoError } from './errores.js';
import { OcrService } from './ocr.service.js';

/**
 * Proveedor simulado CON visión para probar OcrService sin red. Devuelve, en
 * orden, las respuestas de una cola. `completar` sirve a los reintentos de texto
 * de `completarVisionJson`.
 */
class ProveedorVisionSimulado implements ProveedorIa {
  readonly nombre = 'simulado';
  readonly modelo = 'modelo-test';
  private indice = 0;

  constructor(private readonly respuestas: string[]) {}

  private siguiente(): RespuestaIa {
    const texto =
      this.respuestas[Math.min(this.indice, this.respuestas.length - 1)] ?? '';
    this.indice++;
    return {
      texto,
      proveedor: this.nombre,
      modelo: this.modelo,
      latenciaMs: 0,
    };
  }

  completar(_peticion: PeticionIa): Promise<RespuestaIa> {
    return Promise.resolve(this.siguiente());
  }

  completarVision(_peticion: PeticionVision): Promise<RespuestaIa> {
    return Promise.resolve(this.siguiente());
  }
}

/** Proveedor simulado SIN visión (no define `completarVision`). */
class ProveedorSinVision implements ProveedorIa {
  readonly nombre = 'simulado-sin-vision';
  readonly modelo = 'modelo-test';

  completar(_peticion: PeticionIa): Promise<RespuestaIa> {
    return Promise.resolve({
      texto: '',
      proveedor: this.nombre,
      modelo: this.modelo,
      latenciaMs: 0,
    });
  }
}

/** Imagen PNG mínima (1x1) en base64; su contenido no importa, el OCR es simulado. */
const PNG_1x1 = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC',
  'base64',
);

describe('OcrService.extraerTextoDeImagen', () => {
  it('O1. imagen con texto → devuelve el texto transcrito y textoLegible:true', async () => {
    const proveedor = new ProveedorVisionSimulado([
      '{"texto":"Juan Pérez — Desarrollador","textoLegible":true}',
    ]);
    const ia = new IaService(proveedor);
    const ocr = new OcrService(ia);

    const resultado = await ocr.extraerTextoDeImagen(PNG_1x1, 'image/png');

    expect(resultado).toEqual({
      texto: 'Juan Pérez — Desarrollador',
      textoLegible: true,
    });
  });

  it('O2. imagen ilegible → ResultadoParsing distinguible con textoLegible:false (sin excepción)', async () => {
    const proveedor = new ProveedorVisionSimulado([
      '{"texto":"","textoLegible":false}',
    ]);
    const ia = new IaService(proveedor);
    const ocr = new OcrService(ia);

    const resultado = await ocr.extraerTextoDeImagen(PNG_1x1, 'image/jpeg');

    expect(resultado.textoLegible).toBe(false);
    expect(resultado.texto).toBe('');
  });

  it('O3. proveedor sin visión → propaga IaError "peticion" recuperable:false', async () => {
    const ia = new IaService(new ProveedorSinVision());
    const ocr = new OcrService(ia);

    try {
      await ocr.extraerTextoDeImagen(PNG_1x1, 'image/png');
      expect.fail('debía lanzar IaError');
    } catch (e) {
      expect(e).toBeInstanceOf(IaError);
      const error = e as IaError;
      expect(error.tipo).toBe('peticion');
      expect(error.recuperable).toBe(false);
    }
  });

  it('O4. mimeType inválido → FormatoNoSoportadoError (sin llamar a la IA)', async () => {
    const proveedor = new ProveedorVisionSimulado(['no debería llamarse']);
    const ia = new IaService(proveedor);
    const ocr = new OcrService(ia);

    await expect(
      ocr.extraerTextoDeImagen(PNG_1x1, 'application/pdf'),
    ).rejects.toBeInstanceOf(FormatoNoSoportadoError);
  });
});
