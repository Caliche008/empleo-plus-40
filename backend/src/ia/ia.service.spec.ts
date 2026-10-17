import { z } from 'zod';
import { IaService, extraerJson } from './ia.service.js';
import { IaError } from './ia.types.js';
import type {
  PeticionIa,
  PeticionVision,
  ProveedorIa,
  RespuestaIa,
} from './ia.types.js';

/**
 * Proveedor simulado que implementa `ProveedorIa`. Devuelve, en orden, las
 * respuestas de una cola configurable y cuenta las invocaciones a `completar`.
 * No usa red ni APIs reales: todo el texto proviene de la cola.
 */
class ProveedorSimulado implements ProveedorIa {
  readonly nombre = 'simulado';
  readonly modelo = 'modelo-test';

  /** Nº de veces que se invocó `completar`. */
  llamadas = 0;
  /** Peticiones recibidas, en orden, para inspeccionar los mensajes. */
  readonly peticiones: PeticionIa[] = [];
  /** Índice de la respuesta actual dentro de la cola. */
  private indice = 0;

  constructor(private readonly respuestas: string[]) {}

  completar(peticion: PeticionIa): Promise<RespuestaIa> {
    this.llamadas++;
    this.peticiones.push(peticion);
    // Si se agota la cola, repite la última respuesta disponible.
    const texto =
      this.respuestas[Math.min(this.indice, this.respuestas.length - 1)] ?? '';
    this.indice++;
    return Promise.resolve({
      texto,
      proveedor: this.nombre,
      modelo: this.modelo,
      latenciaMs: 0,
    });
  }
}

/**
 * Proveedor simulado CON visión. Añade `completarVision`, que consume la misma
 * cola que `completar`, y registra las peticiones de visión recibidas. Útil para
 * probar `completarVisionJson` sin red.
 */
class ProveedorVisionSimulado extends ProveedorSimulado {
  /** Peticiones de visión recibidas, en orden. */
  readonly peticionesVision: PeticionVision[] = [];
  /** Nº de veces que se invocó `completarVision`. */
  llamadasVision = 0;

  completarVision(peticion: PeticionVision): Promise<RespuestaIa> {
    this.llamadasVision++;
    this.peticionesVision.push(peticion);
    // Reutiliza la cola de respuestas del padre mapeando a una PeticionIa.
    return this.completar({
      mensajes: peticion.prompt,
      temperatura: peticion.temperatura,
      maxTokens: peticion.maxTokens,
    });
  }
}

/** Petición mínima reutilizable en las pruebas. */
function peticionBase(): PeticionIa {
  return { mensajes: [{ rol: 'user', contenido: 'dame el JSON' }] };
}

/** Petición de visión mínima reutilizable en las pruebas. */
function peticionVisionBase(): PeticionVision {
  return {
    prompt: [{ rol: 'user', contenido: 'transcribe la imagen' }],
    imagen: { datosBase64: 'AAAA', mimeType: 'image/png' },
  };
}

describe('extraerJson', () => {
  it('A1. parsea un objeto JSON directo', () => {
    expect(extraerJson('{"a":1,"b":"x"}')).toEqual({ a: 1, b: 'x' });
  });

  it('A2. parsea un array JSON directo', () => {
    expect(extraerJson('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('A3. extrae JSON de un bloque ```json … ```', () => {
    expect(extraerJson('```json\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it('A4. extrae JSON de un bloque sin etiqueta de lenguaje', () => {
    expect(extraerJson('```\n{"ok":true}\n```')).toEqual({ ok: true });
  });

  it('A5. extrae el primer objeto balanceado con texto alrededor', () => {
    expect(extraerJson('Aquí tienes la respuesta: {"hay":true} fin.')).toEqual({
      hay: true,
    });
  });

  it('A6. extrae el primer array balanceado con texto alrededor', () => {
    expect(extraerJson('resultado => [10,20] listo')).toEqual([10, 20]);
  });

  it('A7. devuelve undefined cuando no hay JSON', () => {
    expect(extraerJson('no hay nada estructurado aquí')).toBeUndefined();
  });

  it('A8. devuelve undefined ante una llave abierta sin cierre', () => {
    expect(extraerJson('texto { roto sin cierre')).toBeUndefined();
  });
});

describe('IaService.completarJson — camino feliz', () => {
  const esquema = z.object({ nombre: z.string(), edad: z.number() });

  it('B1. devuelve el dato tipado cuando el proveedor cumple el esquema', async () => {
    const proveedor = new ProveedorSimulado(['{"nombre":"Ana","edad":42}']);
    const servicio = new IaService(proveedor);

    const dato = await servicio.completarJson(peticionBase(), { esquema });

    expect(dato).toEqual({ nombre: 'Ana', edad: 42 });
    expect(proveedor.llamadas).toBe(1);
  });

  it('B2. extrae y valida JSON envuelto en un bloque ```json ```', async () => {
    const proveedor = new ProveedorSimulado([
      '```json\n{"nombre":"Ana","edad":42}\n```',
    ]);
    const servicio = new IaService(proveedor);

    const dato = await servicio.completarJson(peticionBase(), { esquema });

    expect(dato).toEqual({ nombre: 'Ana', edad: 42 });
    expect(proveedor.llamadas).toBe(1);
  });
});

describe('IaService.completarJson — reintentos con proveedor simulado', () => {
  const esquema = z.object({ nombre: z.string(), edad: z.number() });

  it('C1. reintenta ante JSON inexistente y devuelve el dato válido', async () => {
    const proveedor = new ProveedorSimulado([
      'no soy json',
      '{"nombre":"Ana","edad":42}',
    ]);
    const servicio = new IaService(proveedor);

    const dato = await servicio.completarJson(peticionBase(), { esquema });

    expect(dato).toEqual({ nombre: 'Ana', edad: 42 });
    // Hubo exactamente un reintento (dos llamadas en total).
    expect(proveedor.llamadas).toBe(2);

    // La segunda petición incorpora la respuesta previa del asistente y un
    // mensaje de corrección del usuario como último mensaje.
    const segundaPeticion = proveedor.peticiones[1];
    expect(segundaPeticion.mensajes.length).toBeGreaterThan(
      peticionBase().mensajes.length,
    );
    const ultimo =
      segundaPeticion.mensajes[segundaPeticion.mensajes.length - 1];
    expect(ultimo.rol).toBe('user');
    expect(ultimo.contenido).toContain('JSON válido');
    expect(
      segundaPeticion.mensajes.some(
        (m) => m.rol === 'assistant' && m.contenido === 'no soy json',
      ),
    ).toBe(true);
  });

  it('C2. reintenta ante JSON que no cumple el esquema y devuelve el dato válido', async () => {
    const proveedor = new ProveedorSimulado([
      '{"nombre":"Ana"}',
      '{"nombre":"Ana","edad":42}',
    ]);
    const servicio = new IaService(proveedor);

    const dato = await servicio.completarJson(peticionBase(), { esquema });

    expect(dato).toEqual({ nombre: 'Ana', edad: 42 });
    expect(proveedor.llamadas).toBe(2);
  });

  it('C3. lanza IaError tipo "peticion" si nunca llega JSON válido', async () => {
    const proveedor = new ProveedorSimulado(['texto sin json']);
    const servicio = new IaService(proveedor);

    try {
      await servicio.completarJson(peticionBase(), { esquema, reintentos: 1 });
      expect.fail('debía lanzar IaError');
    } catch (e) {
      expect(e).toBeInstanceOf(IaError);
      const error = e as IaError;
      expect(error.tipo).toBe('peticion');
      expect(error.recuperable).toBe(false);
      expect(error.proveedor).toBe(proveedor.nombre);
    }

    // reintentos: 1 → dos intentos en total.
    expect(proveedor.llamadas).toBe(2);
  });
});

describe('IaService.completarVisionJson — proveedor con visión simulado', () => {
  const esquema = z.object({ texto: z.string(), textoLegible: z.boolean() });

  it('V1. devuelve el dato tipado cuando el proveedor con visión cumple el esquema', async () => {
    const proveedor = new ProveedorVisionSimulado([
      '{"texto":"Hoja de vida","textoLegible":true}',
    ]);
    const servicio = new IaService(proveedor);

    const dato = await servicio.completarVisionJson(peticionVisionBase(), {
      esquema,
    });

    expect(dato).toEqual({ texto: 'Hoja de vida', textoLegible: true });
    // El primer intento usa visión; no se tocó `completar`.
    expect(proveedor.llamadasVision).toBe(1);
    expect(proveedor.llamadas).toBe(1);
    expect(proveedor.peticionesVision[0].imagen.mimeType).toBe('image/png');
  });

  it('V2. reintenta ante JSON inválido reusando el completado de texto (sin reenviar imagen)', async () => {
    const proveedor = new ProveedorVisionSimulado([
      'no soy json',
      '{"texto":"ok","textoLegible":true}',
    ]);
    const servicio = new IaService(proveedor);

    const dato = await servicio.completarVisionJson(peticionVisionBase(), {
      esquema,
    });

    expect(dato).toEqual({ texto: 'ok', textoLegible: true });
    // Un solo intento de visión; el reintento fue por texto.
    expect(proveedor.llamadasVision).toBe(1);
    // Dos llamadas totales a `completar` (visión reusa `completar` internamente
    // en el simulado + el reintento de texto).
    expect(proveedor.llamadas).toBe(2);

    // El reintento incorpora la respuesta previa y un mensaje de corrección.
    const segunda = proveedor.peticiones[1];
    const ultimo = segunda.mensajes[segunda.mensajes.length - 1];
    expect(ultimo.rol).toBe('user');
    expect(ultimo.contenido).toContain('JSON válido');
    expect(
      segunda.mensajes.some(
        (m) => m.rol === 'assistant' && m.contenido === 'no soy json',
      ),
    ).toBe(true);
  });

  it('V3. lanza IaError "peticion" recuperable:false si el proveedor no soporta visión', async () => {
    const proveedor = new ProveedorSimulado(['irrelevante']);
    const servicio = new IaService(proveedor);

    try {
      await servicio.completarVisionJson(peticionVisionBase(), { esquema });
      expect.fail('debía lanzar IaError');
    } catch (e) {
      expect(e).toBeInstanceOf(IaError);
      const error = e as IaError;
      expect(error.tipo).toBe('peticion');
      expect(error.recuperable).toBe(false);
      expect(error.proveedor).toBe(proveedor.nombre);
    }

    // No se intentó ningún completado: falla antes de llamar al proveedor.
    expect(proveedor.llamadas).toBe(0);
  });
});
