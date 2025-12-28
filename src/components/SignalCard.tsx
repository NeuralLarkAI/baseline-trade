import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrade } from '@/contexts/TradeContext';
import { TOKEN_INFO } from '@/lib/solana';
import { Pin, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Signal {
  id: string;
  text: string;
  tags: string[];
  token_mint?: string;
  action?: 'BUY' | 'SELL' | 'WATCH';
  prefill_size?: number;
  is_pinned: boolean;
  created_at: string;
}

interface SignalCardProps {
  signal: Signal;
  onTrade?: () => void;
}

export const SignalCard: React.FC<SignalCardProps> = ({ signal, onTrade }) => {
  const { prefillTrade } = useTrade();
  
  const tokenInfo = signal.token_mint ? TOKEN_INFO[signal.token_mint] : null;

  const handleTrade = () => {
    if (signal.token_mint && signal.action && signal.action !== 'WATCH') {
      prefillTrade(signal.token_mint, signal.prefill_size || 0.1, signal.action);
      onTrade?.();
    }
  };

  const actionColor = {
    BUY: 'text-terminal-green border-terminal-green/30 bg-terminal-green/5',
    SELL: 'text-terminal-red border-terminal-red/30 bg-terminal-red/5',
    WATCH: 'text-terminal-yellow border-terminal-yellow/30 bg-terminal-yellow/5',
  };

  return (
    <div className="bg-card border border-border rounded-sm p-4 space-y-3 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm leading-relaxed">{signal.text}</p>
        </div>
        {signal.is_pinned && (
          <Pin className="h-4 w-4 text-muted-foreground shrink-0" />
        )}
      </div>

      {signal.tags && signal.tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {signal.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs font-mono">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {signal.token_mint && signal.action && (
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            {tokenInfo?.logoURI && (
              <img src={tokenInfo.logoURI} alt="" className="w-5 h-5 rounded-full" />
            )}
            <span className="text-sm font-mono">{tokenInfo?.symbol || 'Token'}</span>
            <Badge className={`text-xs ${actionColor[signal.action]}`}>
              {signal.action}
            </Badge>
          </div>
          {signal.action !== 'WATCH' && (
            <Button variant="ghost" size="sm" onClick={handleTrade} className="text-xs">
              Trade this <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          )}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {formatDistanceToNow(new Date(signal.created_at), { addSuffix: true })}
      </div>
    </div>
  );
};
