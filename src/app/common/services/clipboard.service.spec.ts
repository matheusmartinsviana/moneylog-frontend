import { TestBed } from '@angular/core/testing';

import { ClipboardService } from '~/app/common/services/clipboard.service';

describe('ClipboardService', () => {
  const original = Object.getOwnPropertyDescriptor(navigator, 'clipboard');

  function useClipboard(value: unknown): void {
    Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
  }

  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'clipboard', original);
    else Reflect.deleteProperty(navigator, 'clipboard');
  });

  it('Dado clipboard disponível, quando copia, então escreve o texto e devolve true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    useClipboard({ writeText });

    const copied = await TestBed.inject(ClipboardService).copy('valor');

    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith('valor');
  });

  it('Dado que o navegador recusa, então devolve false sem lançar', async () => {
    useClipboard({ writeText: vi.fn().mockRejectedValue(new Error('negado')) });

    expect(await TestBed.inject(ClipboardService).copy('valor')).toBe(false);
  });

  it('Dado que não há clipboard, então devolve false', async () => {
    useClipboard(undefined);

    expect(await TestBed.inject(ClipboardService).copy('valor')).toBe(false);
  });
});
