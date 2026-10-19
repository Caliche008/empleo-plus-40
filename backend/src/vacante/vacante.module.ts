import { Module } from '@nestjs/common';
import { VacanteController } from './vacante.controller.js';
import { VacanteService } from './vacante.service.js';

/**
 * Módulo de vacante: análisis de una oferta a partir de TEXTO pegado y su
 * persistencia. IaModule y PrismaModule son globales, así que IaService y
 * PrismaService se inyectan sin reimportarlos aquí.
 */
@Module({
  controllers: [VacanteController],
  providers: [VacanteService],
  exports: [VacanteService],
})
export class VacanteModule {}
