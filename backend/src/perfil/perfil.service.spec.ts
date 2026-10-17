import { Prisma } from '../generated/prisma/client.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { CrearPerfilDto } from './dto/crear-perfil.dto.js';
import {
  ConsentimientoRequeridoError,
  OperacionFallidaError,
  PerfilNoEncontradoError,
} from './errores.js';
import { PerfilService } from './perfil.service.js';

/**
 * Doble inyectado de PrismaService: espías para los métodos de `candidato` que
 * usa el servicio. Nunca golpea la base de datos real (sin red). Se castea a
 * PrismaService porque solo exponemos lo que el servicio invoca.
 */
function crearPrismaFalso() {
  const candidato = {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  };
  const prisma = { candidato } as unknown as PrismaService;
  return { prisma, candidato };
}

/** Error conocido de Prisma con un código concreto, para simular fallos de BD. */
function errorPrisma(code: string) {
  return new Prisma.PrismaClientKnownRequestError('fallo simulado', {
    code,
    clientVersion: 'test',
  });
}

/** Perfil válido base; cada prueba ajusta lo que necesite. */
function perfilBase(): CrearPerfilDto {
  return {
    nombre: 'Ana',
    telefono: '3001234567',
    pais: 'CO',
    consentimiento: true,
    mostrarFechasAntiguas: false,
    objetivo: {
      rol: 'Auxiliar administrativo',
      salarioMin: 2000000,
      modalidad: 'presencial',
    },
    habilidades: [{ nombre: 'Excel', nivel: 'medio' }],
    experiencias: [
      { cargo: 'Cajera', empresa: 'Tienda', descripcion: 'Atención al cliente', logros: ['x'] },
    ],
    certificaciones: [],
    idiomas: [{ idioma: 'Español' }],
  };
}

describe('PerfilService.guardar', () => {
  it('P1. con consentimiento crea el candidato con relaciones anidadas e include, sin edad', async () => {
    const { prisma, candidato } = crearPrismaFalso();
    candidato.create.mockResolvedValue({ id: 'nuevo' });
    const servicio = new PerfilService(prisma);

    const resultado = await servicio.guardar(perfilBase());

    expect(candidato.create).toHaveBeenCalledTimes(1);
    const args = candidato.create.mock.calls[0][0];
    // Creación anidada de todas las relaciones.
    expect(args.data.objetivo.create.rol).toBe('Auxiliar administrativo');
    expect(args.data.habilidades.create).toHaveLength(1);
    expect(args.data.experiencias.create).toHaveLength(1);
    expect(args.data.idiomas.create).toHaveLength(1);
    // Se piden las relaciones de vuelta.
    expect(args.include).toMatchObject({
      objetivo: true,
      habilidades: true,
      experiencias: true,
      certificaciones: true,
      idiomas: true,
      documentos: true,
    });
    // La edad nunca se persiste.
    expect(JSON.stringify(args.data)).not.toMatch(/edad|fechaNacimiento/i);
    expect(resultado).toEqual({ id: 'nuevo' });
  });

  it('P2. sin consentimiento lanza ConsentimientoRequeridoError y NO llama a create', async () => {
    const { prisma, candidato } = crearPrismaFalso();
    const servicio = new PerfilService(prisma);

    await expect(
      servicio.guardar({ ...perfilBase(), consentimiento: false }),
    ).rejects.toBeInstanceOf(ConsentimientoRequeridoError);
    expect(candidato.create).not.toHaveBeenCalled();
  });

  it('P3. sin salarioMin persiste igual (R5) y no incluye un salario inventado', async () => {
    const { prisma, candidato } = crearPrismaFalso();
    candidato.create.mockResolvedValue({ id: 'x' });
    const servicio = new PerfilService(prisma);

    const dto = perfilBase();
    delete dto.objetivo.salarioMin;
    await servicio.guardar(dto);

    const args = candidato.create.mock.calls[0][0];
    expect(args.data.objetivo.create.salarioMin).toBeUndefined();
  });

  it('P7. un error desconocido de Prisma se traduce a error de dominio sin filtrar el mensaje crudo', async () => {
    const { prisma, candidato } = crearPrismaFalso();
    candidato.create.mockRejectedValue(new Error('conexión a Neon rechazada: host interno'));
    const servicio = new PerfilService(prisma);

    try {
      await servicio.guardar(perfilBase());
      expect.fail('debía lanzar un error de dominio');
    } catch (e) {
      expect(e).toBeInstanceOf(OperacionFallidaError);
      expect((e as Error).message).not.toMatch(/Neon|host interno/);
    }
  });
});

describe('PerfilService.obtener', () => {
  it('P4. existente devuelve el candidato con las 6 relaciones; inexistente lanza PerfilNoEncontradoError', async () => {
    const { prisma, candidato } = crearPrismaFalso();
    candidato.findUnique.mockResolvedValue({ id: 'a1', objetivo: null });
    const servicio = new PerfilService(prisma);

    const resultado = await servicio.obtener('a1');
    const args = candidato.findUnique.mock.calls[0][0];
    expect(args.where).toEqual({ id: 'a1' });
    expect(args.include).toMatchObject({
      objetivo: true,
      habilidades: true,
      experiencias: true,
      certificaciones: true,
      idiomas: true,
      documentos: true,
    });
    expect(resultado).toEqual({ id: 'a1', objetivo: null });

    candidato.findUnique.mockResolvedValue(null);
    await expect(servicio.obtener('no-existe')).rejects.toBeInstanceOf(PerfilNoEncontradoError);
  });
});

describe('PerfilService.actualizar', () => {
  it('P5. actualiza solo lo presente; P2025 simulado lanza PerfilNoEncontradoError', async () => {
    const { prisma, candidato } = crearPrismaFalso();
    candidato.update.mockResolvedValue({ id: 'a1' });
    const servicio = new PerfilService(prisma);

    await servicio.actualizar('a1', { nombre: 'Nuevo', objetivo: { rol: 'Vendedor' } });
    const args = candidato.update.mock.calls[0][0];
    expect(args.where).toEqual({ id: 'a1' });
    expect(args.data.nombre).toBe('Nuevo');
    expect(args.data.objetivo.upsert.update.rol).toBe('Vendedor');

    candidato.update.mockRejectedValue(errorPrisma('P2025'));
    await expect(servicio.actualizar('a1', { nombre: 'X' })).rejects.toBeInstanceOf(
      PerfilNoEncontradoError,
    );
  });
});

describe('PerfilService.eliminar', () => {
  it('P6. borra en un solo paso (confía en el cascade); P2025 lanza PerfilNoEncontradoError', async () => {
    const { prisma, candidato } = crearPrismaFalso();
    candidato.delete.mockResolvedValue({ id: 'a1' });
    const servicio = new PerfilService(prisma);

    await servicio.eliminar('a1');
    expect(candidato.delete).toHaveBeenCalledTimes(1);
    expect(candidato.delete.mock.calls[0][0]).toEqual({ where: { id: 'a1' } });

    candidato.delete.mockRejectedValue(errorPrisma('P2025'));
    await expect(servicio.eliminar('no-existe')).rejects.toBeInstanceOf(PerfilNoEncontradoError);
  });
});
