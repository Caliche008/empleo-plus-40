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

## 2026-10-17 — Validación de entrada con Zod, no class-validator (D-ZOD)
**Decisión:** los DTOs del perfil (`POST /perfil/confirmar`, `PATCH /perfil/:id`) se
validan con **Zod** en el borde, no con class-validator.
**Motivo:** el proyecto no tiene class-validator y la capa de IA ya valida con Zod;
mantener Zod evita una dependencia nueva y da coherencia. `.strict()` rechaza campos
desconocidos (compliance: nunca se cuela `edad` ni `fechaNacimiento`).

## 2026-10-17 — La traducción de error de dominio a HTTP vive en el controller (D-ERRHTTP)
**Decisión:** `PerfilService` lanza errores de dominio en español; el `PerfilController`
los traduce a excepciones HTTP (404/400). El servicio no conoce el transporte.
**Motivo:** mantiene el patrón del backend (`errores.ts` ya está desacoplado de HTTP),
hace el servicio probable sin levantar la app y evita filtrar errores crudos de Prisma/BD
al cliente.

## 2026-10-17 — PATCH solo actualiza escalares + objetivo, no colecciones hijas (D-PATCH-ESCALAR)
**Decisión:** `PATCH /perfil/:id` actualiza los campos escalares del candidato y hace
upsert del objetivo; NO reemplaza habilidades, experiencias, certificaciones ni idiomas.
**Motivo:** reemplazar colecciones exige un borrar+recrear transaccional que ningún
requisito pide ahora. Se deja anotado como pendiente para evitar complejidad prematura.

## 2026-10-17 — Subida de CV y nota de voz diferidas (D-CV)
**Decisión:** `POST /perfil/cv` (multer + almacenamiento cifrado del `Documento`) y
`POST /perfil/voz` quedan fuera de esta fase de persistencia.
**Motivo:** la persistencia del perfil confirmado no las necesita; añadirlas ahora
mezcla manejo de archivos y almacenamiento con el guardado de datos. Se abordan aparte.

## 2026-10-17 — pgvector / match semántico diferido (D-PGVECTOR)
**Decisión:** sin columnas vector ni lógica de match en esta fase.
**Motivo:** el matching es una fase posterior; el schema de persistencia del perfil no
lo requiere todavía. Se añadirá cuando se implemente el emparejamiento.

## 2026-10-19 — POST /vacante/analizar persiste siempre y devuelve el id (D-VACANTE-PERSIST)
**Decisión:** `POST /vacante/analizar` guarda SIEMPRE la vacante analizada (con sus
alertas anidadas) y devuelve el análisis con un campo `id` añadido. En el frontend `id`
es OPCIONAL en la interfaz `VacanteAnalizada`; la pantalla actual no cambia su lógica.
`candidatoId` se guarda como `String?` suelto (sin FK a Candidato) por ahora.
**Motivo:** el módulo de match necesitará referenciar vacantes por id; guardar en el
mismo paso evita un endpoint extra de "guardar" y mantiene el flujo del frontend intacto
(una sola llamada). La FK a Candidato se añadirá como relación opcional si el match la
necesita, sin tocar hoy el modelo Candidato.
