'use client';

import Link from 'next/link';
import { ConnectButton } from '@rainbow-me/rainbowkit';

const links = [
  { href: '/', label: 'Home' },
  { href: '/initiatives', label: 'Initiatives' },
  { href: '/propose', label: 'Propose' },
  { href: '/vote', label: 'Vote' },
  { href: '/treasury', label: 'Treasury' },
  { href: '/mediation', label: 'Mediation' },
  { href: '/donate', label: 'Donate' },
];

export function Navbar() {
  return (
    <nav className="border-b border-green-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold text-green-800">
          🕊️ Peace Coin
        </Link>
        <div className="hidden md:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm text-green-700 hover:text-green-900 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
        <ConnectButton />
      </div>
    </nav>
  );
}
