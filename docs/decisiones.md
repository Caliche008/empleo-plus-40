# Registro de decisiones — Empleo Plus 40

Decisiones que afectan la arquitectura o se desvían del plan original, con fecha
y motivo. La fuente de verdad del producto es el "Plan completo de la app de
empleo para personas +40".

---

## 2026-10-15 — Base de datos: PostgreSQL gestionado en la nube
**Decisión:** usar un PostgreSQL gestionado (Neon o Supabase) en lugar de local/Docker.
**Motivo:** gratis para empezar, incluye pgvector (requerido para match semántico),
evita instalar software pesado y facilita que colaboradores se conecten.

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
