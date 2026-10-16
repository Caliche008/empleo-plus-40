# Tareas — Generador de mensajes

- [ ] 1. Modelo Prisma `Mensaje` y migración. (R1, R2)
- [ ] 2. Módulo NestJS `mensajes` (module, controller, service, DTOs). (R1-R5)
- [ ] 3. Prompts versionados por tipo/canal/tono + Zod (`MensajeGenerado`). (R1-R3)
- [ ] 4. `filtroNoDiscriminacion`: elimina/evita referencias a la edad. (R5)
- [ ] 5. Endpoint POST `/mensajes/generar` (carta / reclutador, con tono y canal). (R1-R3)
- [ ] 6. Límite de longitud para WhatsApp; validación por canal. (R2)
- [ ] 7. Frontend: selector de tipo/canal/tono, vista editable y botón "copiar". (R3, R4)
- [ ] 8. Pruebas: cambiar tono mantiene hechos; mensaje WhatsApp respeta longitud;
      ninguna mención de edad. (R3, R5)
