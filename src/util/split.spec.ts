import {
  bpsToPercent,
  draftFromLines,
  type SplitDraft,
  splitProblem,
  toSplitInput,
  percentToBps,
} from '~/util/split';

const owner = (percent: string | null = null, amount: string | null = null) => ({
  personId: null,
  percent,
  amount,
});
const other = (
  personId: string | null,
  percent: string | null = null,
  amount: string | null = null,
) => ({
  personId,
  percent,
  amount,
});

describe('split', () => {
  describe('porcentagem para pontos-base', () => {
    it.each([
      ['50', 5000],
      ['33,33', 3333],
      ['33.3', 3330],
      ['100', 10000],
      ['0,01', 1],
    ])('Dado %s, então %s', (text, bps) => {
      expect(percentToBps(text)).toBe(bps);
    });

    it.each(['', 'abc', '0', '100,01', '1.234', '-5'])('Dado "%s", então é inválido', (text) => {
      expect(percentToBps(text)).toBeNull();
    });

    it('Dado pontos-base, então volta ao texto sem zeros sobrando', () => {
      expect(bpsToPercent(5000)).toBe('50');
      expect(bpsToPercent(3333)).toBe('33.33');
      expect(bpsToPercent(3305)).toBe('33.05');
    });
  });

  describe('validação de formato', () => {
    const base: SplitDraft = {
      mode: 'BPS',
      includeOwner: true,
      owner: owner('50'),
      others: [other('p1', '50')],
    };

    it('Dado a soma em 100%, então não há problema', () => {
      expect(splitProblem(base)).toBeNull();
    });

    it('Dado a soma diferente de 100%, então PERCENT_SUM', () => {
      expect(splitProblem({ ...base, others: [other('p1', '40')] })).toBe('PERCENT_SUM');
    });

    it('Dado pessoa repetida, então PERSON_REPEATED', () => {
      expect(
        splitProblem({
          ...base,
          owner: owner('34'),
          others: [other('p1', '33'), other('p1', '33')],
        }),
      ).toBe('PERSON_REPEATED');
    });

    it('Dado parte sem pessoa, então PERSON_MISSING', () => {
      expect(splitProblem({ ...base, others: [other(null, '50')] })).toBe('PERSON_MISSING');
    });

    it('Dado porcentagem ilegível, então PERCENT_INVALID', () => {
      expect(splitProblem({ ...base, others: [other('p1', 'x')] })).toBe('PERCENT_INVALID');
    });

    it('Dado modo por valor sem valor numa parte, então AMOUNT_MISSING', () => {
      expect(
        splitProblem({
          ...base,
          mode: 'AMOUNT',
          owner: owner(null, '10.00'),
          others: [other('p1')],
        }),
      ).toBe('AMOUNT_MISSING');
    });

    it('Dado divisão igual sem o dono e sem ninguém, então NO_ONE', () => {
      expect(splitProblem({ mode: 'EQUAL', includeOwner: false, owner: owner(), others: [] })).toBe(
        'NO_ONE',
      );
    });
  });

  describe('corpo para a API', () => {
    it('Dado só o dono, então não há rateio', () => {
      expect(
        toSplitInput({ mode: 'BPS', includeOwner: true, owner: owner('100'), others: [] }),
      ).toBeNull();
    });

    it('Dado BPS, então o dono entra com personId nulo e bps inteiro', () => {
      expect(
        toSplitInput({
          mode: 'BPS',
          includeOwner: true,
          owner: owner('70'),
          others: [other('p1', '30')],
        }),
      ).toEqual({
        mode: 'BPS',
        shares: [
          { personId: null, bps: 7000 },
          { personId: 'p1', bps: 3000 },
        ],
      });
    });

    it('Dado EQUAL sem o dono, então só as pessoas, sem bps nem valor', () => {
      expect(
        toSplitInput({
          mode: 'EQUAL',
          includeOwner: false,
          owner: owner(),
          others: [other('p1'), other('p2')],
        }),
      ).toEqual({ mode: 'EQUAL', shares: [{ personId: 'p1' }, { personId: 'p2' }] });
    });

    it('Dado AMOUNT, então envia o valor por parcela de cada um', () => {
      expect(
        toSplitInput({
          mode: 'AMOUNT',
          includeOwner: true,
          owner: owner(null, '60.00'),
          others: [other('p1', null, '40.00')],
        }),
      ).toEqual({
        mode: 'AMOUNT',
        shares: [
          { personId: null, amount: '60.00' },
          { personId: 'p1', amount: '40.00' },
        ],
      });
    });
  });

  it('Dado o rateio gravado, então reconstrói o rascunho para editar', () => {
    const draft = draftFromLines('BPS', [
      { personId: null, bps: 7000, amount: null },
      { personId: 'p1', bps: 3000, amount: null },
    ]);

    expect(draft.includeOwner).toBe(true);
    expect(draft.owner.percent).toBe('70');
    expect(draft.others).toEqual([{ personId: 'p1', percent: '30', amount: null }]);
  });
});
