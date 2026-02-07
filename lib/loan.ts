export type LoanStatus =
  | 'OFFERED'
  | 'COLLATERAL_LOCKED'
  | 'CREDIT_SENT'
  | 'REPAID'
  | 'DEFAULTED'
  | 'COLLATERAL_CLAIMED';

export type Loan = {
  id: string;
  lenderAddress: string;
  borrowerAddress: string;
  currencyCode: string;
  creditAmount: string;
  collateralXrpDrops: string;
  repayXrpDrops: string;
  dueFinishAfter: number;
  cancelAfter: number;
  escrowOfferSequence?: number;
  escrowTxHash?: string;
  creditTxHash?: string;
  repayTxHash?: string;
  status: LoanStatus;
};

export const loanStorageKey = (id: string) => `loan:${id}`;
