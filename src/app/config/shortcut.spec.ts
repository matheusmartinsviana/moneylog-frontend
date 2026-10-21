import { SHORTCUT_INSTALL_URL } from '~/app/config/shortcut';

describe('SHORTCUT_INSTALL_URL', () => {
  it('Dado o link do atalho, então é https no host icloud.com e sem token nem query', () => {
    const url = new URL(SHORTCUT_INSTALL_URL);

    expect(url.protocol).toBe('https:');
    expect(url.hostname).toMatch(/(^|\.)icloud\.com$/);
    expect(url.search).toBe('');
    expect(url.hash).toBe('');
    expect(SHORTCUT_INSTALL_URL).not.toContain('mlq_');
  });
});
