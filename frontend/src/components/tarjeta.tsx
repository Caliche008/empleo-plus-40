import type { ReactNode } from "react";
import Link from "next/link";

interface TarjetaProps {
  children: ReactNode;
  /** Si toda la tarjeta es pulsable, se envuelve en un enlace. */
  comoBoton?: boolean;
  href?: string;
  className?: string;
}

// La separacion entre fondo y superficie es minima a proposito (dos tonos
// oscuros): se apoya en borde + sombra, no en el contraste de relleno.
const CLASES_TARJETA =
  "block bg-superficie border border-borde rounded-[var(--radius-tarjeta)] p-5 shadow-md";

/**
 * Contenedor de contenido. Con `comoBoton` + `href` se vuelve un enlace pulsable
 * con foco visible y objetivo tactil holgado.
 */
export function Tarjeta({
  children,
  comoBoton = false,
  href,
  className = "",
}: TarjetaProps) {
  const clases = `${CLASES_TARJETA} ${className}`.trim();

  if (comoBoton && href) {
    return (
      <Link
        href={href}
        className={`${clases} transition-colors hover:bg-superficie-alta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco focus-visible:ring-offset-2 focus-visible:ring-offset-fondo`}
      >
        {children}
      </Link>
    );
  }

  return <div className={clases}>{children}</div>;
}
