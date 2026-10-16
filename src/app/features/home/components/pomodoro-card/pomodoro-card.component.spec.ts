import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { GREETING_HOUR } from '~/app/common/components/workspace-header/workspace-header.component';
import {
  PomodoroCardComponent,
  POMODORO_STORAGE_KEY,
} from '~/app/features/home/components/pomodoro-card/pomodoro-card.component';
import { provideI18nTesting } from '~/testing/i18n-testing';

async function setup(hour = 9) {
  return render(PomodoroCardComponent, {
    inputs: { displayName: 'Ana' },
    providers: [provideI18nTesting('pt'), { provide: GREETING_HOUR, useValue: () => hour }],
  });
}

describe('PomodoroCardComponent', () => {
  beforeEach(() => localStorage.removeItem(POMODORO_STORAGE_KEY));

  it('Dado a manhã, quando renderiza, então saúda pelo nome e mostra 25:00 legível', async () => {
    await setup(9);

    expect(screen.getByTestId('home-pomodoro-greeting')).toHaveTextContent('Bom dia, Ana');
    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', '25 minutos e 0 segundos');
  });

  it('Dado o foco rodando, quando passa um segundo, então o visor desce', async () => {
    vi.useFakeTimers();
    try {
      const { fixture } = await setup();
      screen.getByTestId('home-pomodoro-toggle').click();

      vi.advanceTimersByTime(1100);
      fixture.detectChanges();

      expect(screen.getByRole('timer')).toHaveAttribute('aria-label', '24 minutos e 59 segundos');
      screen.getByTestId('home-pomodoro-toggle').click();
    } finally {
      vi.useRealTimers();
    }
  });

  it('Dado a pausa curta escolhida, quando persiste, então guarda o modo e mostra 05:00', async () => {
    await setup();

    await userEvent.click(screen.getByTestId('home-pomodoro-mode-shortBreak'));

    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', '5 minutos e 0 segundos');
    expect(JSON.parse(localStorage.getItem(POMODORO_STORAGE_KEY) ?? '{}').mode).toBe('shortBreak');
  });

  it('Dado um fim previsto futuro salvo, quando recarrega, então retoma a contagem', async () => {
    localStorage.setItem(
      POMODORO_STORAGE_KEY,
      JSON.stringify({ mode: 'focus', endAt: Date.now() + 90_000, day: '', cycles: 0 }),
    );

    const { fixture } = await setup();

    expect(screen.getByRole('timer')).toHaveAttribute('aria-label', '1 minuto e 30 segundos');
    fixture.destroy();
  });

  it('Dado o card, então tem o botão discreto que abre o modo foco', async () => {
    await setup();

    expect(screen.getByRole('button', { name: 'Modo foco' })).toHaveAttribute(
      'data-cy',
      'home-pomodoro-focus-open',
    );
  });
});
