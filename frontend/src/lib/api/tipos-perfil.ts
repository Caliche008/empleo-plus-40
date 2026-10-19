/**
 * Tipos de la capa de API del perfil. Reflejan EXACTAMENTE las formas
 * verificadas del backend (DTOs Zod en `backend/src/perfil/dto/*` y el schema
 * de persistencia). La edad NO existe en ningun tipo (compliance): no se
 * declara ni opcional en entrada ni en salida.
 */

// --- PerfilExtraido: salida de POST /perfil/cv (extractor de IA) ---

export interface HabilidadExtraida {
  nombre: string;
  nivel?: string;
}

export interface ExperienciaExtraida {
  cargo: string;
  empresa?: string;
  descripcion: string;
  logros: string[];
}

export interface CertificacionExtraida {
  nombre: string;
  emisor?: string;
  anio?: string;
}

export interface IdiomaExtraido {
  idioma: string;
  nivel?: string;
}

export interface PerfilExtraido {
  habilidades: HabilidadExtraida[];
  experiencias: ExperienciaExtraida[];
  certificaciones: CertificacionExtraida[];
  idiomas: IdiomaExtraido[];
}

/** POST /perfil/cv responde `{ borrador }`: el perfil es un BORRADOR sin guardar. */
export interface RespuestaCv {
  borrador: PerfilExtraido;
}

// --- Preguntas: GET /perfil/preguntas (preguntas.dto.ts) ---

export interface Pregunta {
  id: string;
  texto: string;
  campo: string;
}

// --- CrearPerfil: cuerpo de POST /perfil/confirmar (crear-perfil.dto.ts) ---

export type Modalidad = "presencial" | "hibrido" | "remoto";

export interface ObjetivoLaboralEntrada {
  /** Requerido: el rol que la persona busca. */
  rol: string;
  sector?: string;
  /** Entero >= 0, OPCIONAL (no todos quieren declararlo). */
  salarioMin?: number;
  modalidad?: Modalidad;
  ubicacion?: string;
  disponibilidad?: string;
}

/**
 * En el CUERPO de entrada `logros` es OPCIONAL: el schema del backend usa
 * `logros: z.array(...).default([])`. Por eso no se reusa `ExperienciaExtraida`
 * (que lo tiene requerido) sino esta forma propia.
 */
export interface ExperienciaEntrada {
  cargo: string;
  empresa?: string;
  descripcion: string;
  logros?: string[];
  desde?: string;
  hasta?: string;
}

export interface CrearPerfil {
  nombre?: string;
  telefono?: string;
  /** 2 letras; el backend aplica default 'CO'. */
  pais?: string;
  /** REQUERIDO y debe ser true para guardar (el backend lo exige === true). */
  consentimiento: boolean;
  /** El backend aplica default false. */
  mostrarFechasAntiguas?: boolean;
  objetivo: ObjetivoLaboralEntrada;
  habilidades?: HabilidadExtraida[];
  experiencias?: ExperienciaEntrada[];
  certificaciones?: CertificacionExtraida[];
  idiomas?: IdiomaExtraido[];
}

// --- ActualizarPerfil: cuerpo de PATCH /perfil/:id (actualizar-perfil.dto.ts) ---

export interface ActualizarPerfil {
  nombre?: string;
  telefono?: string;
  pais?: string;
  mostrarFechasAntiguas?: boolean;
  objetivo?: Partial<ObjetivoLaboralEntrada>;
}

// --- Perfil guardado: respuesta de confirmar/obtener/actualizar ---

/**
 * En la RESPUESTA, Prisma declara `logros String[]` (no nullable) y siempre
 * devuelve el array (vacio o lleno). Por eso en la salida `logros` es REQUERIDO
 * y no reusa `ExperienciaEntrada` (que lo tiene opcional).
 */
export interface ExperienciaGuardada {
  id: string;
  cargo: string;
  empresa?: string;
  descripcion: string;
  logros: string[];
  desde?: string;
  hasta?: string;
}

export interface Perfil {
  id: string;
  telefono: string | null;
  nombre: string | null;
  pais: string;
  consentimiento: boolean;
  mostrarFechasAntiguas: boolean;
  /** DateTime serializado como ISO. */
  creadoEn: string;
  objetivo:
    | (ObjetivoLaboralEntrada & { id: string; candidatoId: string })
    | null;
  habilidades: (HabilidadExtraida & { id: string })[];
  experiencias: ExperienciaGuardada[];
  certificaciones: (CertificacionExtraida & { id: string })[];
  idiomas: (IdiomaExtraido & { id: string })[];
  documentos: { id: string; tipo: string; url: string; creadoEn: string }[];
}
