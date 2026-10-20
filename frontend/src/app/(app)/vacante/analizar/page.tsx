"use client";

import { useState } from "react";
import { Boton } from "@/components/boton";
import { BandaError } from "@/components/banda-error";
import { CampoTexto } from "@/components/campo-texto";
import { Chip } from "@/components/chip";
import { Tarjeta } from "@/components/tarjeta";
import { ErrorApi } from "@/lib/api/cliente";
import { analizarVacante } from "@/lib/api/vacante";
import type { AlertaVacante, TipoAlerta, VacanteAnalizada } from "@/lib/api/tipos-vacante";
import { guardarVacanteId } from "@/lib/puente-perfil";

type Estado = "inactivo" | "cargando" | "exito" | "error";

/**
 * Texto FIJO del descargo legal. Es una constante del frontend (no depende de la
 * IA) para GARANTIZAR que el descargo de no-asesoría-jurídica esté SIEMPRE
 * presente en el resultado, aunque el modelo lo omita en una alerta.
 */
const DESCARGO_LEGAL =
  "Este análisis es orientativo y NO constituye asesoría jurídica. Ante una posible " +
  "discriminación, consulta a un abogado o a la defensoría/autoridad competente.";

/** Encabezado por tipo de alerta, en lenguaje simple y sin alarmismo. */
const TITULO_ALERTA: Record<TipoAlerta, string> = {
  edad: "Posible lenguaje por edad",
  "salario-oculto": "Salario no indicado",
  "requisitos-inflados": "Requisitos posiblemente excesivos",
  otro: "Algo a tener en cuenta",
};

/**
 * Analizar vacante [CONECTADA]. Pega el texto de una oferta y, al pulsar
 * "Analizar", llama a `analizarVacante`, muestra estados cargando/éxito/error y
 * presenta el resultado en lenguaje simple y accesible. El descargo legal es
 * fijo y siempre visible en el resultado. No es una maqueta.
 */
export default function AnalizarVacante() {
  const [texto, setTexto] = useState("");
  const [estado, setEstado] = useState<Estado>("inactivo");
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<VacanteAnalizada | null>(null);

  const cargando = estado === "cargando";
  const sinTexto = texto.trim().length === 0;

  async function onAnalizar() {
    if (sinTexto) {
      return;
    }
    setEstado("cargando");
    setError(null);
    try {
      const analisis = await analizarVacante(texto);
      // Recordamos el id de la vacante para la "ruta feliz": desde el resultado
      // se puede ir directo a calcular la compatibilidad sin copiar ids a mano.
      if (analisis.id) {
        guardarVacanteId(analisis.id);
      }
      setResultado(analisis);
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
        <h1 className="text-2xl font-bold text-texto">Analizar vacante</h1>
        <p className="text-base text-texto-suave">
          Pega el texto completo de la oferta y te mostramos los requisitos en
          lenguaje simple, además de señalar posibles banderas rojas.
        </p>
      </header>

      <Tarjeta>
        <div className="flex flex-col gap-4">
          <CampoTexto
            id="texto-vacante"
            etiqueta="Texto de la oferta"
            ayuda="Copia y pega aquí el anuncio de empleo tal como lo viste."
            valor={texto}
            onCambio={setTexto}
            multilinea
          />
          <Boton
            onClick={onAnalizar}
            deshabilitado={sinTexto}
            cargando={cargando}
            anchoCompleto
            tamano="lg"
          >
            Analizar
          </Boton>
        </div>
      </Tarjeta>

      {estado === "error" && error && <BandaError mensaje={error} />}

      {estado === "exito" && resultado && <Resultado analisis={resultado} />}
    </section>
  );
}

/** Muestra el resultado del análisis en lenguaje simple y accesible. */
function Resultado({ analisis }: { analisis: VacanteAnalizada }) {
  return (
    <div className="flex flex-col gap-5">
      <Tarjeta>
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-texto">{analisis.cargo}</h2>

          <DatosOferta analisis={analisis} />

          <ListaChips titulo="Requisitos obligatorios" valores={analisis.obligatorios} />
          <ListaChips titulo="Requisitos deseables" valores={analisis.deseables} />
          <ListaChips titulo="Habilidades" valores={analisis.habilidades} />
        </div>
      </Tarjeta>

      {analisis.alertas.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-bold text-texto">Qué conviene revisar</h2>
          {analisis.alertas.map((alerta, indice) => (
            <TarjetaAlerta key={`${alerta.tipo}-${indice}`} alerta={alerta} />
          ))}
        </div>
      )}

      {/* Descargo legal FIJO: siempre presente, no depende de la IA. */}
      <Tarjeta className="border-acento-foco">
        <p className="text-sm text-texto-suave">{DESCARGO_LEGAL}</p>
      </Tarjeta>

      {/* Siguiente paso de la ruta feliz: comparar esta vacante con el perfil. */}
      {analisis.id && (
        <Boton href="/match" anchoCompleto tamano="lg">
          Ver mi compatibilidad
        </Boton>
      )}
    </div>
  );
}

/** Lista los datos de la oferta que sí vienen (experiencia, ubicación, etc.). */
function DatosOferta({ analisis }: { analisis: VacanteAnalizada }) {
  const filas: { etiqueta: string; valor?: string }[] = [
    { etiqueta: "Experiencia pedida", valor: analisis.experienciaPedida },
    { etiqueta: "Ubicación", valor: analisis.ubicacion },
    { etiqueta: "Modalidad", valor: analisis.modalidad },
    { etiqueta: "Salario", valor: analisis.salario },
  ].filter((fila) => fila.valor);

  if (filas.length === 0) {
    return null;
  }

  return (
    <dl className="flex flex-col gap-2">
      {filas.map((fila) => (
        <div key={fila.etiqueta} className="flex flex-col">
          <dt className="text-sm text-texto-suave">{fila.etiqueta}</dt>
          <dd className="text-base text-texto">{fila.valor}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Muestra una lista de valores como chips; se omite si está vacía. */
function ListaChips({ titulo, valores }: { titulo: string; valores: string[] }) {
  if (valores.length === 0) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-base font-medium text-texto">{titulo}</h3>
      <ul className="flex flex-wrap gap-2">
        {valores.map((valor, indice) => (
          <li key={`${valor}-${indice}`}>
            <Chip>{valor}</Chip>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Tarjeta de una alerta. La de tipo "edad" se destaca con el borde de acento
 * para darle énfasis visible SIN alarmismo (no usa el color de error).
 */
function TarjetaAlerta({ alerta }: { alerta: AlertaVacante }) {
  const destacada = alerta.tipo === "edad" ? "border-acento-foco" : "";
  return (
    <Tarjeta className={destacada}>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-base font-bold text-texto">{TITULO_ALERTA[alerta.tipo]}</h3>
        <p className="text-base text-texto">{alerta.detalle}</p>
      </div>
    </Tarjeta>
  );
}
