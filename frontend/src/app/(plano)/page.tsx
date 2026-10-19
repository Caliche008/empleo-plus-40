import { Boton } from "@/components/boton";

/**
 * Bienvenida / onboarding [MAQUETA]. Una sola acción principal ("Empezar") que
 * lleva a elegir cómo crear el perfil. Vive en el grupo (plano) (sin
 * NavInferior): es la puerta de entrada antes de la app con pestañas.
 */
export default function Bienvenida() {
  return (
    <section className="flex flex-1 flex-col items-center justify-center gap-10 text-center">
      <div className="flex flex-col gap-4">
        <span aria-hidden="true" className="text-5xl leading-none">
          💼
        </span>
        <h1 className="text-3xl font-bold text-texto">Empleo Plus 40</h1>
        <p className="text-lg text-texto-suave">
          Encuentra empleo después de los 40. Creamos tu perfil con honestidad,
          traducimos tu experiencia y te ayudamos a conseguir entrevistas.
        </p>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Boton href="/perfil/metodo" tamano="lg" anchoCompleto>
          Empezar
        </Boton>
        <Boton href="/ingresar" variante="fantasma" tamano="lg" anchoCompleto>
          Ya tengo cuenta
        </Boton>
      </div>
    </section>
  );
}
