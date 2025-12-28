import React, { useState, useEffect } from 'react';
import { SignalCard } from './SignalCard';
import { getSignals } from '@/lib/db';
import { Loader2 } from 'lucide-react';

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

interface BaselineFeedProps {
  onTradeClick?: () => void;
}

export const BaselineFeed: React.FC<BaselineFeedProps> = ({ onTradeClick }) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSignals = async () => {
      setLoading(true);
      const data = await getSignals();
      setSignals(data as Signal[]);
      setLoading(false);
    };

    fetchSignals();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (signals.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p className="text-sm">No signals yet.</p>
        <p className="text-xs mt-1">Check back later for trading insights.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {signals.map((signal) => (
        <SignalCard key={signal.id} signal={signal} onTrade={onTradeClick} />
      ))}
    </div>
  );
};
