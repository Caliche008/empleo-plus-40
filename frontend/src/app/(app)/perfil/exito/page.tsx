import type { Metadata } from "next";
import { Boton } from "@/components/boton";
import { PantallaExito } from "@/components/pantalla-exito";

export const metadata: Metadata = { title: "Perfil guardado" };

/**
 * Confirmacion tras guardar [NAVEGACION]. No vuelve a llamar al backend: el
 * perfil ya se guardo en /perfil/borrador. Solo ofrece ir a ver el perfil.
 */
export default function ExitoPerfil() {
  return (
    <PantallaExito
      titulo="¡Tu perfil está guardado!"
      mensaje="Ya puedes verlo y editarlo cuando quieras."
      acciones={
        <Boton href="/perfil" anchoCompleto tamano="lg">
          Ver mi perfil
        </Boton>
      }
    />
  );
}
