import { z } from 'zod';

/**
 * Esquema del cuerpo de `PATCH /perfil/:id`. Todo opcional: es un parche
 * parcial de los campos escalares del candidato y de su objetivo. No incluye
 * `id` (lo fija la ruta), ni `consentimiento` (no se re-pide al editar), ni las
 * colecciones hijas (se tratan en una fase posterior). `.strict()` rechaza
 * campos desconocidos como `edad` o `fechaNacimiento` (compliance).
 */

export const objetivoParcheSchema = z
  .object({
    rol: z.string().min(1).optional(),
    sector: z.string().min(1).optional(),
    salarioMin: z.number().int().min(0).optional(),
    modalidad: z.enum(['presencial', 'hibrido', 'remoto']).optional(),
    ubicacion: z.string().min(1).optional(),
    disponibilidad: z.string().min(1).optional(),
  })
  .strict();

export const actualizarPerfilSchema = z
  .object({
    nombre: z.string().min(1).optional(),
    telefono: z.string().min(1).optional(),
    pais: z.string().length(2).optional(),
    mostrarFechasAntiguas: z.boolean().optional(),
    objetivo: objetivoParcheSchema.optional(),
  })
  .strict();

export type ActualizarPerfilDto = z.infer<typeof actualizarPerfilSchema>;
