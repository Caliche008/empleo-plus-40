/**
 * Puente provisional sin autenticacion: pasa el borrador del perfil y el id
 * confirmado entre pantallas vIa `sessionStorage`. Documentado como temporal; se
 * reemplaza cuando exista sesion real.
 */

import type { CrearPerfil } from "@/lib/api/tipos-perfil";

/** Borrador en construccion antes de confirmar. Misma forma que CrearPerfil. */
export type BorradorPerfil = CrearPerfil;

export const CLAVE_BORRADOR = "ep40.borrador-perfil";
export const CLAVE_PERFIL_ID = "ep40.perfil-id";

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
