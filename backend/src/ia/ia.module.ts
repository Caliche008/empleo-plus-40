import { Global, Module } from '@nestjs/common';
import { IaService } from './ia.service.js';

/**
 * Módulo global de IA: cualquier módulo de negocio puede inyectar IaService
 * sin reimportarlo. Es la única puerta a los modelos de lenguaje.
 */
@Global()
@Module({
  providers: [IaService],
  exports: [IaService],
})
export class IaModule {}
