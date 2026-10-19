import { afterEach, describe, expect, it, vi } from "vitest";
import { analizarVacante } from "@/lib/api/vacante";
import { ErrorApi } from "@/lib/api/cliente";
import type { VacanteAnalizada } from "@/lib/api/tipos-vacante";

/** Response JSON correcta con el cuerpo dado. */
function respuestaOk(cuerpo: unknown, status = 200): Response {
  return new Response(JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** Análisis de ejemplo que devolvería el backend. */
function analisisEjemplo(): VacanteAnalizada {
  return {
    cargo: "Desarrollador",
    obligatorios: ["TypeScript"],
    deseables: [],
    habilidades: ["TypeScript"],
    alertas: [{ tipo: "salario-oculto", detalle: "La oferta no indica el salario." }],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("analizarVacante", () => {
  it("hace POST JSON a /vacante/analizar con { texto } y devuelve el análisis", async () => {
    const analisis = analisisEjemplo();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(respuestaOk(analisis));

    const resultado = await analizarVacante("Oferta de empleo con requisitos de la vacante.");

    const [ruta, opciones] = fetchMock.mock.calls[0];
    expect(ruta).toBe("/api/vacante/analizar");
    expect(opciones?.method).toBe("POST");
    expect(opciones?.headers).toEqual({ "Content-Type": "application/json" });
    expect(JSON.parse(opciones?.body as string)).toEqual({
      texto: "Oferta de empleo con requisitos de la vacante.",
    });
    expect(resultado).toEqual(analisis);
  });

  it("respuesta 400 con { message } → lanza ErrorApi con estado 400 y ese mensaje", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      respuestaOk({ message: "El texto de la vacante es muy corto." }, 400),
    );

    try {
      await analizarVacante("corto");
      expect.fail("debía lanzar ErrorApi");
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorApi);
      expect((e as ErrorApi).estado).toBe(400);
      expect((e as ErrorApi).message).toBe("El texto de la vacante es muy corto.");
    }
  });

  it("fetch rechaza (red caída) → ErrorApi con esRed true", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("Failed to fetch"));

    try {
      await analizarVacante("Oferta de empleo con requisitos de la vacante.");
      expect.fail("debía lanzar ErrorApi de red");
    } catch (e) {
      expect(e).toBeInstanceOf(ErrorApi);
      expect((e as ErrorApi).esRed).toBe(true);
    }
  });
});
