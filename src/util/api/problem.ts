import { HttpErrorResponse } from '@angular/common/http';

export interface FieldProblem {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

export interface Problem {
  readonly status: number;
  readonly code: string;
  readonly fieldErrors: readonly FieldProblem[];
  readonly traceId: string | null;
  readonly retryAfterSeconds: number | null;
  readonly detail?: string | null;
  readonly position?: number | null;
  readonly cause?: string | null;
}

export class ProblemError extends Error {
  constructor(readonly problem: Problem) {
    super(`API ${problem.status} ${problem.code}`);
    this.name = 'ProblemError';
  }
}

export const NETWORK_CODE = 'NETWORK';

const FALLBACK_CODE: Readonly<Record<number, string>> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE',
  429: 'TOO_MANY_ATTEMPTS',
  500: 'INTERNAL_ERROR',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toFieldErrors(value: unknown): readonly FieldProblem[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isRecord).map((item) => ({
    field: typeof item['field'] === 'string' ? item['field'] : '',
    code: typeof item['code'] === 'string' ? item['code'] : 'INVALID',
    message: typeof item['message'] === 'string' ? item['message'] : '',
  }));
}

function toRetryAfter(header: string | null): number | null {
  if (header === null || !/^\d+$/.test(header.trim())) return null;
  return Number.parseInt(header.trim(), 10);
}

export function toProblem(error: unknown): Problem {
  if (!(error instanceof HttpErrorResponse)) {
    return {
      status: 0,
      code: NETWORK_CODE,
      fieldErrors: [],
      traceId: null,
      retryAfterSeconds: null,
    };
  }
  if (error.status === 0) {
    return {
      status: 0,
      code: NETWORK_CODE,
      fieldErrors: [],
      traceId: null,
      retryAfterSeconds: null,
    };
  }
  const body: unknown = error.error;
  const code =
    isRecord(body) && typeof body['code'] === 'string' && body['code'] !== ''
      ? body['code']
      : (FALLBACK_CODE[error.status] ?? `HTTP_${error.status}`);
  const traceId =
    isRecord(body) && typeof body['traceId'] === 'string'
      ? body['traceId']
      : (error.headers?.get('X-Trace-Id') ?? null);
  return {
    status: error.status,
    code,
    fieldErrors: isRecord(body) ? toFieldErrors(body['errors']) : [],
    traceId,
    retryAfterSeconds: toRetryAfter(error.headers?.get('Retry-After') ?? null),
    detail: isRecord(body) && typeof body['detail'] === 'string' ? body['detail'] : null,
    position:
      isRecord(body) && typeof body['position'] === 'number' && Number.isInteger(body['position'])
        ? body['position']
        : null,
    cause: isRecord(body) && typeof body['cause'] === 'string' ? body['cause'] : null,
  };
}

export function problemOf(error: unknown): Problem {
  return error instanceof ProblemError ? error.problem : toProblem(error);
}
