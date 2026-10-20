import type { ReglasEvaluadas } from './reglas.js';
import type { SimilitudSemantica } from './semantica.js';
import { PESOS, ponderar } from './ponderar.js';

const semanticaPlena: SimilitudSemantica = {
  simHabilidades: 1,
  simExperiencia: 1,
  fuente: 'respaldo',
};

const reglasPlenas: ReglasEvaluadas = {
  sector: { valor: 1, datoPresente: true },
  ubicacionModalidad: { valor: 1, datoPresente: true },
  salario: { valor: 1, datoPresente: true },
};

describe('ponderar', () => {
  it('W1. todos los datos presentes y valor 1 → puntaje 100 y suma de pesos 100', () => {
    const { puntaje, desglose } = ponderar(reglasPlenas, semanticaPlena);
    expect(puntaje).toBe(100);
    expect(desglose.pesosRedistribuidos).toBe(false);
    const sumaPesos = desglose.criterios.reduce((s, c) => s + c.pesoEfectivo, 0);
    expect(sumaPesos).toBeCloseTo(100, 6);
  });

  it('W2. redistribución al faltar un criterio (salario)', () => {
    const reglas: ReglasEvaluadas = {
      ...reglasPlenas,
      salario: { valor: 0, datoPresente: false },
    };
    const { puntaje, desglose } = ponderar(reglas, semanticaPlena);
    expect(desglose.pesosRedistribuidos).toBe(true);
    // El peso del salario (8) se reparte: la suma de pesos presentes sigue en 100.
    const sumaPresentes = desglose.criterios
      .filter((c) => c.datoPresente)
      .reduce((s, c) => s + c.pesoEfectivo, 0);
    expect(sumaPresentes).toBeCloseTo(100, 6);
    // El criterio salario queda con peso efectivo 0.
    const salario = desglose.criterios.find((c) => c.criterio === 'salario');
    expect(salario?.pesoEfectivo).toBe(0);
    // Con el resto en valor 1, el puntaje sigue siendo 100.
    expect(puntaje).toBe(100);
  });

  it('W3. redistribución al faltar varios criterios', () => {
    const reglas: ReglasEvaluadas = {
      sector: { valor: 0, datoPresente: false },
      ubicacionModalidad: { valor: 0, datoPresente: false },
      salario: { valor: 0, datoPresente: false },
    };
    const { puntaje, desglose } = ponderar(reglas, semanticaPlena);
    expect(desglose.pesosRedistribuidos).toBe(true);
    // Solo habilidades (35) y experiencia (30) tienen dato: se reparten el 100.
    const habilidades = desglose.criterios.find((c) => c.criterio === 'habilidades');
    const experiencia = desglose.criterios.find((c) => c.criterio === 'experiencia');
    expect((habilidades?.pesoEfectivo ?? 0) + (experiencia?.pesoEfectivo ?? 0)).toBeCloseTo(100, 6);
    expect(puntaje).toBe(100);
  });

  it('W4. puntaje acotado a [0,100] y entero', () => {
    const reglasCero: ReglasEvaluadas = {
      sector: { valor: 0, datoPresente: true },
      ubicacionModalidad: { valor: 0, datoPresente: true },
      salario: { valor: 0, datoPresente: true },
    };
    const semanticaCero: SimilitudSemantica = {
      simHabilidades: 0,
      simExperiencia: 0,
      fuente: 'respaldo',
    };
    const { puntaje } = ponderar(reglasCero, semanticaCero);
    expect(puntaje).toBe(0);
    expect(Number.isInteger(puntaje)).toBe(true);
  });

  it('W5. los pesos base suman 100', () => {
    const suma = Object.values(PESOS).reduce((s, p) => s + p, 0);
    expect(suma).toBe(100);
  });
});
