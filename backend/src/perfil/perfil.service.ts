import { Injectable } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ActualizarPerfilDto } from './dto/actualizar-perfil.dto.js';
import type { CrearPerfilDto } from './dto/crear-perfil.dto.js';
import {
  ConsentimientoRequeridoError,
  OperacionFallidaError,
  PerfilNoEncontradoError,
} from './errores.js';

/**
 * Relaciones que se traen al leer un perfil completo. La edad no existe en el
 * modelo, así que nunca se incluye ni se consulta.
 */
const INCLUDE_PERFIL = {
  objetivo: true,
  habilidades: true,
  experiencias: true,
  certificaciones: true,
  idiomas: true,
  documentos: true,
} satisfies Prisma.CandidatoInclude;

/** Código de Prisma para "registro no encontrado". */
const PRISMA_NO_ENCONTRADO = 'P2025';

/**
 * Persistencia del perfil del candidato sobre Prisma/Neon. El servicio queda
 * desacoplado del transporte: lanza errores de dominio en español y nunca
 * filtra el error crudo de la base de datos (compliance). La edad jamás se
 * guarda ni se usa.
 */
@Injectable()
export class PerfilService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Guarda un perfil confirmado creando el candidato y sus relaciones en una
   * sola operación anidada. Exige consentimiento explícito (R6): sin él no se
   * toca la base de datos. Devuelve el candidato con sus relaciones.
   */
  async guardar(dto: CrearPerfilDto) {
    if (dto.consentimiento !== true) {
      // Nada se persiste sin consentimiento: ni siquiera llamamos a Prisma.
      throw new ConsentimientoRequeridoError();
    }

    const data: Prisma.CandidatoCreateInput = {
      nombre: dto.nombre,
      telefono: dto.telefono,
      pais: dto.pais,
      consentimiento: true,
      mostrarFechasAntiguas: dto.mostrarFechasAntiguas,
      objetivo: {
        create: {
          rol: dto.objetivo.rol,
          sector: dto.objetivo.sector,
          salarioMin: dto.objetivo.salarioMin,
          modalidad: dto.objetivo.modalidad,
          ubicacion: dto.objetivo.ubicacion,
          disponibilidad: dto.objetivo.disponibilidad,
        },
      },
      habilidades: {
        create: dto.habilidades.map((h) => ({ nombre: h.nombre, nivel: h.nivel })),
      },
      experiencias: {
        create: dto.experiencias.map((e) => ({
          cargo: e.cargo,
          empresa: e.empresa,
          descripcion: e.descripcion,
          logros: e.logros,
          desde: e.desde,
          hasta: e.hasta,
        })),
      },
      certificaciones: {
        create: dto.certificaciones.map((c) => ({
          nombre: c.nombre,
          emisor: c.emisor,
          anio: c.anio,
        })),
      },
      idiomas: {
        create: dto.idiomas.map((i) => ({ idioma: i.idioma, nivel: i.nivel })),
      },
    };

    try {
      return await this.prisma.candidato.create({ data, include: INCLUDE_PERFIL });
    } catch (error) {
      throw this.traducirError(error);
    }
  }

  /** Devuelve el perfil con sus relaciones o lanza `PerfilNoEncontradoError`. */
  async obtener(id: string) {
    const candidato = await this.prisma.candidato.findUnique({
      where: { id },
      include: INCLUDE_PERFIL,
    });
    if (!candidato) {
      throw new PerfilNoEncontradoError(id);
    }
    return candidato;
  }

  /**
   * Aplica un parche parcial a los campos escalares del candidato y, si viene,
   * a su objetivo (upsert para ser robusto si aún no existía). No reemplaza las
   * colecciones hijas en esta fase.
   */
  async actualizar(id: string, cambios: ActualizarPerfilDto) {
    const data: Prisma.CandidatoUpdateInput = {
      nombre: cambios.nombre,
      telefono: cambios.telefono,
      pais: cambios.pais,
      mostrarFechasAntiguas: cambios.mostrarFechasAntiguas,
    };

    if (cambios.objetivo) {
      data.objetivo = {
        upsert: {
          update: { ...cambios.objetivo },
          // En la creación el rol es obligatorio; si falta en el parche usamos
          // una cadena vacía solo para satisfacer el tipo del create, caso que
          // en la práctica no ocurre porque el objetivo ya existe tras guardar.
          create: { rol: cambios.objetivo.rol ?? '', ...cambios.objetivo },
        },
      };
    }

    try {
      return await this.prisma.candidato.update({
        where: { id },
        data,
        include: INCLUDE_PERFIL,
      });
    } catch (error) {
      throw this.traducirError(error, id);
    }
  }

  /**
   * Borra el perfil en UN solo paso: `onDelete: Cascade` del schema elimina el
   * objetivo, las colecciones y los documentos (R6). No se borran hijos a mano.
   */
  async eliminar(id: string): Promise<void> {
    try {
      await this.prisma.candidato.delete({ where: { id } });
    } catch (error) {
      throw this.traducirError(error, id);
    }
  }

  /**
   * Traduce errores crudos de Prisma a errores de dominio. `P2025` se mapea a
   * `PerfilNoEncontradoError`; cualquier otro se vuelve `OperacionFallidaError`
   * sin filtrar el mensaje interno de la base de datos (compliance).
   */
  private traducirError(error: unknown, id?: string): Error {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PRISMA_NO_ENCONTRADO
    ) {
      return new PerfilNoEncontradoError(id);
    }
    return new OperacionFallidaError();
  }
}
