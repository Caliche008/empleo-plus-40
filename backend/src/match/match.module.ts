import { Module } from '@nestjs/common';
import { PerfilModule } from '../perfil/perfil.module.js';
import { VacanteModule } from '../vacante/vacante.module.js';
import { MatchController } from './match.controller.js';
import { MatchService } from './match.service.js';
import { SemanticaService } from './semantica.service.js';

/**
 * Módulo de match: cruza perfil↔vacante y persiste el resultado. Importa
 * `PerfilModule` y `VacanteModule` para inyectar sus services (ambos los
 * exportan). IaModule y PrismaModule son globales, así que IaService y
 * PrismaService se inyectan sin reimportarlos aquí.
 */
@Module({
  imports: [PerfilModule, VacanteModule],
  controllers: [MatchController],
  providers: [MatchService, SemanticaService],
  exports: [MatchService],
})
export class MatchModule {}
