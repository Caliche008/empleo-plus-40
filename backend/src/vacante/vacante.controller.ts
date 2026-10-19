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
import { analizarVacanteSchema } from './dto/analizar-vacante.dto.js';
import { validarCon } from './dto/validar.js';
import {
  AnalisisFallidoError,
  TextoVacanteInvalidoError,
  VacanteNoEncontradaError,
} from './errores.js';
import { VacanteService } from './vacante.service.js';

/**
 * Endpoint HTTP del análisis de vacante. La validación de entrada se hace con
 * Zod (`validarCon`) y los errores de dominio se traducen aquí a excepciones
 * HTTP, de modo que el servicio permanece desacoplado del transporte y nunca se
 * filtra un error crudo del proveedor de IA ni de la base de datos.
 */
@Controller('vacante')
export class VacanteController {
  constructor(private readonly vacante: VacanteService) {}

  /**
   * Analiza el TEXTO pegado de una oferta, lo persiste y devuelve el análisis
   * con el `id` de la vacante guardada (para referenciarla después).
   */
  @Post('analizar')
  async analizar(@Body() body: unknown) {
    try {
      const dto = validarCon(analizarVacanteSchema, body);
      return await this.vacante.analizar(dto.texto);
    } catch (error) {
      throw this.aHttp(error);
    }
  }

  /** Devuelve una vacante por id con sus alertas (404 si no existe). */
  @Get(':id')
  async obtener(@Param('id') id: string) {
    try {
      return await this.vacante.obtener(id);
    } catch (error) {
      throw this.aHttp(error);
    }
  }

  /**
   * Traduce errores de dominio a excepciones HTTP con mensaje claro. El texto
   * inválido es 400; un fallo de IA es 502; una vacante inexistente es 404
   * (todos con mensaje amable, sin stacktrace). Cualquier otro error (incluido
   * `OperacionFallidaError`) se re-lanza tal cual para que Nest responda 500 sin
   * que aquí se filtre su contenido.
   */
  private aHttp(error: unknown): unknown {
    if (error instanceof TextoVacanteInvalidoError) {
      return new BadRequestException(error.message);
    }
    if (error instanceof AnalisisFallidoError) {
      return new BadGatewayException(error.message);
    }
    if (error instanceof VacanteNoEncontradaError) {
      return new NotFoundException(error.message);
    }
    return error;
  }
}
