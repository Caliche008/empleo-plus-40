import type { EntradaMatch } from '../tipos.js';
import {
  coberturaObligatorios,
  valorModalidad,
  valorSalario,
  valorSector,
  valorUbicacion,
  valorUbicacionModalidad,
} from './reglas.js';

/** Construye una `EntradaMatch` mínima con overrides de perfil/vacante. */
function entrada(
  perfil: Partial<EntradaMatch['perfil']> = {},
  vacante: Partial<EntradaMatch['vacante']> = {},
): EntradaMatch {
  return {
    perfil: { habilidades: [], experiencia: [], ...perfil },
    vacante: { obligatorios: [], deseables: [], habilidades: [], cargo: 'Cargo', ...vacante },
  };
}

describe('valorUbicacion', () => {
  it('R1. ubicación igual → 1', () => {
    expect(valorUbicacion('Bogotá', 'Bogota')).toBe(1);
  });

  it('R2. coincidencia parcial → 0.5', () => {
    expect(valorUbicacion('Bogotá Colombia', 'Bogotá')).toBe(0.5);
  });

  it('R3. ubicación distinta → 0', () => {
    expect(valorUbicacion('Medellín', 'Cali')).toBe(0);
  });
});

describe('valorModalidad', () => {
  it('R4. compatible (remoto-remoto) → 1', () => {
    expect(valorModalidad('remoto', 'remoto')).toBe(1);
  });

  it('R5. incompatible (remoto-presencial) → 0', () => {
    expect(valorModalidad('remoto', 'presencial')).toBe(0);
  });
});

describe('valorUbicacionModalidad (ramas §4.2)', () => {
  it('R6. vacante remota → vale la modalidad (ubicación no aplica)', () => {
    const e = entrada(
      { modalidad: 'remoto', ubicacion: 'Medellín' },
      { modalidad: 'remoto', ubicacion: 'Cali' },
    );
    expect(valorUbicacionModalidad(e)).toEqual({ valor: 1, datoPresente: true });
  });

  it('R7. ambos presentes → promedio', () => {
    const e = entrada(
      { modalidad: 'hibrido', ubicacion: 'Bogotá' },
      { modalidad: 'presencial', ubicacion: 'Bogotá' },
    );
    // modalidad hibrido↔presencial = 0.5; ubicación igual = 1; promedio = 0.75.
    expect(valorUbicacionModalidad(e)).toEqual({ valor: 0.75, datoPresente: true });
  });

  it('R8. falta ubicación → vale la modalidad', () => {
    const e = entrada({ modalidad: 'presencial' }, { modalidad: 'presencial' });
    expect(valorUbicacionModalidad(e)).toEqual({ valor: 1, datoPresente: true });
  });

  it('R9. falta modalidad → vale la ubicación', () => {
    const e = entrada({ ubicacion: 'Cali' }, { ubicacion: 'Cali' });
    expect(valorUbicacionModalidad(e)).toEqual({ valor: 1, datoPresente: true });
  });

  it('R10. faltan ambos → dato faltante', () => {
    const e = entrada({}, {});
    expect(valorUbicacionModalidad(e)).toEqual({ valor: 0, datoPresente: false });
  });
});

describe('valorSalario', () => {
  it('R11. ofrecido ≥ pretendido → 1', () => {
    const e = entrada({ salarioMin: 3_000_000 }, { salario: '3.500.000' });
    expect(valorSalario(e)).toEqual({ valor: 1, datoPresente: true });
  });

  it('R12. dentro del margen → degradado lineal (0..1)', () => {
    const e = entrada({ salarioMin: 1_000_000 }, { salario: '900.000' });
    const r = valorSalario(e);
    expect(r.datoPresente).toBe(true);
    expect(r.valor).toBeGreaterThan(0);
    expect(r.valor).toBeLessThan(1);
  });

  it('R13. muy por debajo → 0', () => {
    const e = entrada({ salarioMin: 3_000_000 }, { salario: '1.000.000' });
    expect(valorSalario(e)).toEqual({ valor: 0, datoPresente: true });
  });

  it('R14. sin salario pretendido → dato faltante', () => {
    const e = entrada({}, { salario: '3.000.000' });
    expect(valorSalario(e)).toEqual({ valor: 0, datoPresente: false });
  });

  it('R15. salario de vacante no parseable → dato faltante', () => {
    const e = entrada({ salarioMin: 3_000_000 }, { salario: 'a convenir' });
    expect(valorSalario(e)).toEqual({ valor: 0, datoPresente: false });
  });
});

describe('coberturaObligatorios', () => {
  it('R16. cobertura 0%', () => {
    const e = entrada({ habilidades: ['Java'] }, { obligatorios: ['Python', 'Kubernetes'] });
    expect(coberturaObligatorios(e)).toBe(0);
  });

  it('R17. cobertura parcial', () => {
    const e = entrada({ habilidades: ['Python'] }, { obligatorios: ['Python', 'Kubernetes'] });
    expect(coberturaObligatorios(e)).toBe(0.5);
  });

  it('R18. cobertura 100%', () => {
    const e = entrada(
      { habilidades: ['Python', 'Kubernetes'] },
      { obligatorios: ['Python', 'Kubernetes'] },
    );
    expect(coberturaObligatorios(e)).toBe(1);
  });
});

describe('valorSector', () => {
  it('R19. con sector solapando el cargo → > 0', () => {
    const e = entrada({ sector: 'desarrollo de software' }, { cargo: 'ingeniero de software' });
    expect(valorSector(e).datoPresente).toBe(true);
    expect(valorSector(e).valor).toBeGreaterThan(0);
  });

  it('R20. sin sector declarado → dato faltante', () => {
    const e = entrada({}, { cargo: 'ingeniero de software' });
    expect(valorSector(e)).toEqual({ valor: 0, datoPresente: false });
  });
});
