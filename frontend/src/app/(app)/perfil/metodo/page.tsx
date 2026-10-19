import type { Metadata } from "next";
import { Boton } from "@/components/boton";
import { Tarjeta } from "@/components/tarjeta";

export const metadata: Metadata = { title: "Crear tu perfil" };

/**
 * Eleccion del metodo para crear el perfil [NAVEGACION]: subir una hoja de vida
 * o responder preguntas una a una. La nota de voz queda deshabilitada
 * ("Próximamente"). No llama al backend ni usa datos de ejemplo: solo enruta.
 */
export default function MetodoPerfil() {
  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-texto">Crea tu perfil</h1>
        <p className="text-base text-texto-suave">
          Elige cómo quieres empezar. Podrás revisar y editar todo antes de
          guardar.
        </p>
      </header>

      <Tarjeta>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-texto">Subir mi hoja de vida</h2>
          <p className="text-base text-texto-suave">
            Súbela y preparamos un borrador con tu experiencia para que lo
            revises.
          </p>
          <Boton href="/perfil/subir" anchoCompleto>
            Subir hoja de vida
          </Boton>
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-texto">Responder preguntas</h2>
          <p className="text-base text-texto-suave">
            Te hacemos preguntas sencillas, una por una, para armar tu perfil.
          </p>
          <Boton href="/perfil/guiado" variante="secundario" anchoCompleto>
            Empezar con preguntas
          </Boton>
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-texto">Grabar una nota de voz</h2>
          <p className="text-base text-texto-suave">
            Pronto podrás contarnos tu experiencia hablando.
          </p>
          <Boton variante="secundario" deshabilitado anchoCompleto>
            Próximamente
          </Boton>
        </div>
      </Tarjeta>
    </section>
  );
}
