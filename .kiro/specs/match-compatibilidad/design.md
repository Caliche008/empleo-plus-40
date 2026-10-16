# Diseño — Match de compatibilidad

## Enfoque: híbrido (reglas + semántica)

El match combina:
1. **Reglas explícitas** (determinísticas): ubicación, modalidad, salario mínimo,
   certificaciones obligatorias. Son objetivas y no pasan por el LLM.
2. **Similitud semántica**: comparar habilidades/experiencia del perfil con los
   requisitos, usando embeddings (pgvector) para no depender de coincidencia literal.
3. **Explicación en lenguaje simple**: el LLM redacta la explicación y las brechas
   a partir del resultado ya calculado (no inventa el puntaje).

Separar el **cálculo** (reglas + vectores, reproducible) de la **redacción**
(LLM) garantiza puntajes consistentes y sin sesgo.

```
match(perfil, vacante):
  base = reglas(perfil, vacante)          // ubicación, salario, obligatorios
  sem  = similitudSemantica(perfil, vacante)  // pgvector
  puntaje = ponderar(base, sem)           // 0..100, pesos fijos y documentados
  brechas = requisitosNoCubiertos(perfil, vacante)
  recomendacion = decidir(puntaje, brechas)
  explicacion = IaService.explicarMatch(puntaje, desglose, brechas) // solo texto
```

## Anti-sesgo (regla dura)

- La función de cálculo recibe SOLO: habilidades, experiencia, sector, ubicación,
  salario. **No recibe** edad, fecha de nacimiento, nombre ni género.
- Prueba de sesgo: mismos datos con distinto nombre/edad inferida → mismo puntaje.

## Modelo de datos (Prisma)

```prisma
model Match {
  id            String   @id @default(uuid())
  candidatoId   String
  vacanteId     String
  puntaje       Int       // 0..100
  desglose      Json      // { habilidades, experiencia, sector, ubicacion, salario }
  cubiertos     String[]
  brechas       Json      // [{ requisito, obligatorio, sugerencia? }]
  recomendacion String    // postular | postular-ajustes | descartar
  explicacion   String
  creadoEn      DateTime @default(now())
}
```

## Ponderación (documentada y ajustable)

| Criterio | Peso por defecto |
|----------|------------------|
| Habilidades (semántico) | 35% |
| Experiencia relevante | 30% |
| Sector | 15% |
| Ubicación / modalidad | 12% |
| Salario | 8% |

Si falta un dato (p. ej. salario no declarado en la vacante), su peso se redistribuye
proporcionalmente y se indica en el desglose.

## API

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/match` | Body: { candidatoId, vacanteId }. Devuelve puntaje, desglose, brechas, recomendación, explicación. |
| GET  | `/match/:id` | Recupera un match calculado. |

## Contrato de IA (solo explicación, no puntaje)

```ts
ExplicacionMatch = {
  resumen: string;              // 1-2 frases en lenguaje simple
  porCriterio: { criterio: string; comentario: string }[];
  brechas: { requisito: string; sugerencia?: string }[];
}
```
El LLM recibe el puntaje y el desglose YA calculados; solo los pone en palabras.
