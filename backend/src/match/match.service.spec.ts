import { Prisma } from '../generated/prisma/client.js';
import { IaService } from '../ia/ia.service.js';
import type {
  PeticionEmbedding,
  PeticionIa,
  ProveedorIa,
  RespuestaEmbedding,
  RespuestaIa,
} from '../ia/ia.types.js';
import { PerfilNoEncontradoError } from '../perfil/errores.js';
import type { PerfilService } from '../perfil/perfil.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { VacanteNoEncontradaError } from '../vacante/errores.js';
import type { VacanteService } from '../vacante/vacante.service.js';
import { OperacionFallidaError } from './errores.js';
import { MatchService } from './match.service.js';
import { SemanticaService } from './semantica.service.js';

/**
 * Proveedor simulado (sin red): devuelve en orden las respuestas de texto de una
 * cola y, opcionalmente, un embedding por texto. `fallaEmbedding` fuerza el
 * camino de respaldo. Mismo patrón que `vacante.service.spec.ts`.
 */
class ProveedorSimulado implements ProveedorIa {
  readonly nombre = 'simulado';
  readonly modelo = 'modelo-test';
  private indice = 0;

  constructor(
    private readonly respuestas: string[],
    private readonly opciones: { fallaEmbedding?: boolean; dimension?: number } = {},
  ) {}

  completar(_peticion: PeticionIa): Promise<RespuestaIa> {
    const texto = this.respuestas[Math.min(this.indice, this.respuestas.length - 1)] ?? '';
    this.indice++;
    return Promise.resolve({ texto, proveedor: this.nombre, modelo: this.modelo, latenciaMs: 0 });
  }

  generarEmbedding(peticion: PeticionEmbedding): Promise<RespuestaEmbedding> {
    if (this.opciones.fallaEmbedding) {
      return Promise.reject(new Error('embeddings caídos'));
    }
    const dimension = this.opciones.dimension ?? 768;
    const vectores = peticion.textos.map(() => Array.from({ length: dimension }, () => 0.1));
    return Promise.resolve({ vectores, proveedor: this.nombre, modelo: this.modelo, dimension });
  }
}

/** Doble inyectado de PrismaService: espías para los métodos de `match`. */
function crearPrismaFalso() {
  const match = { create: vi.fn(), findUnique: vi.fn() };
  const prisma = { match } as unknown as PrismaService;
  return { prisma, match };
}

/** Dobles de los servicios de dominio con solo el método `obtener` que se usa. */
function crearServiciosDominio(perfil: unknown, vacante: unknown) {
  const perfilService = { obtener: vi.fn().mockResolvedValue(perfil) } as unknown as PerfilService;
  const vacanteService = {
    obtener: vi.fn().mockResolvedValue(vacante),
  } as unknown as VacanteService;
  return { perfilService, vacanteService };
}

/** Error conocido de Prisma con un código concreto, para simular fallos de BD. */
function errorPrisma(code: string) {
  return new Prisma.PrismaClientKnownRequestError('fallo simulado', { code, clientVersion: 'test' });
}

/** Perfil mínimo (forma de `PerfilService.obtener`) que proyectarEntrada acepta. */
const PERFIL = {
  id: 'cand-1',
  habilidades: [{ nombre: 'TypeScript' }, { nombre: 'NestJS' }],
  experiencias: [
    { cargo: 'Desarrollador backend', descripcion: 'APIs en Node', logros: ['Lideré migración'] },
  ],
  objetivo: { sector: 'Tecnología', ubicacion: 'Bogotá', salarioMin: 3000000, modalidad: 'remoto' },
};

/** Vacante mínima (forma de `VacanteService.obtener`). */
const VACANTE = {
  id: 'vac-1',
  cargo: 'Desarrollador backend',
  obligatorios: ['TypeScript'],
  deseables: ['Docker'],
  habilidades: ['TypeScript', 'NestJS'],
  experienciaPedida: 'APIs en Node',
  ubicacion: 'Bogotá',
  modalidad: 'remoto',
  salario: '3.000.000',
};

/** Explicación válida del LLM para el camino feliz. */
const EXPLICACION_OK = JSON.stringify({
  resumen: 'Buena compatibilidad.',
  porCriterio: [{ criterio: 'habilidades', comentario: 'Coinciden varias habilidades.' }],
  brechas: [{ requisito: 'Docker', sugerencia: 'Haz un curso de Docker.' }],
});

function crearServicio(
  proveedor: ProveedorSimulado,
  prisma: PrismaService,
  perfilService: PerfilService,
  vacanteService: VacanteService,
) {
  const ia = new IaService(proveedor);
  return new MatchService(perfilService, vacanteService, new SemanticaService(ia), ia, prisma);
}

describe('MatchService.calcular', () => {
  it('M1. orquesta y persiste el match con los campos correctos', async () => {
    const { prisma, match } = crearPrismaFalso();
    match.create.mockResolvedValue({ id: 'match-1', puntaje: 80 });
    const { perfilService, vacanteService } = crearServiciosDominio(PERFIL, VACANTE);
    const servicio = crearServicio(
      new ProveedorSimulado([EXPLICACION_OK]),
      prisma,
      perfilService,
      vacanteService,
    );

    const resultado = await servicio.calcular('cand-1', 'vac-1');

    expect(match.create).toHaveBeenCalledTimes(1);
    const data = match.create.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.candidatoId).toBe('cand-1');
    expect(data.vacanteId).toBe('vac-1');
    expect(typeof data.puntaje).toBe('number');
    expect(data).toHaveProperty('desglose');
    expect(data).toHaveProperty('brechas');
    expect(data).toHaveProperty('cubiertos');
    expect(typeof data.recomendacion).toBe('string');
    // La explicación persistida es solo el resumen (string).
    expect(data.explicacion).toBe('Buena compatibilidad.');
    // El resultado para la UI lleva la explicación completa.
    expect(resultado.explicacionDetallada.porCriterio.length).toBeGreaterThan(0);
  });

  it('M2. perfil inexistente → propaga PerfilNoEncontradoError y NO persiste', async () => {
    const { prisma, match } = crearPrismaFalso();
    const perfilService = {
      obtener: vi.fn().mockRejectedValue(new PerfilNoEncontradoError('cand-x')),
    } as unknown as PerfilService;
    const vacanteService = { obtener: vi.fn() } as unknown as VacanteService;
    const servicio = crearServicio(
      new ProveedorSimulado([EXPLICACION_OK]),
      prisma,
      perfilService,
      vacanteService,
    );

    await expect(servicio.calcular('cand-x', 'vac-1')).rejects.toBeInstanceOf(
      PerfilNoEncontradoError,
    );
    expect(match.create).not.toHaveBeenCalled();
  });

  it('M3. vacante inexistente → propaga VacanteNoEncontradaError y NO persiste', async () => {
    const { prisma, match } = crearPrismaFalso();
    const perfilService = { obtener: vi.fn().mockResolvedValue(PERFIL) } as unknown as PerfilService;
    const vacanteService = {
      obtener: vi.fn().mockRejectedValue(new VacanteNoEncontradaError('vac-x')),
    } as unknown as VacanteService;
    const servicio = crearServicio(
      new ProveedorSimulado([EXPLICACION_OK]),
      prisma,
      perfilService,
      vacanteService,
    );

    await expect(servicio.calcular('cand-1', 'vac-x')).rejects.toBeInstanceOf(
      VacanteNoEncontradaError,
    );
    expect(match.create).not.toHaveBeenCalled();
  });

  it('M4. IA caída → explicación de respaldo y el match NO se rompe', async () => {
    const { prisma, match } = crearPrismaFalso();
    match.create.mockResolvedValue({ id: 'match-4' });
    const { perfilService, vacanteService } = crearServiciosDominio(PERFIL, VACANTE);
    // El proveedor nunca devuelve JSON válido → completarJson lanza IaError.
    const servicio = crearServicio(
      new ProveedorSimulado(['no soy json']),
      prisma,
      perfilService,
      vacanteService,
    );

    const resultado = await servicio.calcular('cand-1', 'vac-1');

    expect(match.create).toHaveBeenCalledTimes(1);
    // El resumen de respaldo avisa que el detalle no está disponible.
    expect(resultado.explicacionDetallada.resumen).toMatch(/no está disponible/i);
    const data = match.create.mock.calls[0][0].data as Record<string, unknown>;
    expect(data.explicacion).toMatch(/no está disponible/i);
  });

  it('M5. error de BD al guardar → OperacionFallidaError sin filtrar internos', async () => {
    const { prisma, match } = crearPrismaFalso();
    match.create.mockRejectedValue(new Error('conexión a Neon rechazada: host interno'));
    const { perfilService, vacanteService } = crearServiciosDominio(PERFIL, VACANTE);
    const servicio = crearServicio(
      new ProveedorSimulado([EXPLICACION_OK]),
      prisma,
      perfilService,
      vacanteService,
    );

    try {
      await servicio.calcular('cand-1', 'vac-1');
      expect.fail('debía lanzar un error de dominio');
    } catch (e) {
      expect(e).toBeInstanceOf(OperacionFallidaError);
      expect((e as Error).message).not.toMatch(/Neon|host interno/);
    }
  });

  it('M6. embeddings caídos → usa respaldo y fuenteSemantica === "respaldo"', async () => {
    const { prisma, match } = crearPrismaFalso();
    match.create.mockResolvedValue({ id: 'match-6' });
    const { perfilService, vacanteService } = crearServiciosDominio(PERFIL, VACANTE);
    const servicio = crearServicio(
      new ProveedorSimulado([EXPLICACION_OK], { fallaEmbedding: true }),
      prisma,
      perfilService,
      vacanteService,
    );

    await servicio.calcular('cand-1', 'vac-1');

    const data = match.create.mock.calls[0][0].data as { desglose: { fuenteSemantica: string } };
    expect(data.desglose.fuenteSemantica).toBe('respaldo');
  });

  it('M7. embeddings con dimensión inesperada → cae a respaldo', async () => {
    const { prisma, match } = crearPrismaFalso();
    match.create.mockResolvedValue({ id: 'match-7' });
    const { perfilService, vacanteService } = crearServiciosDominio(PERFIL, VACANTE);
    const servicio = crearServicio(
      new ProveedorSimulado([EXPLICACION_OK], { dimension: 512 }),
      prisma,
      perfilService,
      vacanteService,
    );

    await servicio.calcular('cand-1', 'vac-1');

    const data = match.create.mock.calls[0][0].data as { desglose: { fuenteSemantica: string } };
    expect(data.desglose.fuenteSemantica).toBe('respaldo');
  });

  it('M8. embeddings OK → fuenteSemantica === "embeddings"', async () => {
    const { prisma, match } = crearPrismaFalso();
    match.create.mockResolvedValue({ id: 'match-8' });
    const { perfilService, vacanteService } = crearServiciosDominio(PERFIL, VACANTE);
    const servicio = crearServicio(
      new ProveedorSimulado([EXPLICACION_OK]),
      prisma,
      perfilService,
      vacanteService,
    );

    await servicio.calcular('cand-1', 'vac-1');

    const data = match.create.mock.calls[0][0].data as { desglose: { fuenteSemantica: string } };
    expect(data.desglose.fuenteSemantica).toBe('embeddings');
  });
});

describe('MatchService.obtener', () => {
  it('M9. existente devuelve el match', async () => {
    const { prisma, match } = crearPrismaFalso();
    match.findUnique.mockResolvedValue({ id: 'match-1', puntaje: 70 });
    const { perfilService, vacanteService } = crearServiciosDominio(PERFIL, VACANTE);
    const servicio = crearServicio(
      new ProveedorSimulado(['{}']),
      prisma,
      perfilService,
      vacanteService,
    );

    const resultado = await servicio.obtener('match-1');

    expect(match.findUnique.mock.calls[0][0].where).toEqual({ id: 'match-1' });
    expect(resultado).toEqual({ id: 'match-1', puntaje: 70 });
  });

  it('M10. inexistente (null) → MatchNoEncontradoError', async () => {
    const { prisma, match } = crearPrismaFalso();
    match.findUnique.mockResolvedValue(null);
    const { perfilService, vacanteService } = crearServiciosDominio(PERFIL, VACANTE);
    const servicio = crearServicio(
      new ProveedorSimulado(['{}']),
      prisma,
      perfilService,
      vacanteService,
    );

    await expect(servicio.obtener('no-existe')).rejects.toThrow('No encontramos el match');
  });

  it('M11. P2025 al leer → MatchNoEncontradoError; otro fallo → OperacionFallidaError sin filtrar', async () => {
    const { prisma, match } = crearPrismaFalso();
    const { perfilService, vacanteService } = crearServiciosDominio(PERFIL, VACANTE);
    const servicio = crearServicio(
      new ProveedorSimulado(['{}']),
      prisma,
      perfilService,
      vacanteService,
    );

    match.findUnique.mockRejectedValue(errorPrisma('P2025'));
    await expect(servicio.obtener('m-x')).rejects.toThrow('No encontramos el match');

    match.findUnique.mockRejectedValue(new Error('conexión a Neon caída: host interno'));
    try {
      await servicio.obtener('m-x');
      expect.fail('debía lanzar un error de dominio');
    } catch (e) {
      expect(e).toBeInstanceOf(OperacionFallidaError);
      expect((e as Error).message).not.toMatch(/Neon|host interno/);
    }
  });
});
