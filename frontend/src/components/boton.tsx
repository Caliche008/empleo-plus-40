"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Spinner } from "@/components/spinner";

type VarianteBoton = "primario" | "secundario" | "fantasma" | "peligro";
type TamanoBoton = "md" | "lg";

interface BotonProps {
  children: ReactNode;
  variante?: VarianteBoton;
  tamano?: TamanoBoton; // md = min-h-12 (48px), lg = min-h-14 (56px)
  tipo?: "button" | "submit";
  deshabilitado?: boolean;
  cargando?: boolean; // muestra spinner + aria-busy y bloquea el click
  anchoCompleto?: boolean; // una accion principal suele ir a ancho completo
  onClick?: () => void;
  href?: string; // si viene, se renderiza como <Link> estilado
}

// El morado solo como fondo con texto blanco; en hover el texto sigue blanco y
// el fondo pasa a un morado mas oscuro (mas contraste), nunca a uno mas claro.
const CLASES_VARIANTE: Record<VarianteBoton, string> = {
  primario:
    "bg-acento text-sobre-acento font-bold hover:bg-acento-hover",
  secundario:
    "bg-superficie-alta text-texto border border-borde hover:bg-superficie",
  fantasma: "bg-transparent text-texto hover:bg-superficie-alta",
  peligro:
    "bg-error-fondo text-texto font-bold hover:brightness-110",
};

const CLASES_TAMANO: Record<TamanoBoton, string> = {
  md: "min-h-12 px-5 text-base",
  lg: "min-h-14 px-6 text-lg",
};

function clasesBase(
  variante: VarianteBoton,
  tamano: TamanoBoton,
  anchoCompleto: boolean,
): string {
  return [
    "inline-flex items-center justify-center gap-2 rounded-[var(--radius-control)]",
    "transition-colors select-none",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco focus-visible:ring-offset-2 focus-visible:ring-offset-fondo",
    "disabled:opacity-60 disabled:cursor-not-allowed",
    CLASES_VARIANTE[variante],
    CLASES_TAMANO[tamano],
    anchoCompleto ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Boton de accion. Si recibe `href` se renderiza como enlace (next/link); si no,
 * como `<button>`. `cargando` fija aria-busy, muestra el spinner y bloquea el click.
 */
export function Boton({
  children,
  variante = "primario",
  tamano = "md",
  tipo = "button",
  deshabilitado = false,
  cargando = false,
  anchoCompleto = false,
  onClick,
  href,
}: BotonProps) {
  const clases = clasesBase(variante, tamano, anchoCompleto);
  const contenido = cargando ? (
    <>
      <Spinner tamano={20} etiqueta="Procesando…" />
      {children}
    </>
  ) : (
    children
  );

  if (href) {
    const inactivo = deshabilitado || cargando;
    return (
      <Link
        href={href}
        className={clases}
        aria-busy={cargando || undefined}
        aria-disabled={inactivo || undefined}
        // Si esta inactivo, el enlace no debe navegar ni recibir foco.
        tabIndex={inactivo ? -1 : undefined}
        onClick={(evento) => {
          if (inactivo) {
            evento.preventDefault();
          }
        }}
      >
        {contenido}
      </Link>
    );
  }

  return (
    <button
      type={tipo}
      className={clases}
      disabled={deshabilitado || cargando}
      aria-busy={cargando || undefined}
      onClick={onClick}
    >
      {contenido}
    </button>
  );
}
