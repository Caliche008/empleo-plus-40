"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/boton";
import { BandaError } from "@/components/banda-error";
import { Tarjeta } from "@/components/tarjeta";
import { ErrorApi } from "@/lib/api/cliente";
import { subirCv } from "@/lib/api/perfil";
import type { PerfilExtraido } from "@/lib/api/tipos-perfil";
import { guardarBorrador } from "@/lib/puente-perfil";

// Tipos aceptados (coinciden con lo que lee el backend) y limite de 10 MB.
const TIPOS_ACEPTADOS = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "image/png",
  "image/jpeg",
];
const EXTENSIONES = ".pdf,.docx,.txt,.png,.jpg,.jpeg";
const MAX_BYTES = 10 * 1024 * 1024;

type Estado = "inactivo" | "cargando" | "error" | "redirigiendo";

/**
 * Subir hoja de vida [CONECTADA]. Valida el archivo en cliente (tipo y tamano),
 * llama a `subirCv`, guarda el borrador resultante en sessionStorage y redirige
 * a /perfil/borrador. Degrada con gracia: un fallo muestra BandaError y, si el
 * archivo no tiene texto legible (422), ofrece el guiado como alternativa.
 */
export default function SubirCv() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<Estado>("inactivo");
  const [error, setError] = useState<string | null>(null);
  const [ofrecerGuiado, setOfrecerGuiado] = useState(false);

  // Valida el archivo elegido en cliente; devuelve un mensaje de error o null.
  function validar(elegido: File): string | null {
    const extensionOk =
      TIPOS_ACEPTADOS.includes(elegido.type) ||
      /\.(pdf|docx|txt|png|jpe?g)$/i.test(elegido.name);
    if (!extensionOk) {
      return "Ese tipo de archivo no se puede leer. Usa PDF, DOCX, TXT, PNG o JPG.";
    }
    if (elegido.size > MAX_BYTES) {
      return "El archivo es demasiado grande (máximo 10 MB).";
    }
    return null;
  }

  function onElegir(evento: React.ChangeEvent<HTMLInputElement>) {
    setError(null);
    setOfrecerGuiado(false);
    const elegido = evento.target.files?.[0] ?? null;
    if (!elegido) {
      setArchivo(null);
      return;
    }
    const mensaje = validar(elegido);
    if (mensaje) {
      setArchivo(null);
      setError(mensaje);
      return;
    }
    setArchivo(elegido);
  }

  // Arma un borrador CrearPerfil a partir del perfil extraido. El objetivo
  // queda con rol vacio: la persona lo completa en /perfil/borrador.
  function aBorrador(extraido: PerfilExtraido) {
    return {
      consentimiento: false,
      objetivo: { rol: "" },
      habilidades: extraido.habilidades,
      experiencias: extraido.experiencias,
      certificaciones: extraido.certificaciones,
      idiomas: extraido.idiomas,
    };
  }

  async function onEnviar() {
    if (!archivo) {
      return;
    }
    setEstado("cargando");
    setError(null);
    setOfrecerGuiado(false);
    try {
      const extraido = await subirCv(archivo);
      guardarBorrador(aBorrador(extraido));
      setEstado("redirigiendo");
      router.push("/perfil/borrador");
    } catch (fallo) {
      setEstado("error");
      const api = fallo instanceof ErrorApi ? fallo : null;
      setError(
        api?.message ??
          "Ocurrió un error. Inténtalo de nuevo en un momento.",
      );
      // 422: el archivo no tenia texto legible; ofrecer el guiado.
      if (api?.estado === 422) {
        setOfrecerGuiado(true);
      }
    }
  }

  const procesando = estado === "cargando" || estado === "redirigiendo";

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-texto">Sube tu hoja de vida</h1>
        <p className="text-base text-texto-suave">
          Aceptamos PDF, DOCX, TXT, PNG o JPG (hasta 10 MB). Prepararemos un
          borrador para que lo revises.
        </p>
      </header>

      <Tarjeta>
        <div className="flex flex-col gap-4">
          <label htmlFor="archivo-cv" className="text-base font-medium text-texto">
            Archivo de tu hoja de vida
          </label>
          <input
            ref={inputRef}
            id="archivo-cv"
            type="file"
            accept={EXTENSIONES}
            onChange={onElegir}
            disabled={procesando}
            className="w-full rounded-[var(--radius-control)] border border-borde bg-superficie-alta px-4 py-3 text-base text-texto file:mr-4 file:rounded-[var(--radius-control)] file:border-0 file:bg-acento file:px-4 file:py-2 file:font-bold file:text-sobre-acento focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco"
          />
          {archivo && (
            <p className="text-sm text-texto-suave">
              Seleccionado: {archivo.name}
            </p>
          )}
        </div>
      </Tarjeta>

      {error && (
        <BandaError
          mensaje={error}
          accion={
            ofrecerGuiado ? (
              <Boton href="/perfil/guiado" variante="secundario">
                Responder preguntas
              </Boton>
            ) : undefined
          }
        />
      )}

      <Boton
        onClick={onEnviar}
        deshabilitado={!archivo}
        cargando={procesando}
        anchoCompleto
        tamano="lg"
      >
        Continuar
      </Boton>
    </section>
  );
}
