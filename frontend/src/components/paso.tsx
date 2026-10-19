interface PasoProps {
  actual: number; // numero de paso actual (1..total)
  total: number;
  titulo: string;
  subtitulo?: string;
}

/**
 * Encabezado de un flujo multipaso: barra de progreso accesible, "Paso X de N" y
 * titulo. La barra usa role="progressbar" con aria-valuenow/min/max.
 */
export function Paso({ actual, total, titulo, subtitulo }: PasoProps) {
  // Se acota el porcentaje al rango valido por si llegan valores fuera de rango.
  const porcentaje = Math.min(100, Math.max(0, (actual / total) * 100));

  return (
    <header className="flex flex-col gap-3">
      <div
        role="progressbar"
        aria-valuenow={actual}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Paso ${actual} de ${total}`}
        className="h-2 w-full overflow-hidden rounded-full bg-superficie-alta"
      >
        <div
          className="h-full rounded-full bg-acento transition-all"
          style={{ width: `${porcentaje}%` }}
        />
      </div>
      <p className="text-sm text-texto-suave">
        Paso {actual} de {total}
      </p>
      <h1 className="text-2xl font-bold text-texto">{titulo}</h1>
      {subtitulo && <p className="text-base text-texto-suave">{subtitulo}</p>}
    </header>
  );
}
