/**
 * Datos de EJEMPLO (maqueta) para la pantalla de estadísticas del candidato.
 * Provisionales, no salen del cliente. La pantalla que los usa muestra
 * <AvisoDemo/>.
 *
 * COMPLIANCE: las cifras describen actividad y competencias; ningun dato usa
 * edad ni campos demograficos.
 */

export interface EjeRadar {
  /** Nombre de la competencia o área. */
  etiqueta: string;
  /** Valor 0..100 (nivel de ejemplo). */
  valor: number;
}

export interface EstadisticasMock {
  postulacionesEnviadas: number;
  vacantesVistas: number;
  entrevistas: number;
  /** Ejes para el "radar" de competencias de ejemplo. */
  radarCompetencias: EjeRadar[];
  esEjemplo: true;
}

export const ESTADISTICAS_EJEMPLO: EstadisticasMock = {
  postulacionesEnviadas: 8,
  vacantesVistas: 24,
  entrevistas: 2,
  radarCompetencias: [
    { etiqueta: "Atención al cliente", valor: 85 },
    { etiqueta: "Organización", valor: 70 },
    { etiqueta: "Ventas", valor: 60 },
    { etiqueta: "Informática", valor: 45 },
    { etiqueta: "Trabajo en equipo", valor: 80 },
  ],
  esEjemplo: true,
};
