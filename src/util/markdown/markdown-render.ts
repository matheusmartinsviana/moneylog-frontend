import type { MdDocument } from '~/util/markdown/markdown';

export const MARKDOWN_PARSE_TIMEOUT_MS = 1_500;
export const MARKDOWN_BOOT_TIMEOUT_MS = 10_000;
export const MARKDOWN_INLINE_FALLBACK_CHARS = 2_000;

export interface MarkdownWorkerRequest {
  readonly requestId: number;
  readonly text: string;
}

export type MarkdownWorkerMessage =
  | { readonly type: 'ready' }
  | { readonly type: 'result'; readonly requestId: number; readonly document: MdDocument }
  | { readonly type: 'error'; readonly requestId: number };

export interface MarkdownWorkerHandle {
  postMessage(message: MarkdownWorkerRequest): void;
  terminate(): void;
  onmessage: ((event: { readonly data: MarkdownWorkerMessage }) => void) | null;
  onerror: ((event: unknown) => void) | null;
}

export type MarkdownWorkerFactory = () => MarkdownWorkerHandle | null;

export type PlainReason = 'timeout' | 'unavailable' | 'error';

export type RenderOutcome =
  | { readonly kind: 'document'; readonly document: MdDocument }
  | { readonly kind: 'plain'; readonly text: string; readonly reason: PlainReason };

interface Pending {
  readonly requestId: number;
  readonly text: string;
  readonly resolve: (outcome: RenderOutcome | null) => void;
  timer: ReturnType<typeof setTimeout> | null;
}

const EMPTY_DOCUMENT: MdDocument = { blocks: [], truncated: false };

export interface MarkdownRendererOptions {
  readonly factory: MarkdownWorkerFactory;
  readonly timeoutMs?: number;
  readonly bootTimeoutMs?: number;
}

export class MarkdownRenderer {
  private worker: MarkdownWorkerHandle | null = null;
  private ready = false;
  private pending: Pending | null = null;
  private lastRequestId = 0;
  private lastFailure: { text: string; outcome: RenderOutcome } | null = null;
  private destroyed = false;

  private readonly timeoutMs: number;
  private readonly bootTimeoutMs: number;
  private readonly factory: MarkdownWorkerFactory;

  constructor(options: MarkdownRendererOptions) {
    this.factory = options.factory;
    this.timeoutMs = options.timeoutMs ?? MARKDOWN_PARSE_TIMEOUT_MS;
    this.bootTimeoutMs = options.bootTimeoutMs ?? MARKDOWN_BOOT_TIMEOUT_MS;
  }

  render(text: string): Promise<RenderOutcome | null> {
    this.supersede();
    if (this.destroyed) return Promise.resolve(null);
    if (text.trim() === '') return Promise.resolve({ kind: 'document', document: EMPTY_DOCUMENT });
    if (this.lastFailure?.text === text) return Promise.resolve(this.lastFailure.outcome);
    const requestId = ++this.lastRequestId;
    return new Promise<RenderOutcome | null>((resolve) => {
      const worker = this.ensureWorker();
      if (!worker) {
        void this.withoutWorker(text, requestId).then(resolve);
        return;
      }
      const pending: Pending = { requestId, text, resolve, timer: null };
      this.pending = pending;
      pending.timer = setTimeout(
        () => this.fail(pending, 'timeout'),
        this.ready ? this.timeoutMs : this.bootTimeoutMs,
      );
      worker.postMessage({ requestId, text });
    });
  }

  destroy(): void {
    this.destroyed = true;
    this.supersede();
    this.dropWorker();
  }

  private async withoutWorker(text: string, requestId: number): Promise<RenderOutcome | null> {
    if (text.length > MARKDOWN_INLINE_FALLBACK_CHARS) {
      return { kind: 'plain', text, reason: 'unavailable' };
    }
    try {
      const { parseMarkdownDocument } = await import('~/util/markdown/markdown');
      if (requestId !== this.lastRequestId || this.destroyed) return null;
      return { kind: 'document', document: parseMarkdownDocument(text) };
    } catch {
      return { kind: 'plain', text, reason: 'error' };
    }
  }

  private ensureWorker(): MarkdownWorkerHandle | null {
    if (this.worker) return this.worker;
    let worker: MarkdownWorkerHandle | null = null;
    try {
      worker = this.factory();
    } catch {
      worker = null;
    }
    if (!worker) return null;
    this.ready = false;
    worker.onmessage = (event) => this.onMessage(worker, event.data);
    worker.onerror = () => {
      const pending = this.pending;
      if (this.worker === worker && pending) this.fail(pending, 'error');
    };
    this.worker = worker;
    return worker;
  }

  private onMessage(source: MarkdownWorkerHandle, message: MarkdownWorkerMessage): void {
    if (source !== this.worker) return;
    const pending = this.pending;
    if (message.type === 'ready') {
      this.ready = true;
      if (pending) {
        if (pending.timer) clearTimeout(pending.timer);
        pending.timer = setTimeout(() => this.fail(pending, 'timeout'), this.timeoutMs);
      }
      return;
    }
    if (!pending || message.requestId !== pending.requestId) return;
    this.pending = null;
    if (pending.timer) clearTimeout(pending.timer);
    if (message.type === 'result') {
      pending.resolve({ kind: 'document', document: message.document });
    } else {
      this.remember(pending.text, 'error');
      pending.resolve({ kind: 'plain', text: pending.text, reason: 'error' });
    }
  }

  private fail(pending: Pending, reason: PlainReason): void {
    if (this.pending !== pending) return;
    this.pending = null;
    if (pending.timer) clearTimeout(pending.timer);
    this.dropWorker();
    this.remember(pending.text, reason);
    pending.resolve({ kind: 'plain', text: pending.text, reason });
  }

  private remember(text: string, reason: PlainReason): void {
    this.lastFailure = { text, outcome: { kind: 'plain', text, reason } };
  }

  private supersede(): void {
    const pending = this.pending;
    if (!pending) return;
    this.pending = null;
    if (pending.timer) clearTimeout(pending.timer);
    pending.resolve(null);
    this.dropWorker();
  }

  private dropWorker(): void {
    const worker = this.worker;
    this.worker = null;
    this.ready = false;
    if (!worker) return;
    worker.onmessage = null;
    worker.onerror = null;
    try {
      worker.terminate();
    } catch {}
  }
}
