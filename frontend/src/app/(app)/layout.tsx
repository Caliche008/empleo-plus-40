import { Suspense } from "react";
import { NavInferior } from "@/components/nav-inferior";

/**
 * Layout de las pantallas con barra de navegacion inferior. Reserva espacio al
 * pie (pb) para que la NavInferior fija no tape el contenido.
 *
 * NavInferior usa `usePathname()` (dato de ruta disponible solo en runtime);
 * con Cache Components el shell estatico se prerenderiza y la barra entra por
 * streaming, por eso va dentro de <Suspense>.
 */
export default function LayoutApp({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 pt-6 pb-24">
      <main className="flex flex-1 flex-col">{children}</main>
      <Suspense fallback={null}>
        <NavInferior />
      </Suspense>
    </div>
  );
}
