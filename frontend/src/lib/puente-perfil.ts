/**
 * Puente provisional sin autenticacion: pasa entre pantallas (vIa
 * `sessionStorage`) el borrador del perfil, el id del perfil confirmado y el id
 * de la ultima vacante analizada. Asi la "ruta feliz" (perfil -> vacante ->
 * compatibilidad) fluye sin pedir identificadores a mano. Documentado como
 * temporal; se reemplaza cuando exista sesion real.
 */

import type { CrearPerfil } from "@/lib/api/tipos-perfil";

/** Borrador en construccion antes de confirmar. Misma forma que CrearPerfil. */
export type BorradorPerfil = CrearPerfil;

export const CLAVE_BORRADOR = "ep40.borrador-perfil";
export const CLAVE_PERFIL_ID = "ep40.perfil-id";
export const CLAVE_VACANTE_ID = "ep40.vacante-id";

/** Guarda el borrador en sessionStorage (JSON). */
export function guardarBorrador(borrador: BorradorPerfil): void {
  sessionStorage.setItem(CLAVE_BORRADOR, JSON.stringify(borrador));
}

/** Lee el borrador; devuelve null si no hay o no se puede parsear. */
export function leerBorrador(): BorradorPerfil | null {
  const crudo = sessionStorage.getItem(CLAVE_BORRADOR);
  if (!crudo) {
    return null;
  }
  try {
    return JSON.parse(crudo) as BorradorPerfil;
  } catch {
    return null;
  }
}

/** Borra el borrador (tras confirmar). */
export function limpiarBorrador(): void {
  sessionStorage.removeItem(CLAVE_BORRADOR);
}

/** Guarda el id del perfil confirmado. */
export function guardarPerfilId(id: string): void {
  sessionStorage.setItem(CLAVE_PERFIL_ID, id);
}

/** Lee el id del perfil confirmado (o null). */
export function leerPerfilId(): string | null {
  return sessionStorage.getItem(CLAVE_PERFIL_ID);
}

/** Guarda el id de la ultima vacante analizada y persistida. */
export function guardarVacanteId(id: string): void {
  sessionStorage.setItem(CLAVE_VACANTE_ID, id);
}

/** Lee el id de la ultima vacante analizada (o null). */
export function leerVacanteId(): string | null {
  return sessionStorage.getItem(CLAVE_VACANTE_ID);
}
