import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { IaService } from '../ia/ia.service.js';
import { IaError } from '../ia/ia.types.js';
import {
  construirPromptAnalizarVacante,
  vacanteAnalizadaSchema,
  type VacanteAnalizada,
} from '../ia/prompts/analizar-vacante.prompt.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  AnalisisFallidoError,
  LONGITUD_MINIMA_TEXTO,
  OperacionFallidaError,
  TextoVacanteInvalidoError,
  VacanteNoEncontradaError,
} from './errores.js';

/** Relaciones que se traen al leer una vacante completa. */
const INCLUDE_VACANTE = { alertas: true } satisfies Prisma.VacanteInclude;

/** Código de Prisma para "registro no encontrado". */
const PRISMA_NO_ENCONTRADO = 'P2025';

/**
 * El análisis de la IA más el `id` de la vacante ya persistida. El frontend
 * recibe la misma estructura del análisis con un `id` adicional para poder
 * referenciar la vacante guardada (paso previo al módulo de match).
 */
export type VacantePersistida = VacanteAnalizada & { id: string };

/**
 * Analiza el TEXTO pegado de una oferta, lo PERSISTE y devuelve el análisis con
 * el `id` de la vacante guardada. Reutiliza la capa de IA existente (prompt
 * versionado + esquema Zod) sin relajar la regla de no inventar: la salida se
 * valida contra `vacanteAnalizadaSchema`, de modo que cualquier campo ajeno que
 * el modelo intente colar queda descartado antes de guardar. La edad nunca se
 * persiste ni se usa (compliance).
 *
 * Esta fase persiste texto + análisis; NO hace fetch de URLs (fuera de alcance).
 */
@Injectable()
export class VacanteService {
  constructor(
    private readonly ia: IaService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Analiza el texto de la vacante y lo guarda. Valida la longitud mínima ANTES
   * de llamar a la IA (un texto vacío o muy corto no toca la red ni la base de
   * datos). Un fallo de la IA se traduce a `AnalisisFallidoError`; un fallo al
   * guardar se traduce a un error de dominio sin filtrar internos. Devuelve el
   * análisis con el `id` de la vacante persistida. `candidatoId` es opcional y
   * se guarda tal cual (sin FK), para asociar la vacante cuando aplique.
   */
  async analizar(texto: string, candidatoId?: string): Promise<VacantePersistida> {
    const limpio = texto?.trim() ?? '';
    if (limpio.length < LONGITUD_MINIMA_TEXTO) {
      throw new TextoVacanteInvalidoError();
    }

    let analisis: VacanteAnalizada;
    try {
      analisis = await this.ia.completarJson(
        { mensajes: construirPromptAnalizarVacante(limpio) },
        { esquema: vacanteAnalizadaSchema },
      );
    } catch (error) {
      if (error instanceof IaError) {
        throw new AnalisisFallidoError();
      }
      throw error;
    }

    // `textoOriginal` guarda lo que la persona pegó TAL CUAL (el texto que entró,
    // sin recortar ni inventar). Las alertas se crean anidadas en la misma
    // operación. La edad no aparece en el modelo, así que nunca se persiste.
    const data: Prisma.VacanteCreateInput = {
      candidatoId,
      cargo: analisis.cargo,
      textoOriginal: texto,
      obligatorios: analisis.obligatorios,
      deseables: analisis.deseables,
      habilidades: analisis.habilidades,
      experienciaPedida: analisis.experienciaPedida,
      ubicacion: analisis.ubicacion,
      modalidad: analisis.modalidad,
      salario: analisis.salario,
      alertas: {
        create: analisis.alertas.map((a) => ({ tipo: a.tipo, detalle: a.detalle })),
      },
    };

    let creada;
    try {
      creada = await this.prisma.vacante.create({ data, include: INCLUDE_VACANTE });
    } catch (error) {
      throw this.traducirError(error);
    }

    return { ...analisis, id: creada.id };
  }

  /** Devuelve la vacante con sus alertas o lanza `VacanteNoEncontradaError`. */
  async obtener(id: string) {
    let vacante;
    try {
      vacante = await this.prisma.vacante.findUnique({
        where: { id },
        include: INCLUDE_VACANTE,
      });
    } catch (error) {
      // Un fallo de la base de datos al leer se traduce a dominio; nunca se
      // filtra el error crudo de Prisma.
      throw this.traducirError(error, id);
    }
    if (!vacante) {
      throw new VacanteNoEncontradaError(id);
    }
    return vacante;
  }

  /**
   * Traduce errores crudos de Prisma a errores de dominio. `P2025` se mapea a
   * `VacanteNoEncontradaError`; cualquier otro se vuelve `OperacionFallidaError`
   * sin filtrar el mensaje interno de la base de datos (compliance).
   */
  private traducirError(error: unknown, id?: string): Error {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === PRISMA_NO_ENCONTRADO) {
        return new VacanteNoEncontradaError(id);
      }
    }
    return new OperacionFallidaError();
  }
}
