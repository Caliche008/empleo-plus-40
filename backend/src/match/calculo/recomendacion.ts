import type { BrechaMatch, Recomendacion } from '../tipos.js';

/**
 * Decisión PURA de recomendación a partir del puntaje y las brechas (R4).
 * Reglas (umbrales nombrados para poder ajustarlos con una prueba):
 * - `descartar` si el puntaje está por debajo de `UMBRAL_BAJO`.
 * - `postular` si el puntaje llega a `UMBRAL_ALTO` y no hay brecha obligatoria.
 * - `postular-ajustes` en el resto, y SIEMPRE que haya al menos una brecha
 *   obligatoria aunque el puntaje sea alto.
 */

/** Por debajo de este puntaje se descarta. */
export const UMBRAL_BAJO = 45;

/** A partir de este puntaje (y sin brecha obligatoria) se recomienda postular. */
export const UMBRAL_ALTO = 70;

export function decidir(
  puntaje: number,
  brechas: BrechaMatch[],
): { recomendacion: Recomendacion; razon: string } {
  const hayBrechaObligatoria = brechas.some((b) => b.obligatorio);

  if (puntaje < UMBRAL_BAJO) {
    return {
      recomendacion: 'descartar',
      razon: 'La compatibilidad es baja para esta vacante.',
    };
  }

  if (puntaje >= UMBRAL_ALTO && !hayBrechaObligatoria) {
    return {
      recomendacion: 'postular',
      razon: 'Buena compatibilidad y sin requisitos obligatorios sin cubrir.',
    };
  }

  if (hayBrechaObligatoria) {
    return {
      recomendacion: 'postular-ajustes',
      razon: 'Hay al menos un requisito obligatorio sin cubrir; conviene reforzarlo antes de postular.',
    };
  }

  return {
    recomendacion: 'postular-ajustes',
    razon: 'Compatibilidad media; postula reforzando los puntos más débiles.',
  };
}
