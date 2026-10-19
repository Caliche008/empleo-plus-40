import type { ReactNode } from "react";

interface PantallaExitoProps {
  titulo: string;
  mensaje: string;
  /** 1 o 2 acciones (normalmente botones). */
  acciones?: ReactNode;
}

/**
 * Confirmacion de exito centrada: icono sobre fondo de exito, titulo, mensaje y
 * acciones. Usada tras guardar el perfil o postular a una vacante.
 */
export function PantallaExito({ titulo, mensaje, acciones }: PantallaExitoProps) {
  return (
    <section className="flex flex-col items-center gap-4 py-8 text-center">
      <span
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-exito text-3xl text-[#06251B]"
      >
        ✓
      </span>
      <h1 className="text-2xl font-bold text-texto">{titulo}</h1>
      <p className="max-w-sm text-base text-texto-suave">{mensaje}</p>
      {acciones && (
        <div className="mt-2 flex w-full max-w-sm flex-col gap-3">{acciones}</div>
      )}
    </section>
  );
}
