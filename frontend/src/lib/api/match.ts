/**
 * Funciones por endpoint del match (compatibilidad candidato ↔ vacante). Se
 * invocan desde Client Components (la base `/api` es relativa same-origin) y
 * lanzan `ErrorApi` ya traducido por `cliente.ts` (entrada inválida 400, perfil o
 * vacante no encontrados 404, backend no disponible por `esRed`).
 */

import { solicitar } from "@/lib/api/cliente";
import type { ResultadoMatch } from "@/lib/api/tipos-match";

/** Ids necesarios para calcular el match. Sin edad/nombre/género (compliance). */
export interface EntradaCalcularMatch {
  candidatoId: string;
  vacanteId: string;
}

/**
 * Calcula el match entre un candidato y una vacante y devuelve el
 * `ResultadoMatch` persistido, incluyendo `explicacionDetallada` para la UI. El
 * backend valida el cuerpo con `.strict()`: cualquier campo extra responde 400.
 */
export async function calcularMatch(
  entrada: EntradaCalcularMatch,
): Promise<ResultadoMatch> {
  return solicitar<ResultadoMatch>("/match", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(entrada),
  });
}

/**
 * Obtiene un match ya calculado por id (404 -> ErrorApi estado 404). No incluye
 * `explicacionDetallada`: ese campo solo viaja en la respuesta de `calcularMatch`.
 */
export async function obtenerMatch(id: string): Promise<ResultadoMatch> {
  return solicitar<ResultadoMatch>(`/match/${encodeURIComponent(id)}`);
}
