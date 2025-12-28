import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { WalletButton } from './WalletButton';
import { NetworkToggle } from './NetworkToggle';
import { Terminal } from 'lucide-react';

export const Header: React.FC = () => {
  const location = useLocation();
  const isTerminal = location.pathname === '/terminal';

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-screen-2xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Terminal className="h-5 w-5 text-foreground" />
          <span className="font-mono text-sm font-semibold tracking-wider">BASELINE</span>
        </Link>

        <div className="flex items-center gap-4">
          <NetworkToggle />
          {isTerminal && <WalletButton />}
          {!isTerminal && (
            <Link
              to="/terminal"
              className="text-sm font-mono text-muted-foreground hover:text-foreground transition-colors"
            >
              Launch Terminal →
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
