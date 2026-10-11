import { TestBed } from '@angular/core/testing';

import { FeedbackToastService } from '~/app/common/services/feedback-toast.service';
import { ToastService } from '~/app/common/services/toast.service';
import { provideI18nTesting } from '~/testing/i18n-testing';

const flush = () => new Promise((resolve) => setTimeout(resolve, 120));

describe('FeedbackToastService', () => {
  let toasts: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideI18nTesting()] });
    toasts = TestBed.inject(ToastService);
    TestBed.inject(FeedbackToastService).start();
  });

  afterEach(() => document.body.replaceChildren());

  function add(html: string): void {
    const host = document.createElement('div');
    host.innerHTML = html;
    document.body.append(host);
  }

  it('Dado um aviso de erro (.banner role=alert), então vira toast de erro e some da tela', async () => {
    add('<p class="banner" role="alert" data-cy="x">Não foi possível salvar.</p>');
    await flush();

    expect(toasts.toasts().map((t) => [t.message, t.tone])).toEqual([
      ['Não foi possível salvar.', 'error'],
    ]);
    expect(document.querySelector('[data-cy="x"]')?.hasAttribute('data-toasted')).toBe(true);
  });

  it('Dado um aviso informativo (role=status), então vira toast neutro', async () => {
    add('<p class="banner" role="status">Configurações salvas.</p>');
    await flush();

    expect(toasts.toasts().map((t) => [t.message, t.tone])).toEqual([
      ['Configurações salvas.', 'info'],
    ]);
  });

  it('Dado uma mensagem marcada com data-toast, então também vira toast', async () => {
    add('<p role="alert" data-toast>E-mail ou senha inválidos.</p>');
    await flush();

    expect(toasts.toasts()[0]?.message).toBe('E-mail ou senha inválidos.');
  });

  it('Dado um aviso com botão de ação, então continua na tela e não vira toast', async () => {
    add('<p class="banner" role="alert">Falhou. <button type="button">Tentar de novo</button></p>');
    await flush();

    expect(toasts.toasts()).toHaveLength(0);
    expect(document.querySelector('.banner')?.hasAttribute('data-toasted')).toBe(false);
  });

  it('Dado o mesmo aviso duas vezes seguidas, então mostra um toast só', async () => {
    add('<p class="banner" role="alert">Falhou.</p><p class="banner" role="alert">Falhou.</p>');
    await flush();

    expect(toasts.toasts()).toHaveLength(1);
  });

  it('Dado o texto de um aviso que muda, então o novo texto vira outro toast', async () => {
    add('<p class="banner" role="alert" id="m">Primeira.</p>');
    await flush();
    const message = document.getElementById('m') as HTMLElement;
    message.textContent = 'Segunda.';
    await flush();

    expect(toasts.toasts().map((t) => t.message)).toEqual(['Primeira.', 'Segunda.']);
  });

  it('Dado o envio de um formulário com campo inválido, então mostra "rótulo: erro" e foca o campo', async () => {
    add(`
      <form>
        <div class="field">
          <label class="field__label" for="nome">Nome</label>
          <input id="nome" aria-invalid="true" aria-describedby="nome-erro" />
          <p class="field-error visually-hidden" id="nome-erro">Informe o nome.</p>
        </div>
      </form>`);
    const form = document.querySelector('form') as HTMLFormElement;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await flush();

    expect(toasts.toasts().map((t) => t.message)).toContain('Nome: Informe o nome.');
    expect(document.activeElement?.id).toBe('nome');
  });

  it('Dado o envio de um formulário válido, então não mostra nada', async () => {
    add('<form><input id="ok" /></form>');
    document.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true }));
    await flush();

    expect(toasts.toasts()).toHaveLength(0);
  });
});
