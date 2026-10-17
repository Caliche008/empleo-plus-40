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
  Post,
} from '@nestjs/common';
import { actualizarPerfilSchema } from './dto/actualizar-perfil.dto.js';
import { crearPerfilSchema } from './dto/crear-perfil.dto.js';
import { PREGUNTAS_PERFIL, type Pregunta } from './dto/preguntas.dto.js';
import { validarCon } from './dto/validar.js';
import {
  ConsentimientoRequeridoError,
  DatosInvalidosError,
  PerfilNoEncontradoError,
} from './errores.js';
import { PerfilService } from './perfil.service.js';

/**
 * Endpoints HTTP del perfil del candidato. La validación de entrada se hace con
 * Zod (`validarCon`) y los errores de dominio se traducen aquí a excepciones
 * HTTP, de modo que el servicio permanece desacoplado del transporte y nunca se
 * filtra un error crudo de la base de datos.
 *
 * Fuera de alcance en esta fase: `POST /perfil/cv` (subida de archivo con
 * multer) y `POST /perfil/voz`.
 */
@Controller('perfil')
export class PerfilController {
  constructor(private readonly perfil: PerfilService) {}

  /**
   * Preguntas de la creación guiada (R2). Se declara ANTES de `/:id` para que la
   * ruta con parámetro no capture la palabra "preguntas".
   */
  @Get('preguntas')
  preguntas(): readonly Pregunta[] {
    return PREGUNTAS_PERFIL;
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
    if (error instanceof ConsentimientoRequeridoError || error instanceof DatosInvalidosError) {
      return new BadRequestException(error.message);
    }
    return error;
  }
}
