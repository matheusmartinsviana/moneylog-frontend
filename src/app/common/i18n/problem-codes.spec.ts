import { problemMessage } from '~/app/common/i18n/problem-message';
import { en } from '~/app/common/i18n/translations/en';
import { es } from '~/app/common/i18n/translations/es';
import { pt } from '~/app/common/i18n/translations/pt';

const CODES_FROM_CONTRACT_2_24_TO_2_32 = [
  'SHARES_INVALID',
  'SHARES_BELOW_RECEIVED',
  'SHARE_PERSON_ARCHIVED',
  'PURCHASE_GROUP_INVALID',
  'PURCHASE_GROUP_MEMBER_INVALID',
  'PURCHASE_GROUP_NOT_FOUND',
  'FX_RATE_REQUIRED',
  'FX_INVALID',
  'TAX_TABLE_UNAVAILABLE',
  'INCOME_PROFILE_INVALID',
  'INCOME_PROFILE_ARCHIVED',
  'INCOME_PROFILE_NOT_FOUND',
  'CARD_CASH_OUT_INVALID',
  'ASSET_INVALID',
  'ASSET_ARCHIVED',
  'ASSET_NOT_FOUND',
  'COMMITMENT_SHARES_INVALID',
  'COMMITMENT_CLAUSES_INVALID',
  'SIMULATION_INVALID',
  'CARD_LAST_DIGITS_INVALID',
  'PURCHASE_LAST_DIGITS_NOT_FROM_CARD',
  'PROVENANCE_INVALID',
  'NOTIFICATION_THRESHOLD_INVALID',
  'PAYROLL_LOAN_INVALID',
  'TRANSACTION_NATURE_INVALID',
] as const;

const CODES_FROM_CONTRACT_2_34 = ['PROFILE_PHOTO_NOT_FOUND'] as const;

describe('Mensagens para os códigos de erro do contrato 2.24 a 2.32', () => {
  for (const [language, dict] of Object.entries({ pt, en, es })) {
    it(`Dado ${language}, então cada código novo tem mensagem própria e não cai no texto genérico`, () => {
      const missing = CODES_FROM_CONTRACT_2_24_TO_2_32.filter(
        (code) => !Object.hasOwn(dict.errors.codes, code),
      );

      expect(missing).toEqual([]);
    });
  }

  for (const [language, dict] of Object.entries({ pt, en, es })) {
    it(`Dado ${language}, então os códigos da foto de perfil têm mensagem própria`, () => {
      const codes = [
        ...CODES_FROM_CONTRACT_2_34,
        'GOAL_PHOTO_UNSUPPORTED_TYPE',
        'GOAL_PHOTO_INVALID_IMAGE',
        'GOAL_PHOTO_TOO_LARGE',
        'GOAL_PHOTO_DIMENSIONS_EXCEEDED',
      ];

      expect(codes.filter((code) => !Object.hasOwn(dict.errors.codes, code))).toEqual([]);
    });
  }

  it('Dado um código novo sem tradução, então o texto cai no genérico do status', () => {
    const text = problemMessage(
      {
        status: 422,
        code: 'CODIGO_QUE_NAO_EXISTE',
        fieldErrors: [],
        traceId: null,
        retryAfterSeconds: null,
      },
      pt.errors,
    );

    expect(text).toBe(pt.errors.unprocessable);
  });
});
