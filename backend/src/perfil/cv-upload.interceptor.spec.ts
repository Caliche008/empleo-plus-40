import {
  BadRequestException,
  Module,
  PayloadTooLargeException,
} from '@nestjs/common';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { traducirErrorMulter } from './cv-upload.interceptor.js';
import { PerfilController } from './perfil.controller.js';
import { PerfilExtractorService } from './perfil-extractor.service.js';
import { PerfilService } from './perfil.service.js';

/**
 * Imita un `MulterError`: multer identifica sus fallos por `code` y pone
 * `name === 'MulterError'`. No se importa la clase real porque `@types/multer`
 * no la expone; el guard del interceptor también se apoya en `name`/`code`.
 */
function errorMulter(code: string, mensajeIngles: string): Error {
  const error = new Error(mensajeIngles);
  error.name = 'MulterError';
  (error as { code?: string }).code = code;
  return error;
}

describe('traducirErrorMulter', () => {
  it('traduce LIMIT_FILE_SIZE a 413 con el mensaje español de ArchivoDemasiadoGrandeError', () => {
    const traducido = traducirErrorMulter(
      errorMulter('LIMIT_FILE_SIZE', 'File too large'),
    );

    expect(traducido).toBeInstanceOf(PayloadTooLargeException);
    const mensaje = (traducido as PayloadTooLargeException).message;
    expect(mensaje).toMatch(/demasiado grande/i);
    expect(mensaje).not.toMatch(/File too large/i);
  });

  it('traduce otros errores de multer a 400 con mensaje español, sin filtrar el texto en inglés', () => {
    const traducido = traducirErrorMulter(
      errorMulter('LIMIT_UNEXPECTED_FILE', 'Unexpected file field'),
    );

    expect(traducido).toBeInstanceOf(BadRequestException);
    const mensaje = (traducido as BadRequestException).message;
    expect(mensaje).toMatch(/un solo archivo/i);
    expect(mensaje).not.toMatch(/Unexpected file field/i);
  });

  it('re-lanza tal cual un error que no es de multer (para que Nest responda 500 sin traducirlo)', () => {
    const crudo = new Error('fallo interno');

    expect(traducirErrorMulter(crudo)).toBe(crudo);
  });
});

/**
 * Prueba de integración ligera del interceptor REAL (multer en memoria) a
 * través de un módulo mínimo: solo el `PerfilController` con un
 * `PerfilExtractorService` simulado y un `PerfilService` vacío. No se importa
 * `IaModule` ni `PrismaModule`, así que no hay red ni base de datos.
 */
describe('POST /perfil/cv (interceptor real, sin red ni IA)', () => {
  const borrador = {
    habilidades: [{ nombre: 'Excel' }],
    experiencias: [],
    certificaciones: [],
    idiomas: [],
  };
  const extraerDeArchivo = vi.fn();

  let app: INestApplication;

  beforeAll(async () => {
    @Module({
      controllers: [PerfilController],
      providers: [
        { provide: PerfilService, useValue: {} },
        {
          provide: PerfilExtractorService,
          useValue: { extraerDeArchivo },
        },
      ],
    })
    class ModuloPrueba {}

    const moduleRef = await Test.createTestingModule({
      imports: [ModuloPrueba],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    extraerDeArchivo.mockReset();
  });

  it('con un archivo pequeño devuelve 200 y { borrador }', async () => {
    extraerDeArchivo.mockResolvedValue(borrador);

    const respuesta = await request(app.getHttpServer())
      .post('/perfil/cv')
      .attach('archivo', Buffer.from('hoja de vida de prueba'), {
        filename: 'cv.txt',
        contentType: 'text/plain',
      });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toEqual({ borrador });
    expect(extraerDeArchivo).toHaveBeenCalledTimes(1);
  });

  it('sin archivo responde 400 con mensaje en español', async () => {
    const respuesta = await request(app.getHttpServer()).post('/perfil/cv');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toMatch(/adjuntar tu hoja de vida/i);
    expect(extraerDeArchivo).not.toHaveBeenCalled();
  });

  it('con un archivo mayor de 10 MB responde 413 en español (no "File too large")', async () => {
    const demasiadoGrande = Buffer.alloc(10 * 1024 * 1024 + 1, 0x61);

    const respuesta = await request(app.getHttpServer())
      .post('/perfil/cv')
      .attach('archivo', demasiadoGrande, {
        filename: 'enorme.txt',
        contentType: 'text/plain',
      });

    expect(respuesta.status).toBe(413);
    expect(respuesta.body.message).toMatch(/demasiado grande/i);
    expect(respuesta.body.message).not.toMatch(/File too large/i);
    expect(extraerDeArchivo).not.toHaveBeenCalled();
  });

  it('con varios archivos en el campo "archivo" responde 400 en español (no "Unexpected file field")', async () => {
    const respuesta = await request(app.getHttpServer())
      .post('/perfil/cv')
      .attach('archivo', Buffer.from('uno'), {
        filename: 'uno.txt',
        contentType: 'text/plain',
      })
      .attach('archivo', Buffer.from('dos'), {
        filename: 'dos.txt',
        contentType: 'text/plain',
      });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.message).toMatch(/un solo archivo/i);
    expect(respuesta.body.message).not.toMatch(/Unexpected file field/i);
    expect(extraerDeArchivo).not.toHaveBeenCalled();
  });
});
