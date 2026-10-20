import { afterEach, describe, expect, it, vi } from "vitest";
import { calcularMatch, obtenerMatch } from "@/lib/api/match";
import { ErrorApi } from "@/lib/api/cliente";
import type { ResultadoMatch } from "@/lib/api/tipos-match";

/** Response JSON correcta con el cuerpo dado. */
function respuestaOk(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Resultado de match de ejemplo que devolvería el backend (sin edad/nombre). */
function resultadoEjemplo(): ResultadoMatch {
  return {
    id: "match-1",
    candidatoId: "cand-1",
    vacanteId: "vac-1",
    puntaje: 72,
    desglose: {
      criterios: [
        {
          criterio: "habilidades",
          valor: 0.8,
          pesoBase: 0.4,
          pesoEfectivo: 0.4,
          aporte: 0.32,
          datoPresente: true,
        },
      ],
      fuenteSemantica: "embeddings",
      pesosRedistribuidos: false,
    },
    cubiertos: ["TypeScript"],
    brechas: [{ requisito: "AWS", obligatorio: false, sugerencia: "Haz un curso básico." }],
    recomendacion: "postular-ajustes",
    explicacion: "Buena compatibilidad con un par de ajustes.",
    creadoEn: "2024-01-01T00:00:00.000Z",
    explicacionDetallada: {
      resumen: "Buena compatibilidad con un par de ajustes.",
      porCriterio: [{ criterio: "habilidades", comentario: "Cubres lo principal." }],
      brechas: [{ requisito: "AWS", sugerencia: "Haz un curso básico." }],
    },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("calcularMatch", () => {
  it("hace POST JSON a /match con { candidatoId, vacanteId } y devuelve el resultado", async () => {
    const resultado = resultadoEjemplo();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(respuestaOk(resultado, 201));

    const devuelto = await calcularMatch({ candidatoId: "cand-1", vacanteId: "vac-1" });

    const [ruta, opciones] = fetchMock.mock.calls[0];
    expect(ruta).toBe("/api/match");
    expect(opciones?.method).toBe("POST");
    expect(opciones?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(opciones?.body as string)).toEqual({
      candidatoId: "cand-1",
      vacanteId: "vac-1",
    });
    expect(devuelto).toEqual(resultado);
  });

  it("respuesta 400 con { message } → lanza ErrorApi con estado 400 y ese mensaje", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      respuestaOk({ message: "Los datos del match no son válidos." }, 400),
    );

    try {
      await calcularMatch({ candidatoId: "", vacanteId: "vac-1" });
      expect.fail("debía lanzar ErrorApi");
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorApi);
      expect((e as ErrorApi).estado).toBe(400);
      expect((e as ErrorApi).message).toBe("Los datos del match no son válidos.");
    }
  });

  it("fetch rechaza (red caída) → ErrorApi con esRed true", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    try {
      await calcularMatch({ candidatoId: "cand-1", vacanteId: "vac-1" });
      expect.fail("debía lanzar ErrorApi de red");
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorApi);
      expect((e as ErrorApi).esRed).toBe(true);
    }
  });
});

describe("obtenerMatch", () => {
  it("hace GET a /match/:id con el id codificado y devuelve el resultado", async () => {
    const resultado = resultadoEjemplo();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(respuestaOk(resultado));

    const devuelto = await obtenerMatch("match 1");

    const [ruta, opciones] = fetchMock.mock.calls[0];
    expect(ruta).toBe("/api/match/match%201");
    expect(opciones?.method ?? "GET").toBe("GET");
    expect(devuelto).toEqual(resultado);
  });

  it("respuesta 404 con { message } → lanza ErrorApi con estado 404", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      respuestaOk({ message: "No encontramos ese match." }, 404),
    );

    try {
      await obtenerMatch("inexistente");
      expect.fail("debía lanzar ErrorApi");
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorApi);
      expect((e as ErrorApi).estado).toBe(404);
    }
  });
});
