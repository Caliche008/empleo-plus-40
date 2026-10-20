/**
 * Tokenización ÚNICA del módulo match. Reglas, semántica de respaldo, sector y
 * brechas comparan términos con este mismo criterio, de modo que el resultado
 * es determinista y auditable. Cualquier cambio aquí (stopwords o pasos) es un
 * cambio versionado que obliga a revisar los asserts de las pruebas.
 */

/**
 * Lista fija de stopwords en español. Se documenta aquí para que sea auditable
 * y estable entre versiones (ver diseño §4.3).
 */
export const STOPWORDS_ES: ReadonlySet<string> = new Set([
  'de',
  'la',
  'el',
  'y',
  'en',
  'con',
  'para',
  'un',
  'una',
  'los',
  'las',
  'del',
  'a',
  'o',
  'al',
  'por',
  'que',
]);

/**
 * Normaliza un texto a una lista de términos comparables:
 * (1) quita diacríticos (NFD + descarte de marcas), (2) pasa a minúsculas,
 * (3) separa por cualquier no-palabra unicode, (4) descarta vacíos y stopwords.
 */
export function normalizar(texto: string): string[] {
  if (!texto) {
    return [];
  }
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .split(/\W+/u)
    .filter((termino) => termino.length > 0 && !STOPWORDS_ES.has(termino));
}
