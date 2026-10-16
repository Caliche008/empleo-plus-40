# Diseño — Seguimiento de postulaciones

## Arquitectura del módulo

Módulo NestJS `seguimiento`. CRUD de postulaciones + generación de recordatorios
por tiempo sin cambio de estado. No envía notificaciones directamente: crea
recordatorios que el módulo `alertas` entrega (con confirmación). Es un módulo
sin IA (lógica determinística).

```
POST /postulaciones            → crear
PATCH /postulaciones/:id/estado → cambiar estado
GET /postulaciones             → tablero agrupado por estado
Cron diario → revisarRecordatorios() → crea Recordatorio a los 7 y 14 días
```

## Modelo de datos (Prisma)

```prisma
model Postulacion {
  id            String   @id @default(uuid())
  candidatoId   String
  vacanteId     String?
  empresa       String
  cargo         String
  estado        String   @default("postulada") // postulada|en-revision|entrevista|oferta|descartada
  fechaPostulacion DateTime @default(now())
  ultimoCambio  DateTime @default(now())
  recordatorios Recordatorio[]
}

model Recordatorio {
  id            String   @id @default(uuid())
  postulacionId String
  postulacion   Postulacion @relation(fields: [postulacionId], references: [id], onDelete: Cascade)
  tipo          String   // seguimiento-7 | seguimiento-14
  enviado       Boolean  @default(false)
  creadoEn      DateTime @default(now())
}
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/postulaciones` | Crear postulación. |
| GET  | `/postulaciones` | Tablero agrupado por estado. |
| PATCH| `/postulaciones/:id/estado` | Cambiar estado (actualiza `ultimoCambio`). |
| DELETE | `/postulaciones/:id` | Eliminar. |

## Recordatorios (cron)

- Tarea diaria (`@nestjs/schedule`) que busca postulaciones activas sin cambio de
  estado desde hace 7 o 14 días y crea el `Recordatorio` correspondiente (una vez).
- El `Recordatorio` queda `enviado = false`; el módulo `alertas` lo entrega tras
  confirmación del canal. Aquí NO se envía nada real.

## Frontend

- Tablero tipo columnas por estado (postulada → oferta), con tarjetas grandes.
- Cambiar estado con un toque (menú simple). Accesible, texto grande.
