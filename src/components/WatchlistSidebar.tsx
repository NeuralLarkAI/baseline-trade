import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getWatchlist, addToWatchlist, removeFromWatchlist } from '@/lib/db';
import { TOKEN_INFO, formatAddress } from '@/lib/solana';
import { useTrade } from '@/contexts/TradeContext';
import { toast } from 'sonner';
import { Star, Plus, X, Search, Loader2 } from 'lucide-react';

interface WatchlistItem {
  id: string;
  wallet_address: string;
  token_mint: string;
  symbol: string;
  added_at: string;
}

export const WatchlistSidebar: React.FC = () => {
  const { publicKey } = useWallet();
  const { setOutputMint, setInputMint } = useTrade();
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMint, setNewMint] = useState('');
  const [newSymbol, setNewSymbol] = useState('');
  const [adding, setAdding] = useState(false);

  const fetchWatchlist = async () => {
    if (!publicKey) return;
    setLoading(true);
    const data = await getWatchlist(publicKey.toBase58());
    setWatchlist(data as WatchlistItem[]);
    setLoading(false);
  };

  useEffect(() => {
    if (publicKey) {
      fetchWatchlist();
    }
  }, [publicKey]);

  const handleAdd = async () => {
    if (!publicKey || !newMint || !newSymbol) return;

    setAdding(true);
    try {
      await addToWatchlist(publicKey.toBase58(), newMint, newSymbol.toUpperCase());
      toast.success('Added to watchlist');
      setShowAddForm(false);
      setNewMint('');
      setNewSymbol('');
      await fetchWatchlist();
    } catch (error) {
      toast.error('Failed to add to watchlist');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (tokenMint: string) => {
    if (!publicKey) return;

    try {
      await removeFromWatchlist(publicKey.toBase58(), tokenMint);
      toast.success('Removed from watchlist');
      await fetchWatchlist();
    } catch (error) {
      toast.error('Failed to remove from watchlist');
    }
  };

  const handleSelect = (tokenMint: string) => {
    setOutputMint(tokenMint);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Star className="h-3 w-3" />
          Watchlist
        </h3>
        {publicKey && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
      </div>

      {showAddForm && (
        <div className="bg-card border border-border rounded-sm p-3 mb-4 space-y-2 animate-fade-in">
          <Input
            placeholder="Token mint address"
            value={newMint}
            onChange={(e) => setNewMint(e.target.value)}
            className="text-xs"
          />
          <Input
            placeholder="Symbol (e.g., BONK)"
            value={newSymbol}
            onChange={(e) => setNewSymbol(e.target.value)}
            className="text-xs"
          />
          <Button
            variant="terminal"
            size="sm"
            onClick={handleAdd}
            disabled={adding || !newMint || !newSymbol}
            className="w-full text-xs"
          >
            {adding ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add Token'}
          </Button>
        </div>
      )}

      {!publicKey ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm text-center px-4">
          Connect wallet to use watchlist
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : watchlist.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm text-center px-4">
          No tokens in watchlist
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-1">
          {watchlist.map((item) => {
            const tokenInfo = TOKEN_INFO[item.token_mint];
            return (
              <div
                key={item.id}
                className="group flex items-center justify-between p-2 rounded-sm hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleSelect(item.token_mint)}
              >
                <div className="flex items-center gap-2">
                  {tokenInfo?.logoURI ? (
                    <img src={tokenInfo.logoURI} alt="" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs">
                      {item.symbol.charAt(0)}
                    </div>
                  )}
                  <span className="text-sm font-mono">{item.symbol}</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(item.token_mint);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      )}

      {/* Token Search */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search tokens..." className="pl-7 text-xs h-8" />
        </div>
      </div>
    </div>
  );
};
