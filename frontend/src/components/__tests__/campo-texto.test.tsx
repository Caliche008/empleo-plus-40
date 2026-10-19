import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CampoTexto } from "@/components/campo-texto";

describe("CampoTexto", () => {
  it("enlaza la etiqueta con el input via htmlFor/id", () => {
    render(
      <CampoTexto
        id="nombre"
        etiqueta="Nombre"
        valor=""
        onCambio={() => {}}
      />,
    );
    expect(screen.getByLabelText("Nombre")).toBeInTheDocument();
  });

  it("muestra el texto de ayuda y lo describe con aria-describedby", () => {
    render(
      <CampoTexto
        id="tel"
        etiqueta="Teléfono"
        valor=""
        onCambio={() => {}}
        ayuda="Opcional"
      />,
    );
    const input = screen.getByLabelText("Teléfono");
    expect(input).toHaveAttribute("aria-describedby", "tel-ayuda");
    expect(screen.getByText("Opcional")).toHaveAttribute("id", "tel-ayuda");
  });

  it("con error marca aria-invalid y describe el mensaje de error", () => {
    render(
      <CampoTexto
        id="correo"
        etiqueta="Correo"
        valor=""
        onCambio={() => {}}
        error="Correo no válido"
      />,
    );
    const input = screen.getByLabelText("Correo");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "correo-error");
    expect(screen.getByText("Correo no válido")).toHaveAttribute(
      "id",
      "correo-error",
    );
  });

  it("llama onCambio con el nuevo valor al escribir", () => {
    const alCambiar = vi.fn();
    render(
      <CampoTexto
        id="ciudad"
        etiqueta="Ciudad"
        valor=""
        onCambio={alCambiar}
      />,
    );
    fireEvent.change(screen.getByLabelText("Ciudad"), {
      target: { value: "Bogotá" },
    });
    expect(alCambiar).toHaveBeenCalledWith("Bogotá");
  });
});
