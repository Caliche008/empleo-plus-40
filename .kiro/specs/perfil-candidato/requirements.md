# Requisitos — Perfil del candidato

## Introducción

Permite a la persona crear su perfil profesional: cargando su CV (PDF, Word o
foto), respondiendo preguntas guiadas, o enviando notas de voz que se transcriben.
El sistema extrae habilidades, experiencia, logros, certificaciones e idiomas, y
registra el objetivo laboral. Toda extracción se confirma con el usuario antes de
guardarse. Cumple el principio de honestidad: nada se da por cierto sin aprobación.

## Historias de usuario y criterios de aceptación (EARS)

### R1 — Carga de CV
**Historia:** Como candidato, quiero subir mi CV existente para no empezar de cero.

- CUANDO el usuario suba un archivo PDF, DOCX o imagen, EL SISTEMA DEBERÁ extraer
  su texto y mostrarlo para revisión.
- SI el archivo supera 10 MB o tiene un formato no soportado, ENTONCES EL SISTEMA
  DEBERÁ rechazarlo con un mensaje claro en lenguaje simple.
- SI el PDF es una imagen escaneada sin texto, ENTONCES EL SISTEMA DEBERÁ avisar
  que no pudo leer el texto y ofrecer la creación guiada o nota de voz.

### R2 — Creación guiada por preguntas
**Historia:** Como candidato sin CV digital, quiero responder preguntas para armar
mi perfil.

- CUANDO el usuario elija "crear perfil guiado", EL SISTEMA DEBERÁ presentar las
  preguntas de una en una (un paso a la vez).
- MIENTRAS el usuario responde, EL SISTEMA DEBERÁ permitir volver atrás y editar.

### R3 — Notas de voz
**Historia:** Como candidato, quiero contar mi experiencia por voz porque me es
más fácil que escribir.

- CUANDO el usuario envíe una nota de voz, EL SISTEMA DEBERÁ transcribirla a texto
  en español y convertirla en experiencia estructurada.
- EL SISTEMA DEBERÁ mostrar la transcripción para que el usuario la corrija.

### R4 — Extracción estructurada con confirmación
**Historia:** Como candidato, quiero revisar lo que el sistema entendió antes de
guardarlo, para que sea fiel a la realidad.

- CUANDO el sistema extraiga habilidades, logros, certificaciones o idiomas,
  EL SISTEMA DEBERÁ mostrarlos y requerir confirmación del usuario antes de guardar.
- EL SISTEMA NO DEBERÁ inventar ni añadir datos que no estén en la fuente original.
- SI el usuario edita un dato extraído, ENTONCES EL SISTEMA DEBERÁ guardar la
  versión editada por el usuario.

### R5 — Objetivo laboral
**Historia:** Como candidato, quiero definir qué busco para recibir análisis
pertinentes.

- EL SISTEMA DEBERÁ permitir registrar: rol deseado, sector, salario mínimo,
  modalidad (presencial/híbrido/remoto), ubicación y disponibilidad.
- SI el salario mínimo queda vacío, ENTONCES EL SISTEMA DEBERÁ permitir continuar
  (campo opcional).

### R6 — Privacidad y control de datos
**Historia:** Como candidato, quiero controlar mis datos sensibles.

- EL SISTEMA DEBERÁ pedir consentimiento explícito antes de guardar datos personales.
- EL SISTEMA DEBERÁ permitir decidir si se muestran año de graduación y fechas antiguas.
- EL SISTEMA NUNCA DEBERÁ usar la edad para filtrar o puntuar.
- EL SISTEMA DEBERÁ permitir eliminar el perfil y sus documentos en un solo paso.
