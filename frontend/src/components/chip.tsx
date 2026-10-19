import type { ReactNode } from "react";

interface ChipProps {
  children: ReactNode;
  /** Activo = fondo acento con texto blanco; inactivo = superficie-alta. */
  activo?: boolean;
  /** Si viene, muestra una "x" para quitar el chip. */
  onEliminar?: () => void;
}

/**
 * Etiqueta pequena para habilidades, idiomas o filtros. El morado solo aparece
 * como fondo (estado activo) con texto blanco, nunca como texto pequeno.
 */
export function Chip({ children, activo = false, onEliminar }: ChipProps) {
  const clasesColor = activo
    ? "bg-acento text-sobre-acento"
    : "bg-superficie-alta text-texto";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm ${clasesColor}`}
    >
      {children}
      {onEliminar && (
        <button
          type="button"
          onClick={onEliminar}
          aria-label={`Quitar ${typeof children === "string" ? children : "etiqueta"}`}
          className="inline-flex h-5 w-5 items-center justify-center rounded-full leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco"
        >
          <span aria-hidden="true">×</span>
        </button>
      )}
    </span>
  );
}
