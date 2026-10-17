import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

/**
 * Módulo global de Prisma: cualquier módulo de negocio puede inyectar
 * PrismaService sin reimportarlo. Es la única puerta a la base de datos.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
