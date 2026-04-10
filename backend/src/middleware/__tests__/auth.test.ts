import { describe, it, expect, vi, beforeAll } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../auth';
import type { Request, Response, NextFunction } from 'express';

const TEST_SECRET = 'test-secret';

beforeAll(() => {
  process.env.JWT_SECRET = TEST_SECRET;
});

function makeRes() {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  return { status, json } as unknown as Response;
}

function makeReq(authHeader?: string): Request {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as unknown as Request;
}

describe('verifyToken middleware', () => {
  it('returns 401 when Authorization header is absent', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    verifyToken(req, res, next);

    expect((res.status as ReturnType<typeof vi.fn>).mock.calls[0][0]).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 { error: "No autorizado" } when Authorization header is absent', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    verifyToken(req, res, next);

    const statusMock = res.status as ReturnType<typeof vi.fn>;
    const jsonMock = statusMock.mock.results[0].value.json as ReturnType<typeof vi.fn>;
    expect(jsonMock.mock.calls[0][0]).toEqual({ error: 'No autorizado' });
  });

  it('returns 401 when Authorization header lacks "Bearer " prefix', () => {
    const token = jwt.sign({ sub: 'admin' }, TEST_SECRET);
    const req = makeReq(token); // no "Bearer " prefix
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    verifyToken(req, res, next);

    const statusMock = res.status as ReturnType<typeof vi.fn>;
    expect(statusMock.mock.calls[0][0]).toBe(401);
    const jsonMock = statusMock.mock.results[0].value.json as ReturnType<typeof vi.fn>;
    expect(jsonMock.mock.calls[0][0]).toEqual({ error: 'No autorizado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 { error: "Sesión expirada" } for an expired token', () => {
    // expiresIn: 0 creates a token that expires immediately (in the past)
    const expiredToken = jwt.sign({ sub: 'admin' }, TEST_SECRET, { expiresIn: -1 });
    const req = makeReq(`Bearer ${expiredToken}`);
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    verifyToken(req, res, next);

    const statusMock = res.status as ReturnType<typeof vi.fn>;
    expect(statusMock.mock.calls[0][0]).toBe(401);
    const jsonMock = statusMock.mock.results[0].value.json as ReturnType<typeof vi.fn>;
    expect(jsonMock.mock.calls[0][0]).toEqual({ error: 'Sesión expirada' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 { error: "No autorizado" } for a token with invalid signature', () => {
    const tokenWithWrongSecret = jwt.sign({ sub: 'admin' }, 'wrong-secret');
    const req = makeReq(`Bearer ${tokenWithWrongSecret}`);
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    verifyToken(req, res, next);

    const statusMock = res.status as ReturnType<typeof vi.fn>;
    expect(statusMock.mock.calls[0][0]).toBe(401);
    const jsonMock = statusMock.mock.results[0].value.json as ReturnType<typeof vi.fn>;
    expect(jsonMock.mock.calls[0][0]).toEqual({ error: 'No autorizado' });
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() for a valid token signed with the correct secret', () => {
    const validToken = jwt.sign({ sub: 'admin' }, TEST_SECRET, { expiresIn: '8h' });
    const req = makeReq(`Bearer ${validToken}`);
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    verifyToken(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect((res.status as ReturnType<typeof vi.fn>)).not.toHaveBeenCalled();
  });
});
