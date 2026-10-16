# Tecnología — Empleo Plus 40

## Arquitectura

**Monolito modular** (no microservicios): un backend único, bien dividido en
módulos internos desacoplados. Si un módulo necesita escalar por sí solo en el
futuro, se extrae entonces, no antes.

**Multi-país desde el diseño:** cada usuario tiene un `pais` asociado. El
compliance, el aviso de privacidad y los parámetros culturales (moneda/salarios,
modalidades, español neutro con variantes) se resuelven por configuración según el
país, no con lógica incrustada. En el MVP se implementa **Colombia**; añadir un país
nuevo debe ser configuración + revisión legal, no reescritura.

Dos proyectos independientes dentro del repositorio:

- `frontend/` — PWA en Next.js (App Router).
- `backend/`  — API en NestJS.

No es un monorepo con workspaces: cada carpeta se instala, corre y despliega por
su cuenta. Conviven en el mismo repositorio para facilitar la colaboración.

## Stack

### Frontend
- **Next.js** (App Router) + **TypeScript**.
- **PWA** (instalable, offline parcial), pensada para gama media/baja.
- **Tailwind CSS** para estilos; diseño accesible, letra grande, alto contraste.
- Estado del servidor con React Query (TanStack Query) cuando aplique.

### Backend
- **NestJS** + **TypeScript**.
- **PostgreSQL** gestionado en **Neon** (nube), con **pgvector** para matching
  semántico.
- **Prisma** como ORM y gestor de migraciones.
- Validación de entrada con **class-validator** / Zod en los límites.

### IA
- Capa de abstracción de proveedor LLM (intercambiable: Gemini, OpenRouter, Groq…).
- Toda la IA produce **JSON validado** por esquema (Zod) antes de usarse.
- Los **prompts viven en un módulo versionado y con pruebas** (no incrustados en
  la lógica de negocio).

### Infraestructura y servicios
- **Transcripción:** servicio speech-to-text en español (para notas de voz).
- **Almacenamiento:** bucket cifrado (S3 o equivalente) para CV y documentos.
- **WhatsApp:** WhatsApp Business API (Meta) o proveedor (Twilio/360dialog).
  Integración **simulada** hasta aprobación explícita; nunca envíos reales sin confirmar.
- **Hosting:** nube con región en Latinoamérica o cercana (revisar residencia de datos).

## Convenciones de código

- **Lenguaje:** TypeScript en todo el stack (`strict: true`).
- **Formato:** Prettier (configuración por defecto, comillas simples, ancho 100).
- **Linter:** ESLint con reglas recomendadas de TypeScript y Nest/Next.
- **Nombres:** carpetas y archivos en `kebab-case`; clases en `PascalCase`;
  variables y funciones en `camelCase`.
- **Sin secretos en el código:** todo por variables de entorno + `.env.example`.
- **Pruebas:** cada módulo con pruebas. Los prompts de IA se prueban por separado.

## Formato de commits (Conventional Commits)

```
<tipo>(<ámbito opcional>): <descripción breve en minúscula>
```

Tipos: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `build`.

Ejemplos:
- `feat(perfil): extracción de habilidades desde CV`
- `fix(match): corrige puntaje cuando falta el salario`
- `docs(steering): añade compliance.md`

## Decisiones

Cualquier decisión que cambie el plan original se registra en
`docs/decisiones.md` con fecha y motivo.
