# microlender

Trustline Credit MVP on XRPL Testnet using Xaman wallet.

## Quickstart

1. Install deps: `npm install`
2. Create `.env.local` with `NEXT_PUBLIC_XAMAN_API_KEY=` from Xaman Developer Dashboard.
3. Run dev server: `npm run dev`

## Notes

- Uses XRPL Testnet WebSocket at `wss://s.altnet.rippletest.net:51233/`.
- All loan state is stored in browser localStorage.
