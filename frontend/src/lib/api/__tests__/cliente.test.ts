import { afterEach, describe, expect, it, vi } from "vitest";
import { ErrorApi, solicitar } from "@/lib/api/cliente";

/** Construye una Response de error de Nest con el cuerpo indicado. */
function respuestaError(status: number, cuerpo?: unknown): Response {
  return new Response(cuerpo === undefined ? null : JSON.stringify(cuerpo), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("solicitar", () => {
  it("devuelve el JSON cuando la respuesta es correcta", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "p1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    const datos = await solicitar<{ id: string }>("/perfil/p1");
    expect(datos).toEqual({ id: "p1" });
  });

  it("pega sobre la base relativa /api", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    await solicitar("/perfil/preguntas");
    expect(fetchMock).toHaveBeenCalledWith("/api/perfil/preguntas", undefined);
  });

  it("devuelve undefined ante un 204 sin cuerpo", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(null, { status: 204 }),
    );
    const resultado = await solicitar<void>("/perfil/p1", { method: "DELETE" });
    expect(resultado).toBeUndefined();
  });

  it("lanza ErrorApi con estado 0 y esRed cuando fetch falla", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("falló"));
    await expect(solicitar("/perfil/preguntas")).rejects.toMatchObject({
      estado: 0,
      esRed: true,
    });
  });

  it("prioriza body.message string del backend", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      respuestaError(400, {
        statusCode: 400,
        message: "El consentimiento es obligatorio.",
        error: "Bad Request",
      }),
    );
    await expect(solicitar("/perfil/confirmar")).rejects.toThrow(
      "El consentimiento es obligatorio.",
    );
  });

  it("une body.message array con espacios", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      respuestaError(400, {
        statusCode: 400,
        message: ["El rol es obligatorio.", "Revisa el objetivo."],
      }),
    );
    await expect(solicitar("/perfil/confirmar")).rejects.toThrow(
      "El rol es obligatorio. Revisa el objetivo.",
    );
  });

  it.each([
    [400, "Revisa los datos e inténtalo de nuevo."],
    [404, "No encontramos el perfil que buscas."],
    [413, "El archivo es demasiado grande (máximo 10 MB)."],
    [415, "Ese tipo de archivo no se puede leer. Usa PDF, DOCX, TXT, PNG o JPG."],
    [422, "No pudimos leer el texto de tu archivo."],
  ])(
    "usa el respaldo por codigo %i cuando no hay message",
    async (codigo, esperado) => {
      vi.spyOn(globalThis, "fetch").mockResolvedValue(
        respuestaError(codigo, { statusCode: codigo }),
      );
      await expect(solicitar("/perfil/x")).rejects.toThrow(esperado);
    },
  );

  it("telefono duplicado (500 generico) cae en el fallback >=500, sin mensaje especifico", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      // El backend NO manda message amable para el telefono duplicado (gap conocido).
      respuestaError(500, { statusCode: 500 }),
    );
    try {
      await solicitar("/perfil/confirmar");
      expect.unreachable("debió lanzar ErrorApi");
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorApi);
      expect((error as ErrorApi).estado).toBe(500);
      expect((error as ErrorApi).message).toBe(
        "Ocurrió un error. Inténtalo de nuevo en un momento.",
      );
      expect((error as ErrorApi).message).not.toMatch(/tel[eé]fono/i);
    }
  });
});
