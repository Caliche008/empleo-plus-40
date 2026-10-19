import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Boton } from "@/components/boton";

describe("Boton", () => {
  it("usa la variante primaria por defecto con texto blanco sobre acento", () => {
    render(<Boton>Guardar</Boton>);
    const boton = screen.getByRole("button", { name: "Guardar" });
    expect(boton).toHaveClass("bg-acento");
    expect(boton).toHaveClass("text-sobre-acento");
  });

  it("aplica la variante peligro cuando se indica", () => {
    render(<Boton variante="peligro">Eliminar</Boton>);
    expect(screen.getByRole("button", { name: "Eliminar" })).toHaveClass(
      "bg-error-fondo",
    );
  });

  it("cuando esta cargando fija aria-busy y bloquea el click", async () => {
    const alPulsar = vi.fn();
    render(
      <Boton cargando onClick={alPulsar}>
        Enviar
      </Boton>,
    );
    const boton = screen.getByRole("button");
    expect(boton).toHaveAttribute("aria-busy", "true");
    expect(boton).toBeDisabled();

    fireEvent.click(boton);
    expect(alPulsar).not.toHaveBeenCalled();
  });

  it("ejecuta onClick cuando esta activo", () => {
    const alPulsar = vi.fn();
    render(<Boton onClick={alPulsar}>Aceptar</Boton>);
    fireEvent.click(screen.getByRole("button", { name: "Aceptar" }));
    expect(alPulsar).toHaveBeenCalledTimes(1);
  });

  it("con href se renderiza como enlace (Link) y no como button", () => {
    render(<Boton href="/perfil">Ir al perfil</Boton>);
    const enlace = screen.getByRole("link", { name: "Ir al perfil" });
    expect(enlace).toHaveAttribute("href", "/perfil");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
