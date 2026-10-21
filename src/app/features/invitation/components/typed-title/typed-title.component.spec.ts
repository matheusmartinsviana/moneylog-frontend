import { render, screen } from '@testing-library/angular';

import {
  CURSOR_LINGER_MS,
  TypedTitleComponent,
} from '~/app/features/invitation/components/typed-title/typed-title.component';
import {
  buildTypingDelays,
  seededRandom,
  TYPING_RANDOM,
} from '~/app/features/invitation/components/typed-title/typing-schedule';

const TEXT = 'Você foi convidado por Ana';
const HESITATE_AT = 22;

function totalMs(): number {
  return buildTypingDelays(TEXT, seededRandom(11), HESITATE_AT).reduce((a, b) => a + b, 0);
}

async function setup(text = TEXT, hesitateAt: number | null = HESITATE_AT) {
  return render(TypedTitleComponent, {
    inputs: { text, hesitateAt },
    providers: [{ provide: TYPING_RANDOM, useValue: seededRandom(11) }],
  });
}

function typedText(): string {
  return screen.getByTestId('typed-title-typed').textContent ?? '';
}

describe('TypedTitleComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    document.documentElement.removeAttribute('data-motion');
  });
  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.setAttribute('data-motion', 'off');
  });

  it('Dado o título, então o texto completo está disponível para leitor de tela e a parte animada fica oculta dele', async () => {
    await setup();

    expect(screen.getByTestId('typed-title-full')).toHaveTextContent(TEXT);
    expect(screen.getByTestId('typed-title-full')).toHaveClass('visually-hidden');
    expect(screen.getByTestId('typed-title-visual')).toHaveAttribute('aria-hidden', 'true');
  });

  it('Dado a digitação, então as letras aparecem em ordem e o resto fica reservado no layout', async () => {
    const { fixture } = await setup();
    expect(typedText()).toBe('');
    expect(screen.getByTestId('typed-title-rest')).toHaveTextContent(TEXT);

    await vi.advanceTimersByTimeAsync(450);
    fixture.detectChanges();
    expect(typedText()).toBe('V');

    await vi.advanceTimersByTimeAsync(600);
    fixture.detectChanges();
    const partial = typedText();
    expect(partial.length).toBeGreaterThan(1);
    expect(partial.length).toBeLessThan(TEXT.length);
    expect(TEXT.startsWith(partial)).toBe(true);
    expect(partial + (screen.getByTestId('typed-title-rest').textContent ?? '')).toBe(TEXT);
  });

  it('Dado o fim da digitação, então mostra tudo, o cursor continua um pouco e some', async () => {
    const { fixture } = await setup();

    await vi.advanceTimersByTimeAsync(totalMs() + 10);
    fixture.detectChanges();
    expect(typedText()).toBe(TEXT);
    expect(screen.getByTestId('typed-title-rest').textContent).toBe('');
    expect(screen.getByTestId('typed-title-cursor')).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(CURSOR_LINGER_MS + 10);
    fixture.detectChanges();
    expect(screen.queryByTestId('typed-title-cursor')).not.toBeInTheDocument();
  });

  it('Dado a hesitação antes do apelido, então a digitação para antes dele e retoma depois', async () => {
    const { fixture } = await setup();
    const delays = buildTypingDelays(TEXT, seededRandom(11), HESITATE_AT);
    const beforeName = delays.slice(0, HESITATE_AT).reduce((a, b) => a + b, 0);

    await vi.advanceTimersByTimeAsync(beforeName + delays[HESITATE_AT]! - 1);
    fixture.detectChanges();
    expect(typedText()).toBe(TEXT.slice(0, HESITATE_AT));

    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();
    expect(typedText()).toBe(TEXT.slice(0, HESITATE_AT + 1));
  });

  it('Dado movimento reduzido, então o texto completo aparece na hora, sem cursor nem timers', async () => {
    document.documentElement.setAttribute('data-motion', 'off');
    await setup();

    expect(typedText()).toBe(TEXT);
    expect(screen.queryByTestId('typed-title-cursor')).not.toBeInTheDocument();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('Dado a destruição do componente no meio da digitação, então os timers são limpos', async () => {
    const { fixture } = await setup();
    await vi.advanceTimersByTimeAsync(500);

    fixture.destroy();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('Dado a digitação em curso, então digitar em outro lugar não reinicia nem repete a animação', async () => {
    const { fixture } = await setup();
    await vi.advanceTimersByTimeAsync(1000);
    const before = typedText();

    fixture.detectChanges();
    fixture.detectChanges();

    expect(typedText()).toBe(before);
  });
});
