import { DatosInvalidosError } from '../errores.js';
import { actualizarPerfilSchema } from './actualizar-perfil.dto.js';
import { crearPerfilSchema } from './crear-perfil.dto.js';
import { validarCon } from './validar.js';

/** Cuerpo mínimo válido de creación. */
function bodyValido() {
  return {
    consentimiento: true,
    objetivo: { rol: 'Auxiliar' },
  };
}

describe('crearPerfilSchema vía validarCon', () => {
  it('D1a. body válido parsea y aplica valores por defecto', () => {
    const dto = validarCon(crearPerfilSchema, bodyValido());
    expect(dto.pais).toBe('CO');
    expect(dto.mostrarFechasAntiguas).toBe(false);
    expect(dto.habilidades).toEqual([]);
  });

  it('D1b. modalidad fuera del enum lanza DatosInvalidosError con mensaje claro', () => {
    const body = { consentimiento: true, objetivo: { rol: 'Auxiliar', modalidad: 'teletrabajo' } };
    try {
      validarCon(crearPerfilSchema, body);
      expect.fail('debía rechazar la modalidad inválida');
    } catch (e) {
      expect(e).toBeInstanceOf(DatosInvalidosError);
      expect((e as Error).message).toMatch(/modalidad/);
    }
  });

  it('D2. salarioMin ausente es válido (R5); negativo es inválido', () => {
    expect(() => validarCon(crearPerfilSchema, bodyValido())).not.toThrow();

    const body = { consentimiento: true, objetivo: { rol: 'Auxiliar', salarioMin: -5 } };
    expect(() => validarCon(crearPerfilSchema, body)).toThrow(DatosInvalidosError);
  });

  it('D3. campo desconocido (edad / fechaNacimiento) se rechaza por strict', () => {
    const nivelSuperior = { ...bodyValido(), edad: 47 };
    expect(() => validarCon(crearPerfilSchema, nivelSuperior)).toThrow(DatosInvalidosError);

    const enObjetivo = { consentimiento: true, objetivo: { rol: 'Auxiliar', fechaNacimiento: '1980' } };
    expect(() => validarCon(crearPerfilSchema, enObjetivo)).toThrow(DatosInvalidosError);
  });

  it('D4a. consentimiento ausente o no booleano es inválido', () => {
    expect(() => validarCon(crearPerfilSchema, { objetivo: { rol: 'Auxiliar' } })).toThrow(
      DatosInvalidosError,
    );
    expect(() =>
      validarCon(crearPerfilSchema, { consentimiento: 'si', objetivo: { rol: 'Auxiliar' } }),
    ).toThrow(DatosInvalidosError);
  });
});

describe('actualizarPerfilSchema vía validarCon', () => {
  it('D4b. acepta un parche parcial válido', () => {
    const dto = validarCon(actualizarPerfilSchema, { nombre: 'Nuevo', objetivo: { rol: 'Vendedor' } });
    expect(dto.nombre).toBe('Nuevo');
    expect(dto.objetivo?.rol).toBe('Vendedor');
  });

  it('D4c. rechaza campos desconocidos', () => {
    expect(() => validarCon(actualizarPerfilSchema, { edad: 30 })).toThrow(DatosInvalidosError);
  });
});
