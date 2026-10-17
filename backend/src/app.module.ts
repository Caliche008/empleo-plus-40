import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { IaModule } from './ia/ia.module.js';
import { PerfilModule } from './perfil/perfil.module.js';

@Module({
  imports: [IaModule, PerfilModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
