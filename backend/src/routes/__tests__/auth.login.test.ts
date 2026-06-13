/**
 * Tests de la ruta POST /api/auth/login: validación Zod, credenciales
 * inválidas, login exitoso vía DB y vía fallback de variables de entorno.
 */

import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

vi.mock('../../utils/audit', () => ({ audit: vi.fn() }));
vi.mock('../../db', () => ({
  default: {
    query: vi.fn(),
  },
}));

import pool from '../../db';
import authRouter from '../auth';

const mockedQuery = vi.mocked(pool.query);

const testApp = express();
testApp.use(express.json());
testApp.use('/api/auth', authRouter);

// Hash real (cost 4 para que el test sea rápido) de la password de prueba
const PASSWORD = 'correct-horse';
let passwordHash: string;

beforeAll(async () => {
  process.env.JWT_SECRET = 'test-secret';
  passwordHash = await bcrypt.hash(PASSWORD, 4);
});

beforeEach(() => {
  vi.clearAllMocks();
  delete process.env.ADMIN_USERNAME;
  delete process.env.ADMIN_PASSWORD_HASH;
});

describe('POST /api/auth/login', () => {
  it('responde 400 si faltan campos (validación Zod)', async () => {
    const res = await request(testApp).post('/api/auth/login').send({ username: 'admin' });
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('errors');
    expect(mockedQuery).not.toHaveBeenCalled();
  });

  it('responde 401 si el usuario no existe', async () => {
    mockedQuery.mockResolvedValueOnce({ rows: [] } as never);
    const res = await request(testApp)
      .post('/api/auth/login')
      .send({ username: 'nadie', password: 'lo-que-sea' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'Credenciales inválidas' });
  });

  it('responde 401 si la contraseña es incorrecta', async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [{ id: 'u1', username: 'admin', password_hash: passwordHash }],
    } as never);
    const res = await request(testApp)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'incorrecta' });
    expect(res.status).toBe(401);
  });

  it('responde 200 con un JWT HS256 válido cuando las credenciales son correctas', async () => {
    mockedQuery.mockResolvedValueOnce({
      rows: [{ id: 'u1', username: 'admin', password_hash: passwordHash }],
    } as never);
    const res = await request(testApp)
      .post('/api/auth/login')
      .send({ username: 'admin', password: PASSWORD });
    expect(res.status).toBe(200);
    expect(res.body.expiresIn).toBe(28800);
    const decoded = jwt.verify(res.body.token, 'test-secret', { algorithms: ['HS256'] });
    expect(decoded).toMatchObject({ sub: 'u1', username: 'admin' });
  });

  it('permite login vía fallback de env cuando no hay fila en admin_users', async () => {
    process.env.ADMIN_USERNAME = 'admin-env';
    process.env.ADMIN_PASSWORD_HASH = passwordHash;
    mockedQuery.mockResolvedValueOnce({ rows: [] } as never);
    const res = await request(testApp)
      .post('/api/auth/login')
      .send({ username: 'admin-env', password: PASSWORD });
    expect(res.status).toBe(200);
    const decoded = jwt.verify(res.body.token, 'test-secret') as { sub: string };
    expect(decoded.sub).toBe('env-admin');
  });
});
