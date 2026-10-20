import { normalizar, STOPWORDS_ES } from './normalizar.js';

describe('normalizar', () => {
  it('N1. quita diacríticos y pasa a minúsculas', () => {
    expect(normalizar('Programación Ágil')).toEqual(['programacion', 'agil']);
  });

  it('N2. separa por no-palabras y descarta vacíos', () => {
    expect(normalizar('Node.js, React/Next')).toEqual(['node', 'js', 'react', 'next']);
  });

  it('N3. descarta stopwords en español', () => {
    expect(normalizar('experto en la gestion de proyectos')).toEqual([
      'experto',
      'gestion',
      'proyectos',
    ]);
  });

  it('N4. texto vacío devuelve lista vacía', () => {
    expect(normalizar('')).toEqual([]);
    expect(normalizar('   ')).toEqual([]);
  });

  it('N5. las stopwords documentadas están presentes', () => {
    for (const palabra of ['de', 'la', 'el', 'y', 'en', 'que']) {
      expect(STOPWORDS_ES.has(palabra)).toBe(true);
    }
  });
});
