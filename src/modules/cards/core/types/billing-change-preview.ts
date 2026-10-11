export interface BillingChangePreview {
  readonly effectiveFromClosingDate: string;
  readonly firstNewInvoice: { readonly closingDate: string; readonly dueDate: string };
  readonly movedInstallments: number;
  readonly movedCredits: number;
  readonly notice: 'FROM_NEXT_INVOICE';
}

export interface BillingDays {
  readonly closingDay: number;
  readonly dueDay: number;
}
