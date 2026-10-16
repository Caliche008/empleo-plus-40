# Requisitos — Alertas de empleo

## Introducción

Notifica a la persona cuando aparece una vacante con buen match (superior a 70) y
entrega los recordatorios de seguimiento. Canal preferido: WhatsApp; alternativa:
correo. El envío real de WhatsApp o correo nunca ocurre sin configuración y
confirmación explícita; en el MVP el canal puede operar en modo simulado.

## Historias de usuario y criterios de aceptación (EARS)

### R1 — Preferencias de notificación
**Historia:** Como candidato, quiero elegir cómo y cuándo me avisan.

- EL SISTEMA DEBERÁ permitir elegir canal preferido: **WhatsApp** o **correo**.
- EL SISTEMA DEBERÁ permitir activar/desactivar las alertas.

### R2 — Alerta por match alto
**Historia:** Como candidato, quiero enterarme de vacantes que me calzan.

- CUANDO una vacante nueva tenga **match > 70** con el perfil, EL SISTEMA DEBERÁ
  generar una alerta para el candidato.
- La alerta DEBERÁ incluir el cargo, el puntaje y un enlace a ver el detalle.

### R3 — Entrega de recordatorios
**Historia:** Como candidato, quiero recibir los recordatorios de seguimiento.

- CUANDO el módulo de seguimiento cree un recordatorio (7/14 días), EL SISTEMA
  DEBERÁ entregarlo por el canal preferido.

### R4 — Envíos seguros (regla dura)
**Historia:** Como responsable del producto, no quiero envíos reales accidentales.

- EL SISTEMA NO DEBERÁ enviar mensajes reales de WhatsApp ni correos sin que el
  canal esté configurado Y el envío esté explícitamente habilitado.
- MIENTRAS el modo sea simulado, EL SISTEMA DEBERÁ registrar la notificación como
  "pendiente/simulada" sin contactar servicios externos.

### R5 — Frecuencia y respeto
**Historia:** Como candidato, no quiero saturarme de mensajes.

- EL SISTEMA DEBERÁ agrupar o limitar las alertas para no exceder una frecuencia
  razonable (p. ej. un resumen por día como máximo por defecto).
