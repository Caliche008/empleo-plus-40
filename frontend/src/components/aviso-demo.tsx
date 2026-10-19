type VarianteAviso = "demo" | "info";

interface AvisoDemoProps {
  texto?: string;
  variante?: VarianteAviso;
}

const TEXTO_POR_DEFECTO: Record<VarianteAviso, string> = {
  demo: "Pantalla de demostración: los datos son de ejemplo.",
  info: "Información: esta sección aún está en construcción.",
};

/**
 * Banda que marca una pantalla como maqueta/demostracion. La honestidad es un
 * principio de compliance: el mensaje no se transmite solo por color/icono, sino
 * con texto visible explicito y un aria-label claro para lectores de pantalla.
 */
export function AvisoDemo({ texto, variante = "demo" }: AvisoDemoProps) {
  const mensaje = texto ?? TEXTO_POR_DEFECTO[variante];

  return (
    <div
      role="note"
      aria-label="Aviso: pantalla de demostración"
      className="flex items-center gap-2 rounded-[var(--radius-control)] bg-aviso px-4 py-3 text-sm font-medium text-[#2A1C00]"
    >
      <span aria-hidden="true">ℹ️</span>
      <span>{mensaje}</span>
    </div>
  );
}
