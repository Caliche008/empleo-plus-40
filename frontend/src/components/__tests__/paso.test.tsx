import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Paso } from "@/components/paso";

describe("Paso", () => {
  it("expone una progressbar con aria-valuenow/min/max", () => {
    render(<Paso actual={2} total={5} titulo="Datos básicos" />);
    const barra = screen.getByRole("progressbar");
    expect(barra).toHaveAttribute("aria-valuenow", "2");
    expect(barra).toHaveAttribute("aria-valuemin", "1");
    expect(barra).toHaveAttribute("aria-valuemax", "5");
  });

  it("muestra el titulo, el subtitulo y 'Paso X de N'", () => {
    render(
      <Paso
        actual={1}
        total={3}
        titulo="Tu experiencia"
        subtitulo="Cuéntanos dónde has trabajado"
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Tu experiencia" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Cuéntanos dónde has trabajado"),
    ).toBeInTheDocument();
    expect(screen.getByText("Paso 1 de 3")).toBeInTheDocument();
  });
});
