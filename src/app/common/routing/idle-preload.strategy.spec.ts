import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { IdlePreloadStrategy } from './idle-preload.strategy';

describe('IdlePreloadStrategy', () => {
  afterEach(() => vi.useRealTimers());

  it('Dado uma rota lazy, quando o navegador fica ocioso, então carrega o chunk', () => {
    vi.useFakeTimers();
    const strategy = TestBed.inject(IdlePreloadStrategy);
    const load = vi.fn(() => of('chunk'));
    const received: unknown[] = [];
    strategy.preload({ path: 'x' }, load).subscribe((value) => received.push(value));
    expect(load).not.toHaveBeenCalled();
    vi.advanceTimersByTime(3500);
    expect(load).toHaveBeenCalledTimes(1);
    expect(received).toEqual(['chunk']);
  });

  it('Dado uma rota com preload desligado, quando preparo, então não carrega', () => {
    vi.useFakeTimers();
    const strategy = TestBed.inject(IdlePreloadStrategy);
    const load = vi.fn(() => of('chunk'));
    strategy.preload({ path: 'x', data: { preload: false } }, load).subscribe();
    vi.advanceTimersByTime(5000);
    expect(load).not.toHaveBeenCalled();
  });
});
