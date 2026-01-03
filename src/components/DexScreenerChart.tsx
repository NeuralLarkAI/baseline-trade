import React from 'react';

interface DexScreenerChartProps {
  tokenMint: string;
  className?: string;
}

export const DexScreenerChart: React.FC<DexScreenerChartProps> = ({ tokenMint, className = '' }) => {
  if (!tokenMint) {
    return (
      <div className={`flex items-center justify-center bg-card border border-border rounded-sm h-[400px] ${className}`}>
        <span className="text-muted-foreground font-mono text-sm">Select a token to view chart</span>
      </div>
    );
  }

  // DexScreener embed URL for Solana tokens
  const chartUrl = `https://dexscreener.com/solana/${tokenMint}?embed=1&theme=dark&trades=0&info=0`;

  return (
    <div className={`bg-card border border-border rounded-sm overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Chart</span>
        <a
          href={`https://dexscreener.com/solana/${tokenMint}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-mono text-terminal-blue hover:underline"
        >
          Open in DexScreener →
        </a>
      </div>
      <iframe
        src={chartUrl}
        title="DexScreener Chart"
        className="w-full h-[400px] border-0"
        allow="clipboard-write"
      />
    </div>
  );
};
