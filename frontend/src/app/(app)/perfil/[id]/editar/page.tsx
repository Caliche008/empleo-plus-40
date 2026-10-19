"use client";

import { Suspense, use, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/boton";
import { BandaError } from "@/components/banda-error";
import { CampoTexto } from "@/components/campo-texto";
import { Chip } from "@/components/chip";
import { EstadoVacio } from "@/components/estado-vacio";
import { Spinner } from "@/components/spinner";
import { Tarjeta } from "@/components/tarjeta";
import { ErrorApi } from "@/lib/api/cliente";
import { actualizarPerfil, obtenerPerfil } from "@/lib/api/perfil";
import type { ActualizarPerfil, Modalidad } from "@/lib/api/tipos-perfil";

const MODALIDADES: { valor: Modalidad; etiqueta: string }[] = [
  { valor: "presencial", etiqueta: "Presencial" },
  { valor: "hibrido", etiqueta: "Híbrido" },
  { valor: "remoto", etiqueta: "Remoto" },
];

// Campos escalares editables (objetivo + datos de contacto). Las colecciones no
// se editan en esta fase (el DTO de PATCH solo cubre escalares + objetivo).
interface Formulario {
  nombre: string;
  telefono: string;
  rol: string;
  sector: string;
  modalidad: Modalidad | "";
  ubicacion: string;
  mostrarFechasAntiguas: boolean;
}

type Estado =
  | { tipo: "cargando" }
  | { tipo: "vacio" }
  | { tipo: "errorCarga"; mensaje: string }
  | { tipo: "listo" };

/**
 * Editar perfil [CONECTADA]. El id viene por la URL. Carga el perfil con
 * obtenerPerfil, edita los campos escalares y el objetivo, y guarda con
 * actualizarPerfil (PATCH). Degrada con gracia (Spinner / EstadoVacio / BandaError).
 */
export default function EditarPerfil({ params }: PageProps<"/perfil/[id]/editar">) {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-12">
          <Spinner tamano={32} />
        </div>
      }
    >
      <Contenido params={params} />
    </Suspense>
  );
}

function Contenido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [form, setForm] = useState<Formulario | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [errorRol, setErrorRol] = useState<string | null>(null);

  const cargar = useCallback(() => {
    setEstado({ tipo: "cargando" });
    obtenerPerfil(id)
      .then((perfil) => {
        setForm({
          nombre: perfil.nombre ?? "",
          telefono: perfil.telefono ?? "",
          rol: perfil.objetivo?.rol ?? "",
          sector: perfil.objetivo?.sector ?? "",
          modalidad: perfil.objetivo?.modalidad ?? "",
          ubicacion: perfil.objetivo?.ubicacion ?? "",
          mostrarFechasAntiguas: perfil.mostrarFechasAntiguas,
        });
        setEstado({ tipo: "listo" });
      })
      .catch((fallo) => {
        const api = fallo instanceof ErrorApi ? fallo : null;
        if (api?.estado === 404) {
          setEstado({ tipo: "vacio" });
          return;
        }
        setEstado({
          tipo: "errorCarga",
          mensaje:
            api?.message ??
            "Ocurrió un error. Inténtalo de nuevo en un momento.",
        });
      });
  }, [id]);

  useEffect(() => {
    // Carga el perfil al montar (sincronizacion con el backend).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  if (estado.tipo === "cargando") {
    return (
      <section className="flex flex-col items-center gap-4 py-12">
        <Spinner etiqueta="Cargando tu perfil…" tamano={32} />
        <p className="text-base text-texto-suave">Cargando tu perfil…</p>
      </section>
    );
  }

  if (estado.tipo === "vacio") {
    return (
      <EstadoVacio
        titulo="No encontramos el perfil"
        mensaje="Es posible que ya no exista."
        accion={
          <Boton href="/perfil/metodo" anchoCompleto tamano="lg">
            Crear mi perfil
          </Boton>
        }
      />
    );
  }

  if (estado.tipo === "errorCarga") {
    return (
      <section className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-texto">Editar perfil</h1>
        <BandaError
          mensaje={estado.mensaje}
          accion={
            <Boton onClick={cargar} variante="secundario">
              Reintentar
            </Boton>
          }
        />
      </section>
    );
  }

  if (!form) {
    return null;
  }

  const f = form;
  const rolVacio = f.rol.trim().length === 0;

  function actualizar(cambio: Partial<Formulario>) {
    setForm((prev) => (prev ? { ...prev, ...cambio } : prev));
  }

  async function guardar() {
    if (rolVacio) {
      setErrorRol("Dinos qué trabajo o rol estás buscando.");
      return;
    }
    setErrorRol(null);
    setGuardando(true);
    setErrorGuardar(null);

    const cambios: ActualizarPerfil = {
      nombre: f.nombre.trim() || undefined,
      telefono: f.telefono.trim() || undefined,
      mostrarFechasAntiguas: f.mostrarFechasAntiguas,
      objetivo: {
        rol: f.rol.trim(),
        sector: f.sector.trim() || undefined,
        modalidad: f.modalidad || undefined,
        ubicacion: f.ubicacion.trim() || undefined,
      },
    };

    try {
      await actualizarPerfil(id, cambios);
      router.push("/perfil");
    } catch (fallo) {
      setGuardando(false);
      const api = fallo instanceof ErrorApi ? fallo : null;
      setErrorGuardar(
        api?.message ?? "Ocurrió un error. Inténtalo de nuevo en un momento.",
      );
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-texto">Editar perfil</h1>

      <Tarjeta>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-texto">Tus datos</h2>
          <CampoTexto
            id="e-nombre"
            etiqueta="Nombre"
            valor={f.nombre}
            onCambio={(v) => actualizar({ nombre: v })}
            autoComplete="name"
          />
          <CampoTexto
            id="e-telefono"
            etiqueta="Teléfono"
            tipo="tel"
            valor={f.telefono}
            onCambio={(v) => actualizar({ telefono: v })}
            autoComplete="tel"
          />
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-texto">¿Qué buscas?</h2>
          <CampoTexto
            id="e-rol"
            etiqueta="Rol o trabajo que buscas"
            valor={f.rol}
            onCambio={(v) => actualizar({ rol: v })}
            requerido
            error={rolVacio ? (errorRol ?? undefined) : undefined}
          />
          <CampoTexto
            id="e-sector"
            etiqueta="Sector (opcional)"
            valor={f.sector}
            onCambio={(v) => actualizar({ sector: v })}
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
                const activo = f.modalidad === opcion.valor;
                return (
                  <button
                    key={opcion.valor}
                    type="button"
                    onClick={() =>
                      actualizar({ modalidad: activo ? "" : opcion.valor })
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
            id="e-ubicacion"
            etiqueta="Ciudad o zona (opcional)"
            valor={f.ubicacion}
            onCambio={(v) => actualizar({ ubicacion: v })}
          />
        </div>
      </Tarjeta>

      <Tarjeta>
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={f.mostrarFechasAntiguas}
            onChange={(e) => actualizar({ mostrarFechasAntiguas: e.target.checked })}
            className="mt-1 h-6 w-6 rounded border-borde focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco"
          />
          <span className="text-base text-texto">
            Mostrar las fechas de mi experiencia más antigua.
          </span>
        </label>
      </Tarjeta>

      {errorGuardar && <BandaError mensaje={errorGuardar} />}

      <div className="flex gap-3">
        <Boton href="/perfil" variante="secundario">
          Cancelar
        </Boton>
        <Boton
          onClick={guardar}
          cargando={guardando}
          deshabilitado={rolVacio}
          anchoCompleto
          tamano="lg"
        >
          Guardar cambios
        </Boton>
      </div>
    </section>
  );
}
