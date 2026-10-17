import { HttpErrorResponse, HttpHeaders } from '@angular/common/http';

import { problemFromBlobError, readText } from '~/util/api/blob-problem';

const blobError = (status: number, body: string) =>
  new HttpErrorResponse({
    status,
    error: new Blob([body], { type: 'application/problem+json' }),
    headers: new HttpHeaders({ 'X-Trace-Id': 'abc' }),
  });

describe('problemFromBlobError', () => {
  it('Dado um Blob com o Problem em JSON, então lê o code e o trace id', async () => {
    const problem = await problemFromBlobError(
      blobError(400, JSON.stringify({ code: 'VALIDATION_FAILED' })),
    );

    expect(problem).toMatchObject({ status: 400, code: 'VALIDATION_FAILED', traceId: 'abc' });
  });

  it('Dado um Blob que não é JSON, então usa o código padrão do status', async () => {
    const problem = await problemFromBlobError(blobError(500, '<html>erro</html>'));

    expect(problem).toMatchObject({ status: 500, code: 'INTERNAL_ERROR' });
  });

  it('Dado erro de rede, então é NETWORK', async () => {
    const problem = await problemFromBlobError(new HttpErrorResponse({ status: 0 }));

    expect(problem).toMatchObject({ status: 0, code: 'NETWORK' });
  });

  it('Dado algo que não é HttpErrorResponse, então é NETWORK', async () => {
    expect(await problemFromBlobError(new Error('x'))).toMatchObject({ code: 'NETWORK' });
  });

  it('Dado um Blob sem text() e um FileReader que falha sem error, então a leitura rejeita com um Error e vira o código padrão', async () => {
    class FailingReader {
      error: DOMException | null = null;
      onerror: (() => void) | null = null;
      onload: (() => void) | null = null;
      result: string | null = null;
      readAsText(): void {
        this.onerror?.();
      }
    }
    vi.stubGlobal('FileReader', FailingReader);
    const blob = new Blob(['{}']);
    Object.defineProperty(blob, 'text', { value: undefined });
    try {
      const problem = await problemFromBlobError(
        new HttpErrorResponse({ status: 400, error: blob, headers: new HttpHeaders() }),
      );

      expect(problem).toMatchObject({ status: 400, code: 'VALIDATION_FAILED' });
      await expect(readText(blob)).rejects.toBeInstanceOf(Error);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
