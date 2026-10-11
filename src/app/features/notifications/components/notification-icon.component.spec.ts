import { render } from '@testing-library/angular';

import { NotificationIconComponent } from '~/app/features/notifications/components/notification-icon.component';
import type { NotificationKind } from '~/modules/notifications/core/types/notification';

const KINDS: readonly NotificationKind[] = [
  'INVOICE_DUE',
  'DEBT_COLLECT',
  'DEBT_PAYABLE_DUE',
  'RECURRENCE_PENDING',
  'COMMITTED_NEXT_MONTH',
  'DAILY_SUMMARY',
  'REMINDER',
  'GOAL_DEADLINE',
  'GROUPED',
];

describe('NotificationIconComponent', () => {
  it.each(KINDS)(
    'Dado o tipo %s, então mostra um ícone decorativo com tom definido',
    async (kind) => {
      const { container } = await render(NotificationIconComponent, { inputs: { kind } });
      const host = container as HTMLElement;

      expect(host.getAttribute('aria-hidden')).toBe('true');
      expect(host.getAttribute('data-tone')).toMatch(/^(accent|positive|warning|risk|neutral)$/);
      expect(host.querySelector('svg')).not.toBeNull();
    },
  );

  it('Dado dívida a receber, então o tom é positivo', async () => {
    const { container } = await render(NotificationIconComponent, {
      inputs: { kind: 'DEBT_COLLECT' },
    });

    expect(container.getAttribute('data-tone')).toBe('positive');
  });

  it('Dado dívida a pagar, então o tom é risco', async () => {
    const { container } = await render(NotificationIconComponent, {
      inputs: { kind: 'DEBT_PAYABLE_DUE' },
    });

    expect(container.getAttribute('data-tone')).toBe('risk');
  });
});
