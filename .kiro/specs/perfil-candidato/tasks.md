# Tareas — Perfil del candidato

- [ ] 1. Definir modelos Prisma (Candidato, ObjetivoLaboral, Experiencia,
      Habilidad, Certificacion, Idioma, Documento) y crear migración. (R1-R6)
- [ ] 2. Crear el módulo NestJS `perfil` (module, controller, service, DTOs). (R1-R6)
- [ ] 3. ParsingService: extraer texto de PDF y DOCX. Pruebas con archivos de muestra. (R1)
- [ ] 4. ParsingService: OCR para imagen y PDF escaneado vía capa `ia`; manejar
      "sin texto legible". (R1)
- [ ] 5. Contrato `PerfilExtraido` con esquema Zod y prompt versionado en `ia/prompts`.
      Prueba del prompt con un CV de ejemplo. (R4)
- [ ] 6. Endpoint POST `/perfil/cv`: parsear + extraer + devolver borrador (sin guardar). (R1, R4)
- [ ] 7. TranscripcionService + endpoint POST `/perfil/voz` (transcribir + borrador). (R3)
- [ ] 8. Preguntas de creación guiada: endpoint GET `/perfil/preguntas` y validación. (R2)
- [ ] 9. Endpoint POST `/perfil/confirmar`: guardar perfil confirmado/editado. (R4)
- [ ] 10. Objetivo laboral: validación de campos; salario opcional. (R5)
- [ ] 11. Consentimiento, control de fechas antiguas y DELETE en un paso. (R6)
- [ ] 12. Frontend: flujo accesible (subir CV / guiado / voz) un paso a la vez,
      con pantalla de confirmación de lo extraído. (R1-R6)
- [ ] 13. Pruebas e2e del flujo: subir CV → confirmar → perfil guardado. (R1, R4)
