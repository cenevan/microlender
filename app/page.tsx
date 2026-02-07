'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Xumm } from 'xumm';
import { getClient, minutesFromNowRipple } from '../lib/xrpl';
import type { Loan, LoanStatus } from '../lib/loan';
import { loanStorageKey } from '../lib/loan';

const DEFAULT_CURRENCY = 'CRD';
const DEFAULT_CREDIT_AMOUNT = '100';
const DEFAULT_COLLATERAL_XRP = '5';
const DEFAULT_REPAY_XRP = '5.2';
const DEFAULT_DUE_MINUTES = 10;
const DEFAULT_GRACE_MINUTES = 10;

if (typeof window !== 'undefined' && typeof (window as any).setImmediate === 'undefined') {
  (window as any).setImmediate = (fn: (...args: any[]) => void, ...args: any[]) =>
    window.setTimeout(fn, 0, ...args);
}

const xrpToDrops = (xrp: string) => {
  const value = Number(xrp);
  if (!Number.isFinite(value)) return '0';
  return Math.round(value * 1_000_000).toString();
};

const formatRippleTime = (rippleSeconds: number) => {
  const unixSeconds = rippleSeconds + 946684800;
  return new Date(unixSeconds * 1000).toLocaleString();
};

const statusLabel = (status: LoanStatus) => {
  switch (status) {
    case 'OFFERED':
      return 'Offer created';
    case 'COLLATERAL_LOCKED':
      return 'Collateral locked in escrow';
    case 'CREDIT_SENT':
      return 'Credit issued';
    case 'REPAID':
      return 'Repayment detected';
    case 'DEFAULTED':
      return 'Defaulted';
    case 'COLLATERAL_CLAIMED':
      return 'Collateral claimed';
    default:
      return status;
  }
};

export default function HomePage() {
  const apiKey = process.env.NEXT_PUBLIC_XAMAN_API_KEY || '';
  const xummRef = useRef<Xumm | null>(null);
  const [connectedAccount, setConnectedAccount] = useState<string>('');
  const [pendingRole, setPendingRole] = useState<'lender' | 'borrower' | null>(null);
  const connectRoleRef = useRef<'lender' | 'borrower' | null>(null);
  const [loan, setLoan] = useState<Loan | null>(null);
  const [loanId, setLoanId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [log, setLog] = useState<string[]>([]);

  const [creditAmount, setCreditAmount] = useState(DEFAULT_CREDIT_AMOUNT);
  const [collateralXrp, setCollateralXrp] = useState(DEFAULT_COLLATERAL_XRP);
  const [repayXrp, setRepayXrp] = useState(DEFAULT_REPAY_XRP);
  const [dueMinutes, setDueMinutes] = useState(DEFAULT_DUE_MINUTES.toString());
  const [graceMinutes, setGraceMinutes] = useState(DEFAULT_GRACE_MINUTES.toString());
  const [borrowerInput, setBorrowerInput] = useState('');
  const [lenderInput, setLenderInput] = useState('');

  useEffect(() => {
    if (!apiKey) return;
    if (!xummRef.current) {
      xummRef.current = new Xumm(apiKey);
      xummRef.current.on('logout', () => {
        setConnectedAccount('');
      });
      xummRef.current.on('success', () => {
        void xummRef.current?.user?.account?.then((account) => {
          if (account) {
            setConnectedAccount(account);
            const role = connectRoleRef.current;
            if (role === 'lender') {
              updateLoan((prev) => ({
                ...prev,
                lenderAddress: account
              }));
              setLenderInput(account);
            }
            if (role === 'borrower') {
              updateLoan((prev) => ({
                ...prev,
                borrowerAddress: account
              }));
              setBorrowerInput(account);
            }
            setPendingRole(null);
            connectRoleRef.current = null;
          }
        });
      });
    }
  }, [apiKey, pendingRole]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get('loan');
    if (idFromUrl) {
      loadLoan(idFromUrl);
    }
  }, []);

  useEffect(() => {
    if (!loan?.id) return;
    setLoanId(loan.id);
  }, [loan?.id]);

  useEffect(() => {
    if (!loan?.id) return;
    localStorage.setItem(loanStorageKey(loan.id), JSON.stringify(loan));
  }, [loan]);

  useEffect(() => {
    if (!loan?.lenderAddress || !loan?.borrowerAddress) return;

    let cancelled = false;
    let cleanup: (() => void) | null = null;
    const setup = async () => {
      const client = await getClient();
      if (cancelled) return;

      await client.request({
        command: 'subscribe',
        accounts: [loan.lenderAddress]
      });

      const handler = (event: any) => {
        if (event.validated !== true) return;
        const tx = event.transaction;
        if (!tx) return;
        if (tx.TransactionType !== 'Payment') return;
        if (tx.Account !== loan.borrowerAddress) return;
        if (tx.Destination !== loan.lenderAddress) return;
        if (typeof tx.Amount !== 'string') return;
        if (tx.Amount !== loan.repayXrpDrops) return;

        const hash = tx.hash || event.hash;
        updateLoan((prev) => ({
          ...prev,
          repayTxHash: hash,
          status: 'REPAID'
        }));
        addLog('Repayment detected on XRPL.');
      };

      client.on('transaction', handler);

      cleanup = () => {
        client.off('transaction', handler);
        void client.request({
          command: 'unsubscribe',
          accounts: [loan.lenderAddress]
        });
      };
    };

    void setup();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [loan?.borrowerAddress, loan?.lenderAddress, loan?.repayXrpDrops]);

  const canUseXumm = apiKey.length > 0;

  const addLog = (entry: string) => {
    setLog((prev) => [entry, ...prev].slice(0, 6));
  };

  const ensureLoanForActions = () => {
    if (loan) return loan;
    if (!lenderInput || !borrowerInput) {
      return null;
    }
    const due = minutesFromNowRipple(Number(dueMinutes || DEFAULT_DUE_MINUTES));
    const cancel = minutesFromNowRipple(
      Number(dueMinutes || DEFAULT_DUE_MINUTES) + Number(graceMinutes || DEFAULT_GRACE_MINUTES)
    );
    const id = crypto.randomUUID();
    const created: Loan = {
      id,
      lenderAddress: lenderInput,
      borrowerAddress: borrowerInput,
      currencyCode: DEFAULT_CURRENCY,
      creditAmount: creditAmount,
      collateralXrpDrops: xrpToDrops(collateralXrp),
      repayXrpDrops: xrpToDrops(repayXrp),
      dueFinishAfter: due,
      cancelAfter: cancel,
      status: 'OFFERED'
    };
    setLoan(created);
    setLoanId(id);
    return created;
  };

  const requireSigner = (expected: string, label: string) => {
    if (!expected) {
      setStatusMessage(`Missing ${label} address.`);
      return false;
    }
    if (!connectedAccount) {
      setStatusMessage(`Connect the ${label} wallet first.`);
      return false;
    }
    if (connectedAccount !== expected) {
      setStatusMessage(
        `Wrong wallet connected. Expected ${label} ${expected.slice(0, 6)}…${expected.slice(-4)}.`
      );
      return false;
    }
    return true;
  };

  const updateLoan = (updater: (prev: Loan) => Loan) => {
    setLoan((prev) => (prev ? updater(prev) : prev));
  };

  const loadLoan = (id: string) => {
    const raw = localStorage.getItem(loanStorageKey(id));
    if (!raw) {
      setStatusMessage('Loan not found in localStorage. Ask lender for a fresh link.');
      return;
    }
    const parsed = JSON.parse(raw) as Loan;
    setLoan(parsed);
    setBorrowerInput(parsed.borrowerAddress || '');
    setLenderInput(parsed.lenderAddress || '');
    setStatusMessage('Loaded loan from localStorage.');
  };

  const createLoanOffer = () => {
    if (!lenderInput) {
      setStatusMessage('Connect as lender first or paste a lender address.');
      return;
    }
    const due = minutesFromNowRipple(Number(dueMinutes || DEFAULT_DUE_MINUTES));
    const cancel = minutesFromNowRipple(
      Number(dueMinutes || DEFAULT_DUE_MINUTES) + Number(graceMinutes || DEFAULT_GRACE_MINUTES)
    );
    const id = crypto.randomUUID();
    const newLoan: Loan = {
      id,
      lenderAddress: lenderInput,
      borrowerAddress: borrowerInput,
      currencyCode: DEFAULT_CURRENCY,
      creditAmount: creditAmount,
      collateralXrpDrops: xrpToDrops(collateralXrp),
      repayXrpDrops: xrpToDrops(repayXrp),
      dueFinishAfter: due,
      cancelAfter: cancel,
      status: 'OFFERED'
    };
    setLoan(newLoan);
    setStatusMessage('Loan offer created. Share the link with the borrower.');
    addLog('Loan offer created.');
  };

  const connectWallet = async (role: 'lender' | 'borrower') => {
    if (!canUseXumm) {
      setStatusMessage('Missing NEXT_PUBLIC_XAMAN_API_KEY in .env.local');
      return;
    }
    setPendingRole(role);
    connectRoleRef.current = role;
    try {
      await xummRef.current?.authorize();
    } catch (error) {
      setStatusMessage('Wallet authorization failed.');
    }
  };

  const requestSignature = async (txjson: any, label: string) => {
    if (!xummRef.current) {
      setStatusMessage('Xaman not initialized.');
      return null;
    }

    setStatusMessage(`Awaiting signature: ${label}`);
    setPendingPayload(null);

    const payloadBody = {
      txjson,
      options: {
        force_network: 'TESTNET'
      }
    };

    const payload = await xummRef.current.payload.createAndSubscribe(payloadBody, (event: any) => {
      if (event.data.signed === true) {
        return event.data;
      }
      if (event.data.signed === false) {
        return event.data;
      }
      return null;
    });

    setPendingPayload(payload.created);

    const resolved = await payload.resolved;
    if (!resolved || !resolved.signed) {
      setStatusMessage('Signature declined.');
      return null;
    }

    setPendingPayload(null);
    setStatusMessage(`${label} signed and submitted.`);
    return resolved;
  };

  const signTrustline = async () => {
    const activeLoan = ensureLoanForActions();
    if (!activeLoan?.lenderAddress || !activeLoan?.borrowerAddress) {
      setStatusMessage('Missing lender or borrower address.');
      return;
    }
    if (!requireSigner(activeLoan.borrowerAddress, 'borrower')) return;
    const creditLimit = (Number(activeLoan.creditAmount) * 2).toString();
    const tx = {
      TransactionType: 'TrustSet',
      Account: activeLoan.borrowerAddress,
      LimitAmount: {
        currency: activeLoan.currencyCode,
        issuer: activeLoan.lenderAddress,
        value: creditLimit
      }
    };

    await requestSignature(tx, 'Trustline');
  };

  const signEscrowCreate = async () => {
    const activeLoan = ensureLoanForActions();
    if (!activeLoan?.lenderAddress || !activeLoan?.borrowerAddress) return;
    if (!requireSigner(activeLoan.borrowerAddress, 'borrower')) return;
    const tx = {
      TransactionType: 'EscrowCreate',
      Account: activeLoan.borrowerAddress,
      Amount: activeLoan.collateralXrpDrops,
      Destination: activeLoan.lenderAddress,
      FinishAfter: activeLoan.dueFinishAfter,
      CancelAfter: activeLoan.cancelAfter
    };
    const result = await requestSignature(tx, 'EscrowCreate');
    if (!result?.txid) return;

    const client = await getClient();
    const txInfo = await client.request({
      command: 'tx',
      transaction: result.txid
    });

    const sequence = (txInfo.result as any).Sequence as number | undefined;

    updateLoan((prev) => ({
      ...prev,
      escrowOfferSequence: sequence,
      escrowTxHash: result.txid,
      status: 'COLLATERAL_LOCKED'
    }));

    addLog('Escrow created on XRPL.');
  };

  const signCreditIssue = async () => {
    const activeLoan = ensureLoanForActions();
    if (!activeLoan?.lenderAddress || !activeLoan?.borrowerAddress) return;
    if (!requireSigner(activeLoan.lenderAddress, 'lender')) return;
    const tx = {
      TransactionType: 'Payment',
      Account: activeLoan.lenderAddress,
      Destination: activeLoan.borrowerAddress,
      Amount: {
        currency: activeLoan.currencyCode,
        issuer: activeLoan.lenderAddress,
        value: activeLoan.creditAmount
      }
    };
    const result = await requestSignature(tx, 'Issue CREDIT');
    if (!result?.txid) return;
    updateLoan((prev) => ({
      ...prev,
      creditTxHash: result.txid,
      status: 'CREDIT_SENT'
    }));
    addLog('Credit issued to borrower.');
  };

  const signRepayment = async () => {
    const activeLoan = ensureLoanForActions();
    if (!activeLoan?.lenderAddress || !activeLoan?.borrowerAddress) return;
    if (!requireSigner(activeLoan.borrowerAddress, 'borrower')) return;
    const tx = {
      TransactionType: 'Payment',
      Account: activeLoan.borrowerAddress,
      Destination: activeLoan.lenderAddress,
      Amount: activeLoan.repayXrpDrops
    };
    const result = await requestSignature(tx, 'Repay XRP');
    if (!result?.txid) return;

    updateLoan((prev) => ({
      ...prev,
      repayTxHash: result.txid,
      status: 'REPAID'
    }));
    addLog('Repayment submitted.');
  };

  const signEscrowCancel = async () => {
    if (!loan?.borrowerAddress || !loan?.escrowOfferSequence) {
      setStatusMessage('Missing escrow sequence.');
      return;
    }
    if (!requireSigner(loan.borrowerAddress, 'borrower')) return;
    const tx = {
      TransactionType: 'EscrowCancel',
      Account: loan.borrowerAddress,
      Owner: loan.borrowerAddress,
      OfferSequence: loan.escrowOfferSequence
    };
    await requestSignature(tx, 'EscrowCancel');
    addLog('Escrow cancel submitted.');
  };

  const signEscrowFinish = async () => {
    if (!loan?.lenderAddress || !loan?.borrowerAddress || !loan?.escrowOfferSequence) return;
    if (!requireSigner(loan.lenderAddress, 'lender')) return;
    const tx = {
      TransactionType: 'EscrowFinish',
      Account: loan.lenderAddress,
      Owner: loan.borrowerAddress,
      OfferSequence: loan.escrowOfferSequence
    };
    await requestSignature(tx, 'EscrowFinish');
    updateLoan((prev) => ({
      ...prev,
      status: 'COLLATERAL_CLAIMED'
    }));
    addLog('Collateral claim submitted.');
  };

  const inviteUrl = useMemo(() => {
    if (!loanId) return '';
    const url = new URL(window.location.href);
    url.searchParams.set('loan', loanId);
    return url.toString();
  }, [loanId]);

  return (
    <main>
      <section className="header">
        <div className="badge">XRPL Testnet · Xaman Wallet</div>
        <div className="title">Trustline Credit MVP</div>
        <div className="subtitle">
          Issue on-chain CREDIT tokens, lock collateral in escrow, and detect repayments via XRPL WebSocket.
        </div>
      </section>

      {!canUseXumm && (
        <section className="card">
          <div className="section-title">Setup Required</div>
          <div className="notice">
            Add <span className="code">NEXT_PUBLIC_XAMAN_API_KEY</span> to <span className="code">.env.local</span> then restart.
          </div>
        </section>
      )}

      <section className="grid">
        <div className="card">
          <div className="section-title">Lender Panel</div>
          <div className="notice">
            Connected as:{' '}
            {connectedAccount && connectedAccount === lenderInput
              ? 'Lender'
              : connectedAccount
                ? 'Other wallet'
                : 'Not connected'}
          </div>
          <div className="label">Lender address</div>
          <input
            className="input"
            value={lenderInput}
            onChange={(e) => {
              const value = e.target.value;
              setLenderInput(value);
              updateLoan((prev) => ({ ...prev, lenderAddress: value }));
            }}
            placeholder="r..."
          />
          <div className="row">
            <button
              className="button"
              onClick={() => connectWallet('lender')}
              disabled={Boolean(connectedAccount && connectedAccount !== lenderInput)}
              title={
                connectedAccount && connectedAccount !== lenderInput
                  ? 'Disconnect or use the lender wallet to connect here.'
                  : undefined
              }
            >
              Connect as lender
            </button>
          </div>

          <div className="hr" />

          <div className="label">Borrower address (optional now)</div>
          <input
            className="input"
            value={borrowerInput}
            onChange={(e) => {
              const value = e.target.value;
              setBorrowerInput(value);
              updateLoan((prev) => ({ ...prev, borrowerAddress: value }));
            }}
            placeholder="r..."
          />

          <div className="label">Credit amount (CREDIT)</div>
          <input
            className="input"
            value={creditAmount}
            onChange={(e) => setCreditAmount(e.target.value)}
          />

          <div className="label">Collateral (XRP)</div>
          <input
            className="input"
            value={collateralXrp}
            onChange={(e) => setCollateralXrp(e.target.value)}
          />

          <div className="label">Repay amount (XRP)</div>
          <input
            className="input"
            value={repayXrp}
            onChange={(e) => setRepayXrp(e.target.value)}
          />

          <div className="row">
            <div style={{ flex: 1 }}>
              <div className="label">Due in (minutes)</div>
              <input
                className="input"
                value={dueMinutes}
                onChange={(e) => setDueMinutes(e.target.value)}
              />
            </div>
            <div style={{ flex: 1 }}>
              <div className="label">Grace (minutes)</div>
              <input
                className="input"
                value={graceMinutes}
                onChange={(e) => setGraceMinutes(e.target.value)}
              />
            </div>
          </div>

          <div className="row">
            <button className="button" onClick={createLoanOffer}>
              Create loan offer
            </button>
            {loan?.id && (
              <button
                className="button secondary"
                onClick={async () => {
                  if (!inviteUrl) return;
                  await navigator.clipboard.writeText(inviteUrl);
                  setStatusMessage('Invite link copied.');
                }}
              >
                Copy invite link
              </button>
            )}
          </div>

          <div className="hr" />
          <div className="row">
            <button className="button" onClick={signCreditIssue}>
              Issue CREDIT
            </button>
            <button className="button secondary" onClick={signEscrowFinish}>
              Claim collateral
            </button>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Borrower Panel</div>
          <div className="notice">
            Connected as:{' '}
            {connectedAccount && connectedAccount === borrowerInput
              ? 'Borrower'
              : connectedAccount
                ? 'Other wallet'
                : 'Not connected'}
          </div>
          <div className="label">Borrower address</div>
          <input
            className="input"
            value={borrowerInput}
            onChange={(e) => {
              const value = e.target.value;
              setBorrowerInput(value);
              updateLoan((prev) => ({ ...prev, borrowerAddress: value }));
            }}
            placeholder="r..."
          />
          <div className="row">
            <button
              className="button"
              onClick={() => connectWallet('borrower')}
              disabled={Boolean(connectedAccount && connectedAccount !== borrowerInput)}
              title={
                connectedAccount && connectedAccount !== borrowerInput
                  ? 'Disconnect or use the borrower wallet to connect here.'
                  : undefined
              }
            >
              Connect as borrower
            </button>
          </div>
          <div className="hr" />
          <div className="row">
            <button className="button" onClick={signTrustline}>
              Open trustline
            </button>
            <button className="button secondary" onClick={signEscrowCreate}>
              Lock collateral
            </button>
          </div>
          <div className="row">
            <button className="button" onClick={signRepayment}>
              Repay XRP
            </button>
            <button className="button secondary" onClick={signEscrowCancel}>
              Cancel escrow
            </button>
          </div>
        </div>

        <div className="card">
          <div className="section-title">Loan Status</div>
          {loan ? (
            <div className="kv">
              <span>Status</span>
              <div>{statusLabel(loan.status)}</div>
              <span>Lender</span>
              <div className="code">{loan.lenderAddress || '—'}</div>
              <span>Borrower</span>
              <div className="code">{loan.borrowerAddress || '—'}</div>
              <span>Credit</span>
              <div>{loan.creditAmount} CREDIT</div>
              <span>Collateral</span>
              <div>{loan.collateralXrpDrops} drops</div>
              <span>Repay</span>
              <div>{loan.repayXrpDrops} drops</div>
              <span>FinishAfter</span>
              <div>{formatRippleTime(loan.dueFinishAfter)}</div>
              <span>CancelAfter</span>
              <div>{formatRippleTime(loan.cancelAfter)}</div>
              <span>Escrow Seq</span>
              <div>{loan.escrowOfferSequence ?? '—'}</div>
              <span>Escrow Tx</span>
              <div className="code">{loan.escrowTxHash || '—'}</div>
              <span>Credit Tx</span>
              <div className="code">{loan.creditTxHash || '—'}</div>
              <span>Repay Tx</span>
              <div className="code">{loan.repayTxHash || '—'}</div>
            </div>
          ) : (
            <div className="notice">Create or load a loan to see status.</div>
          )}
        </div>

        <div className="card">
          <div className="section-title">Signature Request</div>
          {pendingPayload ? (
            <div className="row">
              <img className="qr" src={pendingPayload.refs.qr_png} alt="Xaman QR" />
              <div>
                <div className="notice">Scan to sign with Xaman.</div>
                <a className="button secondary" href={pendingPayload.next.always} target="_blank">
                  Open in Xaman
                </a>
              </div>
            </div>
          ) : (
            <div className="notice">No active sign request.</div>
          )}
        </div>

        <div className="card">
          <div className="section-title">Activity</div>
          {statusMessage && <div className="notice">{statusMessage}</div>}
          <div className="hr" />
          {log.length === 0 && <div className="notice">No events yet.</div>}
          {log.map((entry, index) => (
            <div key={`${entry}-${index}`} className="notice">
              {entry}
            </div>
          ))}
        </div>
      </section>

      <section className="card">
        <div className="section-title">Connected Wallet</div>
        <div className="notice">
          {connectedAccount ? `Connected: ${connectedAccount}` : 'Not connected yet.'}
        </div>
      </section>
    </main>
  );
}
