import { HttpErrorResponse } from '@angular/common/http';

import { Problem, toProblem } from '~/util/api/problem';

function readText(blob: Blob): Promise<string> {
  if (typeof blob.text === 'function') return blob.text();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error ?? new Error('blob read failed'));
    reader.readAsText(blob);
  });
}

export async function problemFromBlobError(error: unknown): Promise<Problem> {
  if (!(error instanceof HttpErrorResponse) || !(error.error instanceof Blob)) {
    return toProblem(error);
  }
  let body: unknown;
  try {
    body = JSON.parse(await readText(error.error));
  } catch {
    body = null;
  }
  return toProblem(
    new HttpErrorResponse({
      error: body,
      headers: error.headers,
      status: error.status,
      statusText: error.statusText,
      ...(error.url ? { url: error.url } : {}),
    }),
  );
}
