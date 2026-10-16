# Tareas — Análisis de vacante

- [ ] 1. Modelos Prisma (Vacante, Alerta) y migración. (R2, R3)
- [ ] 2. Módulo NestJS `vacante` (module, controller, service, DTOs). (R1-R4)
- [ ] 3. Contrato `VacanteAnalizada` con Zod y prompt versionado en `ia/prompts`
      (incluye detección de lenguaje por edad). Prueba con vacantes de ejemplo. (R2, R3, R4)
- [ ] 4. Endpoint POST `/vacante/analizar` para texto pegado. (R1, R2, R3)
- [ ] 5. FetchService para URL propia, con lista de dominios no permitidos y
      fallback a "pega el texto". Respetar no-scraping. (R1)
- [ ] 6. Persistencia de vacante y alertas; endpoint GET `/vacante/:id`. (R4)
- [ ] 7. Descargo legal automático en toda alerta (no asesoría jurídica). (R3)
- [ ] 8. Frontend: pantalla "analizar vacante" (pegar texto/enlace) y vista de
      resultado con requisitos y alertas en lenguaje simple. (R1-R3)
- [ ] 9. Pruebas: vacante con lenguaje por edad → genera alerta; vacante sin
      salario → alerta de salario oculto. (R3)
