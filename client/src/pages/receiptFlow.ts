export type ReceiptPayer = { id: string; } | null;

export function canReviewReceipt(payer: ReceiptPayer, amount: string, concept: string, date: string) {
  return Boolean(payer && amount.trim() && concept.trim() && date);
}
