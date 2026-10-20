import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { IaService } from './../src/ia/ia.service.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

/**
 * E2E del flujo perfil+vacante → match. Levanta AppModule con IaService y
 * PrismaService DOBLES (overrideProvider) para no tocar red ni Neon: el perfil y
 * la vacante vienen del doble de Prisma; la IA devuelve una explicación válida y
 * no soporta embeddings (el match cae al respaldo determinista). Se verifica el
 * contrato de POST /match y GET /match/:id.
 */

/** Perfil y vacante que devuelve el Prisma doble al leerlos. */
const PERFIL = {
  id: 'cand-e2e',
  habilidades: [{ nombre: 'TypeScript' }, { nombre: 'NestJS' }],
  experiencias: [
    { cargo: 'Desarrollador backend', descripcion: 'APIs en Node', logros: ['Lideré migración'] },
  ],
  objetivo: { sector: 'Tecnología', ubicacion: 'Bogotá', salarioMin: 3000000, modalidad: 'remoto' },
};

const VACANTE = {
  id: 'vac-e2e',
  cargo: 'Desarrollador backend',
  obligatorios: ['TypeScript'],
  deseables: ['Docker'],
  habilidades: ['TypeScript', 'NestJS'],
  experienciaPedida: 'APIs en Node',
  ubicacion: 'Bogotá',
  modalidad: 'remoto',
  salario: '3.000.000',
  alertas: [],
};

/** IaService doble: explica con JSON válido; sin embeddings (fuerza respaldo). */
const iaFalso = {
  completarJson: vi.fn().mockResolvedValue({
    resumen: 'Buena compatibilidad.',
    porCriterio: [{ criterio: 'habilidades', comentario: 'Coinciden varias habilidades.' }],
    brechas: [{ requisito: 'Docker', sugerencia: 'Haz un curso de Docker.' }],
  }),
  generarEmbedding: vi.fn().mockRejectedValue(new Error('sin embeddings en test')),
};

describe('MatchController (e2e)', () => {
  let app: INestApplication<App>;
  const guardados = new Map<string, Record<string, unknown>>();

  /** Prisma doble: lee candidato/vacante fijos y guarda matches en memoria. */
  const prismaFalso = {
    candidato: { findUnique: vi.fn().mockResolvedValue(PERFIL) },
    vacante: { findUnique: vi.fn().mockResolvedValue(VACANTE) },
    match: {
      create: vi.fn((args: { data: Record<string, unknown> }) => {
        const id = 'match-e2e';
        const registro = { id, creadoEn: new Date(), ...args.data };
        guardados.set(id, registro);
        return Promise.resolve(registro);
      }),
      findUnique: vi.fn((args: { where: { id: string } }) =>
        Promise.resolve(guardados.get(args.where.id) ?? null),
      ),
    },
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaFalso)
      .overrideProvider(IaService)
      .useValue(iaFalso)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    guardados.clear();
    await app.close();
  });

  it('POST /match → 201 con puntaje 0-100, desglose y recomendación', async () => {
    const res = await request(app.getHttpServer())
      .post('/match')
      .send({ candidatoId: 'cand-e2e', vacanteId: 'vac-e2e' })
      .expect(201);

    expect(res.body.puntaje).toBeGreaterThanOrEqual(0);
    expect(res.body.puntaje).toBeLessThanOrEqual(100);
    expect(res.body.desglose).toBeDefined();
    expect(res.body.desglose.fuenteSemantica).toBe('respaldo');
    expect(typeof res.body.recomendacion).toBe('string');
    expect(res.body.explicacionDetallada.resumen).toBe('Buena compatibilidad.');
  });

  it('GET /match/:id → 200 con el match tras crearlo', async () => {
    await request(app.getHttpServer())
      .post('/match')
      .send({ candidatoId: 'cand-e2e', vacanteId: 'vac-e2e' })
      .expect(201);

    const res = await request(app.getHttpServer()).get('/match/match-e2e').expect(200);

    expect(res.body.id).toBe('match-e2e');
    expect(typeof res.body.puntaje).toBe('number');
  });

  it('POST /match con cuerpo inválido → 400', async () => {
    await request(app.getHttpServer()).post('/match').send({ candidatoId: '' }).expect(400);
  });
});
