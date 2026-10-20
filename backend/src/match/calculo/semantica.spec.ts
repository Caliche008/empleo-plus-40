import type { EntradaMatch } from '../tipos.js';
import { similitudRespaldo, similitudSolapamiento } from './semantica.js';

describe('similitudSolapamiento (Jaccard)', () => {
  it('S1. términos idénticos → 1', () => {
    expect(similitudSolapamiento('Python y SQL', 'python sql')).toBe(1);
  });

  it('S2. disjuntos → 0', () => {
    expect(similitudSolapamiento('Java', 'Python')).toBe(0);
  });

  it('S3. solapamiento parcial → entre 0 y 1', () => {
    const r = similitudSolapamiento('Python SQL', 'Python Go');
    expect(r).toBeGreaterThan(0);
    expect(r).toBeLessThan(1);
  });

  it('S4. ambos vacíos → 0', () => {
    expect(similitudSolapamiento('', '')).toBe(0);
  });
});

describe('similitudRespaldo', () => {
  it('S5. produce dos similitudes y marca fuente respaldo', () => {
    const entrada: EntradaMatch = {
      perfil: {
        habilidades: ['Python', 'SQL'],
        experiencia: ['Lideré migración a la nube reduciendo costos'],
      },
      vacante: {
        obligatorios: ['migración a la nube'],
        deseables: [],
        habilidades: ['Python', 'SQL'],
        cargo: 'Ingeniero',
      },
    };
    const r = similitudRespaldo(entrada);
    expect(r.fuente).toBe('respaldo');
    expect(r.simHabilidades).toBe(1);
    // El texto de experiencia incluye logros ("migración a la nube"), que
    // solapan con el obligatorio: la señal entra sin filtrar fechas (NIT-9).
    expect(r.simExperiencia).toBeGreaterThan(0);
  });
});
