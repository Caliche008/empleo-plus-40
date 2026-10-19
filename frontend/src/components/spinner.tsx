interface SpinnerProps {
  /** Texto anunciado por lectores de pantalla mientras carga. */
  etiqueta?: string;
  /** Tamano del indicador en pixeles. */
  tamano?: number;
}

/**
 * Indicador de carga. El circulo es decorativo (aria-hidden) y el estado se
 * comunica a lectores de pantalla con un texto solo-SR.
 */
export function Spinner({ etiqueta = "Cargando…", tamano = 24 }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex items-center gap-2">
      <span
        aria-hidden="true"
        className="inline-block animate-spin rounded-full border-2 border-borde border-t-acento-foco"
        style={{ width: tamano, height: tamano }}
      />
      <span className="sr-only">{etiqueta}</span>
    </span>
  );
}
