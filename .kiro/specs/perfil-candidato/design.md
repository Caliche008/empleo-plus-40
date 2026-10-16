# Diseño — Perfil del candidato

## Arquitectura del módulo

Módulo NestJS `perfil` que orquesta: parsing de archivos, transcripción de voz,
extracción por IA y persistencia. Depende de `ia` (extracción) y `common`.

```
Usuario → Frontend → POST /perfil/cv (archivo)
                         → ParsingService (texto del archivo)
                         → IaService.extraerPerfil(texto)  [JSON validado]
                         → devuelve borrador para CONFIRMAR
         Frontend → POST /perfil/confirmar (perfil editado)
                         → PerfilService.guardar()  → PostgreSQL
```

## Modelo de datos (Prisma)

```prisma
model Candidato {
  id            String   @id @default(uuid())
  telefono      String?  @unique      // registro por celular/WhatsApp
  nombre        String?
  pais          String   @default("CO")  // ISO país; multi-país (MVP: Colombia)
  consentimiento Boolean @default(false)
  mostrarFechasAntiguas Boolean @default(false)
  objetivo      ObjetivoLaboral?
  habilidades   Habilidad[]
  experiencias  Experiencia[]
  certificaciones Certificacion[]
  idiomas       Idioma[]
  documentos    Documento[]
  creadoEn      DateTime @default(now())
}

model ObjetivoLaboral {
  id          String  @id @default(uuid())
  candidatoId String  @unique
  candidato   Candidato @relation(fields: [candidatoId], references: [id], onDelete: Cascade)
  rol         String
  sector      String?
  salarioMin  Int?
  modalidad   String?  // presencial | hibrido | remoto
  ubicacion   String?
  disponibilidad String?
}

model Experiencia {
  id          String @id @default(uuid())
  candidatoId String
  candidato   Candidato @relation(fields: [candidatoId], references: [id], onDelete: Cascade)
  cargo       String
  empresa     String?
  descripcion String
  logros      String[]
  desde       String?   // texto libre; el usuario decide mostrar fechas
  hasta       String?
}

model Habilidad     { id String @id @default(uuid()) candidatoId String  candidato Candidato @relation(fields:[candidatoId], references:[id], onDelete: Cascade) nombre String nivel String? }
model Certificacion { id String @id @default(uuid()) candidatoId String  candidato Candidato @relation(fields:[candidatoId], references:[id], onDelete: Cascade) nombre String emisor String? anio String? }
model Idioma        { id String @id @default(uuid()) candidatoId String  candidato Candidato @relation(fields:[candidatoId], references:[id], onDelete: Cascade) idioma String nivel String? }

model Documento {
  id          String @id @default(uuid())
  candidatoId String
  candidato   Candidato @relation(fields: [candidatoId], references: [id], onDelete: Cascade)
  tipo        String   // cv-pdf | cv-docx | cv-imagen | audio
  url         String   // almacenamiento cifrado
  creadoEn    DateTime @default(now())
}
```

## API (endpoints)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/perfil/cv` | Sube un CV; devuelve texto extraído y borrador de perfil (sin guardar). |
| POST | `/perfil/voz` | Sube una nota de voz; devuelve transcripción y borrador. |
| GET  | `/perfil/preguntas` | Devuelve las preguntas de creación guiada. |
| POST | `/perfil/confirmar` | Guarda el perfil confirmado/editado por el usuario. |
| GET  | `/perfil/:id` | Obtiene el perfil. |
| PATCH| `/perfil/:id` | Actualiza campos del perfil. |
| DELETE | `/perfil/:id` | Elimina perfil y documentos en un solo paso. |

## Servicios internos

- **ParsingService:** extrae texto de PDF/DOCX/imagen. Para imagen y PDF escaneado,
  usa OCR (visión del LLM). Devuelve texto plano o indica que no hay texto legible.
- **TranscripcionService:** speech-to-text en español (proveedor configurable).
- **PerfilExtractorService:** llama a `IaService.extraerPerfil(texto)`, que devuelve
  un JSON validado por Zod con habilidades, experiencias, logros, certificaciones,
  idiomas. Marca cada ítem como "pendiente de confirmación".

## Contrato de IA (salida JSON validada)

```ts
PerfilExtraido = {
  habilidades: { nombre: string; nivel?: string }[];
  experiencias: { cargo: string; empresa?: string; descripcion: string; logros: string[] }[];
  certificaciones: { nombre: string; emisor?: string; anio?: string }[];
  idiomas: { idioma: string; nivel?: string }[];
}
```
Regla dura: el extractor **no inventa**; si un campo no está en el texto, lo omite.

## Consideraciones de accesibilidad

- Flujo "un paso a la vez": cada pregunta/sección en su pantalla.
- Botones grandes, etiquetas claras, soporte de lector de pantalla.
- Mensajes de error en lenguaje simple, sin tecnicismos.
