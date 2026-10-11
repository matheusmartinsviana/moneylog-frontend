import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';

export const LEDGER_MAX_IN_FLIGHT = 2;

interface Job {
  readonly priority: number;
  readonly order: number;
  readonly start: () => void;
}

export class LedgerGate {
  private active = 0;
  private counter = 0;
  private readonly queue: Job[] = [];

  constructor(readonly maxInFlight: number = LEDGER_MAX_IN_FLIGHT) {}

  get inFlight(): number {
    return this.active;
  }

  get waiting(): number {
    return this.queue.length;
  }

  run<T>(source: Observable<T>, priority = 0): Observable<T> {
    return new Observable<T>((subscriber) => {
      let running = false;
      let released = false;
      const release = (): void => {
        if (!running || released) return;
        released = true;
        this.active--;
        this.drain();
      };
      const job: Job = {
        priority,
        order: this.counter++,
        start: () => {
          running = true;
          this.active++;
          const inner = source.subscribe({
            next: (value) => subscriber.next(value),
            error: (error: unknown) => {
              release();
              subscriber.error(error);
            },
            complete: () => {
              release();
              subscriber.complete();
            },
          });
          subscriber.add(inner);
        },
      };
      this.enqueue(job);
      return () => {
        const index = this.queue.indexOf(job);
        if (index >= 0) this.queue.splice(index, 1);
        release();
      };
    });
  }

  private enqueue(job: Job): void {
    this.queue.push(job);
    this.queue.sort((a, b) => a.priority - b.priority || a.order - b.order);
    this.drain();
  }

  private drain(): void {
    while (this.active < this.maxInFlight && this.queue.length > 0) {
      this.queue.shift()!.start();
    }
  }
}

export const LEDGER_GATE = new InjectionToken<LedgerGate>('LEDGER_GATE');
