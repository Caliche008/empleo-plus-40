import type { BrechaMatch } from '../tipos.js';
import { decidir, UMBRAL_ALTO, UMBRAL_BAJO } from './recomendacion.js';

const brechaObligatoria: BrechaMatch = { requisito: 'Kubernetes', obligatorio: true };
const brechaDeseable: BrechaMatch = { requisito: 'Go', obligatorio: false };

describe('decidir', () => {
  it('C1. puntaje alto sin brecha obligatoria → postular', () => {
    expect(decidir(UMBRAL_ALTO, [brechaDeseable]).recomendacion).toBe('postular');
  });

  it('C2. puntaje alto con brecha obligatoria → postular-ajustes', () => {
    expect(decidir(90, [brechaObligatoria]).recomendacion).toBe('postular-ajustes');
  });

  it('C3. puntaje bajo → descartar', () => {
    expect(decidir(UMBRAL_BAJO - 1, []).recomendacion).toBe('descartar');
  });

  it('C4. puntaje medio sin brecha obligatoria → postular-ajustes', () => {
    expect(decidir(UMBRAL_BAJO, []).recomendacion).toBe('postular-ajustes');
  });

  it('C5. cada recomendación trae una razón no vacía', () => {
    expect(decidir(90, []).razon.length).toBeGreaterThan(0);
  });
});
