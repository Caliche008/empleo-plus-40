import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
} from '@nestjs/common';
import type { PerfilExtraido } from '../ia/prompts/extraer-perfil.prompt.js';
import {
  ArchivoDemasiadoGrandeError,
  ConsentimientoRequeridoError,
  DatosInvalidosError,
  FormatoNoSoportadoError,
  PerfilNoEncontradoError,
  SinTextoLegibleError,
} from './errores.js';
import { PerfilController } from './perfil.controller.js';
import type { PerfilExtractorService } from './perfil-extractor.service.js';
import type { PerfilService } from './perfil.service.js';

/**
 * Dobles inyectados: solo exponen lo que el controller invoca en estas pruebas.
 * No se levanta la app (sin TestingModule), ni red, ni IA real, ni archivos
 * reales, siguiendo el patrón de `perfil.service.spec.ts`.
 */
function crearControlador() {
  const extraerDeArchivo = vi.fn();
  const extractor = { extraerDeArchivo } as unknown as PerfilExtractorService;
  const perfil = {} as unknown as PerfilService;
  const controlador = new PerfilController(perfil, extractor);
  return { controlador, extraerDeArchivo };
}

/** Borrador mínimo válido que el extractor devolvería. */
function borradorFalso(): PerfilExtraido {
  return {
    habilidades: [{ nombre: 'Excel' }],
    experiencias: [
      { cargo: 'Cajera', descripcion: 'Atención al cliente', logros: [] },
    ],
    certificaciones: [],
    idiomas: [{ idioma: 'Español' }],
  };
}

/** Archivo subido mínimo (buffer en memoria) para las pruebas. */
function archivoFalso(): Express.Multer.File {
  return {
    buffer: Buffer.from('contenido del cv'),
    mimetype: 'application/pdf',
  } as Express.Multer.File;
}

describe('PerfilController.subirCv', () => {
  it('C1. con archivo válido llama a extraerDeArchivo con buffer y mimetype y devuelve el borrador', async () => {
    const { controlador, extraerDeArchivo } = crearControlador();
    const borrador = borradorFalso();
    extraerDeArchivo.mockResolvedValue(borrador);
    const archivo = archivoFalso();

    const resultado = await controlador.subirCv(archivo);

    expect(extraerDeArchivo).toHaveBeenCalledTimes(1);
    expect(extraerDeArchivo).toHaveBeenCalledWith(
      archivo.buffer,
      archivo.mimetype,
    );
    expect(resultado).toEqual({ borrador });
  });

  it('C2. sin archivo lanza BadRequestException (400) con mensaje claro y no llama al extractor', async () => {
    const { controlador, extraerDeArchivo } = crearControlador();

    await expect(controlador.subirCv(undefined)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    try {
      await controlador.subirCv(undefined);
      expect.fail('debía lanzar BadRequestException');
    } catch (e) {
      expect((e as BadRequestException).message).toMatch(
        /adjuntar tu hoja de vida/i,
      );
    }
    expect(extraerDeArchivo).not.toHaveBeenCalled();
  });

  it('C3. ArchivoDemasiadoGrandeError se traduce a 413 (PayloadTooLargeException) con el mensaje de dominio', async () => {
    const { controlador, extraerDeArchivo } = crearControlador();
    const dominio = new ArchivoDemasiadoGrandeError();
    extraerDeArchivo.mockRejectedValue(dominio);

    try {
      await controlador.subirCv(archivoFalso());
      expect.fail('debía lanzar PayloadTooLargeException');
    } catch (e) {
      expect(e).toBeInstanceOf(PayloadTooLargeException);
      expect((e as PayloadTooLargeException).message).toBe(dominio.message);
    }
  });

  it('C4. FormatoNoSoportadoError se traduce a 415 (UnsupportedMediaTypeException) con el mensaje de dominio', async () => {
    const { controlador, extraerDeArchivo } = crearControlador();
    const dominio = new FormatoNoSoportadoError();
    extraerDeArchivo.mockRejectedValue(dominio);

    try {
      await controlador.subirCv(archivoFalso());
      expect.fail('debía lanzar UnsupportedMediaTypeException');
    } catch (e) {
      expect(e).toBeInstanceOf(UnsupportedMediaTypeException);
      expect((e as UnsupportedMediaTypeException).message).toBe(
        dominio.message,
      );
    }
  });

  it('C5. SinTextoLegibleError se traduce a 422 (UnprocessableEntityException) con el mensaje de dominio', async () => {
    const { controlador, extraerDeArchivo } = crearControlador();
    const dominio = new SinTextoLegibleError();
    extraerDeArchivo.mockRejectedValue(dominio);

    try {
      await controlador.subirCv(archivoFalso());
      expect.fail('debía lanzar UnprocessableEntityException');
    } catch (e) {
      expect(e).toBeInstanceOf(UnprocessableEntityException);
      expect((e as UnprocessableEntityException).message).toBe(dominio.message);
    }
  });

  it('C6. (regresión) PerfilNoEncontradoError sigue siendo 404 y Consentimiento/DatosInvalidos siguen siendo 400', async () => {
    const { controlador, extraerDeArchivo } = crearControlador();

    extraerDeArchivo.mockRejectedValueOnce(new PerfilNoEncontradoError());
    await expect(controlador.subirCv(archivoFalso())).rejects.toBeInstanceOf(
      NotFoundException,
    );

    extraerDeArchivo.mockRejectedValueOnce(new ConsentimientoRequeridoError());
    await expect(controlador.subirCv(archivoFalso())).rejects.toBeInstanceOf(
      BadRequestException,
    );

    extraerDeArchivo.mockRejectedValueOnce(
      new DatosInvalidosError('dato inválido'),
    );
    await expect(controlador.subirCv(archivoFalso())).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('C7. (compliance) un Error genérico se re-lanza tal cual, sin traducir ni filtrar su mensaje', async () => {
    const { controlador, extraerDeArchivo } = crearControlador();
    const crudo = new Error(
      'fallo de IA: proveedor interno rechazó la petición',
    );
    extraerDeArchivo.mockRejectedValue(crudo);

    try {
      await controlador.subirCv(archivoFalso());
      expect.fail('debía re-lanzar el error genérico');
    } catch (e) {
      // Se re-lanza el mismo objeto; Nest responderá 500 sin exponer traducción.
      expect(e).toBe(crudo);
    }
  });
});
