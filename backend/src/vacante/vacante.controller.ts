import { BadGatewayException, BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { analizarVacanteSchema } from './dto/analizar-vacante.dto.js';
import { validarCon } from './dto/validar.js';
import { AnalisisFallidoError, TextoVacanteInvalidoError } from './errores.js';
import { VacanteService } from './vacante.service.js';

/**
 * Endpoint HTTP del análisis de vacante. La validación de entrada se hace con
 * Zod (`validarCon`) y los errores de dominio se traducen aquí a excepciones
 * HTTP, de modo que el servicio permanece desacoplado del transporte y nunca se
 * filtra un error crudo del proveedor de IA.
 *
 * Fuera de alcance en esta fase: `GET /vacante/:id` (requiere persistencia).
 */
@Controller('vacante')
export class VacanteController {
  constructor(private readonly vacante: VacanteService) {}

  /**
   * Analiza el TEXTO pegado de una oferta y devuelve el `VacanteAnalizada`. No
   * persiste nada: el análisis se devuelve directo en la respuesta.
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

  /**
   * Traduce errores de dominio a excepciones HTTP con mensaje claro. El texto
   * inválido es 400; un fallo de IA es 502 (mensaje amable, sin stacktrace).
   * Cualquier otro error se re-lanza tal cual para que Nest responda 500 sin que
   * aquí se filtre su contenido.
   */
  private aHttp(error: unknown): unknown {
    if (error instanceof TextoVacanteInvalidoError) {
      return new BadRequestException(error.message);
    }
    if (error instanceof AnalisisFallidoError) {
      return new BadGatewayException(error.message);
    }
    return error;
  }
}
