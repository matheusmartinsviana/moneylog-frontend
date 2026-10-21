import { TestBed } from '@angular/core/testing';

import { ClipboardService } from '~/app/common/services/clipboard.service';

describe('ClipboardService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('Dado clipboard disponível, quando copia, então escreve o texto e devolve true', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({ writeText } as unknown as Clipboard);

    const copied = await TestBed.inject(ClipboardService).copy('valor');

    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith('valor');
  });

  it('Dado que o navegador recusa, então devolve false sem lançar', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('negado'));
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue({ writeText } as unknown as Clipboard);

    expect(await TestBed.inject(ClipboardService).copy('valor')).toBe(false);
  });

  it('Dado que não há clipboard, então devolve false', async () => {
    vi.spyOn(navigator, 'clipboard', 'get').mockReturnValue(undefined as unknown as Clipboard);

    expect(await TestBed.inject(ClipboardService).copy('valor')).toBe(false);
  });
});
