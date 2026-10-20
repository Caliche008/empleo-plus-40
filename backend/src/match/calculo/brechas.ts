import { normalizar } from './normalizar.js';
import type { BrechaMatch, EntradaMatch } from '../tipos.js';

/**
 * Brechas PURAS: salen del cálculo, nunca se inventan (compliance §3). Una
 * brecha es un requisito de la vacante (obligatorio o deseable) que el perfil NO
 * cubre por términos normalizados. `cubiertos` son los requisitos que sí cubre.
 * La `sugerencia` la deja vacía; la rellena el LLM en la explicación.
 */
export function calcularBrechas(entrada: EntradaMatch): {
  cubiertos: string[];
  brechas: BrechaMatch[];
} {
  const terminosPerfil = new Set(
    [...entrada.perfil.habilidades, ...entrada.perfil.experiencia].flatMap((t) => normalizar(t)),
  );

  const cubre = (requisito: string): boolean => {
    const terminos = normalizar(requisito);
    return terminos.some((t) => terminosPerfil.has(t));
  };

  const cubiertos: string[] = [];
  const brechas: BrechaMatch[] = [];

  for (const requisito of entrada.vacante.obligatorios) {
    if (cubre(requisito)) {
      cubiertos.push(requisito);
    } else {
      brechas.push({ requisito, obligatorio: true });
    }
  }
  for (const requisito of entrada.vacante.deseables) {
    if (cubre(requisito)) {
      cubiertos.push(requisito);
    } else {
      brechas.push({ requisito, obligatorio: false });
    }
  }

  return { cubiertos, brechas };
}
