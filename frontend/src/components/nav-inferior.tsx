"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Pestana {
  href: string;
  etiqueta: string;
  // Icono simple (emoji) a modo de apoyo visual; el texto siempre va visible.
  icono: string;
}

const PESTANAS: readonly Pestana[] = [
  { href: "/inicio", etiqueta: "Inicio", icono: "🏠" },
  { href: "/guardados", etiqueta: "Guardados", icono: "🔖" },
  { href: "/postulaciones", etiqueta: "Postulaciones", icono: "📨" },
  { href: "/perfil", etiqueta: "Perfil", icono: "👤" },
];

// Una pestana esta activa si la ruta coincide con su base o cuelga de ella.
function estaActiva(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Barra de navegacion inferior fija con 4 pestanas. El estado activo se calcula
 * por la ruta actual y se marca con aria-current="page". El morado solo aparece
 * como fondo del indicador activo, con texto blanco encima.
 */
export function NavInferior() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-10 border-t border-borde bg-superficie"
    >
      <ul className="mx-auto flex max-w-xl items-stretch justify-around">
        {PESTANAS.map((pestana) => {
          const activa = estaActiva(pathname, pestana.href);
          return (
            <li key={pestana.href} className="flex-1">
              <Link
                href={pestana.href}
                aria-current={activa ? "page" : undefined}
                className={`flex min-h-12 flex-col items-center justify-center gap-0.5 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco ${
                  activa
                    ? "bg-acento text-sobre-acento font-bold"
                    : "text-texto-suave"
                }`}
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  {pestana.icono}
                </span>
                <span>{pestana.etiqueta}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
