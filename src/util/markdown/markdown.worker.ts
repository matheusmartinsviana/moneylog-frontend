/// <reference lib="webworker" />
import type { MarkdownWorkerRequest } from '~/util/markdown/markdown-render';
import { handleMarkdownRequest } from '~/util/markdown/markdown-worker-handler';

addEventListener('message', (event: MessageEvent<MarkdownWorkerRequest>) => {
  postMessage(handleMarkdownRequest(event.data));
});
postMessage({ type: 'ready' });
