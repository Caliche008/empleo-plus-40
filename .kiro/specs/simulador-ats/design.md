# Diseño — Simulador ATS

## Arquitectura del módulo

Módulo NestJS `simulador-ats`. Analiza el documento del CV (su estructura) y su
texto frente a las palabras clave de la vacante. Mezcla análisis **determinístico**
(formato) con comparación de palabras clave; el LLM solo redacta explicaciones.

```
POST /simulador-ats { candidatoId|cvTexto, estructuraDoc, vacanteId }
  → AnalisisFormato(estructuraDoc)   // tablas, columnas, imágenes → alertas
  → CoincidenciaKeywords(cvTexto, vacante)  // coinciden / faltan
  → clasificarFaltantes(perfil)      // con respaldo / sin respaldo
  → legibilidad = heuristica(formato, keywords)  // alto/medio/bajo
  → explicacion = IaService.explicarAts(...)  // solo texto
```

## Análisis de formato (determinístico)

Al generar/subir el CV se conoce su estructura. Reglas:
- Tablas presentes → alerta.
- Más de una columna → alerta.
- Encabezados o secciones como imagen → alerta.
- Fuentes no estándar / caracteres raros → aviso leve.

Si el CV proviene del `optimizador` (plantilla ATS), pasa estas reglas por diseño.

## Coincidencia de palabras clave

- Extraer keywords de la vacante (reutiliza `vacante.obligatorios + habilidades`).
- Comparar con el texto del CV (coincidencia + similitud simple).
- Clasificar faltantes:
  - **con respaldo**: existe en el perfil → se puede añadir honestamente.
  - **sin respaldo**: no está en el perfil → informar, NO inventar.

## Modelo de datos (Prisma)

```prisma
model SimulacionAts {
  id            String   @id @default(uuid())
  candidatoId   String
  vacanteId     String
  coinciden     String[]
  faltanConRespaldo String[]
  faltanSinRespaldo String[]
  alertasFormato String[]
  legibilidad   String    // alto | medio | bajo
  explicacion   String
  creadoEn      DateTime @default(now())
}
```

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/simulador-ats` | Simula CV vs vacante; devuelve coincidencias, faltantes, alertas y legibilidad. |

## Contrato de IA (solo explicación)

```ts
ExplicacionAts = {
  resumen: string;        // "legibilidad media porque…"
  consejos: string[];     // mejoras legítimas (formato, keywords con respaldo)
}
```
Regla dura: nunca sugerir relleno de keywords sin respaldo ni texto oculto.
