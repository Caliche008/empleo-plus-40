import { Injectable } from '@nestjs/common';
import { IaService } from '../ia/ia.service.js';
import { IaError } from '../ia/ia.types.js';
import {
  construirPromptAnalizarVacante,
  vacanteAnalizadaSchema,
  type VacanteAnalizada,
} from '../ia/prompts/analizar-vacante.prompt.js';
import { AnalisisFallidoError, LONGITUD_MINIMA_TEXTO, TextoVacanteInvalidoError } from './errores.js';

/**
 * Analiza el TEXTO pegado de una oferta y devuelve un `VacanteAnalizada`.
 * Reutiliza la capa de IA existente (prompt versionado + esquema Zod) sin relajar
 * la regla de no inventar: la salida se valida contra `vacanteAnalizadaSchema`,
 * de modo que cualquier campo ajeno que el modelo intente colar queda descartado.
 *
 * Esta fase SOLO analiza texto: NO persiste nada ni hace fetch de URLs.
 */
@Injectable()
export class VacanteService {
  constructor(private readonly ia: IaService) {}

  /**
   * Analiza el texto de la vacante. Valida la longitud mínima ANTES de llamar a
   * la IA (un texto vacío o muy corto no toca la red). Un fallo de la IA se
   * traduce a `AnalisisFallidoError` (mensaje amable, sin filtrar internos); el
   * resto de errores se propaga tal cual.
   */
  async analizar(texto: string): Promise<VacanteAnalizada> {
    const limpio = texto?.trim() ?? '';
    if (limpio.length < LONGITUD_MINIMA_TEXTO) {
      throw new TextoVacanteInvalidoError();
    }

    try {
      return await this.ia.completarJson(
        { mensajes: construirPromptAnalizarVacante(limpio) },
        { esquema: vacanteAnalizadaSchema },
      );
    } catch (error) {
      if (error instanceof IaError) {
        throw new AnalisisFallidoError();
      }
      throw error;
    }
  }
}
