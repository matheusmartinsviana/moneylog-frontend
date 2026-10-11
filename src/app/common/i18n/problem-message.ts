import type { AppI18n } from '~/app/common/i18n/i18n';
import type { Problem } from '~/util/api/problem';

export function problemMessage(problem: Problem, errors: AppI18n['errors']): string {
  const byCode = Object.hasOwn(errors.codes, problem.code) ? errors.codes[problem.code] : undefined;
  if (byCode) return byCode;
  if (problem.status === 0) return errors.network;
  if (problem.status === 400) return errors.validation;
  if (problem.status === 422) return errors.unprocessable;
  return errors.unavailable;
}
