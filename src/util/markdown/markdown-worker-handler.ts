import { parseMarkdownDocument } from '~/util/markdown/markdown';
import type { MarkdownWorkerMessage, MarkdownWorkerRequest } from '~/util/markdown/markdown-render';

export function handleMarkdownRequest(request: MarkdownWorkerRequest): MarkdownWorkerMessage {
  try {
    return {
      type: 'result',
      requestId: request.requestId,
      document: parseMarkdownDocument(request.text),
    };
  } catch {
    return { type: 'error', requestId: request.requestId };
  }
}
