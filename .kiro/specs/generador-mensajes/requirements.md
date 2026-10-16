# Requisitos — Generador de mensajes

## Introducción

Genera comunicaciones personalizadas por vacante: carta de presentación, y mensajes
breves para contactar reclutadores por LinkedIn o WhatsApp. Ofrece tres tonos
(formal, cercano, directo). Todo con base en el perfil real; sin inventar.

## Historias de usuario y criterios de aceptación (EARS)

### R1 — Carta de presentación
**Historia:** Como candidato, quiero una carta adaptada a la vacante.

- CUANDO el usuario lo pida para una vacante, EL SISTEMA DEBERÁ generar una carta
  de presentación personalizada, basada en el perfil y los requisitos reales.
- EL SISTEMA NO DEBERÁ afirmar logros o habilidades ausentes del perfil.

### R2 — Mensajes para reclutador
**Historia:** Como candidato, quiero un mensaje corto para escribirle al reclutador.

- EL SISTEMA DEBERÁ generar mensajes breves adecuados para **LinkedIn** y para
  **WhatsApp** (más corto, directo).

### R3 — Tres tonos
**Historia:** Como candidato, quiero elegir cómo sueno.

- EL SISTEMA DEBERÁ ofrecer tres tonos: **formal**, **cercano** y **directo**.
- CUANDO el usuario cambie de tono, EL SISTEMA DEBERÁ regenerar el mensaje
  manteniendo los hechos, cambiando solo el estilo.

### R4 — Edición y copia
**Historia:** Como candidato, quiero ajustar y copiar fácilmente el texto.

- EL SISTEMA DEBERÁ permitir editar el texto generado antes de usarlo.
- EL SISTEMA DEBERÁ permitir copiar el texto con un solo toque.

### R5 — Respeto y no discriminación
- EL SISTEMA NO DEBERÁ incluir referencias a la edad del candidato como argumento.
- EL SISTEMA DEBERÁ mantener un tono digno y profesional en todos los tonos.
