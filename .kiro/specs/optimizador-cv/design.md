# Diseño — Optimizador de CV

## Arquitectura del módulo

Módulo NestJS `optimizador`. Toma el perfil (confirmado) y una vacante analizada,
propone reescrituras con respaldo, el usuario aprueba, y genera el documento ATS.

```
Frontend → POST /optimizador/proponer { candidatoId, vacanteId }
  → IaService.optimizarCv(perfil, vacante) → JSON validado de propuestas
  → verificarRespaldo(propuestas, perfil)  // descarta afirmaciones sin base
  → devuelve cambios marcados (antes/después)
Frontend → POST /optimizador/aplicar { propuestasAprobadas }
  → genera CvOptimizado + registro de cambios
Frontend → GET /optimizador/:id/export?formato=docx|pdf
  → ExportService → documento ATS con texto seleccionable
```

## Garantía de honestidad (regla dura)

- Cada propuesta de reescritura referencia la **frase original** del CV que la
  respalda. `verificarRespaldo()` descarta cualquier propuesta sin origen.
- La reescritura **reformula**, no agrega hechos. Se prohíbe introducir nuevas
  habilidades, cifras o logros ausentes del original.
- Registro de cambios persistido (antes/después por ítem).

## Modelo de datos (Prisma)

```prisma
model CvOptimizado {
  id          String   @id @default(uuid())
  candidatoId String
  vacanteId   String
  resumen     String
  secciones   Json      // estructura ATS (experiencia, habilidades, etc.)
  cambios     Json      // [{ campo, antes, despues, origen, aprobado }]
  incluirFechasAntiguas Boolean @default(false)
  creadoEn    DateTime @default(now())
}
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/optimizador/proponer` | Devuelve cambios marcados (antes/después) para aprobar. |
| POST | `/optimizador/aplicar` | Aplica solo los cambios aprobados; guarda registro. |
| GET  | `/optimizador/:id/export` | Exporta a `docx` o `pdf` (texto seleccionable). |

## Contrato de IA (salida JSON validada)

```ts
PropuestaOptimizacion = {
  resumen: { antes: string; despues: string; origen: string };
  logros: { antes: string; despues: string; origen: string }[];
  palabrasClaveIncorporadas: string[];
  palabrasClaveSinRespaldo: string[];   // se informan, NO se afirman en el CV
}
```
`origen` debe citar texto del CV original; si falta, la propuesta se descarta.

## Plantilla y exportación ATS

- Plantilla: **una columna**, sin tablas ni imágenes, encabezados estándar
  (Resumen, Experiencia, Habilidades, Educación, Certificaciones), fuente simple.
- **.docx**: generación con librería de documentos (p. ej. `docx`).
- **PDF**: render del mismo contenido con texto seleccionable (no imagen).
- El usuario decide incluir u omitir año de graduación / fechas antiguas.
