import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

// Test de humo: confirma que el arnes (Vitest + RTL + jsdom + jest-dom) funciona.
describe("arnes de pruebas", () => {
  it("renderiza y aplica los matchers de jest-dom", () => {
    render(<p>Hola</p>);
    expect(screen.getByText("Hola")).toBeInTheDocument();
  });
});
