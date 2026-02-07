import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'Trustline Credit MVP',
  description: 'XRPL trustline credit demo on Testnet with Xaman wallet.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
