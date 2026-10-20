import {
  construirPromptExplicarMatch,
  EXPLICAR_MATCH_VERSION,
  explicacionMatchSchema,
} from './explicar-match.prompt.js';

describe('explicacionMatchSchema', () => {
  it('E1. acepta un JSON válido', () => {
    const valido = {
      resumen: 'Buen encaje general.',
      porCriterio: [{ criterio: 'habilidades', comentario: 'Coinciden las principales.' }],
      brechas: [{ requisito: 'Kubernetes', sugerencia: 'Curso introductorio' }],
    };
    const r = explicacionMatchSchema.safeParse(valido);
    expect(r.success).toBe(true);
  });

  it('E2. hace strip de un campo puntaje si el modelo lo envía', () => {
    const conPuntaje = {
      resumen: 'Resumen.',
      porCriterio: [],
      brechas: [],
      puntaje: 999,
    };
    const r = explicacionMatchSchema.parse(conPuntaje);
    expect('puntaje' in r).toBe(false);
  });

  it('E3. la sugerencia de brecha es opcional', () => {
    const r = explicacionMatchSchema.safeParse({
      resumen: 'Resumen.',
      porCriterio: [],
      brechas: [{ requisito: 'Go' }],
    });
    expect(r.success).toBe(true);
  });
});

describe('construirPromptExplicarMatch', () => {
  it('E4. arma system + user y declara la versión', () => {
    expect(EXPLICAR_MATCH_VERSION).toBe('1.0.0');
    const mensajes = construirPromptExplicarMatch({
      puntaje: 72,
      desglose: { criterios: [], fuenteSemantica: 'respaldo', pesosRedistribuidos: false },
      cubiertos: ['Python'],
      brechas: [{ requisito: 'Kubernetes', obligatorio: true }],
      recomendacion: 'postular-ajustes',
    });
    expect(mensajes).toHaveLength(2);
    expect(mensajes[0].rol).toBe('system');
    expect(mensajes[1].rol).toBe('user');
    expect(mensajes[1].contenido).toContain('72');
  });
});
