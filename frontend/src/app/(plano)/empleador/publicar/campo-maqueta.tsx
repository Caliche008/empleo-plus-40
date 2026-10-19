interface CampoMaquetaProps {
  id: string;
  etiqueta: string;
  /** Valor fijo de ejemplo a mostrar (opcional). */
  valor?: string;
  /** Si es un área de texto en vez de un campo de una línea. */
  multilinea?: boolean;
}

/**
 * Campo de solo lectura para las maquetas del empleador. Es un Server Component
 * sin eventos (no se puede pasar onCambio del servidor a un Client Component):
 * muestra la etiqueta y un control deshabilitado con el mismo estilo del tema.
 * Deja claro que el asistente de publicación es una demostración.
 */
export function CampoMaqueta({
  id,
  etiqueta,
  valor = "",
  multilinea = false,
}: CampoMaquetaProps) {
  const clasesControl =
    "min-h-12 w-full rounded-[var(--radius-control)] border border-borde bg-superficie-alta px-4 py-2 text-base text-texto-suave";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-base font-medium text-texto">
        {etiqueta}
      </label>
      {multilinea ? (
        <textarea
          id={id}
          defaultValue={valor}
          disabled
          rows={3}
          className={clasesControl}
          placeholder="Campo de demostración"
        />
      ) : (
        <input
          id={id}
          type="text"
          defaultValue={valor}
          disabled
          className={clasesControl}
          placeholder="Campo de demostración"
        />
      )}
    </div>
  );
}
