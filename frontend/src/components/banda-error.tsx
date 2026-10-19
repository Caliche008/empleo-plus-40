import type { ReactNode } from "react";

interface BandaErrorProps {
  /** Mensaje en espanol, normalmente el que devuelve el backend. */
  mensaje: string;
  /** Accion opcional, p. ej. un boton "Reintentar". */
  accion?: ReactNode;
}

/**
 * Banda de error con role="alert" para que los lectores de pantalla la anuncien
 * al aparecer. Degrada con gracia los fallos de red o del backend.
 */
export function BandaError({ mensaje, accion }: BandaErrorProps) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-3 rounded-[var(--radius-control)] bg-error-fondo px-4 py-3 text-base text-[#FEE2E2]"
    >
      <p>{mensaje}</p>
      {accion && <div>{accion}</div>}
    </div>
  );
}
