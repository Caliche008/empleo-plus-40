import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  PayloadTooLargeException,
  Post,
  UnprocessableEntityException,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { actualizarPerfilSchema } from './dto/actualizar-perfil.dto.js';
import { crearPerfilSchema } from './dto/crear-perfil.dto.js';
import { PREGUNTAS_PERFIL, type Pregunta } from './dto/preguntas.dto.js';
import { validarCon } from './dto/validar.js';
import {
  ArchivoDemasiadoGrandeError,
  ConsentimientoRequeridoError,
  DatosInvalidosError,
  FormatoNoSoportadoError,
  PerfilNoEncontradoError,
  SinTextoLegibleError,
} from './errores.js';
import { PerfilExtractorService } from './perfil-extractor.service.js';
import { PerfilService } from './perfil.service.js';

/**
 * Límite de tamaño del archivo subido (10 MB), coherente con el límite de
 * dominio de `ArchivoDemasiadoGrandeError`. Actúa como barrera temprana del
 * interceptor para no bufferizar en memoria archivos enormes.
 */
const MAX_BYTES_SUBIDA = 10 * 1024 * 1024;

/**
 * Endpoints HTTP del perfil del candidato. La validación de entrada se hace con
 * Zod (`validarCon`) y los errores de dominio se traducen aquí a excepciones
 * HTTP, de modo que el servicio permanece desacoplado del transporte y nunca se
 * filtra un error crudo de la base de datos.
 *
 * Fuera de alcance en esta fase: `POST /perfil/voz`.
 */
@Controller('perfil')
export class PerfilController {
  constructor(
    private readonly perfil: PerfilService,
    private readonly extractor: PerfilExtractorService,
  ) {}

  /**
   * Preguntas de la creación guiada (R2). Se declara ANTES de `/:id` para que la
   * ruta con parámetro no capture la palabra "preguntas".
   */
  @Get('preguntas')
  preguntas(): readonly Pregunta[] {
    return PREGUNTAS_PERFIL;
  }

  /**
   * Sube una hoja de vida y devuelve el BORRADOR extraído sin guardarlo (R1,
   * R4). El archivo llega en el campo de formulario `archivo`
   * (`multipart/form-data`) con almacenamiento en memoria (sin `storage`), de
   * modo que el contenido vive solo en `archivo.buffer` y se descarta al
   * terminar la petición: no se escribe a disco ni a base de datos.
   *
   * Se declara ANTES de `/:id` para que la ruta estática `cv` no sea capturada
   * por la ruta con parámetro. La respuesta es `{ borrador }` para comunicar que
   * es un borrador pendiente de confirmación vía `POST /perfil/confirmar`.
   */
  @Post('cv')
  @UseInterceptors(
    FileInterceptor('archivo', { limits: { fileSize: MAX_BYTES_SUBIDA } }),
  )
  async subirCv(@UploadedFile() archivo?: Express.Multer.File) {
    if (!archivo) {
      throw new BadRequestException(
        "Debes adjuntar tu hoja de vida en el campo 'archivo'.",
      );
    }
    try {
      const borrador = await this.extractor.extraerDeArchivo(
        archivo.buffer,
        archivo.mimetype,
      );
      return { borrador };
    } catch (error) {
      throw this.aHttp(error);
    }
  }

  /** Guarda el perfil confirmado por la persona (R4) y devuelve lo guardado. */
  @Post('confirmar')
  async confirmar(@Body() body: unknown) {
    const dto = validarCon(crearPerfilSchema, body);
    try {
      return await this.perfil.guardar(dto);
    } catch (error) {
      throw this.aHttp(error);
    }
  }

  /** Devuelve un perfil por id (404 si no existe). */
  @Get(':id')
  async obtener(@Param('id') id: string) {
    try {
      return await this.perfil.obtener(id);
    } catch (error) {
      throw this.aHttp(error);
    }
  }

  /** Aplica un parche parcial al perfil (404 si no existe). */
  @Patch(':id')
  async actualizar(@Param('id') id: string, @Body() body: unknown) {
    const cambios = validarCon(actualizarPerfilSchema, body);
    try {
      return await this.perfil.actualizar(id, cambios);
    } catch (error) {
      throw this.aHttp(error);
    }
  }

  /** Borra el perfil en un solo paso (R6). Responde 204 sin cuerpo. */
  @Delete(':id')
  @HttpCode(204)
  async eliminar(@Param('id') id: string): Promise<void> {
    try {
      await this.perfil.eliminar(id);
    } catch (error) {
      throw this.aHttp(error);
    }
  }

  /**
   * Traduce errores de dominio a excepciones HTTP con mensaje claro. Cualquier
   * otro error (incluido uno genérico de base de datos) se re-lanza tal cual
   * para que Nest responda 500 sin que aquí se filtre su contenido.
   */
  private aHttp(error: unknown): unknown {
    if (error instanceof PerfilNoEncontradoError) {
      return new NotFoundException(error.message);
    }
    if (
      error instanceof ConsentimientoRequeridoError ||
      error instanceof DatosInvalidosError
    ) {
      return new BadRequestException(error.message);
    }
    // El archivo excede el límite de tamaño: 413 es el código exacto para un
    // cuerpo demasiado grande.
    if (error instanceof ArchivoDemasiadoGrandeError) {
      return new PayloadTooLargeException(error.message);
    }
    // El tipo de archivo no es procesable: 415 describe un media type no
    // soportado.
    if (error instanceof FormatoNoSoportadoError) {
      return new UnsupportedMediaTypeException(error.message);
    }
    // El archivo llegó bien pero su contenido no se pudo procesar (p. ej. PDF
    // escaneado sin texto): 422 = sintaxis correcta pero contenido inprocesable.
    if (error instanceof SinTextoLegibleError) {
      return new UnprocessableEntityException(error.message);
    }
    return error;
  }
}
