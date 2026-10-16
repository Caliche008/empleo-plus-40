# Requisitos — Match de compatibilidad

## Introducción

Compara el perfil del candidato con una vacante analizada y produce un puntaje de
0 a 100 con desglose por criterios, explicación en lenguaje simple, brechas reales
y una recomendación clara (postular, postular con ajustes, o descartar). El puntaje
nunca depende de la edad, el nombre o el género.

## Historias de usuario y criterios de aceptación (EARS)

### R1 — Puntaje con desglose
**Historia:** Como candidato, quiero un puntaje claro de qué tan compatible soy.

- CUANDO exista un perfil y una vacante, EL SISTEMA DEBERÁ calcular un puntaje de
  0 a 100 con desglose: habilidades, experiencia relevante, sector, ubicación y salario.
- EL SISTEMA DEBERÁ explicar cada criterio en lenguaje simple.

### R2 — Match justo (sin sesgo)
**Historia:** Como candidato +40, quiero que mi puntaje sea justo.

- EL SISTEMA NUNCA DEBERÁ usar edad, nombre o género para calcular el puntaje.
- EL SISTEMA DEBERÁ producir el mismo puntaje si se cambia solo el nombre o la edad
  inferida (verificable con pruebas de sesgo).

### R3 — Brechas y cómo cerrarlas
**Historia:** Como candidato, quiero saber qué me falta y cómo mejorarlo.

- CUANDO haya requisitos no cubiertos, EL SISTEMA DEBERÁ listarlos como brechas.
- PARA CADA brecha relevante, EL SISTEMA DEBERÁ sugerir una acción (curso o
  certificación) cuando sea razonable.

### R4 — Recomendación clara
**Historia:** Como candidato, quiero una recomendación simple sobre qué hacer.

- CUANDO el puntaje y las brechas estén calculados, EL SISTEMA DEBERÁ recomendar
  una de tres opciones: **postular**, **postular con ajustes**, o **descartar**,
  con una razón breve.
- SI el match es alto pero hay una brecha obligatoria, ENTONCES la recomendación
  DEBERÁ reflejarlo (p. ej. "postular con ajustes").

### R5 — Explicabilidad
**Historia:** Como candidato, quiero entender de dónde sale el puntaje.

- EL SISTEMA DEBERÁ mostrar qué requisitos de la vacante sí cubre el perfil y
  cuáles no, de forma explícita.
