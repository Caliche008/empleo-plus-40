# Estructura — Empleo Plus 40

## Raíz del repositorio

```
empleo-plus-40/
├── frontend/            # PWA Next.js (independiente)
├── backend/             # API NestJS (independiente)
├── docs/                # Documentación y decisiones
│   └── decisiones.md    # Registro de decisiones con fecha y motivo
├── .kiro/
│   ├── steering/        # Reglas del proyecto (product, tech, structure, compliance)
│   └── specs/           # Especificaciones por módulo (requirements, design, tasks)
└── README.md
```

## Backend (NestJS) — monolito modular

```
backend/
├── src/
│   ├── main.ts                 # Arranque de la app
│   ├── app.module.ts           # Módulo raíz que compone los demás
│   ├── common/                 # Utilidades transversales
│   │   ├── config/             # Configuración y validación de entorno
│   │   ├── guards/             # Autenticación / autorización
│   │   └── dto/                # DTOs compartidos
│   ├── ia/                     # Capa de IA (abstracción de proveedor LLM)
│   │   ├── providers/          # Adaptadores (gemini, openrouter, groq…)
│   │   ├── prompts/            # Prompts versionados + pruebas
│   │   └── ia.service.ts       # Fachada: completa() con salida JSON validada
│   ├── perfil/                 # Módulo: perfil del candidato
│   ├── vacante/                # Módulo: análisis de vacante
│   ├── match/                  # Módulo: compatibilidad perfil-vacante
│   ├── optimizador/            # Módulo: optimización de CV
│   ├── simulador-ats/          # Módulo: simulador ATS
│   ├── mensajes/               # Módulo: generador de mensajes
│   ├── seguimiento/            # Módulo: seguimiento de postulaciones
│   └── alertas/                # Módulo: alertas de empleo
├── prisma/
│   └── schema.prisma           # Modelo de datos y migraciones
├── test/                       # Pruebas e2e
├── .env.example
└── package.json
```

Cada módulo de negocio sigue el patrón NestJS: `*.module.ts`, `*.controller.ts`,
`*.service.ts`, `dto/`, y pruebas `*.spec.ts`. Un módulo no importa directamente
las entrañas de otro: se comunican por sus servicios públicos.

## Frontend (Next.js) — PWA

```
frontend/
├── src/
│   ├── app/                    # Rutas (App Router)
│   │   ├── layout.tsx          # Layout accesible (fuentes grandes, contraste)
│   │   ├── page.tsx            # Inicio
│   │   ├── perfil/             # Flujo de perfil
│   │   ├── vacante/            # Analizar vacante
│   │   ├── match/              # Resultado de compatibilidad
│   │   └── optimizar/          # Optimización del CV
│   ├── components/             # Componentes reutilizables y accesibles
│   ├── lib/                    # Cliente de API, utilidades
│   └── styles/                 # Estilos globales (Tailwind)
├── public/
│   └── manifest.json           # Configuración PWA
├── .env.example
└── package.json
```

## Responsabilidades por módulo (backend)

| Módulo | Responsabilidad |
|--------|-----------------|
| `ia` | Hablar con el LLM y devolver JSON validado. Única puerta a la IA. |
| `perfil` | Extraer y guardar el perfil del candidato (CV, voz, objetivo). |
| `vacante` | Extraer requisitos y señales de alerta de una oferta. |
| `match` | Calcular puntaje 0-100 con desglose y recomendación. |
| `optimizador` | Reescribir el CV sin inventar, con cambios para aprobar. |
| `simulador-ats` | Palabras clave faltantes y alertas de parsing. |
| `mensajes` | Carta de presentación y mensajes para LinkedIn/WhatsApp. |
| `seguimiento` | Tablero de postulaciones y recordatorios. |
| `alertas` | Notificaciones de vacantes con match alto. |

## Regla de dependencia

- Los módulos de negocio dependen de `ia` y `common`, nunca al revés.
- Ningún módulo accede a la base de datos de otro módulo directamente.
- El frontend solo se comunica con el backend por su API pública (HTTP/JSON).
