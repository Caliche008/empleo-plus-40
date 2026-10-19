"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
import { CampoTexto } from "@/components/campo-texto";

// Validacion mínima de correo (solo para la demo; el backend de auth no existe).
function correoValido(valor: string): boolean {
  return /\S+@\S+\.\S+/.test(valor.trim());
}

/**
 * Ingresar [MAQUETA]. Valida en el cliente (correo con formato y contraseña no
 * vacía) y navega a /inicio SIN llamar a ningún backend de autenticación.
 */
export default function Ingresar() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [errores, setErrores] = useState<{ correo?: string; clave?: string }>(
    {},
  );

  function enviar() {
    const nuevos: { correo?: string; clave?: string } = {};
    if (!correoValido(correo)) {
      nuevos.correo = "Escribe un correo válido, por ejemplo nombre@correo.com.";
    }
    if (clave.trim().length === 0) {
      nuevos.clave = "Escribe tu contraseña.";
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) {
      // Maqueta: no hay backend de auth; solo navegamos.
      router.push("/inicio");
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />
      <h1 className="text-2xl font-bold text-texto">Ingresar</h1>
      <p className="text-base text-texto-suave">
        Entra con tu correo y contraseña para ver tus vacantes.
      </p>

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
          error={errores.correo}
          autoComplete="email"
          requerido
        />
        <CampoTexto
          id="clave"
          etiqueta="Contraseña"
          tipo="password"
          valor={clave}
          onCambio={setClave}
          error={errores.clave}
          autoComplete="current-password"
          requerido
        />
        <Boton tipo="submit" tamano="lg" anchoCompleto>
          Ingresar
        </Boton>
      </form>

      <div className="flex flex-col gap-2 text-center">
        <Boton href="/nueva-contrasena" variante="fantasma">
          Olvidé mi contraseña
        </Boton>
        <Boton href="/registro" variante="fantasma">
          Crear una cuenta
        </Boton>
      </div>
    </section>
  );
}
