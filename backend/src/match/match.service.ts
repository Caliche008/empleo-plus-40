import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { IaService } from '../ia/ia.service.js';
import { IaError } from '../ia/ia.types.js';
import {
  construirPromptExplicarMatch,
  explicacionMatchSchema,
  type ExplicacionMatch,
} from '../ia/prompts/explicar-match.prompt.js';
import { PerfilService } from '../perfil/perfil.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { VacanteService } from '../vacante/vacante.service.js';
import { calcularBrechas } from './calculo/brechas.js';
import { proyectarEntrada } from './calculo/entrada.js';
import { evaluarReglas } from './calculo/reglas.js';
import { decidir } from './calculo/recomendacion.js';
import { ponderar } from './calculo/ponderar.js';
import { MatchNoEncontradoError, OperacionFallidaError } from './errores.js';
import { SemanticaService } from './semantica.service.js';
import type { BrechaMatch, DesgloseMatch } from './tipos.js';

/** Código de Prisma para "registro no encontrado". */
const PRISMA_NO_ENCONTRADO = 'P2025';

/**
 * Resultado del match que se devuelve a la UI: el registro `Match` persistido
 * más la `ExplicacionMatch` completa (el registro solo guarda el `resumen` de la
 * explicación como string; la UI quiere también `porCriterio` y las sugerencias
 * por brecha).
 */
export type MatchConExplicacion = Awaited<ReturnType<MatchService['persistir']>> & {
  explicacionDetallada: ExplicacionMatch;
};

/**
 * Orquesta el cálculo del match perfil↔vacante y lo persiste. El cálculo es
 * determinista (reglas puras + similitud); la IA SOLO redacta la explicación y
 * nunca cambia el puntaje. El match NO se rompe si fallan los embeddings (cae a
 * respaldo en `SemanticaService`) ni si falla la IA de explicación (plantilla
 * determinista). Ningún error filtra internos de Prisma/Gemini/Neon (§9, §13).
 */
@Injectable()
export class MatchService {
  private readonly logger = new Logger(MatchService.name);

  constructor(
    private readonly perfilService: PerfilService,
    private readonly vacanteService: VacanteService,
    private readonly semanticaService: SemanticaService,
    private readonly ia: IaService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Calcula y persiste el match. Propaga `PerfilNoEncontradoError` /
   * `VacanteNoEncontradaError` (→ 404) desde los servicios de dominio. Un fallo
   * de BD al guardar se traduce a `OperacionFallidaError` (→ 500) sin filtrar
   * internos. Devuelve el `Match` guardado enriquecido con la explicación
   * completa para la UI.
   */
  async calcular(candidatoId: string, vacanteId: string): Promise<MatchConExplicacion> {
    // 1 y 2) Lectura de dominio: cualquier 404 se propaga tal cual.
    const perfil = await this.perfilService.obtener(candidatoId);
    const vacante = await this.vacanteService.obtener(vacanteId);

    // 3..8) Cálculo determinista (sin red salvo los embeddings del paso 5).
    const entrada = proyectarEntrada(perfil, vacante);
    const reglas = evaluarReglas(entrada);
    const semantica = await this.semanticaService.similitud(entrada);
    const { puntaje, desglose } = ponderar(reglas, semantica);
    const { cubiertos, brechas } = calcularBrechas(entrada);
    const { recomendacion, razon } = decidir(puntaje, brechas);

    // 9) Explicación: la IA solo redacta; si falla, plantilla determinista.
    const explicacion = await this.explicar({
      puntaje,
      desglose,
      cubiertos,
      brechas,
      recomendacion,
      razon,
    });

    // 10) Una sola escritura; `embedding` queda NULL (MED-2). Traducir errores.
    const guardado = await this.persistir({
      candidatoId,
      vacanteId,
      puntaje,
      desglose,
      cubiertos,
      brechas,
      recomendacion,
      explicacion: explicacion.resumen,
    });

    return { ...guardado, explicacionDetallada: explicacion };
  }

  /** Devuelve un match por id o lanza `MatchNoEncontradoError` (→ 404). */
  async obtener(id: string) {
    let match;
    try {
      match = await this.prisma.match.findUnique({ where: { id } });
    } catch (error) {
      throw this.traducirError(error, id);
    }
    if (!match) {
      throw new MatchNoEncontradoError(id);
    }
    return match;
  }

  /** Escritura única del `Match`. Separada para poder tipar `MatchConExplicacion`. */
  private async persistir(data: {
    candidatoId: string;
    vacanteId: string;
    puntaje: number;
    desglose: DesgloseMatch;
    cubiertos: string[];
    brechas: BrechaMatch[];
    recomendacion: string;
    explicacion: string;
  }) {
    try {
      return await this.prisma.match.create({
        data: {
          candidatoId: data.candidatoId,
          vacanteId: data.vacanteId,
          puntaje: data.puntaje,
          // `desglose` y `brechas` son JSON con forma estable (tipos.ts). Se
          // castean a InputJsonValue porque Prisma los expone como Json.
          desglose: data.desglose as unknown as Prisma.InputJsonValue,
          cubiertos: data.cubiertos,
          brechas: data.brechas as unknown as Prisma.InputJsonValue,
          recomendacion: data.recomendacion,
          explicacion: data.explicacion,
        },
      });
    } catch (error) {
      throw this.traducirError(error);
    }
  }

  /**
   * Pide al LLM que redacte la explicación del resultado YA calculado. Valida la
   * salida contra `explicacionMatchSchema` (sin `.strict()`: un `puntaje` que el
   * modelo cuele se descarta). Ante cualquier `IaError` (incluido JSON inválido
   * tras reintentos) NO rompe el match: devuelve una explicación por plantilla
   * determinista, armada solo con datos ya calculados.
   */
  private async explicar(datos: {
    puntaje: number;
    desglose: DesgloseMatch;
    cubiertos: string[];
    brechas: BrechaMatch[];
    recomendacion: string;
    razon: string;
  }): Promise<ExplicacionMatch> {
    try {
      return await this.ia.completarJson(
        {
          mensajes: construirPromptExplicarMatch({
            puntaje: datos.puntaje,
            desglose: datos.desglose,
            cubiertos: datos.cubiertos,
            brechas: datos.brechas,
            recomendacion: datos.recomendacion,
          }),
        },
        { esquema: explicacionMatchSchema },
      );
    } catch (error) {
      if (error instanceof IaError) {
        this.logger.warn('IA de explicación no disponible; se usa la plantilla de respaldo.');
        return this.explicacionDeRespaldo(datos);
      }
      throw error;
    }
  }

  /**
   * Explicación por plantilla determinista (sin IA). Usa solo datos calculados:
   * puntaje, recomendación y brechas. Avisa, con tono sobrio, que el detalle no
   * está disponible. Las sugerencias por brecha quedan vacías (las rellenaría la
   * IA). Nunca menciona edad/nombre/género ni inventa nada (§8).
   */
  private explicacionDeRespaldo(datos: {
    puntaje: number;
    desglose: DesgloseMatch;
    brechas: BrechaMatch[];
    recomendacion: string;
    razon: string;
  }): ExplicacionMatch {
    const resumen =
      `Compatibilidad de ${datos.puntaje} de 100. Recomendación: ${datos.recomendacion}. ` +
      `${datos.razon} ` +
      'La explicación detallada no está disponible en este momento.';

    return {
      resumen,
      porCriterio: datos.desglose.criterios.map((c) => ({
        criterio: c.criterio,
        comentario: `Aporta ${Math.round(c.aporte)} de ${Math.round(c.pesoEfectivo)} puntos posibles.`,
      })),
      brechas: datos.brechas.map((b) => ({ requisito: b.requisito })),
    };
  }

  /**
   * Traduce errores crudos de Prisma a errores de dominio. `P2025` → match no
   * encontrado; cualquier otro → `OperacionFallidaError` sin filtrar el mensaje
   * interno de la base de datos (compliance).
   */
  private traducirError(error: unknown, id?: string): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === PRISMA_NO_ENCONTRADO) {
        return new MatchNoEncontradoError(id);
      }
    }
    return new OperacionFallidaError();
  }
}
