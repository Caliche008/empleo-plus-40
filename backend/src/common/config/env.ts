import { z } from 'zod';

/**
 * Esquema de variables de entorno. El arranque falla temprano y con mensaje
 * claro si falta algo esencial, en lugar de romper a mitad de ejecución.
 */
const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  DATABASE_URL: z.string().optional().default(''),

  IA_PROVIDER: z.enum(['gemini', 'openrouter', 'groq']).default('gemini'),
  IA_MODEL: z.string().default('gemini-flash-latest'),
  GEMINI_API_KEY: z.string().optional().default(''),
  OPENROUTER_API_KEY: z.string().optional().default(''),
  OPENROUTER_MODEL: z.string().default('meta-llama/llama-3.3-70b-instruct:free'),
  GROQ_API_KEY: z.string().optional().default(''),
  GROQ_MODEL: z.string().default('openai/gpt-oss-120b'),

  PAIS_DEFECTO: z.string().length(2).default('CO'),
  ENVIOS_REALES: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(source);
  if (!parsed.success) {
    const detalle = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Variables de entorno inválidas: ${detalle}`);
  }
  return parsed.data;
}
