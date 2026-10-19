import { Boton } from "@/components/boton";

// Pantalla de bienvenida (maqueta). Las rutas definitivas del onboarding se
// construyen en una fase posterior; aqui queda la cascara minima con el tema.
export default function Inicio() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-texto">Empleo Plus 40</h1>
        <p className="text-lg text-texto-suave">
          Encuentra empleo después de los 40. Creamos tu perfil con honestidad y
          te ayudamos a conseguir entrevistas.
        </p>
      </div>
      <Boton href="/perfil/metodo" tamano="lg" anchoCompleto>
        Empezar
      </Boton>
    </main>
  );
}
