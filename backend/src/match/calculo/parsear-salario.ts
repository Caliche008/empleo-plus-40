/**
 * Parseo PURO de salario en texto libre, locale es-CO. Devuelve un número en la
 * misma unidad que `ObjetivoLaboral.salarioMin` (pesos) o `undefined` cuando el
 * texto no es numérico ("a convenir", etc.). Convenciones:
 * - '.' es separador de miles (es-CO): "3.500.000" → 3500000.
 * - ',' se trata como separador decimal: "3,5 millones" → 3.5 millones.
 * - "millones"/"mill"/"millon" multiplican por 1e6.
 * - un rango "X a Y" usa el MÍNIMO (conservador).
 */

/** Multiplicador cuando el texto menciona millones. */
const MILLON = 1_000_000;

/**
 * Convierte un fragmento numérico (ya sin palabras) a número, tratando '.' como
 * separador de miles y ',' como decimal. Devuelve `undefined` si no hay dígitos.
 */
function aNumero(fragmento: string): number | undefined {
  // Se quitan los puntos (miles) y se normaliza la coma decimal a punto.
  const limpio = fragmento.replace(/\./g, '').replace(',', '.').trim();
  if (!/\d/.test(limpio)) {
    return undefined;
  }
  const valor = Number.parseFloat(limpio);
  return Number.isFinite(valor) ? valor : undefined;
}

export function parsearSalario(texto: string): number | undefined {
  if (!texto) {
    return undefined;
  }

  const normalizado = texto.toLowerCase();
  // ¿Menciona millones? Entonces los números van en esa unidad.
  const enMillones = /\bmill(?:on(?:es)?)?\b/.test(normalizado);

  // Se extraen los fragmentos numéricos (admiten '.', ',' y dígitos).
  const fragmentos = normalizado.match(/\d[\d.,]*/g);
  if (!fragmentos || fragmentos.length === 0) {
    return undefined;
  }

  const numeros = fragmentos
    .map((fragmento) => aNumero(fragmento))
    .filter((valor): valor is number => valor !== undefined)
    .map((valor) => (enMillones ? valor * MILLON : valor));

  if (numeros.length === 0) {
    return undefined;
  }

  // Un rango usa el mínimo (criterio conservador del diseño).
  return Math.min(...numeros);
}
