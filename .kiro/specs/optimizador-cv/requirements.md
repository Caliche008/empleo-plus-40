# Requisitos — Optimizador de CV

## Introducción

Reescribe el CV del candidato para una vacante concreta: mejora el resumen y los
logros con las palabras clave reales de la oferta, traduce experiencia "antigua" a
competencias actuales, y aplica una plantilla compatible con ATS. Nunca inventa:
cada cambio se marca y requiere aprobación del usuario. Exporta a .docx y PDF con
texto seleccionable.

## Historias de usuario y criterios de aceptación (EARS)

### R1 — Reescritura honesta con palabras clave
**Historia:** Como candidato, quiero que mi CV use las palabras de la vacante sin
mentir.

- CUANDO se optimice el CV para una vacante, EL SISTEMA DEBERÁ reescribir el
  resumen y los logros incorporando palabras clave de la oferta.
- EL SISTEMA NO DEBERÁ añadir experiencia, logros, títulos ni datos inexistentes
  en el CV original.
- SI una palabra clave de la vacante no tiene respaldo en el perfil, ENTONCES EL
  SISTEMA NO DEBERÁ afirmar que el candidato la posee.

### R2 — Cambios marcados y aprobación
**Historia:** Como candidato, quiero ver y aprobar cada cambio.

- CUANDO el sistema proponga cambios, EL SISTEMA DEBERÁ mostrarlos marcados
  (antes/después) para aprobación individual o global.
- EL SISTEMA NO DEBERÁ aplicar ningún cambio sin confirmación del usuario.
- EL SISTEMA DEBERÁ guardar un registro de qué se modificó.

### R3 — Traducción de experiencia antigua
**Historia:** Como candidato +40, quiero que mi experiencia suene vigente.

- CUANDO una tarea esté expresada en términos antiguos (p. ej. "coordiné inventarios
  en Excel"), EL SISTEMA DEBERÁ ofrecer una redacción en competencias actuales
  (p. ej. "gestión de datos y control de procesos"), sin cambiar el hecho real.

### R4 — Plantilla ATS
**Historia:** Como candidato, quiero un CV que las máquinas puedan leer.

- EL SISTEMA DEBERÁ generar el CV en una plantilla ATS: una columna, sin tablas ni
  imágenes, encabezados estándar, fuentes simples.
- EL SISTEMA DEBERÁ permitir al usuario decidir si incluye año de graduación y
  fechas antiguas; por defecto, recomendar omitirlas cuando no aporten.

### R5 — Exportación
**Historia:** Como candidato, quiero descargar mi CV listo para enviar.

- EL SISTEMA DEBERÁ exportar a **.docx** y **PDF** con **texto seleccionable**
  (no imagen).

### R6 — No usar la edad
- EL SISTEMA NUNCA DEBERÁ sugerir cambios basados en la edad del candidato ni
  recomendar ocultar la edad como táctica de engaño; solo omitir datos que no
  aportan, a decisión del usuario.
