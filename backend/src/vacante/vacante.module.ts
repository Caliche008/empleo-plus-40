import { Module } from '@nestjs/common';
import { VacanteController } from './vacante.controller.js';
import { VacanteService } from './vacante.service.js';

/**
 * Módulo de vacante: análisis de una oferta a partir de TEXTO pegado. IaModule es
 * global, así que IaService se inyecta sin reimportarlo aquí. Esta fase no
 * persiste nada (sin PrismaService ni repositorio).
 */
@Module({
  controllers: [VacanteController],
  providers: [VacanteService],
  exports: [VacanteService],
})
export class VacanteModule {}
