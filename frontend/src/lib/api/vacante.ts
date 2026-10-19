/**
 * Funciones por endpoint del análisis de vacante. Se invocan desde Client
 * Components (la base `/api` es relativa same-origin) y lanzan `ErrorApi` ya
 * traducido por `cliente.ts` (texto inválido 400, IA caída 502, backend no
 * disponible por `esRed`).
 */

import { solicitar } from "@/lib/api/cliente";
import type { VacanteAnalizada } from "@/lib/api/tipos-vacante";

/**
 * Analiza el TEXTO pegado de una oferta y devuelve el `VacanteAnalizada`. No
 * persiste nada: el backend responde el análisis directo.
 */
export async function analizarVacante(texto: string): Promise<VacanteAnalizada> {
  return solicitar<VacanteAnalizada>("/vacante/analizar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ texto }),
  });
}
