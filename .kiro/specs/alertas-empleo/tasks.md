# Tareas — Alertas de empleo

- [ ] 1. Modelos Prisma `PreferenciaNotificacion` y `Notificacion` + migración. (R1, R2)
- [ ] 2. Módulo NestJS `alertas` (module, controller, service, DTOs). (R1-R5)
- [ ] 3. Interfaz `CanalAdapter` + `SimuladoAdapter` (por defecto, sin red). (R4)
- [ ] 4. `WhatsAppAdapter` y `CorreoAdapter` inertes hasta `ENVIOS_REALES=true` y
      variables presentes. (R4)
- [ ] 5. Preferencias: canal, activo, maxPorDia (GET/PUT). (R1, R5)
- [ ] 6. Generar alerta cuando `match > 70` (hook desde el módulo match). (R2)
- [ ] 7. Entregar recordatorios de seguimiento creados por `seguimiento`. (R3)
- [ ] 8. Control de frecuencia (agrupar/limter por `maxPorDia`). (R5)
- [ ] 9. Endpoint `/alertas/probar` (notificación de prueba simulada). (R4)
- [ ] 10. Frontend: pantalla de preferencias y lista de notificaciones. Accesible. (R1)
- [ ] 11. Pruebas: con `ENVIOS_REALES=false` nunca se contacta red; match>70 crea
      alerta; respeta maxPorDia. (R2, R4, R5)
```
