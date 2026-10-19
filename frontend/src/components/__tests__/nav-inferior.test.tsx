import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { NavInferior } from "@/components/nav-inferior";

// Mock de usePathname para controlar la ruta activa en cada caso.
const usePathnameMock = vi.fn();
vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

describe("NavInferior", () => {
  beforeEach(() => {
    usePathnameMock.mockReset();
  });

  it("marca aria-current='page' solo en la pestaña de la ruta actual", () => {
    usePathnameMock.mockReturnValue("/guardados");
    render(<NavInferior />);

    expect(screen.getByRole("link", { name: /Guardados/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(
      screen.getByRole("link", { name: /Inicio/ }),
    ).not.toHaveAttribute("aria-current");
  });

  it("considera activa la pestaña cuando la ruta cuelga de su base", () => {
    usePathnameMock.mockReturnValue("/perfil/editar");
    render(<NavInferior />);

    expect(screen.getByRole("link", { name: /Perfil/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("renderiza las cuatro pestañas", () => {
    usePathnameMock.mockReturnValue("/inicio");
    render(<NavInferior />);
    expect(screen.getAllByRole("link")).toHaveLength(4);
  });
});
