# Empleo Plus 40

Aplicación de empleo para personas mayores de 40 años en Colombia. Analiza
vacantes frente al perfil real de la persona, optimiza el CV para pasar filtros
ATS **sin inventar experiencia**, prepara entrevistas y da seguimiento a las
postulaciones. Canal principal: WhatsApp; complemento: PWA.

> El foco es conseguir **entrevistas**, con honestidad y dignidad. No promete
> empleo ni "vencer" al ATS.

## Arquitectura

Monolito modular, dos proyectos independientes en un mismo repositorio:

- **`frontend/`** — PWA en Next.js (App Router) + TypeScript + Tailwind.
- **`backend/`** — API en NestJS + TypeScript + PostgreSQL (Prisma, pgvector).

## Documentación del proyecto

- Reglas y contexto: [`.kiro/steering/`](.kiro/steering/) (product, tech, structure, compliance).
- Especificaciones por módulo: [`.kiro/specs/`](.kiro/specs/).
- Decisiones técnicas: [`docs/decisiones.md`](docs/decisiones.md).

## Estado

En desarrollo. Fase actual: especificaciones del MVP.

## Módulos del MVP

1. Perfil del candidato
2. Análisis de vacante
3. Match de compatibilidad
4. Optimizador de CV
5. Simulador ATS
6. Generador de mensajes
7. Seguimiento de postulaciones
8. Alertas de empleo
