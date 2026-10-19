"use client";

type TipoCampo = "text" | "tel" | "email" | "number" | "password";

interface CampoTextoProps {
  id: string;
  etiqueta: string; // label siempre visible, nunca placeholder-como-label
  valor: string;
  onCambio: (valor: string) => void;
  tipo?: TipoCampo;
  multilinea?: boolean; // renderiza <textarea>
  requerido?: boolean;
  error?: string; // texto de error enlazado por aria-describedby + aria-invalid
  ayuda?: string; // texto de ayuda en texto-suave
  autoComplete?: string;
}

const CLASES_CONTROL =
  "w-full min-h-12 rounded-[var(--radius-control)] bg-superficie-alta border border-borde px-4 py-3 text-base text-texto placeholder:text-texto-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco";

/**
 * Campo de formulario con etiqueta visible, texto de ayuda y de error. El error
 * se enlaza con aria-describedby y marca aria-invalid para lectores de pantalla.
 */
export function CampoTexto({
  id,
  etiqueta,
  valor,
  onCambio,
  tipo = "text",
  multilinea = false,
  requerido = false,
  error,
  ayuda,
  autoComplete,
}: CampoTextoProps) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  // Se describe por ayuda y/o error, segun existan.
  const describedBy =
    [idAyuda, idError].filter(Boolean).join(" ") || undefined;
  const clasesError = error ? "border-error" : "";

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-base font-medium text-texto">
        {etiqueta}
        {requerido && (
          <span aria-hidden="true" className="text-texto-suave">
            {" "}
            *
          </span>
        )}
      </label>

      {ayuda && (
        <p id={idAyuda} className="text-sm text-texto-suave">
          {ayuda}
        </p>
      )}

      {multilinea ? (
        <textarea
          id={id}
          value={valor}
          onChange={(evento) => onCambio(evento.target.value)}
          required={requerido}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          autoComplete={autoComplete}
          rows={4}
          className={`${CLASES_CONTROL} ${clasesError} resize-y`}
        />
      ) : (
        <input
          id={id}
          type={tipo}
          value={valor}
          onChange={(evento) => onCambio(evento.target.value)}
          required={requerido}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          autoComplete={autoComplete}
          className={`${CLASES_CONTROL} ${clasesError}`}
        />
      )}

      {error && (
        <p id={idError} className="text-sm text-error">
          {error}
        </p>
      )}
    </div>
  );
}
