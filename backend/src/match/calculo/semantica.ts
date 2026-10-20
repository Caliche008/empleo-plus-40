import { normalizar } from './normalizar.js';
import type { EntradaMatch } from '../tipos.js';

/**
 * Similitud semántica de respaldo (determinista, sin red). Es el camino que usan
 * las pruebas y al que cae el servicio si los embeddings fallan (diseño §4.3).
 */

/** Resultado de la similitud semántica: dos señales independientes + su fuente. */
export interface SimilitudSemantica {
  /** Similitud 0..1 entre habilidades del perfil y de la vacante. */
  simHabilidades: number;
  /** Similitud 0..1 entre experiencia del perfil y requisitos de la vacante. */
  simExperiencia: number;
  /** De dónde salió: aquí siempre 'respaldo'. */
  fuente: 'embeddings' | 'respaldo';
}

/**
 * Coeficiente de Jaccard |A ∩ B| / |A ∪ B| sobre los conjuntos de términos
 * normalizados de `a` y `b`. Idénticos → 1; disjuntos → 0; ambos vacíos → 0.
 */
export function similitudSolapamiento(a: string, b: string): number {
  const conjuntoA = new Set(normalizar(a));
  const conjuntoB = new Set(normalizar(b));

  if (conjuntoA.size === 0 && conjuntoB.size === 0) {
    return 0;
  }

  let interseccion = 0;
  for (const termino of conjuntoA) {
    if (conjuntoB.has(termino)) {
      interseccion += 1;
    }
  }
  const union = conjuntoA.size + conjuntoB.size - interseccion;
  return union === 0 ? 0 : interseccion / union;
}

/**
 * Calcula las dos similitudes canónicas por solapamiento (Jaccard) sobre los
 * mismos pares de textos que usaría el camino de embeddings:
 * - habilidades: perfil.habilidades ↔ vacante.habilidades.
 * - experiencia: perfil.experiencia ↔ vacante.obligatorios+deseables+experienciaPedida.
 */
export function similitudRespaldo(entrada: EntradaMatch): SimilitudSemantica {
  const textoHabilidadesPerfil = entrada.perfil.habilidades.join(' ');
  const textoHabilidadesVacante = entrada.vacante.habilidades.join(' ');

  const textoExperienciaPerfil = entrada.perfil.experiencia.join(' ');
  const textoRequisitosVacante = [
    ...entrada.vacante.obligatorios,
    ...entrada.vacante.deseables,
    entrada.vacante.experienciaPedida ?? '',
  ].join(' ');

  return {
    simHabilidades: similitudSolapamiento(textoHabilidadesPerfil, textoHabilidadesVacante),
    simExperiencia: similitudSolapamiento(textoExperienciaPerfil, textoRequisitosVacante),
    fuente: 'respaldo',
  };
}
