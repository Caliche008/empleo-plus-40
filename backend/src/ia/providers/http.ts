import { IaError } from '../ia.types.js';

/** Clasifica un código HTTP en un tipo de IaError y si es recuperable. */
function clasificar(status: number): { tipo: IaError['tipo']; recuperable: boolean } {
  if (status === 429) return { tipo: 'rate_limit', recuperable: true };
  if (status === 401 || status === 403) return { tipo: 'auth', recuperable: false };
  if (status >= 500) return { tipo: 'servidor', recuperable: true };
  if (status >= 400) return { tipo: 'peticion', recuperable: false };
  return { tipo: 'desconocido', recuperable: false };
}

export interface OpcionesFetch {
  metodo?: string;
  cabeceras?: Record<string, string>;
  cuerpo?: unknown;
  timeoutMs?: number;
  proveedor: string;
}

/** POST JSON con timeout y errores normalizados a IaError. */
export async function fetchJson<T>(url: string, opts: OpcionesFetch): Promise<T> {
  const { metodo = 'POST', cabeceras = {}, cuerpo, timeoutMs = 60_000, proveedor } = opts;
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), timeoutMs);

  let res: Response;
  try {
    res = await fetch(url, {
      method: metodo,
      headers: { 'content-type': 'application/json', ...cabeceras },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
      signal: controlador.signal,
    });
  } catch (err) {
    clearTimeout(temporizador);
    const abortado = err instanceof Error && err.name === 'AbortError';
    throw new IaError(
      abortado ? `Timeout tras ${timeoutMs}ms` : `Error de red: ${(err as Error).message}`,
      'red',
      proveedor,
      true,
    );
  }
  clearTimeout(temporizador);

  if (!res.ok) {
    const texto = await res.text().catch(() => '');
    const { tipo, recuperable } = clasificar(res.status);
    throw new IaError(`HTTP ${res.status} de ${proveedor}: ${texto.slice(0, 300)}`, tipo, proveedor, recuperable);
  }

  try {
    return (await res.json()) as T;
  } catch {
    throw new IaError(`Respuesta no-JSON de ${proveedor}`, 'servidor', proveedor, true);
  }
}
