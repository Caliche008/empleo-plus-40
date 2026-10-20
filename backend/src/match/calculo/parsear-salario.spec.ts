import { parsearSalario } from './parsear-salario.js';

describe('parsearSalario', () => {
  it('P1. puntos como separador de miles', () => {
    expect(parsearSalario('$3.500.000')).toBe(3_500_000);
  });

  it('P2. millones multiplica por 1e6', () => {
    expect(parsearSalario('4 millones')).toBe(4_000_000);
    expect(parsearSalario('2 mill')).toBe(2_000_000);
  });

  it('P3. rango "X a Y" usa el mínimo', () => {
    expect(parsearSalario('3 a 4 millones')).toBe(3_000_000);
    expect(parsearSalario('2.000.000 a 3.000.000')).toBe(2_000_000);
  });

  it('P4. coma decimal con millones', () => {
    expect(parsearSalario('3,5 millones')).toBe(3_500_000);
  });

  it('P5. "a convenir" o no numérico → undefined', () => {
    expect(parsearSalario('a convenir')).toBeUndefined();
    expect(parsearSalario('')).toBeUndefined();
    expect(parsearSalario('salario competitivo')).toBeUndefined();
  });
});
