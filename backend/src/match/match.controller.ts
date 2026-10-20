import {
  BadGatewayException,
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
} from '@nestjs/common';
import { IaError } from '../ia/ia.types.js';
import { PerfilNoEncontradoError } from '../perfil/errores.js';
import { VacanteNoEncontradaError } from '../vacante/errores.js';
import { calcularMatchSchema } from './dto/calcular-match.dto.js';
import { validarCon } from './dto/validar.js';
import { EntradaMatchInvalidaError, MatchNoEncontradoError } from './errores.js';
import { MatchService } from './match.service.js';

/**
 * Endpoint HTTP del match. La validación de entrada se hace con Zod
 * (`validarCon`) y los errores de dominio se traducen aquí a excepciones HTTP,
 * de modo que el servicio permanece desacoplado del transporte y nunca se filtra
 * un error crudo del proveedor de IA ni de la base de datos (§10, §13).
 */
@Controller('match')
export class MatchController {
  constructor(private readonly match: MatchService) {}

  /**
   * Calcula y persiste el match entre un perfil y una vacante ya analizada.
   * Devuelve el match con su explicación completa.
   */
  @Post()
  async calcular(@Body() body: unknown) {
    try {
      const dto = validarCon(calcularMatchSchema, body);
      return await this.match.calcular(dto.candidatoId, dto.vacanteId);
    } catch (error) {
      throw this.aHttp(error);
    }
  }

  /** Devuelve un match persistido por id (404 si no existe). */
  @Get(':id')
  async obtener(@Param('id') id: string) {
    try {
      return await this.match.obtener(id);
    } catch (error) {
      throw this.aHttp(error);
    }
  }

  /**
   * Traduce errores de dominio a excepciones HTTP con mensaje claro: entrada
   * inválida → 400; perfil/vacante/match inexistente → 404; un `IaError` que
   * escapara (no debería: hay respaldo) → 502. Cualquier otro error (incluido
   * `OperacionFallidaError`) se re-lanza tal cual para que Nest responda 500 sin
   * filtrar su contenido.
   */
  private aHttp(error: unknown): unknown {
    if (error instanceof EntradaMatchInvalidaError) {
      return new BadRequestException(error.message);
    }
    if (
      error instanceof PerfilNoEncontradoError ||
      error instanceof VacanteNoEncontradaError ||
      error instanceof MatchNoEncontradoError
    ) {
      return new NotFoundException(error.message);
    }
    if (error instanceof IaError) {
      return new BadGatewayException(
        'No pudimos completar el análisis ahora mismo. Inténtalo de nuevo en un momento.',
      );
    }
    return error;
  }
}
