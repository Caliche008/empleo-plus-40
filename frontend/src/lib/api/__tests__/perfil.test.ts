import { afterEach, describe, expect, it, vi } from "vitest";
import {
  actualizarPerfil,
  confirmarPerfil,
  eliminarPerfil,
  obtenerPerfil,
  obtenerPreguntas,
  subirCv,
} from "@/lib/api/perfil";
import type { CrearPerfil } from "@/lib/api/tipos-perfil";

/** Response JSON correcta con el cuerpo dado. */
function respuestaOk(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("subirCv", () => {
  it("hace POST a /perfil/cv con FormData (campo 'archivo') y sin Content-Type manual", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        respuestaOk({
          borrador: {
            habilidades: [],
            experiencias: [],
            certificaciones: [],
            idiomas: [],
          },
        }),
      );

    const archivo = new File(["hoja de vida"], "cv.pdf", {
      type: "application/pdf",
    });
    const borrador = await subirCv(archivo);

    const [ruta, opciones] = fetchMock.mock.calls[0];
    expect(ruta).toBe("/api/perfil/cv");
    expect(opciones?.method).toBe("POST");
    expect(opciones?.body).toBeInstanceOf(FormData);
    const cuerpo = opciones?.body as FormData;
    expect(cuerpo.get("archivo")).toBeInstanceOf(File);
    // No se fija Content-Type a mano: el navegador pone el boundary.
    expect(opciones?.headers).toBeUndefined();
    // Desenvuelve { borrador }.
    expect(borrador).toEqual({
      habilidades: [],
      experiencias: [],
      certificaciones: [],
      idiomas: [],
    });
  });
});

describe("obtenerPreguntas", () => {
  it("hace GET a /perfil/preguntas y devuelve la lista", async () => {
    const preguntas = [{ id: "rol", texto: "¿Qué rol?", campo: "objetivo.rol" }];
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(respuestaOk(preguntas));
    const resultado = await obtenerPreguntas();
    expect(fetchMock).toHaveBeenCalledWith("/api/perfil/preguntas", undefined);
    expect(resultado).toEqual(preguntas);
  });
});

describe("confirmarPerfil", () => {
  it("hace POST JSON a /perfil/confirmar con consentimiento en el cuerpo", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(respuestaOk({ id: "p1" }));

    const datos: CrearPerfil = {
      consentimiento: true,
      objetivo: { rol: "Operario" },
    };
    await confirmarPerfil(datos);

    const [ruta, opciones] = fetchMock.mock.calls[0];
    expect(ruta).toBe("/api/perfil/confirmar");
    expect(opciones?.method).toBe("POST");
    expect(opciones?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(opciones?.body as string)).toEqual({
      consentimiento: true,
      objetivo: { rol: "Operario" },
    });
  });
});

describe("obtenerPerfil", () => {
  it("hace GET a /perfil/:id", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(respuestaOk({ id: "p1" }));
    await obtenerPerfil("p1");
    expect(fetchMock).toHaveBeenCalledWith("/api/perfil/p1", undefined);
  });
});

describe("actualizarPerfil", () => {
  it("hace PATCH JSON a /perfil/:id con el parche", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(respuestaOk({ id: "p1" }));
    await actualizarPerfil("p1", { nombre: "Ana" });
    const [ruta, opciones] = fetchMock.mock.calls[0];
    expect(ruta).toBe("/api/perfil/p1");
    expect(opciones?.method).toBe("PATCH");
    expect(JSON.parse(opciones?.body as string)).toEqual({ nombre: "Ana" });
  });
});

describe("eliminarPerfil", () => {
  it("hace DELETE a /perfil/:id y resuelve con 204 sin cuerpo", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status: 204 }));
    await expect(eliminarPerfil("p1")).resolves.toBeUndefined();
    const [ruta, opciones] = fetchMock.mock.calls[0];
    expect(ruta).toBe("/api/perfil/p1");
    expect(opciones?.method).toBe("DELETE");
  });
});
