import type { Provider } from '@angular/core';

import { MARKDOWN_WORKER_FACTORY } from '~/app/features/notes/components/markdown-view/markdown-render.service';
import {
  type MarkdownWorkerFactory,
  type MarkdownWorkerHandle,
  type MarkdownWorkerRequest,
} from '~/util/markdown/markdown-render';
import { handleMarkdownRequest } from '~/util/markdown/markdown-worker-handler';

export interface FakeMarkdownWorker extends MarkdownWorkerHandle {
  readonly requests: MarkdownWorkerRequest[];
  terminated: boolean;
}

export type FakeBehavior = (request: MarkdownWorkerRequest, worker: FakeMarkdownWorker) => void;

export const respondWithRealParser: FakeBehavior = (request, worker) => {
  worker.onmessage?.({ data: handleMarkdownRequest(request) });
};

export const neverRespond: FakeBehavior = () => undefined;

export function fakeMarkdownWorkerFactory(
  behavior: FakeBehavior = respondWithRealParser,
  created: FakeMarkdownWorker[] = [],
): MarkdownWorkerFactory {
  return () => {
    const worker: FakeMarkdownWorker = {
      requests: [],
      terminated: false,
      onmessage: null,
      onerror: null,
      postMessage(request) {
        worker.requests.push(request);
        queueMicrotask(() => {
          if (!worker.terminated) behavior(request, worker);
        });
      },
      terminate() {
        worker.terminated = true;
      },
    };
    created.push(worker);
    queueMicrotask(() => {
      if (!worker.terminated) worker.onmessage?.({ data: { type: 'ready' } });
    });
    return worker;
  };
}

export function provideFakeMarkdownWorker(
  behavior: FakeBehavior = respondWithRealParser,
  created: FakeMarkdownWorker[] = [],
): Provider {
  return {
    provide: MARKDOWN_WORKER_FACTORY,
    useValue: fakeMarkdownWorkerFactory(behavior, created),
  };
}
