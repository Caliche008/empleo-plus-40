"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Boton } from "@/components/boton";
import { BandaError } from "@/components/banda-error";
import { CampoTexto } from "@/components/campo-texto";
import { Chip } from "@/components/chip";
import { Paso } from "@/components/paso";
import { Spinner } from "@/components/spinner";
import { Tarjeta } from "@/components/tarjeta";
import { ErrorApi } from "@/lib/api/cliente";
import { obtenerPreguntas } from "@/lib/api/perfil";
import type {
  CertificacionExtraida,
  CrearPerfil,
  ExperienciaEntrada,
  HabilidadExtraida,
  IdiomaExtraido,
  Modalidad,
  Pregunta,
} from "@/lib/api/tipos-perfil";
import { guardarBorrador } from "@/lib/puente-perfil";

// Pasos del guiado en orden. La captura es ESTRUCTURADA (un campo por paso o una
// coleccion a la vez); NO se infiere estructura desde texto libre.
type ClavePaso =
  | "nombre"
  | "telefono"
  | "rol"
  | "sector"
  | "modalidad"
  | "ubicacion"
  | "disponibilidad"
  | "experiencias"
  | "habilidades"
  | "certificaciones"
  | "idiomas";

const ORDEN_PASOS: ClavePaso[] = [
  "nombre",
  "telefono",
  "rol",
  "sector",
  "modalidad",
  "ubicacion",
  "disponibilidad",
  "experiencias",
  "habilidades",
  "certificaciones",
  "idiomas",
];

const MODALIDADES: { valor: Modalidad; etiqueta: string }[] = [
  { valor: "presencial", etiqueta: "Presencial" },
  { valor: "hibrido", etiqueta: "Híbrido" },
  { valor: "remoto", etiqueta: "Remoto" },
];

// Estado acumulado del guiado (campos planos; se arma el CrearPerfil al final).
interface EstadoGuiado {
  nombre: string;
  telefono: string;
  rol: string;
  sector: string;
  modalidad: Modalidad | "";
  ubicacion: string;
  disponibilidad: string;
  experiencias: ExperienciaEntrada[];
  habilidades: HabilidadExtraida[];
  certificaciones: CertificacionExtraida[];
  idiomas: IdiomaExtraido[];
}

const ESTADO_INICIAL: EstadoGuiado = {
  nombre: "",
  telefono: "",
  rol: "",
  sector: "",
  modalidad: "",
  ubicacion: "",
  disponibilidad: "",
  experiencias: [],
  habilidades: [],
  certificaciones: [],
  idiomas: [],
};

/**
 * Creacion guiada [CONECTADA solo lee preguntas]. Captura ESTRUCTURADA un paso a
 * la vez: escalares y objetivo con inputs directos; colecciones agregando items
 * uno a uno. Arma un borrador CrearPerfil, lo guarda en sessionStorage y
 * redirige a /perfil/borrador (NO llama a confirmar).
 */
export default function GuiadoPerfil() {
  const router = useRouter();
  const [preguntas, setPreguntas] = useState<Pregunta[] | null>(null);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [indice, setIndice] = useState(0);
  const [datos, setDatos] = useState<EstadoGuiado>(ESTADO_INICIAL);
  const [errorRol, setErrorRol] = useState<string | null>(null);

  // Lee las preguntas (en el cliente). Se usan para mostrar el texto de cada
  // paso; el reintento la vuelve a llamar.
  const cargar = useCallback(() => {
    setErrorCarga(null);
    setPreguntas(null);
    obtenerPreguntas()
      .then(setPreguntas)
      .catch((fallo) => {
        const api = fallo instanceof ErrorApi ? fallo : null;
        setErrorCarga(
          api?.message ?? "No pudimos cargar las preguntas. Inténtalo de nuevo.",
        );
      });
  }, []);

  useEffect(() => {
    // Carga las preguntas al montar (efecto de sincronizacion con el backend).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
  }, [cargar]);

  // Mapa id de pregunta -> texto, para mostrar la pregunta de cada paso.
  const textoPorId = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const pregunta of preguntas ?? []) {
      mapa.set(pregunta.id, pregunta.texto);
    }
    return mapa;
  }, [preguntas]);

  if (errorCarga) {
    return (
      <section className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-texto">Crear perfil con preguntas</h1>
        <BandaError
          mensaje={errorCarga}
          accion={
            <Boton onClick={cargar} variante="secundario">
              Reintentar
            </Boton>
          }
        />
      </section>
    );
  }

  if (!preguntas) {
    return (
      <section className="flex flex-col items-center gap-4 py-12">
        <Spinner etiqueta="Cargando las preguntas…" tamano={32} />
        <p className="text-base text-texto-suave">Cargando las preguntas…</p>
      </section>
    );
  }

  const clave = ORDEN_PASOS[indice];
  const total = ORDEN_PASOS.length;
  const esUltimo = indice === total - 1;
  const texto = textoPorId.get(clave) ?? "";

  function avanzar() {
    // El rol es obligatorio: no se puede pasar del paso sin completarlo.
    if (clave === "rol" && datos.rol.trim().length === 0) {
      setErrorRol("Dinos qué trabajo o rol estás buscando.");
      return;
    }
    setErrorRol(null);
    if (esUltimo) {
      finalizar();
      return;
    }
    setIndice((i) => i + 1);
  }

  function retroceder() {
    setErrorRol(null);
    setIndice((i) => Math.max(0, i - 1));
  }

  // Arma el CrearPerfil (consentimiento SIEMPRE false aqui: se marca en el
  // borrador) y redirige. Colecciones vacias quedan como arreglos vacios.
  function finalizar() {
    const borrador: CrearPerfil = {
      consentimiento: false,
      nombre: datos.nombre.trim() || undefined,
      telefono: datos.telefono.trim() || undefined,
      objetivo: {
        rol: datos.rol.trim(),
        sector: datos.sector.trim() || undefined,
        modalidad: datos.modalidad || undefined,
        ubicacion: datos.ubicacion.trim() || undefined,
        disponibilidad: datos.disponibilidad.trim() || undefined,
      },
      habilidades: datos.habilidades,
      experiencias: datos.experiencias,
      certificaciones: datos.certificaciones,
      idiomas: datos.idiomas,
    };
    guardarBorrador(borrador);
    router.push("/perfil/borrador");
  }

  return (
    <section className="flex flex-col gap-6">
      <Paso actual={indice + 1} total={total} titulo="Crea tu perfil" />

      <Tarjeta>
        <div className="flex flex-col gap-4">
          <p className="text-lg font-medium text-texto">{texto}</p>
          {renderPaso(clave, datos, setDatos, errorRol)}
        </div>
      </Tarjeta>

      <div className="flex gap-3">
        {indice > 0 && (
          <Boton onClick={retroceder} variante="secundario">
            Atrás
          </Boton>
        )}
        <Boton onClick={avanzar} anchoCompleto tamano="lg">
          {esUltimo ? "Revisar borrador" : "Siguiente"}
        </Boton>
      </div>
    </section>
  );
}

// Renderiza el control del paso actual. Separa escalares (inputs directos) de
// colecciones (listas de items estructurados).
function renderPaso(
  clave: ClavePaso,
  datos: EstadoGuiado,
  setDatos: React.Dispatch<React.SetStateAction<EstadoGuiado>>,
  errorRol: string | null,
) {
  switch (clave) {
    case "nombre":
      return (
        <CampoTexto
          id="g-nombre"
          etiqueta="Tu nombre"
          valor={datos.nombre}
          onCambio={(v) => setDatos((d) => ({ ...d, nombre: v }))}
          autoComplete="name"
        />
      );
    case "telefono":
      return (
        <CampoTexto
          id="g-telefono"
          etiqueta="Teléfono de contacto"
          tipo="tel"
          valor={datos.telefono}
          onCambio={(v) => setDatos((d) => ({ ...d, telefono: v }))}
          autoComplete="tel"
        />
      );
    case "rol":
      return (
        <CampoTexto
          id="g-rol"
          etiqueta="Rol o trabajo que buscas"
          valor={datos.rol}
          onCambio={(v) => setDatos((d) => ({ ...d, rol: v }))}
          requerido
          error={errorRol ?? undefined}
        />
      );
    case "sector":
      return (
        <CampoTexto
          id="g-sector"
          etiqueta="Sector o tipo de empresa"
          valor={datos.sector}
          onCambio={(v) => setDatos((d) => ({ ...d, sector: v }))}
        />
      );
    case "modalidad":
      return (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Modalidad">
          {MODALIDADES.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() =>
                setDatos((d) => ({
                  ...d,
                  modalidad: d.modalidad === opcion.valor ? "" : opcion.valor,
                }))
              }
              aria-pressed={datos.modalidad === opcion.valor}
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco rounded-full"
            >
              <Chip activo={datos.modalidad === opcion.valor}>
                {opcion.etiqueta}
              </Chip>
            </button>
          ))}
        </div>
      );
    case "ubicacion":
      return (
        <CampoTexto
          id="g-ubicacion"
          etiqueta="Ciudad o zona"
          valor={datos.ubicacion}
          onCambio={(v) => setDatos((d) => ({ ...d, ubicacion: v }))}
        />
      );
    case "disponibilidad":
      return (
        <CampoTexto
          id="g-disponibilidad"
          etiqueta="Disponibilidad"
          valor={datos.disponibilidad}
          onCambio={(v) => setDatos((d) => ({ ...d, disponibilidad: v }))}
        />
      );
    case "experiencias":
      return <PasoExperiencias datos={datos} setDatos={setDatos} />;
    case "habilidades":
      return <PasoHabilidades datos={datos} setDatos={setDatos} />;
    case "certificaciones":
      return <PasoCertificaciones datos={datos} setDatos={setDatos} />;
    case "idiomas":
      return <PasoIdiomas datos={datos} setDatos={setDatos} />;
  }
}

interface PropsColeccion {
  datos: EstadoGuiado;
  setDatos: React.Dispatch<React.SetStateAction<EstadoGuiado>>;
}

// Experiencias: cargo + descripcion. Se agregan de una en una (estructurado).
function PasoExperiencias({ datos, setDatos }: PropsColeccion) {
  const [cargo, setCargo] = useState("");
  const [descripcion, setDescripcion] = useState("");

  function agregar() {
    if (cargo.trim().length === 0 || descripcion.trim().length === 0) {
      return;
    }
    setDatos((d) => ({
      ...d,
      experiencias: [
        ...d.experiencias,
        { cargo: cargo.trim(), descripcion: descripcion.trim(), logros: [] },
      ],
    }));
    setCargo("");
    setDescripcion("");
  }

  function quitar(indice: number) {
    setDatos((d) => ({
      ...d,
      experiencias: d.experiencias.filter((_, i) => i !== indice),
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      {datos.experiencias.length > 0 && (
        <ul className="flex flex-col gap-2">
          {datos.experiencias.map((exp, i) => (
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
                onClick={() => quitar(i)}
                aria-label={`Quitar ${exp.cargo}`}
                className="text-texto-suave focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-acento-foco"
              >
                Quitar
              </button>
            </li>
          ))}
        </ul>
      )}
      <CampoTexto
        id="g-exp-cargo"
        etiqueta="Cargo"
        valor={cargo}
        onCambio={setCargo}
      />
      <CampoTexto
        id="g-exp-desc"
        etiqueta="¿Qué hacías en ese cargo?"
        valor={descripcion}
        onCambio={setDescripcion}
        multilinea
      />
      <Boton
        onClick={agregar}
        variante="secundario"
        deshabilitado={
          cargo.trim().length === 0 || descripcion.trim().length === 0
        }
      >
        Agregar experiencia
      </Boton>
    </div>
  );
}

// Habilidades: lista de nombres (chips).
function PasoHabilidades({ datos, setDatos }: PropsColeccion) {
  const [nombre, setNombre] = useState("");

  function agregar() {
    if (nombre.trim().length === 0) {
      return;
    }
    setDatos((d) => ({
      ...d,
      habilidades: [...d.habilidades, { nombre: nombre.trim() }],
    }));
    setNombre("");
  }

  function quitar(indice: number) {
    setDatos((d) => ({
      ...d,
      habilidades: d.habilidades.filter((_, i) => i !== indice),
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      {datos.habilidades.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {datos.habilidades.map((hab, i) => (
            <Chip key={`${hab.nombre}-${i}`} onEliminar={() => quitar(i)}>
              {hab.nombre}
            </Chip>
          ))}
        </div>
      )}
      <CampoTexto
        id="g-habilidad"
        etiqueta="Una habilidad"
        valor={nombre}
        onCambio={setNombre}
      />
      <Boton
        onClick={agregar}
        variante="secundario"
        deshabilitado={nombre.trim().length === 0}
      >
        Agregar habilidad
      </Boton>
    </div>
  );
}

// Certificaciones: lista de nombres (chips).
function PasoCertificaciones({ datos, setDatos }: PropsColeccion) {
  const [nombre, setNombre] = useState("");

  function agregar() {
    if (nombre.trim().length === 0) {
      return;
    }
    setDatos((d) => ({
      ...d,
      certificaciones: [...d.certificaciones, { nombre: nombre.trim() }],
    }));
    setNombre("");
  }

  function quitar(indice: number) {
    setDatos((d) => ({
      ...d,
      certificaciones: d.certificaciones.filter((_, i) => i !== indice),
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      {datos.certificaciones.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {datos.certificaciones.map((cert, i) => (
            <Chip key={`${cert.nombre}-${i}`} onEliminar={() => quitar(i)}>
              {cert.nombre}
            </Chip>
          ))}
        </div>
      )}
      <CampoTexto
        id="g-certificacion"
        etiqueta="Un curso o certificación"
        valor={nombre}
        onCambio={setNombre}
      />
      <Boton
        onClick={agregar}
        variante="secundario"
        deshabilitado={nombre.trim().length === 0}
      >
        Agregar certificación
      </Boton>
    </div>
  );
}

// Idiomas: idioma + nivel opcional.
function PasoIdiomas({ datos, setDatos }: PropsColeccion) {
  const [idioma, setIdioma] = useState("");
  const [nivel, setNivel] = useState("");

  function agregar() {
    if (idioma.trim().length === 0) {
      return;
    }
    setDatos((d) => ({
      ...d,
      idiomas: [
        ...d.idiomas,
        { idioma: idioma.trim(), nivel: nivel.trim() || undefined },
      ],
    }));
    setIdioma("");
    setNivel("");
  }

  function quitar(indice: number) {
    setDatos((d) => ({
      ...d,
      idiomas: d.idiomas.filter((_, i) => i !== indice),
    }));
  }

  return (
    <div className="flex flex-col gap-4">
      {datos.idiomas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {datos.idiomas.map((item, i) => (
            <Chip key={`${item.idioma}-${i}`} onEliminar={() => quitar(i)}>
              {item.idioma}
              {item.nivel ? ` · ${item.nivel}` : ""}
            </Chip>
          ))}
        </div>
      )}
      <CampoTexto
        id="g-idioma"
        etiqueta="Idioma"
        valor={idioma}
        onCambio={setIdioma}
      />
      <CampoTexto
        id="g-idioma-nivel"
        etiqueta="Nivel (opcional)"
        valor={nivel}
        onCambio={setNivel}
      />
      <Boton
        onClick={agregar}
        variante="secundario"
        deshabilitado={idioma.trim().length === 0}
      >
        Agregar idioma
      </Boton>
    </div>
  );
}
