# Registro de decisiones — Empleo Plus 40

Decisiones que afectan la arquitectura o se desvían del plan original, con fecha
y motivo. La fuente de verdad del producto es el "Plan completo de la app de
empleo para personas +40".

---

## 2026-10-15 — Base de datos: PostgreSQL gestionado en Neon
**Decisión:** usar **Neon** (PostgreSQL gestionado) en lugar de local/Docker/Supabase.
**Motivo:** gratis para empezar, incluye pgvector (requerido para match semántico),
reactivación instantánea, permite varios proyectos, y es simple de conectar. Evita
instalar software pesado y facilita que colaboradores se conecten.

## 2026-10-15 — Backend: NestJS (TypeScript)
**Decisión:** NestJS en vez de FastAPI (Python).
**Motivo:** un solo lenguaje (TypeScript) en todo el stack; comparte tipos con el
frontend Next.js, más mantenible para equipo pequeño. El plan permitía elegir uno.

## 2026-10-15 — Arquitectura: monolito modular (no microservicios)
**Decisión:** backend único con módulos internos desacoplados.
**Motivo:** microservicios añaden complejidad y costo sin beneficio en un MVP. El
plan ya propone backend único para equipo pequeño. Se extraerán servicios solo si
una razón real lo justifica más adelante.

## 2026-10-15 — Organización: dos proyectos independientes en un repo
**Decisión:** `frontend/` y `backend/` como proyectos independientes (sin workspaces
de monorepo), en un único repositorio Git.
**Motivo:** simple de entender y presentar a colaboradores; sin la complejidad de
herramientas de monorepo, que no aportan en esta etapa.

## 2026-10-15 — Enfoque +40 sin restricción de acceso por edad (Opción A)
**Decisión:** la app se enfoca en personas +40 (mensaje, funciones, misión), pero
no bloquea el acceso por edad; cualquier persona puede registrarse y usarla.
**Motivo:** evita contradicción con el compliance (no usar la edad para filtrar),
no excluye al usuario secundario del plan (desempleados/emprendedores que pueden
ser <40) y es lo más limpio legalmente. El enfoque +40 se da por producto, no por
un muro de edad.

## 2026-10-15 — Alcance regional: piloto Colombia, arquitectura multi-país
**Decisión:** el producto apunta a toda Latinoamérica, pero el piloto inicial es
en Colombia. La arquitectura se diseña multi-país desde el inicio: cada usuario
tiene un país asociado; el compliance (ley de datos, antidiscriminación), el aviso
de privacidad y detalles culturales (salarios, modalidades, español neutro) son
configurables por país. En el MVP solo se implementa Colombia.
**Motivo:** la visión es regional y el edadismo laboral es transversal en Latam.
Diseñar multi-país ahora evita rehacer; lanzar país por país tras validar evita
abarcar demasiado de golpe.

## 2026-10-15 — Lo diferenciador es el núcleo, no un extra
**Decisión:** priorizar como centro del producto el **traductor de experiencia +40**
y el **detector de edadismo**, con honestidad radical y acompañamiento humano. Los
módulos genéricos (optimizador ATS, mensajes) quedan al servicio de ese diferenciador.
**Motivo:** la investigación de mercado mostró que optimizar CV/ATS ya está resuelto
por muchos competidores maduros (en inglés, público general). La ventaja real está
en el nicho +40, el enfoque local Latam, la honestidad y el acompañamiento, no en la
tecnología genérica.

## 2026-10-16 — OCR de hojas de vida vía visión del LLM, retrocompatible (Decisión D3)
**Decisión:** para leer hojas de vida que llegan como imagen (foto o escaneo), el
OCR se hace con la capacidad multimodal del propio proveedor de IA, no con una
librería de OCR nativa (p. ej. Tesseract). La capa `ia` se extiende de forma
**opcional y retrocompatible**: se añade el tipo `PeticionVision` y el método
opcional `completarVision?` en la interfaz `ProveedorIa`, implementado SOLO en
`GeminiProvider` (formato REST `contents[].parts` con `inlineData`). `IaService`
expone `completarVisionJson`, equivalente multimodal de `completarJson` (valida la
salida con Zod y reintenta pidiendo corrección sobre texto, sin reenviar la imagen).
Un `OcrService` aislado en `src/perfil` delega en esa fachada con un prompt propio
versionado (`ocr-cv.prompt.ts`). Todo el punto multimodal se prueba con IA simulada,
sin red.
**Motivo:** cambiar el contrato `completar` a multimodal tocaría los tres proveedores
y el tipo del que depende todo módulo, y los proveedores OpenAI-compatibles usan otro
formato de imagen. Hacer `completarVision` opcional mantiene intactos a
`OpenAICompatibleProvider` y a los dobles simulados (las 14 pruebas previas siguen en
verde) y aísla el único proveedor con visión. Evitar OCR nativo quita una dependencia
binaria pesada y reutiliza la infraestructura de IA ya existente. El OCR solo
transcribe lo visible (nunca inventa) y marca `textoLegible:false` cuando no hay texto,
en línea con el compliance duro del proyecto.
