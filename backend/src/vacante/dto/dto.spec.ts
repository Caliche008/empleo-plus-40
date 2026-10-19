import { TextoVacanteInvalidoError } from '../errores.js';
import { analizarVacanteSchema } from './analizar-vacante.dto.js';
import { validarCon } from './validar.js';

describe('analizarVacanteSchema vía validarCon', () => {
  it('D1. body con texto string parsea y devuelve el texto', () => {
    const dto = validarCon(analizarVacanteSchema, {
      texto: 'Oferta de empleo con requisitos y condiciones de la vacante.',
    });
    expect(dto.texto).toBe('Oferta de empleo con requisitos y condiciones de la vacante.');
  });

  it('D2. body sin texto lanza TextoVacanteInvalidoError', () => {
    expect(() => validarCon(analizarVacanteSchema, {})).toThrow(TextoVacanteInvalidoError);
  });

  it('D3. texto no-string lanza TextoVacanteInvalidoError', () => {
    expect(() => validarCon(analizarVacanteSchema, { texto: 123 })).toThrow(
      TextoVacanteInvalidoError,
    );
  });

  it('D4. campo desconocido (strict) lanza TextoVacanteInvalidoError', () => {
    expect(() =>
      validarCon(analizarVacanteSchema, { texto: 'una oferta', url: 'https://ejemplo.com' }),
    ).toThrow(TextoVacanteInvalidoError);
  });
});
