import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { GREETING_HOUR } from '~/app/common/components/workspace-header/workspace-header.component';
import { PomodoroCardComponent } from '~/app/features/home/components/pomodoro-card/pomodoro-card.component';
import { POMODORO_STORAGE_KEY } from '~/app/features/home/components/pomodoro-card/pomodoro.service';
import { provideI18nTesting } from '~/testing/i18n-testing';

async function setup() {
  return render(PomodoroCardComponent, {
    inputs: { displayName: 'Ana' },
    providers: [provideI18nTesting('pt'), { provide: GREETING_HOUR, useValue: () => 9 }],
  });
}

describe('PomodoroFocusComponent', () => {
  beforeEach(() => localStorage.removeItem(POMODORO_STORAGE_KEY));

  it('Dado o card, quando abre o modo foco, então mostra o mesmo relógio em um diálogo', async () => {
    await setup();

    await userEvent.click(screen.getByTestId('home-pomodoro-focus-open'));

    expect(screen.getByRole('dialog', { name: 'Foco' })).toBeInTheDocument();
    expect(screen.getByTestId('pomodoro-focus-timer')).toHaveAttribute(
      'aria-label',
      '25 minutos e 0 segundos',
    );
  });

  it('Dado o modo foco aberto, quando inicia e fecha com Esc, então o timer segue rodando e o foco volta ao botão', async () => {
    await setup();
    const opener = screen.getByTestId('home-pomodoro-focus-open');
    await userEvent.click(opener);

    await userEvent.click(screen.getByTestId('pomodoro-focus-toggle'));
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByTestId('home-pomodoro-toggle')).toHaveTextContent('Pausar');
    expect(JSON.parse(localStorage.getItem(POMODORO_STORAGE_KEY) ?? '{}').endAt).toEqual(
      expect.any(Number),
    );
    expect(opener).toHaveFocus();
    screen.getByTestId('home-pomodoro-toggle').click();
  });

  it('Dado o modo foco, quando escolhe a pausa curta, então o card também mostra 05:00', async () => {
    await setup();
    await userEvent.click(screen.getByTestId('home-pomodoro-focus-open'));

    await userEvent.click(screen.getByTestId('pomodoro-focus-mode-shortBreak'));
    await userEvent.keyboard('{Escape}');

    expect(screen.getByTestId('home-pomodoro-timer')).toHaveAttribute(
      'aria-label',
      '5 minutos e 0 segundos',
    );
  });

  it('Dado sem Fullscreen API, quando abre, então não mostra o botão de tela cheia', async () => {
    const original = document.documentElement.requestFullscreen;
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      value: undefined,
      configurable: true,
    });
    try {
      await setup();
      await userEvent.click(screen.getByTestId('home-pomodoro-focus-open'));

      expect(screen.queryByTestId('pomodoro-focus-fullscreen')).not.toBeInTheDocument();
    } finally {
      Object.defineProperty(document.documentElement, 'requestFullscreen', {
        value: original,
        configurable: true,
      });
    }
  });

  it('Dado a tela cheia disponível, quando o clique falha, então não quebra', async () => {
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      value: () => Promise.reject(new Error('negado')),
      configurable: true,
    });
    await setup();
    await userEvent.click(screen.getByTestId('home-pomodoro-focus-open'));

    await userEvent.click(screen.getByTestId('pomodoro-focus-fullscreen'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
