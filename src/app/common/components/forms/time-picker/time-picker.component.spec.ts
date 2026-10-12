import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';

import { TimePickerComponent } from '~/app/common/components/forms/time-picker/time-picker.component';
import { axeViolations, describeViolations } from '~/testing/axe';
import { provideI18nTesting } from '~/testing/i18n-testing';

@Component({
  selector: 'app-time-host',
  imports: [ReactiveFormsModule, TimePickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<app-time-picker
    [formControl]="control()"
    fieldId="hora"
    label="Horário"
    hint="Escolha a hora."
    [mandatory]="mandatory()"
  />`,
})
class TimeHostComponent {
  readonly control = input.required<FormControl<string | null>>();
  readonly mandatory = input(true);
}

async function setup(initial: string | null = '22:00', mandatory = true) {
  const control = new FormControl<string | null>(initial);
  const result = await render(TimeHostComponent, {
    inputs: { control, mandatory },
    providers: [provideI18nTesting()],
  });
  return { ...result, control, trigger: screen.getByTestId('hora') };
}

describe('TimePickerComponent', () => {
  it('Dado o valor HH:mm do modelo, então o botão o mostra e o nome acessível traz o rótulo e o horário', async () => {
    const { trigger } = await setup('08:30');

    expect(trigger).toHaveTextContent('08:30');
    expect(trigger).toHaveAccessibleName('Horário: 08:30');
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
  });

  it('Dado sem valor, então mostra o marcador e o campo obrigatório fica inválido', async () => {
    const { trigger, control } = await setup(null);

    expect(trigger).toHaveTextContent('--:--');
    expect(control.errors).toEqual({ required: true });
  });

  it('Dado valor legado inválido, então é tratado como vazio', async () => {
    const { trigger } = await setup('25:99');

    expect(trigger).toHaveTextContent('--:--');
  });

  it('Dado que abro o seletor, então há uma lista de horas (00 a 23) e uma de minutos de 5 em 5, com o valor atual marcado', async () => {
    const { trigger } = await setup('22:30');

    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const hours = screen.getByTestId('hora-hours');
    const minutes = screen.getByTestId('hora-minutes');
    expect(hours.querySelectorAll('[role="option"]')).toHaveLength(24);
    expect(minutes.querySelectorAll('[role="option"]')).toHaveLength(12);
    expect(screen.getByTestId('hora-hour-22')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('hora-minute-30')).toHaveAttribute('aria-selected', 'true');
  });

  it('Dado que escolho a hora, então o controle recebe a nova hora com os mesmos minutos e o seletor continua aberto', async () => {
    const { trigger, control } = await setup('22:30');

    await userEvent.click(trigger);
    await userEvent.click(screen.getByTestId('hora-hour-07'));

    expect(control.value).toBe('07:30');
    expect(trigger).toHaveTextContent('07:30');
    expect(screen.queryByTestId('hora-hours')).toBeInTheDocument();
  });

  it('Dado que escolho os minutos, então o controle recebe o horário e o seletor fecha', async () => {
    const { trigger, control } = await setup('22:30');

    await userEvent.click(trigger);
    await userEvent.click(screen.getByTestId('hora-minute-45'));

    expect(control.value).toBe('22:45');
    expect(screen.queryByTestId('hora-hours')).not.toBeInTheDocument();
  });

  it('Dado minutos fora do passo de 5 (08:07), então a lista inclui esse valor sem perdê-lo', async () => {
    const { trigger } = await setup('08:07');

    await userEvent.click(trigger);

    expect(screen.getByTestId('hora-minute-07')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByTestId('hora-minutes').querySelectorAll('[role="option"]')).toHaveLength(13);
  });

  it('Dado sem valor e escolho só a hora, então os minutos começam em 00', async () => {
    const { trigger, control } = await setup(null);

    await userEvent.click(trigger);
    await userEvent.click(screen.getByTestId('hora-hour-09'));

    expect(control.value).toBe('09:00');
  });

  it('Dado campo opcional, então "Limpar" aparece e esvazia o valor; obrigatório não tem "Limpar"', async () => {
    const optional = await setup('08:30', false);
    await userEvent.click(optional.trigger);
    await userEvent.click(screen.getByTestId('hora-clear'));

    expect(optional.control.value).toBeNull();
    expect(optional.control.valid).toBe(true);
    expect(optional.trigger).toHaveTextContent('--:--');
  });

  it('Dado campo obrigatório aberto, então não há botão Limpar', async () => {
    const { trigger } = await setup('08:30');

    await userEvent.click(trigger);

    expect(screen.queryByTestId('hora-clear')).not.toBeInTheDocument();
  });

  it('Dado o teclado nas horas, então setas movem o foco, Enter escolhe e Esc fecha devolvendo o foco ao botão', async () => {
    const { trigger, control } = await setup('22:00');

    await userEvent.click(trigger);
    screen.getByTestId('hora-hour-22').focus();
    await userEvent.keyboard('{ArrowUp}');
    expect(screen.getByTestId('hora-hour-21')).toHaveFocus();
    await userEvent.keyboard('{Enter}');
    expect(control.value).toBe('21:00');

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByTestId('hora-hours')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('Dado "Pronto", então fecha e marca o campo como tocado', async () => {
    const { trigger, control } = await setup('22:00');

    await userEvent.click(trigger);
    await userEvent.click(screen.getByTestId('hora-done'));

    expect(screen.queryByTestId('hora-hours')).not.toBeInTheDocument();
    expect(control.touched).toBe(true);
  });

  it('Dado o seletor, então não tem violações de acessibilidade, fechado e aberto', async () => {
    const { container, trigger } = await setup('22:00');
    expect(describeViolations(await axeViolations(container))).toBe('');

    await userEvent.click(trigger);

    expect(describeViolations(await axeViolations(document.body))).toBe('');
  });
});
