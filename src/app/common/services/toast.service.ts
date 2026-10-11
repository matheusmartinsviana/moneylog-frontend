import { DestroyRef, inject, Injectable, signal } from '@angular/core';

export type ToastTone = 'info' | 'error';

export interface ToastAction {
  readonly id: string;
  readonly label: string;
  readonly run: () => void;
}

export interface ToastOptions {
  readonly tone?: ToastTone;
  readonly durationMs?: number;
  readonly actions?: readonly ToastAction[];
}

export interface Toast {
  readonly id: number;
  readonly message: string;
  readonly tone: ToastTone;
  readonly actions: readonly ToastAction[];
}

const DEFAULT_DURATION: Readonly<Record<ToastTone, number>> = { info: 5000, error: 8000 };
const ACTION_DURATION = 10_000;
const MAX_VISIBLE = 3;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly items = signal<readonly Toast[]>([]);
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  private nextId = 0;

  readonly toasts = this.items.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.timers.forEach((timer) => clearTimeout(timer)));
  }

  show(message: string, options: ToastOptions = {}): number {
    const tone = options.tone ?? 'info';
    const actions = options.actions ?? [];
    const toast: Toast = { id: ++this.nextId, message, tone, actions };
    const current = this.items();
    const overflow = current.slice(0, Math.max(0, current.length - MAX_VISIBLE + 1));
    overflow.forEach((old) => this.clearTimer(old.id));
    this.items.set([...current.slice(overflow.length), toast]);
    this.timers.set(
      toast.id,
      setTimeout(
        () => this.dismiss(toast.id),
        options.durationMs ?? (actions.length > 0 ? ACTION_DURATION : DEFAULT_DURATION[tone]),
      ),
    );
    return toast.id;
  }

  dismiss(id: number): void {
    this.clearTimer(id);
    this.items.update((list) => list.filter((toast) => toast.id !== id));
  }

  private clearTimer(id: number): void {
    clearTimeout(this.timers.get(id));
    this.timers.delete(id);
  }
}
