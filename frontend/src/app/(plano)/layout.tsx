/**
 * Layout plano (sin NavInferior) para onboarding, auth y flujos de pantalla
 * completa. No reserva espacio inferior porque no hay barra fija.
 */
export default function LayoutPlano({ children }: LayoutProps<"/">) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-5 py-6">
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
