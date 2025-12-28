import React, { useState, useEffect } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { getTrades } from '@/lib/db';
import { getSOLBalance, getSPLTokenBalances, TOKEN_INFO, formatAmount, formatAddress, getExplorerUrl } from '@/lib/solana';
import { useNetwork } from '@/contexts/NetworkContext';
import { Wallet, ExternalLink, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Trade {
  id: string;
  wallet_address: string;
  direction: 'BUY' | 'SELL';
  input_mint: string;
  output_mint: string;
  input_amount: number;
  output_amount_est: number;
  tx_sig?: string;
  created_at: string;
}

interface TokenBalance {
  mint: string;
  balance: number;
  decimals: number;
}

export const PortfolioPanel: React.FC = () => {
  const { publicKey } = useWallet();
  const { connection } = useConnection();
  const { isMainnet } = useNetwork();
  
  const [solBalance, setSolBalance] = useState<number>(0);
  const [tokenBalances, setTokenBalances] = useState<TokenBalance[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllTokens, setShowAllTokens] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!publicKey) return;
      
      setLoading(true);
      try {
        const [sol, tokens, tradeData] = await Promise.all([
          getSOLBalance(connection, publicKey),
          getSPLTokenBalances(connection, publicKey),
          getTrades(publicKey.toBase58()),
        ]);
        
        setSolBalance(sol);
        setTokenBalances(tokens.filter(t => t.balance > 0));
        setTrades(tradeData as Trade[]);
      } catch (error) {
        console.error('Error fetching portfolio:', error);
      } finally {
        setLoading(false);
      }
    };

    if (publicKey) {
      fetchData();
      const interval = setInterval(fetchData, 30000); // Refresh every 30s
      return () => clearInterval(interval);
    }
  }, [publicKey, connection]);

  if (!publicKey) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <Wallet className="h-8 w-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Connect wallet to view portfolio</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const visibleTokens = showAllTokens ? tokenBalances : tokenBalances.slice(0, 3);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* SOL Balance */}
      <div className="mb-6">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Balance</h3>
        <div className="flex items-center gap-3">
          <img
            src="https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png"
            alt="SOL"
            className="w-8 h-8 rounded-full"
          />
          <div>
            <div className="text-xl font-mono">{formatAmount(solBalance, 4)} SOL</div>
            <div className="text-xs text-muted-foreground">{isMainnet ? 'Mainnet' : 'Devnet'}</div>
          </div>
        </div>
      </div>

      {/* Token Balances */}
      {tokenBalances.length > 0 && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Tokens</h3>
          <div className="space-y-2">
            {visibleTokens.map((token) => {
              const info = TOKEN_INFO[token.mint];
              return (
                <div key={token.mint} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    {info?.logoURI ? (
                      <img src={info.logoURI} alt="" className="w-5 h-5 rounded-full" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted" />
                    )}
                    <span className="text-sm font-mono">{info?.symbol || formatAddress(token.mint, 3)}</span>
                  </div>
                  <span className="text-sm font-mono">{formatAmount(token.balance)}</span>
                </div>
              );
            })}
          </div>
          {tokenBalances.length > 3 && (
            <button
              onClick={() => setShowAllTokens(!showAllTokens)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mt-2 transition-colors"
            >
              {showAllTokens ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              {showAllTokens ? 'Show less' : `+${tokenBalances.length - 3} more`}
            </button>
          )}
        </div>
      )}

      {/* Recent Trades */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Recent Trades</h3>
        {trades.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No trades yet
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2">
            {trades.map((trade) => {
              const inputInfo = TOKEN_INFO[trade.input_mint];
              const outputInfo = TOKEN_INFO[trade.output_mint];
              return (
                <div key={trade.id} className="bg-card border border-border rounded-sm p-2 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-mono ${
                        trade.direction === 'BUY' ? 'text-terminal-green' : 'text-terminal-red'
                      }`}
                    >
                      {trade.direction}
                    </span>
                    {trade.tx_sig && (
                      <a
                        href={getExplorerUrl(trade.tx_sig, isMainnet)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-terminal-blue hover:underline flex items-center gap-1"
                      >
                        {formatAddress(trade.tx_sig, 3)}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="text-muted-foreground">
                    {formatAmount(trade.input_amount)} {inputInfo?.symbol || '?'} → {formatAmount(trade.output_amount_est)} {outputInfo?.symbol || '?'}
                  </div>
                  <div className="text-muted-foreground/70 mt-1">
                    {formatDistanceToNow(new Date(trade.created_at), { addSuffix: true })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
