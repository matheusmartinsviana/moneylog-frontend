import type { components } from '~/util/api/schema.gen';

type Schemas = components['schemas'];

export type ThirdPartyReceivablesResponse = Schemas['ThirdPartyReceivables'];
export type ThirdPartyExpenseResponse = Schemas['ThirdPartyExpense'];
export type ThirdPartyExpenseRequest = Schemas['ThirdPartyExpenseInput'];
export type ThirdPartyReceiptResponse = Schemas['ThirdPartyReceipt'];
export type ThirdPartyReceiptRequest = Schemas['ThirdPartyReceiptInput'];
