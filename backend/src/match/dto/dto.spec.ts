import { EntradaMatchInvalidaError } from '../errores.js';
import { calcularMatchSchema } from './calcular-match.dto.js';
import { validarCon } from './validar.js';

/**
 * El DTO de entrada del match es `.strict()`: rechaza cuerpos sin ids, con tipos
 * erróneos y con campos extra (en particular `edad`/`nombre`, que nunca deben
 * entrar). Todos los fallos acaban en `EntradaMatchInvalidaError` (→ 400).
 */
describe('calcularMatchSchema + validarCon', () => {
  it('acepta un cuerpo con ambos ids no vacíos', () => {
    const dto = validarCon(calcularMatchSchema, { candidatoId: 'c-1', vacanteId: 'v-1' });
    expect(dto).toEqual({ candidatoId: 'c-1', vacanteId: 'v-1' });
  });

  it('rechaza cuerpo sin ids', () => {
    expect(() => validarCon(calcularMatchSchema, {})).toThrow(EntradaMatchInvalidaError);
    expect(() => validarCon(calcularMatchSchema, { candidatoId: 'c-1' })).toThrow(
      EntradaMatchInvalidaError,
    );
  });

  it('rechaza ids vacíos', () => {
    expect(() => validarCon(calcularMatchSchema, { candidatoId: '', vacanteId: 'v-1' })).toThrow(
      EntradaMatchInvalidaError,
    );
  });

  it('rechaza tipos erróneos', () => {
    expect(() =>
      validarCon(calcularMatchSchema, { candidatoId: 123, vacanteId: 'v-1' }),
    ).toThrow(EntradaMatchInvalidaError);
  });

  it('rechaza campos extra como edad/nombre', () => {
    expect(() =>
      validarCon(calcularMatchSchema, {
        candidatoId: 'c-1',
        vacanteId: 'v-1',
        edad: 50,
        nombre: 'Ana',
      }),
    ).toThrow(EntradaMatchInvalidaError);
  });
});
