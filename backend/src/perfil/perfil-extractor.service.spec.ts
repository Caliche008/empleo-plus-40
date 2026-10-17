import { IaService } from '../ia/ia.service.js';
import { IaError } from '../ia/ia.types.js';
import type {
  PeticionIa,
  PeticionVision,
  ProveedorIa,
  RespuestaIa,
} from '../ia/ia.types.js';
import {
  FormatoNoSoportadoError,
  SinTextoLegibleError,
  type ResultadoParsing,
} from './errores.js';
import { OcrService } from './ocr.service.js';
import { ParsingService } from './parsing.service.js';
import { PerfilExtractorService } from './perfil-extractor.service.js';

/**
 * Proveedor simulado (sin red) que devuelve, en orden, las respuestas de una
 * cola. Implementa visión opcional reusando la misma cola, para poder inyectarlo
 * tanto en el camino de extracción como en el de OCR.
 */
class ProveedorSimulado implements ProveedorIa {
  readonly nombre = 'simulado';
  readonly modelo = 'modelo-test';
  llamadas = 0;
  private indice = 0;

  constructor(private readonly respuestas: string[]) {}

  private siguiente(): RespuestaIa {
    this.llamadas++;
    const texto =
      this.respuestas[Math.min(this.indice, this.respuestas.length - 1)] ?? '';
    this.indice++;
    return { texto, proveedor: this.nombre, modelo: this.modelo, latenciaMs: 0 };
  }

  completar(_peticion: PeticionIa): Promise<RespuestaIa> {
    return Promise.resolve(this.siguiente());
  }

  completarVision(_peticion: PeticionVision): Promise<RespuestaIa> {
    return Promise.resolve(this.siguiente());
  }
}

/** Doble de ParsingService que devuelve un resultado fijo y cuenta llamadas. */
class ParsingServiceFalso extends ParsingService {
  llamadas = 0;
  constructor(private readonly resultado: ResultadoParsing) {
    super();
  }
  override extraerTexto(): Promise<ResultadoParsing> {
    this.llamadas++;
    return Promise.resolve(this.resultado);
  }
}

/** Doble de OcrService que devuelve un resultado fijo y cuenta llamadas. */
class OcrServiceFalso extends OcrService {
  llamadas = 0;
  constructor(private readonly resultado: ResultadoParsing) {
    // IaService no se usa en el doble (se sobreescribe el método).
    super(new IaService(new ProveedorSimulado([''])));
  }
  override extraerTextoDeImagen(): Promise<ResultadoParsing> {
    this.llamadas++;
    return Promise.resolve(this.resultado);
  }
}

const PERFIL_VALIDO = JSON.stringify({
  habilidades: [{ nombre: 'TypeScript', nivel: 'avanzado' }],
  experiencias: [
    { cargo: 'Desarrollador', empresa: 'ACME', descripcion: 'Backend', logros: ['x'] },
  ],
  certificaciones: [],
  idiomas: [{ idioma: 'Español' }],
});

const PDF_BUFFER = Buffer.from('%PDF-1.4 contenido');
const IMG_BUFFER = Buffer.from('bytes-de-imagen');

describe('PerfilExtractorService.extraerDeTexto', () => {
  it('E1. texto → PerfilExtraido tipado válido', async () => {
    const proveedor = new ProveedorSimulado([PERFIL_VALIDO]);
    const ia = new IaService(proveedor);
    const servicio = new PerfilExtractorService(
      ia,
      new ParsingService(),
      new OcrService(ia),
    );

    const perfil = await servicio.extraerDeTexto('Hoja de vida de prueba');

    expect(perfil.habilidades).toEqual([{ nombre: 'TypeScript', nivel: 'avanzado' }]);
    expect(perfil.idiomas).toEqual([{ idioma: 'Español' }]);
    expect(proveedor.llamadas).toBe(1);
  });

  it('E2. NO inventa: los campos extra del LLM se descartan por Zod', async () => {
    const conExtras = JSON.stringify({
      habilidades: [{ nombre: 'SQL', nivel: 'medio', inventadoNivel: 99 }],
      experiencias: [],
      certificaciones: [],
      idiomas: [],
      edad: 47,
      campoFantasma: 'no debería persistir',
    });
    const ia = new IaService(new ProveedorSimulado([conExtras]));
    const servicio = new PerfilExtractorService(
      ia,
      new ParsingService(),
      new OcrService(ia),
    );

    const perfil = await servicio.extraerDeTexto('texto');

    // Campos fuera del esquema no aparecen.
    expect(perfil).not.toHaveProperty('edad');
    expect(perfil).not.toHaveProperty('campoFantasma');
    // Y dentro de un ítem, tampoco se cuela una propiedad ajena.
    expect(perfil.habilidades[0]).toEqual({ nombre: 'SQL', nivel: 'medio' });
    expect(perfil.habilidades[0]).not.toHaveProperty('inventadoNivel');
  });
});

describe('PerfilExtractorService.extraerDeArchivo', () => {
  it('E3. PDF con texto → usa ParsingService y NO llama a OCR', async () => {
    const parsing = new ParsingServiceFalso({
      texto: 'Texto del CV en PDF',
      textoLegible: true,
    });
    const ocr = new OcrServiceFalso({ texto: '', textoLegible: false });
    const ia = new IaService(new ProveedorSimulado([PERFIL_VALIDO]));
    const servicio = new PerfilExtractorService(ia, parsing, ocr);

    const perfil = await servicio.extraerDeArchivo(PDF_BUFFER, 'application/pdf');

    expect(perfil.habilidades.length).toBe(1);
    expect(parsing.llamadas).toBe(1);
    expect(ocr.llamadas).toBe(0);
  });

  it('E4. imagen → usa OcrService y luego extrae', async () => {
    const parsing = new ParsingServiceFalso({ texto: '', textoLegible: false });
    const ocr = new OcrServiceFalso({
      texto: 'Texto transcrito de la imagen',
      textoLegible: true,
    });
    const ia = new IaService(new ProveedorSimulado([PERFIL_VALIDO]));
    const servicio = new PerfilExtractorService(ia, parsing, ocr);

    const perfil = await servicio.extraerDeArchivo(IMG_BUFFER, 'image/png');

    expect(perfil.habilidades.length).toBe(1);
    // Es imagen: no se toca ParsingService.
    expect(parsing.llamadas).toBe(0);
    expect(ocr.llamadas).toBe(1);
  });

  it('E5. PDF sin texto legible → intenta OCR; si OCR tampoco → SinTextoLegibleError', async () => {
    const parsing = new ParsingServiceFalso({ texto: '', textoLegible: false });
    const ocr = new OcrServiceFalso({ texto: '', textoLegible: false });
    const ia = new IaService(new ProveedorSimulado([PERFIL_VALIDO]));
    const servicio = new PerfilExtractorService(ia, parsing, ocr);

    await expect(
      servicio.extraerDeArchivo(PDF_BUFFER, 'application/pdf'),
    ).rejects.toBeInstanceOf(SinTextoLegibleError);

    expect(parsing.llamadas).toBe(1);
    expect(ocr.llamadas).toBe(1);
  });

  it('E6. JSON inválido persistente → propaga IaError "peticion"', async () => {
    const parsing = new ParsingServiceFalso({
      texto: 'Texto del CV en PDF',
      textoLegible: true,
    });
    const ocr = new OcrServiceFalso({ texto: '', textoLegible: false });
    // El proveedor nunca devuelve JSON válido → completarJson agota reintentos.
    const ia = new IaService(new ProveedorSimulado(['no soy json']));
    const servicio = new PerfilExtractorService(ia, parsing, ocr);

    try {
      await servicio.extraerDeArchivo(PDF_BUFFER, 'application/pdf');
      expect.fail('debía lanzar IaError');
    } catch (e) {
      expect(e).toBeInstanceOf(IaError);
      expect((e as IaError).tipo).toBe('peticion');
      expect((e as IaError).recuperable).toBe(false);
    }
  });

  it('E5b. respaldo OCR sobre formato no soportado → SinTextoLegibleError (no error de formato)', async () => {
    // Doble de OcrService que lanza FormatoNoSoportadoError al intentar OCR de
    // un tipo no-imagen: el orquestador debe traducirlo a SinTextoLegibleError.
    class OcrServiceQueRechaza extends OcrService {
      constructor() {
        super(new IaService(new ProveedorSimulado([''])));
      }
      override extraerTextoDeImagen(): Promise<ResultadoParsing> {
        return Promise.reject(new FormatoNoSoportadoError());
      }
    }
    const parsing = new ParsingServiceFalso({ texto: '', textoLegible: false });
    const ia = new IaService(new ProveedorSimulado([PERFIL_VALIDO]));
    const servicio = new PerfilExtractorService(ia, parsing, new OcrServiceQueRechaza());

    await expect(
      servicio.extraerDeArchivo(PDF_BUFFER, 'application/pdf'),
    ).rejects.toBeInstanceOf(SinTextoLegibleError);
  });
});
