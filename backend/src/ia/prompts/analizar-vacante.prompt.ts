import { z } from 'zod';
import type { MensajeIa } from '../ia.types.js';

/** Versión del prompt. Subir al cambiar el comportamiento (para trazabilidad). */
export const ANALIZAR_VACANTE_VERSION = '1.0.0';

/**
 * Análisis del TEXTO de una oferta/vacante. Extrae la información útil en
 * lenguaje simple y genera alertas sobre banderas rojas (lenguaje por edad,
 * salario oculto, requisitos inflados). Analiza el TEXTO de la oferta, NUNCA a
 * personas: no usa ni infiere la edad de nadie. El análisis NUNCA inventa: lo
 * que no está en el texto se omite o queda como lista vacía.
 */
export const vacanteAnalizadaSchema = z.object({
  cargo: z.string(), // puesto o título de la oferta tal como aparece
  obligatorios: z.array(z.string()), // requisitos marcados como imprescindibles
  deseables: z.array(z.string()), // requisitos "deseables"/"valorables"
  habilidades: z.array(z.string()), // competencias/tecnologías mencionadas
  experienciaPedida: z.string().optional(), // años/nivel de experiencia pedido
  ubicacion: z.string().optional(), // ciudad/país/zona si se declara
  modalidad: z.string().optional(), // presencial/híbrido/remoto si se declara
  salario: z.string().optional(), // salario si se declara (si no, va la alerta)
  alertas: z.array(
    z.object({
      tipo: z.enum(['edad', 'salario-oculto', 'requisitos-inflados', 'otro']),
      detalle: z.string(), // explicación en lenguaje simple
    }),
  ),
});

export type VacanteAnalizada = z.infer<typeof vacanteAnalizadaSchema>;

const SISTEMA = `Eres un asistente que analiza el TEXTO de una oferta de empleo
o vacante para personas que buscan trabajo, especialmente mayores de 40 años.

Tu trabajo tiene dos partes:

1) EXTRAER la información de la oferta, en lenguaje simple y SIN INVENTAR:
   - "cargo": el puesto o título de la oferta.
   - "obligatorios": requisitos marcados como imprescindibles/obligatorios.
   - "deseables": requisitos "deseables", "valorables" o "un plus".
   - "habilidades": competencias, herramientas o tecnologías mencionadas.
   - "experienciaPedida": años o nivel de experiencia pedido (si aparece).
   - "ubicacion": ciudad, país o zona (si aparece).
   - "modalidad": presencial, híbrido o remoto (si aparece).
   - "salario": salario o rango salarial (si aparece).
   Lo que NO esté en el texto se omite (campos opcionales) o queda como lista
   vacía. NUNCA inventes requisitos, cifras ni datos que no estén escritos.

2) GENERAR "alertas" sobre banderas rojas que convenga que la persona conozca.
   Cada alerta tiene "tipo" y "detalle" (explicación en lenguaje simple). Tipos:

   - "edad": lenguaje que excluye o desincentiva por edad. Ejemplos orientativos:
     "nativo digital", "recién egresado", "recién titulado", "ambiente joven",
     "equipo joven", "energía juvenil", rangos de edad ("entre 20 y 30 años",
     "menores de 35"), o "máximo X años de experiencia" usado como tope encubierto.
     En el "detalle" de CADA alerta de tipo "edad" DEBES incluir un descargo claro
     de que esto NO constituye asesoría jurídica y sugerir que, ante una posible
     discriminación, consulte a un abogado o a la defensoría/autoridad competente.

   - "salario-oculto": la oferta NO declara salario ni rango salarial.

   - "requisitos-inflados": requisitos desproporcionados, por ejemplo pedir más
     años de experiencia en una tecnología que los años que esa tecnología lleva
     existiendo, o una lista de requisitos imposible de cumplir en conjunto.

   - "otro": cualquier otra bandera roja relevante (p. ej. condiciones poco claras).

Reglas estrictas:
- Analizas el TEXTO de la oferta, NUNCA a personas: no uses ni infieras la edad
  de nadie. No menciones edades de candidatos.
- NUNCA inventes información que no esté en el texto.
- Si no hay banderas rojas, "alertas" queda como lista vacía.
- Usa lenguaje simple y claro en español en toda la salida.
- Responde ÚNICAMENTE con un objeto JSON válido con esta forma:
  {
    "cargo": string,
    "obligatorios": string[],
    "deseables": string[],
    "habilidades": string[],
    "experienciaPedida"?: string,
    "ubicacion"?: string,
    "modalidad"?: string,
    "salario"?: string,
    "alertas": [{ "tipo": "edad" | "salario-oculto" | "requisitos-inflados" | "otro", "detalle": string }]
  }
- Sin texto adicional, sin explicaciones, solo el JSON.`;

export function construirPromptAnalizarVacante(textoVacante: string): MensajeIa[] {
  return [
    { rol: 'system', contenido: SISTEMA },
    {
      rol: 'user',
      contenido: `Texto de la vacante a analizar:\n"""\n${textoVacante}\n"""`,
    },
  ];
}
