import type { ReactNode } from "react";

interface EstadoVacioProps {
  titulo: string;
  mensaje?: string;
  /** Icono decorativo opcional (por defecto una ilustracion simple). */
  icono?: string;
  /** Accion principal, p. ej. un boton "Crear mi perfil". */
  accion?: ReactNode;
}

/**
 * Estado vacio para listas sin datos o un perfil inexistente. Ofrece una accion
 * clara para que la persona sepa que hacer a continuacion.
 */
export function EstadoVacio({
  titulo,
  mensaje,
  icono = "📭",
  accion,
}: EstadoVacioProps) {
  return (
    <section className="flex flex-col items-center gap-4 py-10 text-center">
      <span aria-hidden="true" className="text-5xl leading-none">
        {icono}
      </span>
      <h2 className="text-xl font-bold text-texto">{titulo}</h2>
      {mensaje && (
        <p className="max-w-sm text-base text-texto-suave">{mensaje}</p>
      )}
      {accion && <div className="mt-2 w-full max-w-sm">{accion}</div>}
    </section>
  );
}
