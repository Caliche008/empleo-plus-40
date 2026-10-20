import { calcularBrechas } from './brechas.js';
import { proyectarEntrada, type PerfilEntrada, type VacanteEntrada } from './entrada.js';
import { ponderar } from './ponderar.js';
import { evaluarReglas } from './reglas.js';
import { similitudRespaldo } from './semantica.js';

/**
 * GATE de compliance (R2 / §12). Prueba de NO-REGRESIÓN del proyector: parte de
 * un Candidato/Vacante COMPLETOS (con nombre, fechas y año de certificación),
 * construye B = copia de A cambiando SOLO nombre y datos que insinúan edad
 * (desde/hasta de experiencia, año de certificación), y verifica que el match
 * calculado con el RESPALDO determinista (sin red) es idéntico: puntaje, desglose
 * y brechas. Si alguien hiciera que `proyectarEntrada` empezara a copiar esos
 * datos al cálculo, esta prueba fallaría y lo bloquearía.
 */

/** Forma amplia (tipo Prisma) con los campos sensibles que NO deben influir. */
interface PerfilCompleto extends PerfilEntrada {
  nombre?: string;
  experiencias: {
    cargo: string;
    descripcion: string;
    logros: string[];
    desde?: string;
    hasta?: string;
  }[];
  certificaciones?: { nombre: string; anio?: string }[];
}

const PERFIL_A: PerfilCompleto = {
  nombre: 'Ana Pérez',
  habilidades: [{ nombre: 'TypeScript' }, { nombre: 'NestJS' }, { nombre: 'PostgreSQL' }],
  experiencias: [
    {
      cargo: 'Desarrolladora backend',
      descripcion: 'Construcción de APIs REST en Node y TypeScript',
      logros: ['Lideré la migración a la nube'],
      desde: '1990',
      hasta: '2000',
    },
  ],
  objetivo: {
    sector: 'Tecnología',
    ubicacion: 'Bogotá',
    salarioMin: 3000000,
    modalidad: 'remoto',
  },
  certificaciones: [{ nombre: 'AWS Developer', anio: '1998' }],
};

/** B: mismo perfil, cambiando SOLO nombre y datos que insinúan edad. */
const PERFIL_B: PerfilCompleto = {
  ...PERFIL_A,
  nombre: 'Carlos Gómez',
  experiencias: [
    {
      ...PERFIL_A.experiencias[0],
      // Fechas distintas (insinúan otra edad): no deben influir.
      desde: '2015',
      hasta: '2024',
    },
  ],
  certificaciones: [{ nombre: 'AWS Developer', anio: '2023' }],
};

const VACANTE: VacanteEntrada = {
  cargo: 'Desarrollador backend',
  obligatorios: ['TypeScript', 'APIs REST'],
  deseables: ['Docker'],
  habilidades: ['TypeScript', 'NestJS'],
  experienciaPedida: 'APIs en Node',
  ubicacion: 'Bogotá',
  modalidad: 'remoto',
  salario: '3.000.000',
};

/** Calcula el match completo con el respaldo determinista (sin red). */
function calcularConRespaldo(perfil: PerfilEntrada, vacante: VacanteEntrada) {
  const entrada = proyectarEntrada(perfil, vacante);
  const reglas = evaluarReglas(entrada);
  const semantica = similitudRespaldo(entrada);
  const { puntaje, desglose } = ponderar(reglas, semantica);
  const { cubiertos, brechas } = calcularBrechas(entrada);
  return { puntaje, desglose, cubiertos, brechas };
}

describe('Prueba de sesgo (gate R2)', () => {
  it('cambiar nombre, fechas y año de certificación NO cambia el puntaje ni el desglose', () => {
    const a = calcularConRespaldo(PERFIL_A, VACANTE);
    const b = calcularConRespaldo(PERFIL_B, VACANTE);

    expect(b.puntaje).toBe(a.puntaje);
    expect(b.desglose).toEqual(a.desglose);
    expect(b.cubiertos).toEqual(a.cubiertos);
    expect(b.brechas).toEqual(a.brechas);
  });
});
