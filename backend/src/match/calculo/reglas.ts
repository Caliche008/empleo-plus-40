import { normalizar } from './normalizar.js';
import { parsearSalario } from './parsear-salario.js';
import type { EntradaMatch, Modalidad } from '../tipos.js';
import { similitudSolapamiento } from './semantica.js';

/**
 * Reglas deterministas del match. Cada una es PURA y opera SOLO sobre
 * `EntradaMatch` (nunca ve edad/nombre). Las que pueden carecer de dato
 * devuelven `{ valor, datoPresente }` para que `ponderar` redistribuya el peso.
 */

/** Valor de un criterio que puede faltar. `datoPresente=false` → se redistribuye. */
export interface ValorRegla {
  valor: number;
  datoPresente: boolean;
}

/**
 * Margen (fracción) por debajo del salario pretendido dentro del cual el valor
 * se degrada linealmente de 1 a 0. Fuera de él (muy por debajo) el valor es 0.
 */
export const MARGEN_SALARIO = 0.2;

/**
 * Ubicación 0..1: 1 si coinciden los términos normalizados; 0.5 si una contiene
 * a la otra (coincidencia parcial de términos); 0 si difieren por completo.
 * Devuelve 0 también si no hay términos comparables (lo gestiona la combinada).
 */
export function valorUbicacion(perfil: string, vacante: string): number {
  const a = normalizar(perfil);
  const b = normalizar(vacante);
  if (a.length === 0 || b.length === 0) {
    return 0;
  }
  const conjuntoA = new Set(a);
  const conjuntoB = new Set(b);
  const iguales = a.length === b.length && a.every((t) => conjuntoB.has(t));
  if (iguales) {
    return 1;
  }
  const hayInterseccion = a.some((t) => conjuntoB.has(t)) || b.some((t) => conjuntoA.has(t));
  return hayInterseccion ? 0.5 : 0;
}

/**
 * Tabla de compatibilidad fija de modalidad (perfil ← vacante). El perfil remoto
 * o híbrido tolera más opciones; el presencial solo acepta presencial.
 */
const COMPATIBILIDAD_MODALIDAD: Record<Modalidad, Record<Modalidad, number>> = {
  // Perfil remoto: ideal remoto; híbrido aceptable a medias; presencial no.
  remoto: { remoto: 1, hibrido: 0.5, presencial: 0 },
  // Perfil híbrido: híbrido o remoto bien; presencial a medias.
  hibrido: { remoto: 1, hibrido: 1, presencial: 0.5 },
  // Perfil presencial: solo presencial; híbrido a medias; remoto no encaja.
  presencial: { remoto: 0, hibrido: 0.5, presencial: 1 },
};

/** Modalidad 0..1 según la tabla fija. */
export function valorModalidad(perfil: Modalidad, vacante: Modalidad): number {
  return COMPATIBILIDAD_MODALIDAD[perfil][vacante];
}

/**
 * Criterio combinado "Ubicación / modalidad" (comparten peso). Implementa las
 * cuatro ramas del diseño §4.2 de forma determinista:
 * - vacante remota → vale la modalidad (la ubicación no aplica).
 * - ambos presentes → promedio de ubicación y modalidad.
 * - falta uno → el término presente.
 * - faltan ambos → dato faltante (su peso se redistribuye).
 */
export function valorUbicacionModalidad(entrada: EntradaMatch): ValorRegla {
  const { perfil, vacante } = entrada;

  const hayModalidad = perfil.modalidad !== undefined && vacante.modalidad !== undefined;
  const hayUbicacion =
    perfil.ubicacion !== undefined &&
    perfil.ubicacion.trim().length > 0 &&
    vacante.ubicacion !== undefined &&
    vacante.ubicacion.trim().length > 0;

  // Vacante remota: la ubicación no penaliza ni se promedia.
  if (vacante.modalidad === 'remoto' && perfil.modalidad !== undefined) {
    return { valor: valorModalidad(perfil.modalidad, vacante.modalidad), datoPresente: true };
  }

  const mod = hayModalidad
    ? valorModalidad(perfil.modalidad as Modalidad, vacante.modalidad as Modalidad)
    : undefined;
  const ubi = hayUbicacion
    ? valorUbicacion(perfil.ubicacion as string, vacante.ubicacion as string)
    : undefined;

  if (mod !== undefined && ubi !== undefined) {
    return { valor: (ubi + mod) / 2, datoPresente: true };
  }
  if (mod !== undefined) {
    return { valor: mod, datoPresente: true };
  }
  if (ubi !== undefined) {
    return { valor: ubi, datoPresente: true };
  }
  // Faltan ambos: dato faltante.
  return { valor: 0, datoPresente: false };
}

/**
 * Salario 0..1: compara `perfil.salarioMin` con `parsearSalario(vacante.salario)`.
 * 1 si la vacante ofrece ≥ el mínimo; degradado lineal dentro del margen; 0 muy
 * por debajo. Si no hay salario pretendido o el de la vacante no es parseable →
 * dato faltante.
 */
export function valorSalario(entrada: EntradaMatch): ValorRegla {
  const pretendido = entrada.perfil.salarioMin;
  const ofrecido = parsearSalario(entrada.vacante.salario ?? '');

  if (pretendido === undefined || pretendido <= 0 || ofrecido === undefined) {
    return { valor: 0, datoPresente: false };
  }
  if (ofrecido >= pretendido) {
    return { valor: 1, datoPresente: true };
  }
  // Por debajo: degradado lineal dentro del margen.
  const minimoAceptable = pretendido * (1 - MARGEN_SALARIO);
  if (ofrecido <= minimoAceptable) {
    return { valor: 0, datoPresente: true };
  }
  const valor = (ofrecido - minimoAceptable) / (pretendido - minimoAceptable);
  return { valor, datoPresente: true };
}

/**
 * Cobertura de obligatorios 0..1: fracción de `vacante.obligatorios` que el
 * perfil cubre. Un obligatorio está cubierto si alguno de sus términos
 * normalizados aparece en el texto combinado del perfil (habilidades +
 * experiencia). Sin obligatorios → 1 (nada que exigir).
 */
export function coberturaObligatorios(entrada: EntradaMatch): number {
  const { obligatorios } = entrada.vacante;
  if (obligatorios.length === 0) {
    return 1;
  }
  const terminosPerfil = new Set(
    [...entrada.perfil.habilidades, ...entrada.perfil.experiencia].flatMap((t) => normalizar(t)),
  );
  const cubiertos = obligatorios.filter((req) => {
    const terminosReq = normalizar(req);
    return terminosReq.some((t) => terminosPerfil.has(t));
  });
  return cubiertos.length / obligatorios.length;
}

/**
 * Sector 0..1: solapamiento (Jaccard) entre `perfil.sector` y `vacante.cargo`
 * (la vacante no tiene campo sector, §4.2 MED-3). Sin sector declarado → dato
 * faltante (su peso se redistribuye).
 */
export function valorSector(entrada: EntradaMatch): ValorRegla {
  const sector = entrada.perfil.sector;
  if (sector === undefined || sector.trim().length === 0) {
    return { valor: 0, datoPresente: false };
  }
  return { valor: similitudSolapamiento(sector, entrada.vacante.cargo), datoPresente: true };
}

/**
 * Valores de las reglas que NO salen de la similitud semántica. Habilidades y
 * experiencia los aporta la similitud (ver `ponderar`), así que aquí van sector,
 * ubicación/modalidad y salario.
 */
export interface ReglasEvaluadas {
  sector: ValorRegla;
  ubicacionModalidad: ValorRegla;
  salario: ValorRegla;
}

/** Evalúa de una sola vez las reglas deterministas de `EntradaMatch`. */
export function evaluarReglas(entrada: EntradaMatch): ReglasEvaluadas {
  return {
    sector: valorSector(entrada),
    ubicacionModalidad: valorUbicacionModalidad(entrada),
    salario: valorSalario(entrada),
  };
}
