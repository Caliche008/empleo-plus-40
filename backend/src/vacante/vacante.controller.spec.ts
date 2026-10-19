import { BadGatewayException, BadRequestException } from '@nestjs/common';
import type { VacanteAnalizada } from '../ia/prompts/analizar-vacante.prompt.js';
import { AnalisisFallidoError, TextoVacanteInvalidoError } from './errores.js';
import { VacanteController } from './vacante.controller.js';
import type { VacanteService } from './vacante.service.js';

/**
 * Doble inyectado: solo expone lo que el controller invoca. No se levanta la app
 * (sin TestingModule), ni red, ni IA real, siguiendo el patrón de
 * `perfil.controller.spec.ts`.
 */
function crearControlador() {
  const analizar = vi.fn();
  const vacante = { analizar } as unknown as VacanteService;
  const controlador = new VacanteController(vacante);
  return { controlador, analizar };
}

/** Resultado mínimo válido que el servicio devolvería. */
function analisisFalso(): VacanteAnalizada {
  return {
    cargo: 'Analista',
    obligatorios: [],
    deseables: [],
    habilidades: [],
    alertas: [],
  };
}

describe('VacanteController.analizar', () => {
  it('C1. body válido llama a vacante.analizar(texto) y devuelve el resultado', async () => {
    const { controlador, analizar } = crearControlador();
    const resultado = analisisFalso();
    analizar.mockResolvedValue(resultado);
    const texto = 'Oferta de empleo con requisitos y condiciones de la vacante.';

    const respuesta = await controlador.analizar({ texto });

    expect(analizar).toHaveBeenCalledTimes(1);
    expect(analizar).toHaveBeenCalledWith(texto);
    expect(respuesta).toBe(resultado);
  });

  it('C2. body inválido (sin texto) lanza BadRequestException (400) y no llama al servicio', async () => {
    const { controlador, analizar } = crearControlador();

    await expect(controlador.analizar({})).rejects.toBeInstanceOf(BadRequestException);
    expect(analizar).not.toHaveBeenCalled();
  });

  it('C3. TextoVacanteInvalidoError se traduce a BadRequestException (400)', async () => {
    const { controlador, analizar } = crearControlador();
    const dominio = new TextoVacanteInvalidoError();
    analizar.mockRejectedValue(dominio);

    try {
      await controlador.analizar({ texto: 'una oferta válida y suficientemente larga para pasar.' });
      expect.fail('debía lanzar BadRequestException');
    } catch (e) {
      expect(e).toBeInstanceOf(BadRequestException);
      expect((e as BadRequestException).message).toBe(dominio.message);
    }
  });

  it('C4. AnalisisFallidoError se traduce a BadGatewayException (502) con el mensaje de dominio', async () => {
    const { controlador, analizar } = crearControlador();
    const dominio = new AnalisisFallidoError();
    analizar.mockRejectedValue(dominio);

    try {
      await controlador.analizar({ texto: 'una oferta válida y suficientemente larga para pasar.' });
      expect.fail('debía lanzar BadGatewayException');
    } catch (e) {
      expect(e).toBeInstanceOf(BadGatewayException);
      expect((e as BadGatewayException).message).toBe(dominio.message);
    }
  });

  it('C5. (compliance) un Error genérico se re-lanza tal cual, sin traducir ni filtrar su mensaje', async () => {
    const { controlador, analizar } = crearControlador();
    const crudo = new Error('fallo interno: el proveedor de IA rechazó la petición');
    analizar.mockRejectedValue(crudo);

    try {
      await controlador.analizar({ texto: 'una oferta válida y suficientemente larga para pasar.' });
      expect.fail('debía re-lanzar el error genérico');
    } catch (e) {
      expect(e).toBe(crudo);
    }
  });
});
