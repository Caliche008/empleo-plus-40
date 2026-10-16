# Requisitos — Análisis de vacante

## Introducción

Permite analizar una oferta de empleo pegando su texto o un enlace propio. El
sistema extrae requisitos obligatorios y deseables, y detecta señales de alerta
(lenguaje excluyente por edad, requisitos inflados, salario no declarado). No se
hace scraping no autorizado: solo texto pegado o enlaces que el usuario aporta.

## Historias de usuario y criterios de aceptación (EARS)

### R1 — Entrada de vacante
**Historia:** Como candidato, quiero pegar una oferta para analizarla.

- CUANDO el usuario pegue el texto de una vacante, EL SISTEMA DEBERÁ procesarlo.
- CUANDO el usuario pegue un enlace, EL SISTEMA DEBERÁ obtener su texto solo si la
  fuente lo permite; SI no, ENTONCES DEBERÁ pedir que pegue el texto manualmente.
- EL SISTEMA NO DEBERÁ hacer scraping de portales que lo prohíban en sus términos.

### R2 — Extracción de requisitos
**Historia:** Como candidato, quiero saber qué pide la vacante de forma clara.

- CUANDO se analice una vacante, EL SISTEMA DEBERÁ extraer: cargo, requisitos
  obligatorios, requisitos deseables, habilidades, experiencia pedida, ubicación,
  modalidad y salario (si está).
- EL SISTEMA DEBERÁ presentar los requisitos en lenguaje simple.

### R3 — Señales de alerta
**Historia:** Como candidato, quiero saber si una oferta tiene banderas rojas.

- SI la oferta contiene lenguaje excluyente por edad (p. ej. "máximo 30 años",
  "recién egresado", "joven dinámico"), ENTONCES EL SISTEMA DEBERÁ marcarlo como
  alerta y explicar por qué.
- SI la oferta no declara salario, ENTONCES EL SISTEMA DEBERÁ señalarlo.
- SI los requisitos parecen inflados (p. ej. años de experiencia en una tecnología
  más nueva que esos años), ENTONCES EL SISTEMA DEBERÁ señalarlo.
- EL SISTEMA DEBERÁ aclarar que no da asesoría jurídica y sugerir consultar a un
  abogado o defensoría ante discriminación.

### R4 — Resultado estructurado
**Historia:** Como sistema, necesito un resultado estructurado para el match.

- CUANDO termine el análisis, EL SISTEMA DEBERÁ producir un JSON validado con los
  requisitos y las alertas, reutilizable por el módulo de match.
- EL SISTEMA NO DEBERÁ inventar requisitos que no estén en el texto.
