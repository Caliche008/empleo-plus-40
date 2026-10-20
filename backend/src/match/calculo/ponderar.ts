import type { CriterioMatch, DesgloseMatch } from '../tipos.js';
import type { ReglasEvaluadas, ValorRegla } from './reglas.js';
import type { SimilitudSemantica } from './semantica.js';

/**
 * Ponderación PURA 0..100 con redistribución. Pesos fijos documentados (diseño
 * §5); el peso de un criterio sin dato se reparte proporcionalmente entre los
 * que sí tienen dato, de modo que el denominador sigue sumando 100.
 */

/** Pesos base fijos. Suman 100. */
export const PESOS: Record<CriterioMatch, number> = {
  habilidades: 35,
  experiencia: 30,
  sector: 15,
  'ubicacion-modalidad': 12,
  salario: 8,
};

/** Un criterio listo para ponderar: su valor 0..1 y si el dato estaba presente. */
interface CriterioEntrada {
  criterio: CriterioMatch;
  valor: number;
  datoPresente: boolean;
}

/** Acota un valor a [0, 1] por seguridad numérica. */
function acotar01(valor: number): number {
  if (valor < 0) {
    return 0;
  }
  if (valor > 1) {
    return 1;
  }
  return valor;
}

export function ponderar(
  reglas: ReglasEvaluadas,
  semantica: SimilitudSemantica,
): { puntaje: number; desglose: DesgloseMatch } {
  // Habilidades y experiencia siempre tienen dato (la similitud siempre produce
  // un valor, sea por embeddings o por respaldo).
  const habilidades: ValorRegla = { valor: acotar01(semantica.simHabilidades), datoPresente: true };
  const experiencia: ValorRegla = { valor: acotar01(semantica.simExperiencia), datoPresente: true };

  const criterios: CriterioEntrada[] = [
    { criterio: 'habilidades', valor: habilidades.valor, datoPresente: habilidades.datoPresente },
    { criterio: 'experiencia', valor: experiencia.valor, datoPresente: experiencia.datoPresente },
    { criterio: 'sector', valor: acotar01(reglas.sector.valor), datoPresente: reglas.sector.datoPresente },
    {
      criterio: 'ubicacion-modalidad',
      valor: acotar01(reglas.ubicacionModalidad.valor),
      datoPresente: reglas.ubicacionModalidad.datoPresente,
    },
    { criterio: 'salario', valor: acotar01(reglas.salario.valor), datoPresente: reglas.salario.datoPresente },
  ];

  // Peso presente y peso faltante para la redistribución proporcional.
  const pesoPresente = criterios
    .filter((c) => c.datoPresente)
    .reduce((suma, c) => suma + PESOS[c.criterio], 0);
  const pesoFaltante = 100 - pesoPresente;
  const pesosRedistribuidos = pesoFaltante > 0 && pesoPresente > 0;

  const desgloseCriterios = criterios.map((c) => {
    const pesoBase = PESOS[c.criterio];
    // Sin dato: peso efectivo 0 (su peso se reparte entre los presentes). Con
    // dato: su peso base más la parte proporcional del peso faltante.
    const pesoEfectivo = c.datoPresente
      ? pesoPresente > 0
        ? pesoBase + (pesoBase / pesoPresente) * pesoFaltante
        : 0
      : 0;
    const aporte = pesoEfectivo * c.valor;
    return {
      criterio: c.criterio,
      valor: c.valor,
      pesoBase,
      pesoEfectivo,
      aporte,
      datoPresente: c.datoPresente,
    };
  });

  const total = desgloseCriterios.reduce((suma, c) => suma + c.aporte, 0);
  const puntaje = Math.min(100, Math.max(0, Math.round(total)));

  return {
    puntaje,
    desglose: {
      criterios: desgloseCriterios,
      fuenteSemantica: semantica.fuente,
      pesosRedistribuidos,
    },
  };
}
