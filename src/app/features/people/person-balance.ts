import type { AppI18n } from '~/app/common/i18n/i18n';
import { interpolate } from '~/app/common/i18n/interpolate';
import type { Person } from '~/modules/people/core/types/person';
import { formatMoney, withoutSign } from '~/util/money';

export function balanceText(
  person: Pick<Person, 'name' | 'net' | 'direction'>,
  copy: AppI18n['people'],
): string {
  return interpolate(copy.balance[person.direction], {
    name: person.name,
    amount: formatMoney(withoutSign(person.net)),
  });
}

export function openDebtsText(count: number, copy: AppI18n['people']): string {
  if (count === 0) return copy.noOpenDebts;
  return interpolate(count === 1 ? copy.openDebtsOne : copy.openDebtsMany, {
    count: String(count),
  });
}
