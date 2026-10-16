# Requisitos — Seguimiento de postulaciones

## Introducción

Un tablero simple para que la persona registre y siga el estado de sus
postulaciones, con recordatorios de seguimiento. El objetivo es dar orden y
constancia a la búsqueda, con una interfaz muy clara.

## Historias de usuario y criterios de aceptación (EARS)

### R1 — Registrar postulación
**Historia:** Como candidato, quiero registrar a dónde apliqué.

- CUANDO el usuario postule (o lo indique), EL SISTEMA DEBERÁ permitir crear una
  postulación con: vacante, empresa, fecha y estado inicial "postulada".
- CUANDO el flujo venga del optimizador/mensajes, EL SISTEMA DEBERÁ permitir crear
  la postulación automáticamente con esos datos.

### R2 — Estados del tablero
**Historia:** Como candidato, quiero ver en qué va cada postulación.

- EL SISTEMA DEBERÁ soportar los estados: **postulada, en revisión, entrevista,
  oferta, descartada**.
- EL SISTEMA DEBERÁ permitir cambiar el estado de forma simple (un toque).

### R3 — Recordatorios de seguimiento
**Historia:** Como candidato, quiero que me recuerden hacer seguimiento.

- CUANDO una postulación lleve **7 días** sin cambio de estado, EL SISTEMA DEBERÁ
  generar un recordatorio de seguimiento.
- CUANDO lleve **14 días**, EL SISTEMA DEBERÁ generar un segundo recordatorio.
- Los recordatorios se entregan por el canal preferido (WhatsApp o correo); el
  envío real requiere el módulo de alertas y confirmación (no se simula aquí el envío).

### R4 — Vista simple
**Historia:** Como candidato +40, quiero un tablero fácil de entender.

- EL SISTEMA DEBERÁ mostrar las postulaciones agrupadas por estado, con texto
  grande y acciones claras.

### R5 — Privacidad
- EL SISTEMA DEBERÁ permitir eliminar una postulación y sus datos cuando el usuario
  lo desee.
