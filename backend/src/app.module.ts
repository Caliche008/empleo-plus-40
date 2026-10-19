import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { IaModule } from './ia/ia.module.js';
import { PerfilModule } from './perfil/perfil.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { VacanteModule } from './vacante/vacante.module.js';

@Module({
  imports: [PrismaModule, IaModule, PerfilModule, VacanteModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
