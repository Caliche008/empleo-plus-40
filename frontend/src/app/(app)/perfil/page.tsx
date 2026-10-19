"use client";

import { useCallback, useEffect, useState } from "react";
import { Boton } from "@/components/boton";
import { BandaError } from "@/components/banda-error";
import { Chip } from "@/components/chip";
import { EstadoVacio } from "@/components/estado-vacio";
import { Spinner } from "@/components/spinner";
import { Tarjeta } from "@/components/tarjeta";
import { ErrorApi } from "@/lib/api/cliente";
import { obtenerPerfil } from "@/lib/api/perfil";
import type { Perfil } from "@/lib/api/tipos-perfil";
import { leerPerfilId } from "@/lib/puente-perfil";

type Estado =
  | { tipo: "cargando" }
  | { tipo: "vacio" } // sin id en sessionStorage o 404
  | { tipo: "error"; mensaje: string }
  | { tipo: "listo"; perfil: Perfil };

/**
 * Ver mi perfil [CONECTADA]. Lee el id de sessionStorage (puente provisional sin
 * auth) y carga el perfil en el cliente. Degrada con gracia: sin id o 404 ->
 * EstadoVacio con CTA; red o >=500 -> BandaError con "Reintentar". No usa
 * loading/not-found de servidor.
 */
export default function VerPerfil() {
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });

  const cargar = useCallback(() => {
    const id = leerPerfilId();
    if (!id) {
      setEstado({ tipo: "vacio" });
      return;
    }
    setEstado({ tipo: "cargando" });
    obtenerPerfil(id)
      .then((perfil) => setEstado({ tipo: "listo", perfil }))
      .catch((fallo) => {
        const api = fallo instanceof ErrorApi ? fallo : null;
        if (api?.estado === 404) {
          setEstado({ tipo: "vacio" });
          return;
        }
        setEstado({
          tipo: "error",
          mensaje:
            api?.message ??
            "Ocurrió un error. Inténtalo de nuevo en un momento.",
        });
      });
  }, []);

  useEffect(() => {
    // Carga al montar: lee el id del navegador (sessionStorage) y pide el
    // perfil. Es un efecto de sincronizacion con una fuente externa (browser +
    // backend), el caso legitimo para setState en efecto.
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
        titulo="Aún no tienes perfil"
        mensaje="Crea tu perfil para que las empresas te conozcan."
        icono="👤"
        accion={
          <Boton href="/perfil/metodo" anchoCompleto tamano="lg">
            Crear mi perfil
          </Boton>
        }
      />
    );
  }

  if (estado.tipo === "error") {
    return (
      <section className="flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-texto">Mi perfil</h1>
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

  const { perfil } = estado;

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-texto">
          {perfil.nombre ?? "Mi perfil"}
        </h1>
        {perfil.objetivo?.rol && (
          <p className="text-lg text-texto-suave">{perfil.objetivo.rol}</p>
        )}
      </header>

      {perfil.objetivo && (
        <Tarjeta>
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-bold text-texto">Lo que buscas</h2>
            <dl className="flex flex-col gap-1 text-base">
              {perfil.objetivo.sector && (
                <DatoDescriptivo etiqueta="Sector" valor={perfil.objetivo.sector} />
              )}
              {perfil.objetivo.modalidad && (
                <DatoDescriptivo
                  etiqueta="Modalidad"
                  valor={perfil.objetivo.modalidad}
                />
              )}
              {perfil.objetivo.ubicacion && (
                <DatoDescriptivo
                  etiqueta="Ubicación"
                  valor={perfil.objetivo.ubicacion}
                />
              )}
              {typeof perfil.objetivo.salarioMin === "number" && (
                <DatoDescriptivo
                  etiqueta="Salario mínimo"
                  valor={String(perfil.objetivo.salarioMin)}
                />
              )}
            </dl>
          </div>
        </Tarjeta>
      )}

      {perfil.experiencias.length > 0 && (
        <Tarjeta>
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-texto">Experiencia</h2>
            <ul className="flex flex-col gap-3">
              {perfil.experiencias.map((exp) => (
                <li key={exp.id} className="flex flex-col gap-1">
                  <p className="font-medium text-texto">{exp.cargo}</p>
                  <p className="text-base text-texto-suave">{exp.descripcion}</p>
                  {exp.logros.length > 0 && (
                    <ul className="list-inside list-disc text-base text-texto-suave">
                      {exp.logros.map((logro, i) => (
                        <li key={i}>{logro}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </Tarjeta>
      )}

      {perfil.habilidades.length > 0 && (
        <Tarjeta>
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-texto">Habilidades</h2>
            <div className="flex flex-wrap gap-2">
              {perfil.habilidades.map((hab) => (
                <Chip key={hab.id}>{hab.nombre}</Chip>
              ))}
            </div>
          </div>
        </Tarjeta>
      )}

      {perfil.certificaciones.length > 0 && (
        <Tarjeta>
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-texto">Certificaciones</h2>
            <div className="flex flex-wrap gap-2">
              {perfil.certificaciones.map((cert) => (
                <Chip key={cert.id}>{cert.nombre}</Chip>
              ))}
            </div>
          </div>
        </Tarjeta>
      )}

      {perfil.idiomas.length > 0 && (
        <Tarjeta>
          <div className="flex flex-col gap-3">
            <h2 className="text-xl font-bold text-texto">Idiomas</h2>
            <div className="flex flex-wrap gap-2">
              {perfil.idiomas.map((item) => (
                <Chip key={item.id}>
                  {item.idioma}
                  {item.nivel ? ` · ${item.nivel}` : ""}
                </Chip>
              ))}
            </div>
          </div>
        </Tarjeta>
      )}

      <div className="flex flex-col gap-3">
        <Boton href={`/perfil/${perfil.id}/editar`} anchoCompleto>
          Editar mi perfil
        </Boton>
        <Boton href={`/perfil/${perfil.id}/eliminar`} variante="peligro" anchoCompleto>
          Eliminar mi perfil
        </Boton>
      </div>
    </section>
  );
}

function DatoDescriptivo({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex gap-2">
      <dt className="font-medium text-texto">{etiqueta}:</dt>
      <dd className="text-texto-suave">{valor}</dd>
    </div>
  );
}
