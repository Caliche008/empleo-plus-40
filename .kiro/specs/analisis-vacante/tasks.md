# Tareas — Análisis de vacante

- [ ] 1. Modelos Prisma (Vacante, Alerta) y migración. (R2, R3)
- [~] 2. Módulo NestJS `vacante` (module, controller, service, DTOs). (R1-R4)
      PARCIAL: module/controller/service/DTOs hechos para el análisis por TEXTO;
      la persistencia (BD) queda fuera de esta fase (depende de la tarea 1/6).
- [x] 3. Contrato `VacanteAnalizada` con Zod y prompt versionado en `ia/prompts`
      (incluye detección de lenguaje por edad). Prueba con vacantes de ejemplo. (R2, R3, R4)
- [x] 4. Endpoint POST `/vacante/analizar` para texto pegado. (R1, R2, R3)
- [ ] 5. FetchService para URL propia, con lista de dominios no permitidos y
      fallback a "pega el texto". Respetar no-scraping. (R1)
- [ ] 6. Persistencia de vacante y alertas; endpoint GET `/vacante/:id`. (R4)
- [~] 7. Descargo legal automático en toda alerta (no asesoría jurídica). (R3)
      PARCIAL: en esta fase el descargo se garantiza vía UI fija (frontend) y se
      refuerza en el prompt para la alerta de tipo `edad`. El descargo "en toda
      alerta" automático en el dato queda pendiente de la fase de persistencia.
- [~] 8. Frontend: pantalla "analizar vacante" (pegar texto/enlace) y vista de
      resultado con requisitos y alertas en lenguaje simple. (R1-R3)
      PARCIAL: pantalla de análisis por TEXTO hecha y conectada; la entrada por
      ENLACE/URL (fetch) queda fuera (depende de la tarea 5).
- [x] 9. Pruebas: vacante con lenguaje por edad → genera alerta; vacante sin
      salario → alerta de salario oculto. (R3)
