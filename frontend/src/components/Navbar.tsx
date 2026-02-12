'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Button } from '@/components/ui/button';

const links = [
  { href: '/', label: 'Home' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/initiatives', label: 'Initiatives' },
  { href: '/propose', label: 'Propose' },
  { href: '/vote', label: 'Vote' },
  { href: '/treasury', label: 'Treasury' },
  { href: '/mediation', label: 'Mediation' },
  { href: '/donate', label: 'Donate' },
];

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="border-b border-green-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-xl font-bold text-green-800 hover:text-green-900 transition-colors"
        >
          🕊️ Peace Coin
        </Link>
        
        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-6">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors ${
                pathname === l.href 
                  ? 'text-green-900 font-medium border-b-2 border-green-500 pb-1' 
                  : 'text-green-700 hover:text-green-900'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:block">
            <ConnectButton showBalance={false} />
          </div>
          
          {/* Mobile Menu Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden"
          >
            ☰
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="lg:hidden bg-white border-t border-green-100">
          <div className="px-4 py-4 space-y-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setIsMenuOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm transition-colors ${
                  pathname === l.href
                    ? 'bg-green-100 text-green-900 font-medium'
                    : 'text-green-700 hover:bg-green-50 hover:text-green-900'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <div className="pt-4 border-t border-green-100 sm:hidden">
              <ConnectButton showBalance={false} />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
