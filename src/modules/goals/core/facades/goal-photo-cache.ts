import { Injectable } from '@angular/core';
import { finalize, map, Observable, of, shareReplay } from 'rxjs';

import type { GoalPhotoVariant } from '~/modules/goals/core/types/goal';

export const GOAL_PHOTO_CACHE_LIMIT = 24;

interface Entry {
  readonly url: string;
  refs: number;
  stale: boolean;
}

export function photoKey(goalId: string, photoId: string, variant: GoalPhotoVariant): string {
  return `${goalId}/${photoId}/${variant}`;
}

@Injectable({ providedIn: 'root' })
export class GoalPhotoCache {
  private readonly entries = new Map<string, Entry>();
  private readonly inflight = new Map<string, Observable<string>>();
  private generation = 0;

  get size(): number {
    return this.entries.size;
  }

  fetch(key: string, loader: () => Observable<Blob>): Observable<string> {
    const hit = this.entries.get(key);
    if (hit) {
      this.entries.delete(key);
      this.entries.set(key, hit);
      return of(hit.url);
    }
    const running = this.inflight.get(key);
    if (running) return running;
    const generation = this.generation;
    const request = loader().pipe(
      map((blob) => {
        const url = URL.createObjectURL(blob);
        if (generation !== this.generation) {
          URL.revokeObjectURL(url);
          return url;
        }
        this.entries.set(key, { url, refs: 0, stale: false });
        this.evict();
        return url;
      }),
      finalize(() => this.inflight.delete(key)),
      shareReplay({ bufferSize: 1, refCount: true }),
    );
    this.inflight.set(key, request);
    return request;
  }

  hold(key: string): void {
    const entry = this.entries.get(key);
    if (entry) entry.refs++;
  }

  release(key: string): void {
    const entry = this.entries.get(key);
    if (!entry) return;
    entry.refs = Math.max(0, entry.refs - 1);
    if (entry.refs === 0 && entry.stale) this.drop(key, entry);
    else this.evict();
  }

  forgetPhoto(goalId: string, photoId: string): void {
    for (const variant of ['thumb', 'display'] as const) {
      const key = photoKey(goalId, photoId, variant);
      const entry = this.entries.get(key);
      if (!entry) continue;
      if (entry.refs === 0) this.drop(key, entry);
      else entry.stale = true;
    }
  }

  clear(): void {
    this.generation++;
    for (const [key, entry] of [...this.entries]) this.drop(key, entry);
    this.inflight.clear();
  }

  private drop(key: string, entry: Entry): void {
    URL.revokeObjectURL(entry.url);
    this.entries.delete(key);
  }

  private evict(): void {
    if (this.entries.size <= GOAL_PHOTO_CACHE_LIMIT) return;
    for (const [key, entry] of this.entries) {
      if (this.entries.size <= GOAL_PHOTO_CACHE_LIMIT) return;
      if (entry.refs === 0) this.drop(key, entry);
    }
  }
}
