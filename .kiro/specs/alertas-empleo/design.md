# Diseño — Alertas de empleo

## Arquitectura del módulo

Módulo NestJS `alertas`. Centraliza la entrega de notificaciones (alertas de match
alto y recordatorios de seguimiento) a través de **adaptadores de canal** con una
interfaz común. Por defecto, modo **simulado** (no contacta servicios externos).

```
Evento (match>70 | recordatorio) → AlertasService.encolar(notificacion)
  → respeta preferencias y frecuencia
  → CanalAdapter.enviar()   // whatsapp | correo | simulado
  → registra resultado (enviada | simulada | fallida)
```

## Patrón de canal (seguridad)

```ts
interface CanalAdapter {
  nombre: 'whatsapp' | 'correo' | 'simulado';
  habilitado(): boolean;      // true solo si configurado Y envío permitido
  enviar(n: Notificacion): Promise<ResultadoEnvio>;
}
```

- **SimuladoAdapter** (por defecto): registra la notificación como "simulada",
  sin red. Es el único activo hasta configurar y habilitar explícitamente otro.
- **WhatsAppAdapter / CorreoAdapter**: implementados pero **inertes** hasta que las
  variables de entorno estén presentes Y `ENVIOS_REALES=true`.

## Modelo de datos (Prisma)

```prisma
model PreferenciaNotificacion {
  id          String  @id @default(uuid())
  candidatoId String  @unique
  canal       String  @default("simulado") // whatsapp | correo | simulado
  activo      Boolean @default(true)
  maxPorDia   Int     @default(1)
}

model Notificacion {
  id          String   @id @default(uuid())
  candidatoId String
  tipo        String   // match-alto | seguimiento-7 | seguimiento-14
  titulo      String
  cuerpo      String
  estado      String   @default("pendiente") // pendiente|simulada|enviada|fallida
  creadoEn    DateTime @default(now())
}
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET/PUT | `/alertas/preferencias` | Ver/actualizar canal y actividad. |
| GET | `/alertas` | Lista de notificaciones del candidato. |
| POST | `/alertas/probar` | Genera una notificación de prueba (siempre simulada). |

## Reglas duras

- `ENVIOS_REALES` por defecto `false`. Sin ella, todo es simulado.
- Nunca enviar sin canal configurado por variables de entorno.
- Respetar `maxPorDia` (agrupar en resumen si se excede).
- Secretos de WhatsApp/correo solo por entorno, nunca en código.
