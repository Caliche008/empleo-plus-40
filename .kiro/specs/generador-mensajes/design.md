# Diseño — Generador de mensajes

## Arquitectura del módulo

Módulo NestJS `mensajes`. Toma perfil + vacante (+ tono y canal) y pide al LLM un
texto basado en hechos reales. Guarda los mensajes generados para reutilizar.

```
POST /mensajes/generar { candidatoId, vacanteId, tipo, canal?, tono }
  → IaService.generarMensaje(perfil, vacante, tipo, canal, tono) → JSON validado
  → filtroNoDiscriminacion(texto)   // sin referencias a edad
  → devuelve { texto }
```

- `tipo`: `carta` | `mensaje-reclutador`
- `canal` (si tipo = mensaje-reclutador): `linkedin` | `whatsapp`
- `tono`: `formal` | `cercano` | `directo`

## Modelo de datos (Prisma)

```prisma
model Mensaje {
  id          String   @id @default(uuid())
  candidatoId String
  vacanteId   String
  tipo        String   // carta | mensaje-reclutador
  canal       String?  // linkedin | whatsapp
  tono        String   // formal | cercano | directo
  texto       String
  creadoEn    DateTime @default(now())
}
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/mensajes/generar` | Genera carta o mensaje según tipo/canal/tono. |
| GET  | `/mensajes/:id` | Recupera un mensaje. |

## Contrato de IA (salida JSON validada)

```ts
MensajeGenerado = {
  texto: string;
  longitud: number;       // caracteres (WhatsApp debe ser breve)
}
```

Reglas y límites:
- WhatsApp: mensaje corto (orientativo < 500 caracteres).
- LinkedIn: breve pero algo más formal.
- Carta: estructura saludo / cuerpo / cierre.
- **Sin inventar** logros ni habilidades; sin mencionar edad; tono digno.
- Prompts por tono versionados en `ia/prompts`.
