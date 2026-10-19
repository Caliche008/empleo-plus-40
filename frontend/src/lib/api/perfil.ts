/**
 * Funciones por endpoint del perfil. Todas se invocan desde Client Components
 * (la base `/api` es relativa same-origin) y lanzan `ErrorApi` ya traducido.
 */

import { solicitar } from "@/lib/api/cliente";
import type {
  ActualizarPerfil,
  CrearPerfil,
  Perfil,
  Pregunta,
  RespuestaCv,
} from "@/lib/api/tipos-perfil";

/**
 * Sube una hoja de vida y devuelve el BORRADOR extraido (sin guardar). El campo
 * de formulario es exactamente `archivo` (coincide con `CAMPO_ARCHIVO` del
 * backend) y NO se fija `Content-Type`: el navegador agrega el boundary del
 * multipart automaticamente.
 */
export async function subirCv(archivo: File): Promise<RespuestaCv["borrador"]> {
  const cuerpo = new FormData();
  cuerpo.append("archivo", archivo);
  const respuesta = await solicitar<RespuestaCv>("/perfil/cv", {
    method: "POST",
    body: cuerpo,
  });
  return respuesta.borrador;
}

/** Lee la lista estatica de preguntas de la creacion guiada. */
export async function obtenerPreguntas(): Promise<Pregunta[]> {
  return solicitar<Pregunta[]>("/perfil/preguntas");
}

/**
 * Guarda el perfil confirmado por la persona. `consentimiento` debe ir en
 * `true` o el backend responde 400.
 */
export async function confirmarPerfil(datos: CrearPerfil): Promise<Perfil> {
  return solicitar<Perfil>("/perfil/confirmar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(datos),
  });
}

/** Obtiene un perfil por id (404 -> ErrorApi estado 404). */
export async function obtenerPerfil(id: string): Promise<Perfil> {
  return solicitar<Perfil>(`/perfil/${encodeURIComponent(id)}`);
}

/** Aplica un parche parcial al perfil (404 si no existe). */
export async function actualizarPerfil(
  id: string,
  cambios: ActualizarPerfil,
): Promise<Perfil> {
  return solicitar<Perfil>(`/perfil/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cambios),
  });
}

/** Elimina el perfil (204 sin cuerpo -> undefined). */
export async function eliminarPerfil(id: string): Promise<void> {
  await solicitar<void>(`/perfil/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
