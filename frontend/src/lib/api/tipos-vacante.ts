/**
 * Tipos de la capa de API del análisis de vacante. Reflejan EXACTAMENTE el
 * contrato `VacanteAnalizada` del backend (`backend/src/ia/prompts/analizar-vacante.prompt.ts`).
 * La edad NO aparece en ningún tipo (compliance): el análisis es del TEXTO de la
 * oferta, nunca de personas.
 */

/** Tipos de bandera roja que el análisis puede señalar. */
export type TipoAlerta = "edad" | "salario-oculto" | "requisitos-inflados" | "otro";

/** Una alerta del análisis, con su explicación en lenguaje simple. */
export interface AlertaVacante {
  tipo: TipoAlerta;
  detalle: string;
}

/**
 * Resultado del análisis de una oferta. Los arrays siempre vienen (pueden estar
 * vacíos); los campos opcionales se omiten cuando la oferta no los declara.
 */
export interface VacanteAnalizada {
  cargo: string;
  obligatorios: string[];
  deseables: string[];
  habilidades: string[];
  experienciaPedida?: string;
  ubicacion?: string;
  modalidad?: string;
  salario?: string;
  alertas: AlertaVacante[];
}
