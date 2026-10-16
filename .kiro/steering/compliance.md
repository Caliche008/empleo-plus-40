# Cumplimiento, privacidad y ética — Empleo Plus 40

> Estas reglas son **obligatorias** y no se pueden sobrepasar. Afectan tanto al
> código como al comportamiento de la IA.

## 1. Protección de datos personales (Ley 1581 de 2012 — Colombia)

- **Consentimiento explícito** antes de recolectar o tratar datos personales.
- **Aviso de privacidad** claro, en lenguaje simple, accesible desde la app.
- Derechos del titular: **conocer, actualizar, rectificar y suprimir** sus datos.
- Registro de la base de datos ante la **SIC** cuando aplique.
- **Minimización:** solo se guardan los datos que el servicio realmente necesita.
- **Eliminación en un paso:** el usuario puede borrar su cuenta y documentos de
  forma sencilla y completa.
- **Cifrado** en tránsito (TLS) y en reposo. Control de acceso por rol.

## 2. No discriminación por edad (y otros)

- **La edad NUNCA se usa para filtrar ni para puntuar** a un candidato.
- Los puntajes de match no deben variar por nombre, edad inferida o género.
  Esto se verifica con pruebas de sesgo periódicas.
- Se **recomienda al usuario omitir** datos que no aportan y exponen a sesgo
  (año de graduación, fechas muy antiguas), pero la decisión es siempre suya.
- La app **alerta** sobre ofertas con lenguaje discriminatorio (p. ej. por edad),
  pero **no da asesoría jurídica**: recomienda consultar abogado o defensoría.
  Referencia: Ley 1482 de 2011 (antidiscriminación).

## 3. Honestidad del CV (regla dura de la IA)

- **Nunca fabricar** experiencia, logros, títulos, fechas ni datos.
- El optimizador solo puede **reformular lo que ya existe** en el CV original.
- **Cada afirmación nueva** o reescritura requiere **confirmación del usuario**.
- Se mantiene un **registro de cambios** para que el usuario vea qué se modificó.
- Si la IA no tiene respaldo en el CV para una afirmación, no la incluye.

## 4. Fuentes de vacantes (legalidad)

- **Prohibido el scraping no autorizado** de portales de empleo (viola sus
  términos de uso y puede acarrear problemas legales).
- Orden de fuentes permitidas:
  1. Acuerdos con bolsas de empleo y aliados.
  2. Cargas manuales de orientadores/usuarios (pegar texto o enlace propio).
  3. APIs públicas o agregadores **autorizados**.

## 5. Datos sensibles

- No se almacenan datos sensibles innecesarios.
- La **salud** y la **edad** no se usan para filtrar ni puntuar.
- Documentos (CV) en almacenamiento cifrado, con acceso mínimo necesario.

## 6. IA — guardrails obligatorios

- Salida **JSON validada por esquema** en los módulos de datos.
- **Filtro de lenguaje discriminatorio** en todas las respuestas generadas.
- Ninguna acción que envíe datos del usuario a terceros sin que la tarea lo exija
  y el usuario lo haya aceptado.
- No llamadas reales a servicios de pago ni envío real de WhatsApp sin
  confirmación explícita.

## 7. Accesibilidad

- **WCAG 2.1 AA** como referencia. La verificación completa requiere pruebas con
  tecnologías de asistencia y revisión experta; se documenta lo verificado y lo
  pendiente.
