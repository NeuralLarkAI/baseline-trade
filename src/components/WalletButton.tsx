import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { formatAddress } from '@/lib/solana';
import { Wallet, LogOut } from 'lucide-react';

export const WalletButton: React.FC = () => {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();

  if (publicKey) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-1.5 border border-border bg-card rounded-sm">
          <div className="w-2 h-2 rounded-full bg-terminal-green animate-pulse-subtle" />
          <span className="text-sm font-mono">{formatAddress(publicKey.toBase58())}</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => disconnect()}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="terminal"
      onClick={() => setVisible(true)}
      disabled={connecting}
    >
      <Wallet className="h-4 w-4 mr-2" />
      {connecting ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};
