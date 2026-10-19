"use client";

import { useState } from "react";
import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
import { CampoTexto } from "@/components/campo-texto";

function correoValido(valor: string): boolean {
  return /\S+@\S+\.\S+/.test(valor.trim());
}

/**
 * Recuperar contraseña [MAQUETA]. Valida el correo en el cliente y muestra un
 * mensaje de confirmación SIN llamar a ningún backend de autenticación.
 */
export default function NuevaContrasena() {
  const [correo, setCorreo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviado, setEnviado] = useState(false);

  function enviar() {
    if (!correoValido(correo)) {
      setError("Escribe un correo válido, por ejemplo nombre@correo.com.");
      setEnviado(false);
      return;
    }
    setError(null);
    // Maqueta: no hay backend; mostramos la confirmación directamente.
    setEnviado(true);
  }

  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />
      <h1 className="text-2xl font-bold text-texto">Recuperar contraseña</h1>
      <p className="text-base text-texto-suave">
        Escribe tu correo y te enviaremos los pasos para crear una nueva
        contraseña.
      </p>

      {enviado ? (
        <div
          role="status"
          className="rounded-[var(--radius-control)] bg-superficie border border-borde p-5"
        >
          <p className="text-base text-texto">
            Si <strong>{correo.trim()}</strong> está registrado, recibirás un
            correo con los pasos para continuar.
          </p>
        </div>
      ) : (
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            enviar();
          }}
        >
          <CampoTexto
            id="correo"
            etiqueta="Correo electrónico"
            tipo="email"
            valor={correo}
            onCambio={setCorreo}
            error={error ?? undefined}
            autoComplete="email"
            requerido
          />
          <Boton tipo="submit" tamano="lg" anchoCompleto>
            Enviar instrucciones
          </Boton>
        </form>
      )}

      <div className="text-center">
        <Boton href="/ingresar" variante="fantasma">
          Volver a ingresar
        </Boton>
      </div>
    </section>
  );
}
