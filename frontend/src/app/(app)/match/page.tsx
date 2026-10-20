"use client";

import { useState } from "react";
import { Boton } from "@/components/boton";
import { BandaError } from "@/components/banda-error";
import { CampoTexto } from "@/components/campo-texto";
import { Chip } from "@/components/chip";
import { Spinner } from "@/components/spinner";
import { Tarjeta } from "@/components/tarjeta";
import { ErrorApi } from "@/lib/api/cliente";
import { calcularMatch } from "@/lib/api/match";
import type {
  BrechaMatch,
  CriterioDesglose,
  RecomendacionMatch,
  ResultadoMatch,
} from "@/lib/api/tipos-match";

type Estado = "inactivo" | "cargando" | "exito" | "error";

/**
 * Etiqueta corta de cada recomendación, en lenguaje simple y sin paternalismo.
 * El match NO insinúa edad: solo compatibilidad profesional.
 */
const ETIQUETA_RECOMENDACION: Record<RecomendacionMatch, string> = {
  postular: "Postular",
  "postular-ajustes": "Postular con ajustes",
  descartar: "Descartar",
};

/** Frase de por qué, acorde a la recomendación. */
const RAZON_RECOMENDACION: Record<RecomendacionMatch, string> = {
  postular: "Tu perfil encaja bien con lo que pide la vacante.",
  "postular-ajustes":
    "Encajas en lo principal; refuerza lo que falta antes de postular.",
  descartar: "Hoy la vacante pide varias cosas que tu perfil aún no cubre.",
};

/** Nombre legible de cada criterio del desglose, sin tecnicismos. */
const NOMBRE_CRITERIO: Record<string, string> = {
  habilidades: "Habilidades",
  experiencia: "Experiencia",
  sector: "Sector",
  "ubicacion-modalidad": "Ubicación y modalidad",
  salario: "Salario",
};

/**
 * Compatibilidad (match) [CONECTADA]. Pantalla de resultado accesible.
 *
 * Disparador documentado del match en esta fase: una tarjeta con los ids del
 * candidato y de la vacante. El `candidatoId` es el id del perfil guardado; el
 * `vacanteId` es el `id` que devuelve `analizarVacante` al guardar la oferta. La
 * integración directa desde las pantallas de perfil/vacante llega después; por
 * ahora esta pantalla es la forma usable y documentada de calcular un match.
 *
 * Accesibilidad verificada manualmente: el tema oscuro+morado mantiene contraste
 * alto; el foco de teclado es visible (los componentes base fijan
 * `focus-visible:ring-acento-foco`); los campos tienen etiqueta visible y texto de
 * ayuda; hay UNA sola acción principal; el puntaje usa texto grande con
 * `aria-label` en palabras y la banda de error se anuncia con `role="alert"`. La
 * validación completa con tecnologías de asistencia (lectores de pantalla reales)
 * requiere revisión humana — ver `compliance.md §7`.
 */
export default function Compatibilidad() {
  const [candidatoId, setCandidatoId] = useState("");
  const [vacanteId, setVacanteId] = useState("");
  const [estado, setEstado] = useState<Estado>("inactivo");
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<ResultadoMatch | null>(null);

  const cargando = estado === "cargando";
  const faltanIds =
    candidatoId.trim().length === 0 || vacanteId.trim().length === 0;

  async function onCalcular() {
    if (faltanIds) {
      return;
    }
    setEstado("cargando");
    setError(null);
    try {
      const match = await calcularMatch({
        candidatoId: candidatoId.trim(),
        vacanteId: vacanteId.trim(),
      });
      setResultado(match);
      setEstado("exito");
    } catch (fallo) {
      const api = fallo instanceof ErrorApi ? fallo : null;
      setError(api?.message ?? "Ocurrió un error. Inténtalo de nuevo en un momento.");
      setEstado("error");
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-texto">Compatibilidad</h1>
        <p className="text-base text-texto-suave">
          Compara tu perfil con una vacante analizada y te mostramos qué tan bien
          encajan, qué ya cubres y qué conviene reforzar.
        </p>
      </header>

      <Tarjeta>
        <div className="flex flex-col gap-4">
          <CampoTexto
            id="candidato-id"
            etiqueta="Id del perfil"
            ayuda="Es el identificador de tu perfil guardado."
            valor={candidatoId}
            onCambio={setCandidatoId}
          />
          <CampoTexto
            id="vacante-id"
            etiqueta="Id de la vacante"
            ayuda="Es el identificador que obtienes al analizar y guardar una oferta."
            valor={vacanteId}
            onCambio={setVacanteId}
          />
          <Boton
            onClick={onCalcular}
            deshabilitado={faltanIds}
            cargando={cargando}
            anchoCompleto
            tamano="lg"
          >
            Calcular compatibilidad
          </Boton>
        </div>
      </Tarjeta>

      {estado === "cargando" && (
        <div className="flex justify-center">
          <Spinner etiqueta="Calculando compatibilidad…" tamano={32} />
        </div>
      )}

      {estado === "error" && error && <BandaError mensaje={error} />}

      {estado === "exito" && resultado && <Resultado match={resultado} />}
    </section>
  );
}

/** Muestra el resultado del match en lenguaje simple y accesible. */
function Resultado({ match }: { match: ResultadoMatch }) {
  // La explicación rica solo viene en POST; cae al resumen persistido si falta.
  const resumen = match.explicacionDetallada?.resumen ?? match.explicacion;
  // Aviso sobrio cuando el detalle vino del respaldo (sin embeddings o sin IA).
  const detalleLimitado =
    match.desglose.fuenteSemantica === "respaldo" ||
    match.explicacionDetallada === undefined;

  return (
    <div className="flex flex-col gap-5">
      <Tarjeta>
        <div className="flex flex-col items-center gap-3">
          <p
            className="text-5xl font-bold text-texto"
            aria-label={`Compatibilidad: ${match.puntaje} de 100`}
          >
            {match.puntaje}
            <span aria-hidden="true" className="text-2xl text-texto-suave">
              {" "}
              / 100
            </span>
          </p>
          <div className="flex flex-col items-center gap-2">
            <Chip activo>{ETIQUETA_RECOMENDACION[match.recomendacion]}</Chip>
            <p className="text-center text-base text-texto-suave">
              {RAZON_RECOMENDACION[match.recomendacion]}
            </p>
          </div>
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-texto">En qué nos basamos</h2>
          <p className="text-base text-texto">{resumen}</p>
          {detalleLimitado && (
            <p className="text-sm text-texto-suave">
              La explicación detallada no está disponible en este momento; el
              puntaje y el desglose siguen siendo válidos.
            </p>
          )}
        </div>
      </Tarjeta>

      <Tarjeta>
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-texto">Desglose por criterio</h2>
          <ul className="flex flex-col gap-3">
            {match.desglose.criterios.map((criterio) => (
              <li key={criterio.criterio}>
                <Desglose criterio={criterio} />
              </li>
            ))}
          </ul>
          {match.desglose.pesosRedistribuidos && (
            <p className="text-sm text-texto-suave">
              Algún criterio no tenía datos y su peso se repartió entre los demás.
            </p>
          )}
        </div>
      </Tarjeta>

      <ListaCubiertos cubiertos={match.cubiertos} />
      <ListaBrechas brechas={match.brechas} />
    </div>
  );
}

/** Una fila del desglose: criterio, su aporte y si su peso se redistribuyó. */
function Desglose({ criterio }: { criterio: CriterioDesglose }) {
  const nombre = NOMBRE_CRITERIO[criterio.criterio] ?? criterio.criterio;
  // El aporte llega en 0..1 (fracción del puntaje); se muestra como porcentaje.
  const aporte = Math.round(criterio.aporte * 100);
  const redistribuido = criterio.pesoEfectivo !== criterio.pesoBase;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-base font-medium text-texto">{nombre}</span>
        <span className="text-base text-texto-suave">+{aporte} pts</span>
      </div>
      {!criterio.datoPresente && (
        <span className="text-sm text-texto-suave">Sin datos para este criterio.</span>
      )}
      {redistribuido && (
        <span className="text-sm text-texto-suave">Peso ajustado por datos faltantes.</span>
      )}
    </div>
  );
}

/** Lista "Qué cubres": requisitos ya cubiertos como chips. */
function ListaCubiertos({ cubiertos }: { cubiertos: string[] }) {
  return (
    <Tarjeta>
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-texto">Qué cubres</h2>
        {cubiertos.length === 0 ? (
          <p className="text-base text-texto-suave">
            Todavía no hay requisitos cubiertos para esta vacante.
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {cubiertos.map((valor, indice) => (
              <li key={`${valor}-${indice}`}>
                <Chip>{valor}</Chip>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Tarjeta>
  );
}

/** Lista "Qué falta": brechas con su sugerencia, marcando obligatoria vs. deseable. */
function ListaBrechas({ brechas }: { brechas: BrechaMatch[] }) {
  return (
    <Tarjeta>
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-bold text-texto">Qué falta</h2>
        {brechas.length === 0 ? (
          <p className="text-base text-texto-suave">
            No encontramos brechas: cubres lo que pide la vacante.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {brechas.map((brecha, indice) => (
              <li key={`${brecha.requisito}-${indice}`}>
                <FilaBrecha brecha={brecha} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Tarjeta>
  );
}

/** Una brecha: requisito, si es obligatoria o deseable y la sugerencia de la IA. */
function FilaBrecha({ brecha }: { brecha: BrechaMatch }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-base font-medium text-texto">{brecha.requisito}</span>
        <Chip>{brecha.obligatorio ? "Obligatoria" : "Deseable"}</Chip>
      </div>
      {brecha.sugerencia && (
        <p className="text-base text-texto-suave">{brecha.sugerencia}</p>
      )}
    </div>
  );
}
