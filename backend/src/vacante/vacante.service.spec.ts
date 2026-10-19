import { IaService } from '../ia/ia.service.js';
import type { PeticionIa, ProveedorIa, RespuestaIa } from '../ia/ia.types.js';
import { AnalisisFallidoError, TextoVacanteInvalidoError } from './errores.js';
import { VacanteService } from './vacante.service.js';

/**
 * Proveedor simulado (sin red) que devuelve, en orden, las respuestas de una
 * cola. Cuenta `llamadas` para verificar que el servicio NO toca la IA cuando el
 * texto es inválido. Mismo patrón que `perfil-extractor.service.spec.ts`.
 */
class ProveedorSimulado implements ProveedorIa {
  readonly nombre = 'simulado';
  readonly modelo = 'modelo-test';
  llamadas = 0;
  private indice = 0;

  constructor(private readonly respuestas: string[]) {}

  completar(_peticion: PeticionIa): Promise<RespuestaIa> {
    this.llamadas++;
    const texto =
      this.respuestas[Math.min(this.indice, this.respuestas.length - 1)] ?? '';
    this.indice++;
    return Promise.resolve({
      texto,
      proveedor: this.nombre,
      modelo: this.modelo,
      latenciaMs: 0,
    });
  }
}

/** Texto de oferta suficientemente largo para pasar la longitud mínima. */
const OFERTA_LARGA =
  'Buscamos desarrollador para unirse a nuestro equipo joven y dinámico. ' +
  'Requisitos: experiencia en TypeScript. Jornada completa, presencial en Madrid.';

describe('VacanteService.analizar', () => {
  it('V1. oferta con lenguaje por edad → devuelve VacanteAnalizada con alerta tipo "edad"', async () => {
    const respuesta = JSON.stringify({
      cargo: 'Desarrollador',
      obligatorios: ['Experiencia en TypeScript'],
      deseables: [],
      habilidades: ['TypeScript'],
      ubicacion: 'Madrid',
      modalidad: 'presencial',
      salario: '30.000 €',
      alertas: [
        {
          tipo: 'edad',
          detalle:
            'La oferta menciona "equipo joven", lenguaje que puede excluir por edad. ' +
            'Esto no es asesoría jurídica; ante una posible discriminación consulta a un abogado o a la defensoría.',
        },
      ],
    });
    const proveedor = new ProveedorSimulado([respuesta]);
    const servicio = new VacanteService(new IaService(proveedor));

    const resultado = await servicio.analizar(OFERTA_LARGA);

    expect(resultado.cargo).toBe('Desarrollador');
    expect(resultado.alertas.some((a) => a.tipo === 'edad')).toBe(true);
    expect(proveedor.llamadas).toBe(1);
  });

  it('V2. oferta sin salario → devuelve alerta tipo "salario-oculto" y sin campo salario', async () => {
    const respuesta = JSON.stringify({
      cargo: 'Operario de almacén',
      obligatorios: ['Carné de carretillero'],
      deseables: [],
      habilidades: [],
      alertas: [
        {
          tipo: 'salario-oculto',
          detalle: 'La oferta no indica el salario. Pregunta por el rango antes de avanzar.',
        },
      ],
    });
    const proveedor = new ProveedorSimulado([respuesta]);
    const servicio = new VacanteService(new IaService(proveedor));

    const resultado = await servicio.analizar(OFERTA_LARGA);

    expect(resultado.salario).toBeUndefined();
    expect(resultado.alertas.some((a) => a.tipo === 'salario-oculto')).toBe(true);
  });

  it('V3. texto vacío → lanza TextoVacanteInvalidoError y NO llama a la IA', async () => {
    const proveedor = new ProveedorSimulado(['{}']);
    const servicio = new VacanteService(new IaService(proveedor));

    await expect(servicio.analizar('')).rejects.toBeInstanceOf(TextoVacanteInvalidoError);
    await expect(servicio.analizar('   ')).rejects.toBeInstanceOf(TextoVacanteInvalidoError);
    expect(proveedor.llamadas).toBe(0);
  });

  it('V4. texto más corto que el mínimo → lanza TextoVacanteInvalidoError y NO llama a la IA', async () => {
    const proveedor = new ProveedorSimulado(['{}']);
    const servicio = new VacanteService(new IaService(proveedor));

    await expect(servicio.analizar('Vendedor en Madrid')).rejects.toBeInstanceOf(
      TextoVacanteInvalidoError,
    );
    expect(proveedor.llamadas).toBe(0);
  });

  it('V5. NO inventa: los campos extra del LLM se descartan por Zod', async () => {
    const conExtras = JSON.stringify({
      cargo: 'Analista',
      obligatorios: [],
      deseables: [],
      habilidades: [],
      alertas: [],
      edad: 50,
      campoFantasma: 'no debería aparecer',
    });
    const servicio = new VacanteService(new IaService(new ProveedorSimulado([conExtras])));

    const resultado = await servicio.analizar(OFERTA_LARGA);

    expect(resultado).not.toHaveProperty('edad');
    expect(resultado).not.toHaveProperty('campoFantasma');
    expect(resultado.cargo).toBe('Analista');
  });

  it('V6. respuesta inválida persistente → traduce el IaError a AnalisisFallidoError', async () => {
    // El proveedor nunca devuelve JSON válido → completarJson agota reintentos y
    // lanza IaError, que el servicio traduce a un error de dominio amable.
    const servicio = new VacanteService(new IaService(new ProveedorSimulado(['no soy json'])));

    await expect(servicio.analizar(OFERTA_LARGA)).rejects.toBeInstanceOf(AnalisisFallidoError);
  });
});
