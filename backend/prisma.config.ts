// Configuración de la CLI de Prisma 7. La CLI ya no autocarga `.env`, así que
// lo cargamos aquí con `dotenv/config` para que `DATABASE_URL` esté disponible
// al validar, migrar y generar. El valor del secreto nunca se expone en código:
// vive solo en `.env` (ignorado por git).
import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
