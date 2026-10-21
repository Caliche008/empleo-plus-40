# Punto de retorno — Empleo Plus 40

> Lee este archivo al abrir un chat nuevo para continuar sin perder contexto.
> Fuente de verdad: `.kiro/steering/`, `.kiro/specs/`, `docs/decisiones.md`.
> Última actualización: 2026-10-21.

## Qué es el proyecto

App contra el **edadismo laboral** para profesionales **+40** (piloto Colombia,
visión Latinoamérica). Diferenciador núcleo: **detector de edadismo en ofertas**,
**traductor de experiencia +40**, **honestidad radical** (nunca inventar),
acompañamiento, y canal principal **WhatsApp + PWA**. Ver `.kiro/steering/product.md`.

## Stack

- **Backend:** NestJS + TypeScript ESM (`backend/`). Prisma 7 + PostgreSQL en Neon
  (con pgvector). IA intercambiable (Gemini activo), salida JSON validada con Zod.
- **Frontend:** Next.js 16 + React 19 + Tailwind v4 (`frontend/`). Tema oscuro +
  morado. Proxy `/api` → backend.
- **Repo:** git local + GitHub (`main` al día). Flujo: rama por feature → merge
  `--no-ff` a `main` → push → borrar rama.

## Puertos y arranque local

- Backend en **3000**: `cd backend ; npm run start:dev`
- Frontend en **3001**: `cd frontend ; npm run dev` → abrir http://localhost:3001
- Ver en el celular (sin tocar firewall): túnel con cloudflared (ya instalado):
  `cloudflared tunnel --url http://localhost:3001` → da una URL pública temporal.

## Estado actual (TODO EN `main`, verificado y mergeado)

HECHO y funcional de verdad (probado contra backend + Neon + Gemini):
- **Capa IA** robusta. Fix aplicado: Gemini 3.x con `thinkingBudget:0` (el
  "pensamiento" rompía las respuestas JSON) y timeout 90s. Nota: Gemini a veces
  da 502/503 por alta demanda; hay reintentos y degradación.
- **Módulo perfil-candidato:** parsing PDF/DOCX/TXT, OCR de imágenes vía IA,
  extracción con IA (sin inventar), persistencia Prisma/Neon, endpoints
  `POST /perfil/cv`, `/perfil/confirmar`, `GET/PATCH/DELETE /perfil/:id`,
  `GET /perfil/preguntas`. Consentimiento obligatorio, borrado en un paso.
  Pendiente del módulo: transcripción de voz (tarea 7).
- **Módulo análisis de vacante:** prompt `analizar-vacante` (detecta edad,
  salario oculto, requisitos inflados; descargo legal siempre), `POST /vacante/analizar`
  (persiste y devuelve id), `GET /vacante/:id`. Pendiente: FetchService de URLs (tarea 5).
- **Módulo match / compatibilidad:** reglas + semántica (pgvector preparado,
  columna NULL por ahora; respaldo Jaccard sin red) + explicación IA (solo redacta).
  Anti-sesgo DURO (el cálculo no recibe edad/nombre/género) con **prueba de sesgo**
  como gate. `POST /match`, `GET /match/:id`.
- **Frontend:** cáscara visual completa + flujo del perfil, vacante y match
  CONECTADOS de verdad. Ruta feliz enlazada: crear perfil → analizar vacante →
  botón "Ver mi compatibilidad" → match automático (sin pedir ids a mano).
- Pantallas MAQUETA (datos de ejemplo, con aviso de demo): inicio/buscar empleo,
  login/registro, guardados, postulaciones, estadísticas, publicar vacante (empleador).

## Decisión de producto PENDIENTE (lo más importante a resolver)

Al ver la demo en el celular surgió una observación clave del usuario: **"se ve
como una app de empleos más"**, porque la entrada muestra maquetas genéricas y el
diferenciador (detector de edadismo, match honesto) está escondido. Falta validar
si sirve como herramienta esencial.

Plan propuesto para retomar (en este orden):
1. **Probar el diferenciador con una oferta REAL**: pegar el texto de una vacante
   real que excluya por edad y ver si el detector da algo valioso y creíble.
   (Tener a mano el texto de una oferta real de LinkedIn/Computrabajo.)
2. Si convence: **poner el diferenciador al frente** — rehacer la bienvenida para
   que reciba con "analiza si una oferta te discrimina por edad" y lleve directo a
   eso, no a una lista de empleos genérica. Esconder/quitar maquetas que lo hacen
   parecer "una más".
3. Alternativa: **replantear el enfoque** del producto si el concepto no convence.

## Pendientes técnicos (para después, no bloquean la decisión de producto)

- Transcripción de voz (perfil, tarea 7) — requiere elegir servicio speech-to-text.
- FetchService de URLs en análisis de vacante (tarea 5).
- Módulos sin empezar: optimizador CV, simulador ATS, generador de mensajes,
  alertas de empleo, seguimiento de postulaciones.
- Transversal: PWA (manifest/offline), **autenticación real** (hoy el login es
  maqueta), WhatsApp (canal principal), despliegue a producción.
- Validación humana de accesibilidad (WCAG) y legal (Ley 1581) antes de producción.

## PENDIENTES DE SEGURIDAD (hacer pronto)

Durante el desarrollo se expusieron credenciales en el chat. ROTAR:
- Contraseña de la base de datos en **Neon** (panel → Roles → reset password).
- Clave de **Gemini** (Google AI Studio → revocar/regenerar).
Tras rotarlas, actualizar `backend/.env` (ignorado por git) con los nuevos valores.

## Progreso aproximado

~30-35% del MVP completo. La base difícil (arquitectura, capa IA, núcleo
perfil→vacante→match) está hecha. Falta volumen de funcionalidad de cara al
usuario y, sobre todo, resolver la pregunta de producto de arriba.
