# Requisitos — Simulador ATS

## Introducción

Simula cómo un sistema ATS (Applicant Tracking System) leería el CV frente a una
vacante: muestra qué palabras clave coinciden y cuáles faltan, y alerta sobre
elementos de formato que suelen fallar en los parsers (tablas, columnas múltiples,
encabezados en imágenes). No promete "vencer" al ATS; ayuda a que el CV sea legible.

## Historias de usuario y criterios de aceptación (EARS)

### R1 — Coincidencia de palabras clave
**Historia:** Como candidato, quiero saber qué palabras clave de la vacante tiene y
cuáles le faltan a mi CV.

- CUANDO se simule un CV contra una vacante, EL SISTEMA DEBERÁ listar las palabras
  clave que **coinciden** y las que **faltan**.
- EL SISTEMA DEBERÁ indicar, de las que faltan, cuáles tienen respaldo en el perfil
  (se pueden añadir honestamente) y cuáles no (no se deben inventar).

### R2 — Alertas de formato (parsing)
**Historia:** Como candidato, quiero saber si mi CV tiene formato que confunde al ATS.

- SI el CV contiene tablas, columnas múltiples o encabezados en imágenes, ENTONCES
  EL SISTEMA DEBERÁ alertar que esos elementos suelen fallar en parsers.
- EL SISTEMA DEBERÁ sugerir la plantilla ATS de una columna como alternativa.

### R3 — Puntaje de legibilidad ATS
**Historia:** Como candidato, quiero una idea simple de qué tan legible es mi CV.

- EL SISTEMA DEBERÁ dar un indicador simple (p. ej. alto/medio/bajo) de legibilidad
  ATS, con explicación en lenguaje simple.
- EL SISTEMA DEBERÁ aclarar que es una estimación, no una garantía.

### R4 — Honestidad
- EL SISTEMA NO DEBERÁ recomendar técnicas de engaño (texto oculto, relleno de
  palabras clave sin respaldo). Solo mejoras legítimas de formato y contenido real.
