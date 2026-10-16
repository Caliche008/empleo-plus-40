# Método de desarrollo — Empleo Plus 40

Regla de trabajo para TODO el desarrollo del proyecto. Se aplica a cada módulo y
a cada tarea. El objetivo es calidad profesional e impecable, sin prototipos a
medias.

## El loop (por cada tarea)

1. **Planificar:** entender el requisito (spec en `.kiro/specs/`), definir el
   enfoque mínimo y correcto. Sin sobre-ingeniería.
2. **Construir:** implementar siguiendo `tech.md` (TypeScript estricto, nombres,
   formato) y `compliance.md`.
3. **Probar:** escribir y ejecutar pruebas automáticas antes de dar por hecho.
4. **Auditoría adversarial (árbitro):** atacar el propio trabajo buscando fallos,
   como si quisiera tumbarlo (ver checklist abajo). Corregir lo que aparezca.
5. **Repetir** hasta superar todos los criterios de validación.
6. **Commit** con mensaje claro (Conventional Commits).

## Checklist del árbitro adversarial

Antes de dar por terminada una tarea, revisar activamente:

- **Casos límite:** entradas vacías, enormes, con caracteres raros, en otro idioma,
  archivos corruptos, campos faltantes.
- **Seguridad:** inyección (SQL/prompt), datos sin validar, secretos expuestos,
  errores que filtran información interna.
- **Compliance (crítico en este proyecto):**
  - ¿Se puede colar la **edad** en el cálculo del match o en un filtro? → No debe.
  - ¿La IA puede **inventar** experiencia/logros? → No debe; todo con respaldo.
  - ¿Se hace algún **scraping** no autorizado? → Prohibido.
  - ¿Se envía algo real (WhatsApp/correo) sin confirmación? → Prohibido.
- **Robustez:** ¿qué pasa si el LLM devuelve JSON inválido, si la red falla, si la
  BD no responde? Degradar con gracia, nunca romper sin mensaje claro.
- **Accesibilidad (frontend):** contraste, tamaño de fuente, foco de teclado,
  etiquetas para lector de pantalla, una acción principal por pantalla.
- **Honestidad del resultado:** no afirmar que algo funciona sin haberlo probado;
  documentar lo verificado y lo pendiente.

## Criterios de validación (el listón)

Una tarea NO está terminada hasta que:

- [ ] Compila sin errores ni warnings de tipo.
- [ ] Pasa sus pruebas automáticas.
- [ ] Pasa el linter.
- [ ] Cumple el compliance (verificado contra el checklist).
- [ ] Pasó la auditoría adversarial (se buscaron y corrigieron fallos).
- [ ] Sin placeholders, sin TODO a medias, sin código muerto.

## Entregable

- Código limpio en TypeScript, según convenciones de `tech.md`.
- Salidas de IA en JSON validado por Zod.
- Comentarios solo donde aportan (el "porqué", no el "qué" obvio).
- Un commit por avance significativo.

## Nota de honestidad

El "árbitro adversarial" es una **revisión crítica sistemática**, no una garantía
absoluta de ausencia de errores. Reduce fallos de forma importante, pero la
validación final de seguridad, legal (Ley 1581) y accesibilidad (WCAG) requiere
también revisión humana experta antes de producción.
