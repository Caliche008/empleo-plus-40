import { z } from 'zod';

/**
 * Esquemas Zod del cuerpo de `POST /perfil/confirmar`. Se valida en el borde
 * (compliance): `.strict()` rechaza cualquier campo desconocido, de modo que no
 * se cuele `edad`, `fechaNacimiento` ni nada ajeno al perfil acordado.
 *
 * Las sub-formas (habilidad, certificación, idioma) coinciden con las del
 * extractor de IA; la de experiencia se extiende con `desde`/`hasta` porque el
 * schema de persistencia los admite (texto libre que la persona controla).
 */

export const habilidadSchema = z
  .object({
    nombre: z.string().min(1),
    nivel: z.string().min(1).optional(),
  })
  .strict();

export const experienciaSchema = z
  .object({
    cargo: z.string().min(1),
    empresa: z.string().min(1).optional(),
    descripcion: z.string().min(1),
    logros: z.array(z.string().min(1)).default([]),
    desde: z.string().min(1).optional(),
    hasta: z.string().min(1).optional(),
  })
  .strict();

export const certificacionSchema = z
  .object({
    nombre: z.string().min(1),
    emisor: z.string().min(1).optional(),
    anio: z.string().min(1).optional(),
  })
  .strict();

export const idiomaSchema = z
  .object({
    idioma: z.string().min(1),
    nivel: z.string().min(1).optional(),
  })
  .strict();

export const objetivoSchema = z
  .object({
    rol: z.string().min(1),
    sector: z.string().min(1).optional(),
    // Salario opcional (R5): no todas las personas quieren declararlo.
    salarioMin: z.number().int().min(0).optional(),
    modalidad: z.enum(['presencial', 'hibrido', 'remoto']).optional(),
    ubicacion: z.string().min(1).optional(),
    disponibilidad: z.string().min(1).optional(),
  })
  .strict();

export const crearPerfilSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    telefono: z.string().min(1).optional(),
    pais: z.string().length(2).default('CO'),
    // El consentimiento se exige === true en el servicio (R6), no solo por tipo.
    consentimiento: z.boolean(),
    mostrarFechasAntiguas: z.boolean().default(false),
    objetivo: objetivoSchema,
    habilidades: z.array(habilidadSchema).default([]),
    experiencias: z.array(experienciaSchema).default([]),
    certificaciones: z.array(certificacionSchema).default([]),
    idiomas: z.array(idiomaSchema).default([]),
  })
  .strict();

export type CrearPerfilDto = z.infer<typeof crearPerfilSchema>;
