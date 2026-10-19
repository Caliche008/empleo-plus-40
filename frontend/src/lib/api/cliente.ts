/**
 * Cliente HTTP de la capa de API. Base same-origin relativa (`/api`) reenviada
 * por el proxy `rewrites()` de Next al backend. Por ser relativa, SOLO resuelve
 * en el navegador: todas las funciones de `perfil.ts` se llaman desde Client
 * Components.
 *
 * `solicitar` prioriza SIEMPRE el `message` en espanol del backend (Nest
 * devuelve `{ statusCode, message, error }` con `message` string o string[]) y
 * cae a un texto por codigo solo si el cuerpo no es legible. Nunca filtra
 * detalles internos.
 */

/** Base de la API. Relativa same-origin salvo override explicito. */
const BASE = process.env.NEXT_PUBLIC_API_URL ?? "/api";

/**
 * Error de dominio de la capa de API. `estado` es el status HTTP (0 cuando no
 * hubo respuesta: red caida o backend inaccesible); `esRed` lo marca para que
 * la UI distinga "no pudimos conectar" de un error con respuesta.
 */
export class ErrorApi extends Error {
  readonly estado: number;
  readonly esRed: boolean;

  constructor(mensaje: string, estado: number, esRed = false) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estado = estado;
    this.esRed = esRed;
  }
}

/**
 * Mensajes de respaldo por codigo, usados SOLO si el backend no manda un
 * `message` legible. El teléfono duplicado llega como 500 generico (gap conocido
 * del backend) y cae aqui en el ramo `>= 500`, sin mensaje especifico.
 */
const MENSAJE_POR_CODIGO: Record<number, string> = {
  400: "Revisa los datos e inténtalo de nuevo.",
  404: "No encontramos el perfil que buscas.",
  413: "El archivo es demasiado grande (máximo 10 MB).",
  415: "Ese tipo de archivo no se puede leer. Usa PDF, DOCX, TXT, PNG o JPG.",
  422: "No pudimos leer el texto de tu archivo.",
};

const MENSAJE_RED =
  "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
const MENSAJE_SERVIDOR = "Ocurrió un error. Inténtalo de nuevo en un momento.";

/** Texto de respaldo para un codigo HTTP sin `message` legible. */
function mensajeDeRespaldo(estado: number): string {
  if (estado in MENSAJE_POR_CODIGO) {
    return MENSAJE_POR_CODIGO[estado];
  }
  if (estado >= 500) {
    return MENSAJE_SERVIDOR;
  }
  return "Revisa los datos e inténtalo de nuevo.";
}

/**
 * Extrae el `message` del cuerpo de error de Nest. Si es un arreglo de cadenas,
 * las une con un espacio; si es una cadena no vacia, la usa tal cual. Devuelve
 * `undefined` cuando no hay texto aprovechable (y entonces se usa el respaldo).
 */
function extraerMensaje(cuerpo: unknown): string | undefined {
  if (cuerpo === null || typeof cuerpo !== "object") {
    return undefined;
  }
  const mensaje = (cuerpo as { message?: unknown }).message;
  if (typeof mensaje === "string") {
    const limpio = mensaje.trim();
    return limpio.length > 0 ? limpio : undefined;
  }
  if (Array.isArray(mensaje)) {
    const texto = mensaje
      .filter((parte): parte is string => typeof parte === "string")
      .join(" ")
      .trim();
    return texto.length > 0 ? texto : undefined;
  }
  return undefined;
}

/**
 * Realiza una peticion y devuelve el cuerpo JSON tipado. Un 204 (o respuesta
 * sin cuerpo) devuelve `undefined`. Cualquier fallo se traduce a `ErrorApi` con
 * mensaje en espanol.
 */
export async function solicitar<T>(
  ruta: string,
  opciones?: RequestInit,
): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${BASE}${ruta}`, opciones);
  } catch {
    // Sin respuesta del servidor: red caida o backend inaccesible.
    throw new ErrorApi(MENSAJE_RED, 0, true);
  }

  if (!respuesta.ok) {
    let cuerpo: unknown;
    try {
      cuerpo = await respuesta.json();
    } catch {
      cuerpo = undefined;
    }
    const mensaje =
      extraerMensaje(cuerpo) ?? mensajeDeRespaldo(respuesta.status);
    throw new ErrorApi(mensaje, respuesta.status);
  }

  // 204 (y 205) no traen cuerpo: no se intenta parsear JSON.
  if (respuesta.status === 204 || respuesta.status === 205) {
    return undefined as T;
  }

  return (await respuesta.json()) as T;
}
