import { BadGatewayException, BadRequestException, NotFoundException } from '@nestjs/common';
import type { VacanteAnalizada } from '../ia/prompts/analizar-vacante.prompt.js';
import {
  AnalisisFallidoError,
  OperacionFallidaError,
  TextoVacanteInvalidoError,
  VacanteNoEncontradaError,
} from './errores.js';
import { VacanteController } from './vacante.controller.js';
import type { VacanteService } from './vacante.service.js';

/**
 * Doble inyectado: solo expone lo que el controller invoca. No se levanta la app
 * (sin TestingModule), ni red, ni IA real, siguiendo el patrón de
 * `perfil.controller.spec.ts`.
 */
function crearControlador() {
  const analizar = vi.fn();
  const obtener = vi.fn();
  const vacante = { analizar, obtener } as unknown as VacanteService;
  const controlador = new VacanteController(vacante);
  return { controlador, analizar, obtener };
}

/** Resultado mínimo válido que el servicio devolvería, con el id persistido. */
function analisisFalso(): VacanteAnalizada & { id: string } {
  return {
    id: 'vac-1',
    cargo: 'Analista',
    obligatorios: [],
    deseables: [],
    habilidades: [],
    alertas: [],
  };
}

describe('VacanteController.analizar', () => {
  it('C1. body válido llama a vacante.analizar(texto) y devuelve el resultado con id', async () => {
    const { controlador, analizar } = crearControlador();
    const resultado = analisisFalso();
    analizar.mockResolvedValue(resultado);
    const texto = 'Oferta de empleo con requisitos y condiciones de la vacante.';

    const respuesta = await controlador.analizar({ texto });

    expect(analizar).toHaveBeenCalledTimes(1);
    expect(analizar).toHaveBeenCalledWith(texto);
    expect(respuesta).toBe(resultado);
    expect((respuesta as { id: string }).id).toBe('vac-1');
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

describe('VacanteController.obtener', () => {
  it('C6. id existente llama a vacante.obtener(id) y devuelve la vacante con alertas', async () => {
    const { controlador, obtener } = crearControlador();
    const guardada = { id: 'vac-1', cargo: 'Analista', alertas: [] };
    obtener.mockResolvedValue(guardada);

    const respuesta = await controlador.obtener('vac-1');

    expect(obtener).toHaveBeenCalledWith('vac-1');
    expect(respuesta).toBe(guardada);
  });

  it('C7. VacanteNoEncontradaError se traduce a NotFoundException (404)', async () => {
    const { controlador, obtener } = crearControlador();
    const dominio = new VacanteNoEncontradaError('vac-x');
    obtener.mockRejectedValue(dominio);

    try {
      await controlador.obtener('vac-x');
      expect.fail('debía lanzar NotFoundException');
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundException);
      expect((e as NotFoundException).message).toBe(dominio.message);
    }
  });

  it('C8. (compliance) OperacionFallidaError del servicio se re-lanza sin traducir ni filtrar', async () => {
    const { controlador, obtener } = crearControlador();
    const dominio = new OperacionFallidaError();
    obtener.mockRejectedValue(dominio);

    try {
      await controlador.obtener('vac-x');
      expect.fail('debía re-lanzar el error de dominio');
    } catch (e) {
      expect(e).toBe(dominio);
    }
  });
});
