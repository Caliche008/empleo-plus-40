# Diseño — Análisis de vacante

## Arquitectura del módulo

Módulo NestJS `vacante`. Recibe texto (o enlace del propio usuario), lo normaliza
y llama a `ia` para extraer requisitos y detectar alertas. Persiste la vacante
analizada para que `match` la use.

```
Frontend → POST /vacante/analizar { texto | url }
  → (si url propia y permitida) FetchService.obtenerTexto()
  → IaService.analizarVacante(texto)  → JSON validado { requisitos, alertas }
  → VacanteService.guardar()  → PostgreSQL
  → devuelve resultado al usuario
```

## Modelo de datos (Prisma)

```prisma
model Vacante {
  id            String   @id @default(uuid())
  candidatoId   String?
  cargo         String
  textoOriginal String
  obligatorios  String[]
  deseables     String[]
  habilidades   String[]
  experienciaPedida String?
  ubicacion     String?
  modalidad     String?
  salario       String?
  alertas       Alerta[]
  creadoEn      DateTime @default(now())
}

model Alerta {
  id         String  @id @default(uuid())
  vacanteId  String
  vacante    Vacante @relation(fields: [vacanteId], references: [id], onDelete: Cascade)
  tipo       String  // edad | salario-oculto | requisitos-inflados | otro
  detalle    String  // explicación en lenguaje simple
}
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/vacante/analizar` | Analiza texto o URL propia; devuelve requisitos + alertas. |
| GET  | `/vacante/:id` | Obtiene una vacante analizada. |

## Contrato de IA (salida JSON validada)

```ts
VacanteAnalizada = {
  cargo: string;
  obligatorios: string[];
  deseables: string[];
  habilidades: string[];
  experienciaPedida?: string;
  ubicacion?: string;
  modalidad?: string;
  salario?: string;
  alertas: { tipo: 'edad'|'salario-oculto'|'requisitos-inflados'|'otro'; detalle: string }[];
}
```

Reglas duras:
- No inventar requisitos ausentes en el texto.
- El prompt incluye ejemplos de lenguaje excluyente por edad para detectarlos.
- Siempre añade el descargo: "no es asesoría jurídica".

## FetchService (enlaces)

- Solo intenta obtener texto de URLs que el usuario aporta explícitamente.
- Lista negra de dominios cuyos términos prohíben el acceso automatizado → en esos
  casos, pedir el texto pegado. Nunca eludir protecciones ni scrapear a escala.
