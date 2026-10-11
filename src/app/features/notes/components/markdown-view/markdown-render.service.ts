import { DestroyRef, inject, Injectable, InjectionToken } from '@angular/core';

import {
  MarkdownRenderer,
  type MarkdownWorkerFactory,
  type MarkdownWorkerHandle,
  type RenderOutcome,
} from '~/util/markdown/markdown-render';

export const MARKDOWN_WORKER_FACTORY = new InjectionToken<MarkdownWorkerFactory>(
  'MARKDOWN_WORKER_FACTORY',
  {
    providedIn: 'root',
    factory: () => () => {
      if (typeof Worker === 'undefined') return null;
      return new Worker(new URL('../../../../../util/markdown/markdown.worker', import.meta.url), {
        type: 'module',
        name: 'markdown',
      }) as unknown as MarkdownWorkerHandle;
    },
  },
);

@Injectable()
export class MarkdownRenderService {
  private readonly renderer = new MarkdownRenderer({ factory: inject(MARKDOWN_WORKER_FACTORY) });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.renderer.destroy());
  }

  render(text: string): Promise<RenderOutcome | null> {
    return this.renderer.render(text);
  }
}
