import { Prisma } from '../generated/prisma/client.js';
import { IaService } from '../ia/ia.service.js';
import type { PeticionIa, ProveedorIa, RespuestaIa } from '../ia/ia.types.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import {
  AnalisisFallidoError,
  OperacionFallidaError,
  TextoVacanteInvalidoError,
  VacanteNoEncontradaError,
} from './errores.js';
import { VacanteService } from './vacante.service.js';

/**
 * Proveedor simulado (sin red) que devuelve, en orden, las respuestas de una
 * cola. Cuenta `llamadas` para verificar que el servicio NO toca la IA cuando el
 * texto es inválido. Mismo patrón que `perfil-extractor.service.spec.ts`.
 */
class ProveedorSimulado implements ProveedorIa {
  readonly nombre = 'simulado';
  readonly modelo = 'modelo-test';
  llamadas = 0;
  private indice = 0;

  constructor(private readonly respuestas: string[]) {}

  completar(_peticion: PeticionIa): Promise<RespuestaIa> {
    this.llamadas++;
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
 * Doble inyectado de PrismaService: espías para los métodos de `vacante` que usa
 * el servicio. Nunca golpea la base de datos real (sin red). Se castea a
 * PrismaService porque solo exponemos lo que el servicio invoca.
 */
function crearPrismaFalso() {
  const vacante = {
    create: vi.fn(),
    findUnique: vi.fn(),
  };
  const prisma = { vacante } as unknown as PrismaService;
  return { prisma, vacante };
}

/** Error conocido de Prisma con un código concreto, para simular fallos de BD. */
function errorPrisma(code: string) {
  return new Prisma.PrismaClientKnownRequestError('fallo simulado', {
    code,
    clientVersion: 'test',
  });
}

/** Texto de oferta suficientemente largo para pasar la longitud mínima. */
const OFERTA_LARGA =
  'Buscamos desarrollador para unirse a nuestro equipo joven y dinámico. ' +
  'Requisitos: experiencia en TypeScript. Jornada completa, presencial en Madrid.';

describe('VacanteService.analizar', () => {
  it('V1. oferta con lenguaje por edad → persiste y devuelve VacanteAnalizada con alerta tipo "edad"', async () => {
    const respuesta = JSON.stringify({
      cargo: 'Desarrollador',
      obligatorios: ['Experiencia en TypeScript'],
      deseables: [],
      habilidades: ['TypeScript'],
      ubicacion: 'Madrid',
      modalidad: 'presencial',
      salario: '30.000 €',
      alertas: [
        {
          tipo: 'edad',
          detalle:
            'La oferta menciona "equipo joven", lenguaje que puede excluir por edad. ' +
            'Esto no es asesoría jurídica; ante una posible discriminación consulta a un abogado o a la defensoría.',
        },
      ],
    });
    const { prisma, vacante } = crearPrismaFalso();
    vacante.create.mockResolvedValue({ id: 'vac-1', alertas: [] });
    const proveedor = new ProveedorSimulado([respuesta]);
    const servicio = new VacanteService(new IaService(proveedor), prisma);

    const resultado = await servicio.analizar(OFERTA_LARGA);

    expect(resultado.cargo).toBe('Desarrollador');
    expect(resultado.alertas.some((a) => a.tipo === 'edad')).toBe(true);
    expect(proveedor.llamadas).toBe(1);
  });

  it('V2. oferta sin salario → devuelve alerta tipo "salario-oculto" y sin campo salario', async () => {
    const respuesta = JSON.stringify({
      cargo: 'Operario de almacén',
      obligatorios: ['Carné de carretillero'],
      deseables: [],
      habilidades: [],
      alertas: [
        {
          tipo: 'salario-oculto',
          detalle: 'La oferta no indica el salario. Pregunta por el rango antes de avanzar.',
        },
      ],
    });
    const { prisma, vacante } = crearPrismaFalso();
    vacante.create.mockResolvedValue({ id: 'vac-2', alertas: [] });
    const proveedor = new ProveedorSimulado([respuesta]);
    const servicio = new VacanteService(new IaService(proveedor), prisma);

    const resultado = await servicio.analizar(OFERTA_LARGA);

    expect(resultado.salario).toBeUndefined();
    expect(resultado.alertas.some((a) => a.tipo === 'salario-oculto')).toBe(true);
  });

  it('V3. texto vacío → lanza TextoVacanteInvalidoError y NO llama a la IA', async () => {
    const { prisma, vacante } = crearPrismaFalso();
    const proveedor = new ProveedorSimulado(['{}']);
    const servicio = new VacanteService(new IaService(proveedor), prisma);

    await expect(servicio.analizar('')).rejects.toBeInstanceOf(TextoVacanteInvalidoError);
    await expect(servicio.analizar('   ')).rejects.toBeInstanceOf(TextoVacanteInvalidoError);
    expect(proveedor.llamadas).toBe(0);
    expect(vacante.create).not.toHaveBeenCalled();
  });

  it('V4. texto más corto que el mínimo → lanza TextoVacanteInvalidoError y NO llama a la IA', async () => {
    const { prisma, vacante } = crearPrismaFalso();
    const proveedor = new ProveedorSimulado(['{}']);
    const servicio = new VacanteService(new IaService(proveedor), prisma);

    await expect(servicio.analizar('Vendedor en Madrid')).rejects.toBeInstanceOf(
      TextoVacanteInvalidoError,
    );
    expect(proveedor.llamadas).toBe(0);
    expect(vacante.create).not.toHaveBeenCalled();
  });

  it('V5. NO inventa: los campos extra del LLM se descartan por Zod', async () => {
    const conExtras = JSON.stringify({
      cargo: 'Analista',
      obligatorios: [],
      deseables: [],
      habilidades: [],
      alertas: [],
      edad: 50,
      campoFantasma: 'no debería aparecer',
    });
    const { prisma, vacante } = crearPrismaFalso();
    vacante.create.mockResolvedValue({ id: 'vac-5', alertas: [] });
    const servicio = new VacanteService(new IaService(new ProveedorSimulado([conExtras])), prisma);

    const resultado = await servicio.analizar(OFERTA_LARGA);

    expect(resultado).not.toHaveProperty('edad');
    expect(resultado).not.toHaveProperty('campoFantasma');
    expect(resultado.cargo).toBe('Analista');
  });

  it('V6. respuesta inválida persistente → traduce el IaError a AnalisisFallidoError', async () => {
    // El proveedor nunca devuelve JSON válido → completarJson agota reintentos y
    // lanza IaError, que el servicio traduce a un error de dominio amable.
    const { prisma, vacante } = crearPrismaFalso();
    const servicio = new VacanteService(
      new IaService(new ProveedorSimulado(['no soy json'])),
      prisma,
    );

    await expect(servicio.analizar(OFERTA_LARGA)).rejects.toBeInstanceOf(AnalisisFallidoError);
    // Un análisis fallido no debe intentar persistir nada.
    expect(vacante.create).not.toHaveBeenCalled();
  });

  it('V7. (a) persiste la vacante con alertas anidadas e include, y devuelve el id', async () => {
    const respuesta = JSON.stringify({
      cargo: 'Desarrollador',
      obligatorios: ['TypeScript'],
      deseables: ['Docker'],
      habilidades: ['TypeScript', 'NestJS'],
      experienciaPedida: '3 años',
      ubicacion: 'Madrid',
      modalidad: 'presencial',
      salario: '30.000 €',
      alertas: [
        { tipo: 'salario-oculto', detalle: 'detalle 1' },
        { tipo: 'otro', detalle: 'detalle 2' },
      ],
    });
    const { prisma, vacante } = crearPrismaFalso();
    vacante.create.mockResolvedValue({ id: 'vac-7', alertas: [] });
    const servicio = new VacanteService(new IaService(new ProveedorSimulado([respuesta])), prisma);

    // Con espacios alrededor para comprobar que `textoOriginal` guarda el texto
    // TAL CUAL entró (sin recortar), aunque el análisis use la versión limpia.
    const conEspacios = `  \n${OFERTA_LARGA}\n  `;
    const resultado = await servicio.analizar(conEspacios);

    expect(vacante.create).toHaveBeenCalledTimes(1);
    const args = vacante.create.mock.calls[0][0];
    // El texto original (pegado) se persiste tal cual, sin recortar espacios.
    expect(args.data.textoOriginal).toBe(conEspacios);
    expect(args.data.cargo).toBe('Desarrollador');
    expect(args.data.alertas.create).toHaveLength(2);
    expect(args.data.alertas.create[0]).toEqual({ tipo: 'salario-oculto', detalle: 'detalle 1' });
    expect(args.include).toMatchObject({ alertas: true });
    // El resultado incluye el id de la vacante persistida.
    expect(resultado.id).toBe('vac-7');
  });

  it('V8. (a) acepta candidatoId opcional y lo persiste tal cual', async () => {
    const respuesta = JSON.stringify({
      cargo: 'Analista',
      obligatorios: [],
      deseables: [],
      habilidades: [],
      alertas: [],
    });
    const { prisma, vacante } = crearPrismaFalso();
    vacante.create.mockResolvedValue({ id: 'vac-8', alertas: [] });
    const servicio = new VacanteService(new IaService(new ProveedorSimulado([respuesta])), prisma);

    await servicio.analizar(OFERTA_LARGA, 'cand-123');

    const args = vacante.create.mock.calls[0][0];
    expect(args.data.candidatoId).toBe('cand-123');
  });

  it('V9. (d) error de Prisma al guardar → OperacionFallidaError sin filtrar internos', async () => {
    const respuesta = JSON.stringify({
      cargo: 'Analista',
      obligatorios: [],
      deseables: [],
      habilidades: [],
      alertas: [],
    });
    const { prisma, vacante } = crearPrismaFalso();
    vacante.create.mockRejectedValue(new Error('conexión a Neon rechazada: host interno'));
    const servicio = new VacanteService(new IaService(new ProveedorSimulado([respuesta])), prisma);

    try {
      await servicio.analizar(OFERTA_LARGA);
      expect.fail('debía lanzar un error de dominio');
    } catch (e) {
      expect(e).toBeInstanceOf(OperacionFallidaError);
      expect((e as Error).message).not.toMatch(/Neon|host interno/);
    }
  });

  it('V10. (f) no se guarda edad: ningún campo de datos es edad/fecha de nacimiento', async () => {
    // El LLM intenta colar una edad; Zod la descarta y el mapeo nunca la guarda.
    // La única mención válida de "edad" es el TIPO de una alerta (describe el
    // TEXTO de la oferta, no la edad de una persona), así que se verifica contra
    // las CLAVES de `data` y de sus alertas, no contra el valor del tipo.
    const respuesta = JSON.stringify({
      cargo: 'Analista',
      obligatorios: ['Experiencia'],
      deseables: [],
      habilidades: ['Excel'],
      alertas: [{ tipo: 'edad', detalle: 'menciona "equipo joven"' }],
      edad: 50,
    });
    const { prisma, vacante } = crearPrismaFalso();
    vacante.create.mockResolvedValue({ id: 'vac-10', alertas: [] });
    const servicio = new VacanteService(new IaService(new ProveedorSimulado([respuesta])), prisma);

    await servicio.analizar(OFERTA_LARGA);

    const args = vacante.create.mock.calls[0][0];
    const data = args.data as Record<string, unknown>;
    // No hay campo de datos "edad" ni "fechaNacimiento" en la vacante…
    expect(Object.keys(data)).not.toContain('edad');
    expect(Object.keys(data)).not.toContain('fechaNacimiento');
    // …ni dentro de las alertas que se crean (solo `tipo` y `detalle`).
    const alertas = (data.alertas as { create: Record<string, unknown>[] }).create;
    for (const alerta of alertas) {
      expect(Object.keys(alerta)).toEqual(['tipo', 'detalle']);
    }
  });
});

describe('VacanteService.obtener', () => {
  it('V11. (b) existente devuelve la vacante con sus alertas e include', async () => {
    const guardada = {
      id: 'vac-11',
      cargo: 'Analista',
      alertas: [{ id: 'a1', tipo: 'otro', detalle: 'detalle' }],
    };
    const { prisma, vacante } = crearPrismaFalso();
    vacante.findUnique.mockResolvedValue(guardada);
    const servicio = new VacanteService(new IaService(new ProveedorSimulado(['{}'])), prisma);

    const resultado = await servicio.obtener('vac-11');

    const args = vacante.findUnique.mock.calls[0][0];
    expect(args.where).toEqual({ id: 'vac-11' });
    expect(args.include).toMatchObject({ alertas: true });
    expect(resultado).toEqual(guardada);
  });

  it('V12. (c) inexistente (findUnique → null) → VacanteNoEncontradaError', async () => {
    const { prisma, vacante } = crearPrismaFalso();
    vacante.findUnique.mockResolvedValue(null);
    const servicio = new VacanteService(new IaService(new ProveedorSimulado(['{}'])), prisma);

    await expect(servicio.obtener('no-existe')).rejects.toBeInstanceOf(VacanteNoEncontradaError);
  });

  it('V13. P2025 al leer → VacanteNoEncontradaError; otro fallo → OperacionFallidaError sin filtrar', async () => {
    const { prisma, vacante } = crearPrismaFalso();
    const servicio = new VacanteService(new IaService(new ProveedorSimulado(['{}'])), prisma);

    vacante.findUnique.mockRejectedValue(errorPrisma('P2025'));
    await expect(servicio.obtener('vac-x')).rejects.toBeInstanceOf(VacanteNoEncontradaError);

    vacante.findUnique.mockRejectedValue(new Error('conexión a Neon caída: host interno'));
    try {
      await servicio.obtener('vac-x');
      expect.fail('debía lanzar un error de dominio');
    } catch (e) {
      expect(e).toBeInstanceOf(OperacionFallidaError);
      expect((e as Error).message).not.toMatch(/Neon|host interno/);
    }
  });
});
