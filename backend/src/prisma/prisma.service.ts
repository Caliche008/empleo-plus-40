// Carga `.env` antes de instanciar el cliente para que `DATABASE_URL` esté en
// `process.env` al arrancar la app (Prisma 7 ya no la autocarga). El valor del
// secreto nunca se expone: solo se lee desde el entorno.
import 'dotenv/config';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Cliente de Prisma para toda la app. Prisma 7 exige un adaptador de driver, así
 * que se instancia con `@prisma/adapter-pg` apuntando a `DATABASE_URL`. Conecta
 * al iniciar el módulo y se desconecta limpio al destruirlo, para no dejar
 * conexiones colgando contra Neon.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      // Fallamos temprano y con mensaje claro, sin revelar el valor esperado.
      throw new Error(
        'Falta la configuración de la base de datos (DATABASE_URL). ' +
          'Revisa el archivo .env del backend.',
      );
    }

    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Conexión a la base de datos establecida.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
