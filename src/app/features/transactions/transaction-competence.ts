import { interpolate } from '~/app/common/i18n/interpolate';
import { formatCompetence, formatIsoDate } from '~/util/date';

export function incomeMonthNote(
  tx: { readonly date: string; readonly incomeCompetence: string | null },
  template: string,
  locale: string,
): string | null {
  const competence = tx.incomeCompetence;
  if (!competence || competence === tx.date.slice(0, 7)) return null;
  return interpolate(template, {
    month: formatCompetence(competence, locale),
    date: formatIsoDate(tx.date, locale),
  });
}
