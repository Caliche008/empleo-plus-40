"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AvisoDemo } from "@/components/aviso-demo";
import { Boton } from "@/components/boton";
import { CampoTexto } from "@/components/campo-texto";

function correoValido(valor: string): boolean {
  return /\S+@\S+\.\S+/.test(valor.trim());
}

/**
 * Registro [MAQUETA]. Valida en el cliente (nombre, correo, contraseña de al
 * menos 6 caracteres y confirmación coincidente) y navega a /perfil/metodo SIN
 * llamar a ningún backend de autenticación.
 */
export default function Registro() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [clave, setClave] = useState("");
  const [claveRepetida, setClaveRepetida] = useState("");
  const [errores, setErrores] = useState<{
    nombre?: string;
    correo?: string;
    clave?: string;
    claveRepetida?: string;
  }>({});

  function enviar() {
    const nuevos: typeof errores = {};
    if (nombre.trim().length === 0) {
      nuevos.nombre = "Dinos cómo te llamas.";
    }
    if (!correoValido(correo)) {
      nuevos.correo = "Escribe un correo válido, por ejemplo nombre@correo.com.";
    }
    if (clave.length < 6) {
      nuevos.clave = "La contraseña debe tener al menos 6 caracteres.";
    }
    if (claveRepetida !== clave) {
      nuevos.claveRepetida = "Las contraseñas no coinciden.";
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length === 0) {
      // Maqueta: no hay backend de auth; solo navegamos a crear el perfil.
      router.push("/perfil/metodo");
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <AvisoDemo />
      <h1 className="text-2xl font-bold text-texto">Crear una cuenta</h1>
      <p className="text-base text-texto-suave">
        Con tu cuenta guardas tu perfil y tus postulaciones.
      </p>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          enviar();
        }}
      >
        <CampoTexto
          id="nombre"
          etiqueta="Nombre"
          valor={nombre}
          onCambio={setNombre}
          error={errores.nombre}
          autoComplete="name"
          requerido
        />
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
          ayuda="Al menos 6 caracteres."
          autoComplete="new-password"
          requerido
        />
        <CampoTexto
          id="clave-repetida"
          etiqueta="Repite la contraseña"
          tipo="password"
          valor={claveRepetida}
          onCambio={setClaveRepetida}
          error={errores.claveRepetida}
          autoComplete="new-password"
          requerido
        />
        <Boton tipo="submit" tamano="lg" anchoCompleto>
          Crear cuenta
        </Boton>
      </form>

      <div className="text-center">
        <Boton href="/ingresar" variante="fantasma">
          Ya tengo cuenta
        </Boton>
      </div>
    </section>
  );
}
