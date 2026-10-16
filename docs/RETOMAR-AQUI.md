# Punto de retorno — Empleo Plus 40

> Lee este archivo al abrir un chat nuevo para continuar sin perder contexto.
> La fuente de verdad es: `.kiro/steering/`, `.kiro/specs/`, `docs/decisiones.md`.

## Qué es el proyecto

App para profesionales **mayores de 40 años** contra el **edadismo laboral**.
Analiza vacantes vs. perfil real, optimiza el CV sin inventar (ATS), traduce
experiencia "antigua" a competencias vigentes, detecta sesgo por edad en ofertas,
prepara entrevistas y da seguimiento. Canal principal WhatsApp + PWA.

- **Piloto:** Colombia. **Visión:** toda Latinoamérica (arquitectura multi-país).
- **Enfoque +40 pero SIN restringir acceso por edad** (decisión Opción A).
- **Diferenciador (núcleo):** traductor de experiencia +40, detector de edadismo,
  honestidad radical (nunca inventar), dignidad + acompañamiento humano, WhatsApp
  accesible.

## Stack y arquitectura

- **Monolito modular** (no microservicios).
- **Backend:** NestJS + TypeScript (carpeta `backend/`). ESM (imports con `.js`).
- **Frontend:** Next.js PWA + Tailwind + App Router (carpeta `frontend/`).
- **BD:** PostgreSQL en **Neon** con pgvector + Prisma. **PENDIENTE DE CONECTAR**
  (falta crear el proyecto en Neon y poner DATABASE_URL en `backend/.env`).
- **IA:** proveedor intercambiable (gemini/openrouter/groq), salida JSON validada
  (Zod), prompts versionados y probados aparte.

## Método de desarrollo (OBLIGATORIO)

Ver `.kiro/steering/metodo-desarrollo.md`. Por cada tarea: planificar → construir
→ probar → **auditoría adversarial (árbitro)** → corregir → repetir → commit.
No dar por terminado sin: compila, pruebas pasan, linter, compliance, sin placeholders.

## Estado actual (todo en git LOCAL, 6 commits; NO hay GitHub aún)

Hecho:
- Fases 0, 1, 2 completas: estructura, steering (5 archivos), specs de los 8 módulos.
- Scaffold backend NestJS + frontend Next.js, dependencias instaladas.
  - NOTA: npm fallaba con error `edgesOut`; se resolvió usando `--legacy-peer-deps`.
- Capa `ia` construida: `ia.service.ts` (completar + completarJson con validación
  Zod y reintentos), proveedores (gemini, openai-compatible para openrouter/groq),
  `ia.module.ts` (global). Prompts versionados: `extraer-perfil`, `traducir-experiencia`.

## RETOMAR POR AQUÍ (orden)

1. **Crear el prompt `detectar-edadismo`** en `backend/src/ia/prompts/`
   (quedó pendiente; es diferenciador clave). Esquema Zod: hayIndicios, senales
   [{fragmento, motivo, gravedad baja|media|alta}], resumen (con descargo "no es
   asesoría jurídica").
2. **Pruebas de la capa `ia`** (según el método): probar `extraerJson()` con
   JSON directo, envuelto en ```json```, y con texto alrededor; validación de
   esquemas; reintento ante JSON inválido (con un proveedor simulado).
3. **Módulo `perfil-candidato`** (primer módulo del MVP): ver su spec en
   `.kiro/specs/perfil-candidato/`. Empezar por lo que NO necesita BD:
   ParsingService (PDF/DOCX/texto) + PerfilExtractorService usando la capa `ia`.
4. Conectar **Neon** cuando el usuario pase la DATABASE_URL → Prisma schema +
   primera migración → endpoints del perfil.

## Pendientes del usuario

- Crear proyecto en **Neon** y pasar la connection string (va en `backend/.env`,
  nunca en git).
- Decidir si subir a **GitHub** (ahora solo está en git local de este PC).
- Nombre definitivo del producto ("Empleo Plus 40" es provisional).
