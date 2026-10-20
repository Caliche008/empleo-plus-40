import { Injectable, Logger } from '@nestjs/common';
import { IaService } from '../ia/ia.service.js';
import { similitudRespaldo, type SimilitudSemantica } from './calculo/semantica.js';
import type { EntradaMatch } from './tipos.js';

/** Dimensión esperada del embedding (text-embedding-004 → 768, FEAT-001). */
const DIMENSION_ESPERADA = 768;

/**
 * Calcula las dos similitudes semánticas (habilidades y experiencia) del match.
 * Camino principal: embeddings de Gemini comparados vector a vector en memoria
 * (dos cosenos, diseño §4.3). Camino de respaldo: Jaccard determinista sin red
 * (`similitudRespaldo`). NUNCA lanza por un fallo de embeddings: ante cualquier
 * error (IaError, dimensión ≠ 768, proveedor sin soporte) cae al respaldo, de
 * modo que el match sigue produciendo un puntaje (R1, robustez §3.3).
 */
@Injectable()
export class SemanticaService {
  private readonly logger = new Logger(SemanticaService.name);

  constructor(private readonly ia: IaService) {}

  /**
   * Devuelve `simHabilidades`/`simExperiencia` 0..1 y la `fuente`. Arma los
   * cuatro textos canónicos, pide un embedding por texto (taskType
   * SEMANTIC_SIMILARITY ya fijado en el provider), valida la dimensión y calcula
   * los dos cosenos normalizados `(cos + 1) / 2`. Si algo falla, usa el respaldo.
   */
  async similitud(entrada: EntradaMatch): Promise<SimilitudSemantica> {
    const habilidadesPerfil = entrada.perfil.habilidades.join(' ');
    const habilidadesVacante = entrada.vacante.habilidades.join(' ');
    const experienciaPerfil = entrada.perfil.experiencia.join(' ');
    const requisitosVacante = [
      ...entrada.vacante.obligatorios,
      ...entrada.vacante.deseables,
      entrada.vacante.experienciaPedida ?? '',
    ].join(' ');

    try {
      // Una llamada por texto; el provider conserva el orden de `textos`.
      const { vectores, dimension } = await this.ia.generarEmbedding({
        textos: [habilidadesPerfil, experienciaPerfil, habilidadesVacante, requisitosVacante],
      });

      if (dimension !== DIMENSION_ESPERADA || vectores.length !== 4) {
        throw new Error('dimension-inesperada');
      }
      const [hPerfil, ePerfil, hVacante, rVacante] = vectores;

      return {
        simHabilidades: cosenoNormalizado(hPerfil, hVacante),
        simExperiencia: cosenoNormalizado(ePerfil, rVacante),
        fuente: 'embeddings',
      };
    } catch {
      // Degradación limpia: nunca se filtra el error del proveedor y el cálculo
      // sigue con el respaldo determinista. Solo un aviso a nivel servicio.
      this.logger.warn('Embeddings no disponibles; se usa la similitud de respaldo.');
      return similitudRespaldo(entrada);
    }
  }
}

/**
 * Coseno de dos vectores normalizado a [0,1] con `(cos + 1) / 2`. Vectores vacíos
 * o de norma 0 → 0 (sin señal). No lanza: su caller ya está en el camino feliz.
 */
function cosenoNormalizado(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) {
    return 0;
  }
  let producto = 0;
  let normaA = 0;
  let normaB = 0;
  for (let i = 0; i < a.length; i++) {
    producto += a[i] * b[i];
    normaA += a[i] * a[i];
    normaB += b[i] * b[i];
  }
  if (normaA === 0 || normaB === 0) {
    return 0;
  }
  const coseno = producto / (Math.sqrt(normaA) * Math.sqrt(normaB));
  const normalizado = (coseno + 1) / 2;
  // Acota por seguridad numérica (el coseno puede salir de [-1,1] por redondeo).
  return Math.min(1, Math.max(0, normalizado));
}
