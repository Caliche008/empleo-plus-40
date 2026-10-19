"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/boton";
import { BandaError } from "@/components/banda-error";
import { CampoTexto } from "@/components/campo-texto";
import { Chip } from "@/components/chip";
import { Tarjeta } from "@/components/tarjeta";
import { ErrorApi } from "@/lib/api/cliente";
import { confirmarPerfil } from "@/lib/api/perfil";
import type { CrearPerfil, Modalidad } from "@/lib/api/tipos-perfil";
import {
  guardarPerfilId,
  leerBorrador,
  limpiarBorrador,
} from "@/lib/puente-perfil";

const MODALIDADES: { valor: Modalidad; etiqueta: string }[] = [
  { valor: "presencial", etiqueta: "Presencial" },
  { valor: "hibrido", etiqueta: "Híbrido" },
  { valor: "remoto", etiqueta: "Remoto" },
];

type Estado = "editando" | "guardando" | "error";

/**
 * Revisar y confirmar el borrador [CONECTADA]. UNICO punto de persistencia: lee
 * el borrador de sessionStorage (si falta, redirige a /perfil/metodo), permite
 * editar objetivo/colecciones/salario, exige rol y consentimiento marcado (el
 * boton Guardar queda deshabilitado hasta ambos; el consentimiento NUNCA se
 * pre-marca) y al confirmar llama a confirmarPerfil, guarda el id y navega a
 * /perfil/exito.
 */
export default function BorradorPerfil() {
  const router = useRouter();
  const [borrador, setBorrador] = useState<CrearPerfil | null>(null);
  const [cargado, setCargado] = useState(false);
  const [estado, setEstado] = useState<Estado>("editando");
  const [error, setError] = useState<string | null>(null);
  const [errorRol, setErrorRol] = useState<string | null>(null);
  const [consentimiento, setConsentimiento] = useState(false);
  const [salario, setSalario] = useState("");

  // Lee el borrador al montar. Sin borrador, no hay nada que confirmar.
  useEffect(() => {
    const leido = leerBorrador();
    if (!leido) {
      router.replace("/perfil/metodo");
      return;
    }
    // Carga el borrador del navegador al montar (sincronizacion con sessionStorage).
    /* eslint-disable react-hooks/set-state-in-effect */
    setBorrador(leido);
    if (typeof leido.objetivo.salarioMin === "number") {
      setSalario(String(leido.objetivo.salarioMin));
    }
    setCargado(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [router]);

  if (!cargado || !borrador) {
    return null;
  }

  const b = borrador;
  const rolVacio = b.objetivo.rol.trim().length === 0;
  const salarioInvalido =
    salario.trim().length > 0 && !/^\d+$/.test(salario.trim());

  function actualizarObjetivo(cambio: Partial<CrearPerfil["objetivo"]>) {
    setBorrador((prev) =>
      prev ? { ...prev, objetivo: { ...prev.objetivo, ...cambio } } : prev,
    );
  }

  function quitarHabilidad(indice: number) {
    setBorrador((prev) =>
      prev
        ? { ...prev, habilidades: (prev.habilidades ?? []).filter((_, i) => i !== indice) }
        : prev,
    );
  }

  function quitarIdioma(indice: number) {
    setBorrador((prev) =>
      prev
        ? { ...prev, idiomas: (prev.idiomas ?? []).filter((_, i) => i !== indice) }
        : prev,
    );
  }

  function quitarCertificacion(indice: number) {
    setBorrador((prev) =>
      prev
        ? {
            ...prev,
            certificaciones: (prev.certificaciones ?? []).filter(
              (_, i) => i !== indice,
            ),
          }
        : prev,
    );
  }

  function quitarExperiencia(indice: number) {
    setBorrador((prev) =>
      prev
        ? { ...prev, experiencias: (prev.experiencias ?? []).filter((_, i) => i !== indice) }
        : prev,
    );
  }

  async function guardar() {
    if (rolVacio) {
      setErrorRol("Dinos qué trabajo o rol estás buscando.");
      return;
    }
    if (salarioInvalido) {
      return;
    }
    setErrorRol(null);
    setEstado("guardando");
    setError(null);

    const salarioMin =
      salario.trim().length > 0 ? Number.parseInt(salario.trim(), 10) : undefined;

    const datos: CrearPerfil = {
      ...b,
      consentimiento: true,
      objetivo: {
        ...b.objetivo,
        rol: b.objetivo.rol.trim(),
        salarioMin,
      },
    };

    try {
      const perfil = await confirmarPerfil(datos);
      guardarPerfilId(perfil.id);
      limpiarBorrador();
      router.push("/perfil/exito");
    } catch (fallo) {
      setEstado("error");
      const api = fallo instanceof ErrorApi ? fallo : null;
      setError(
        api?.message ?? "Ocurrió un error. Inténtalo de nuevo en un momento.",
      );
    }
  }

  const guardando = estado === "guardando";
  const puedeGuardar =
    !rolVacio && !salarioInvalido && consentimiento && !guardando;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-texto">Revisa tu perfil</h1>
        <p className="text-base text-texto-suave">
          Esto es un borrador. Nada se guarda hasta que lo confirmes. Revisa y
          corrige lo que haga falta.
        </p>
      </header>

      <Tarjeta>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-texto">¿Qué buscas?</h2>
          <CampoTexto
            id="b-rol"
            etiqueta="Rol o trabajo que buscas"
            valor={b.objetivo.rol}
            onCambio={(v) => actualizarObjetivo({ rol: v })}
            requerido
            error={rolVacio ? (errorRol ?? undefined) : undefined}
          />
          <CampoTexto
            id="b-sector"
            etiqueta="Sector (opcional)"
            valor={b.objetivo.sector ?? ""}
            onCambio={(v) => actualizarObjetivo({ sector: v || undefined })}
          />
          <div className="flex flex-col gap-2">
            <span className="text-base font-medium text-texto">
              Modalidad (opcional)
            </span>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Modalidad"
            >
              {MODALIDADES.map((opcion) => {
                const activo = b.objetivo.modalidad === opcion.valor;
                return (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() =>
                      actualizarObjetivo({
                        modalidad: activo ? undefined : opcion.valor,
                      })
                    }
                    aria-pressed={activo}
                    className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco"
                  >
                    <Chip activo={activo}>{opcion.etiqueta}</Chip>
                  </button>
                );
              })}
            </div>
          </div>
          <CampoTexto
            id="b-ubicacion"
            etiqueta="Ciudad o zona (opcional)"
            valor={b.objetivo.ubicacion ?? ""}
            onCambio={(v) => actualizarObjetivo({ ubicacion: v || undefined })}
          />
          <CampoTexto
            id="b-salario"
            etiqueta="Salario mínimo deseado (opcional)"
            tipo="number"
            valor={salario}
            onCambio={setSalario}
            ayuda="Un número entero, sin puntos ni comas. Puedes dejarlo vacío."
            error={
              salarioInvalido
                ? "Escribe solo números enteros (sin negativos ni decimales)."
                : undefined
            }
          />
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-texto">Tu experiencia</h2>
          {(b.experiencias ?? []).length === 0 ? (
            <p className="text-sm text-texto-suave">
              No agregaste experiencias.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {(b.experiencias ?? []).map((exp, i) => (
                <li
                  key={`${exp.cargo}-${i}`}
                  className="flex items-start justify-between gap-3 rounded-[var(--radius-control)] bg-superficie-alta px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-texto">{exp.cargo}</p>
                    <p className="text-sm text-texto-suave">{exp.descripcion}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => quitarExperiencia(i)}
                    aria-label={`Quitar ${exp.cargo}`}
                    className="text-texto-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco"
                  >
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-texto">Habilidades</h2>
          {(b.habilidades ?? []).length === 0 ? (
            <p className="text-sm text-texto-suave">No agregaste habilidades.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(b.habilidades ?? []).map((hab, i) => (
                <Chip key={`${hab.nombre}-${i}`} onEliminar={() => quitarHabilidad(i)}>
                  {hab.nombre}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-texto">Certificaciones</h2>
          {(b.certificaciones ?? []).length === 0 ? (
            <p className="text-sm text-texto-suave">
              No agregaste certificaciones.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(b.certificaciones ?? []).map((cert, i) => (
                <Chip
                  key={`${cert.nombre}-${i}`}
                  onEliminar={() => quitarCertificacion(i)}
                >
                  {cert.nombre}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-texto">Idiomas</h2>
          {(b.idiomas ?? []).length === 0 ? (
            <p className="text-sm text-texto-suave">No agregaste idiomas.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(b.idiomas ?? []).map((item, i) => (
                <Chip key={`${item.idioma}-${i}`} onEliminar={() => quitarIdioma(i)}>
                  {item.idioma}
                  {item.nivel ? ` · ${item.nivel}` : ""}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </Tarjeta>

      <Tarjeta>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={b.mostrarFechasAntiguas ?? false}
            onChange={(e) =>
              setBorrador((prev) =>
                prev
                  ? { ...prev, mostrarFechasAntiguas: e.target.checked }
                  : prev,
              )
            }
            className="mt-1 h-6 w-6 rounded border-borde focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco"
          />
          <span className="text-base text-texto">
            Mostrar las fechas de mi experiencia más antigua.
          </span>
        </label>
      </Tarjeta>

      <Tarjeta>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={consentimiento}
            onChange={(e) => setConsentimiento(e.target.checked)}
            className="mt-1 h-6 w-6 rounded border-borde focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco"
          />
          <span className="text-base text-texto">
            Autorizo que se guarde mi perfil con la información que acabo de
            revisar.
          </span>
        </label>
      </Tarjeta>

      {error && <BandaError mensaje={error} />}

      <Boton
        onClick={guardar}
        deshabilitado={!puedeGuardar}
        cargando={guardando}
        anchoCompleto
        tamano="lg"
      >
        Guardar mi perfil
      </Boton>
    </section>
  );
}
