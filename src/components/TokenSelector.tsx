import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TOKEN_INFO, SOL_MINT, USDC_MINT_MAINNET, USDC_MINT_DEVNET } from '@/lib/solana';
import { useNetwork } from '@/contexts/NetworkContext';
import { Search, ChevronDown, Loader2 } from 'lucide-react';
import { fetchTokenMetadata, getCachedMetadata, TokenMetadata } from '@/lib/tokenMetadata';

// Popular tokens list
const POPULAR_TOKENS = [
  {
    mint: SOL_MINT,
    symbol: 'SOL',
    name: 'Solana',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  {
    mint: USDC_MINT_MAINNET,
    symbol: 'USDC',
    name: 'USD Coin',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  {
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'BONK',
    name: 'Bonk',
    logoURI: 'https://arweave.net/hQiPZOsRZXGXBJd_82PhVdlM_hACsT_q6wqwf5cSY7I',
  },
  {
    mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
    symbol: 'JUP',
    name: 'Jupiter',
    logoURI: 'https://static.jup.ag/jup/icon.png',
  },
  {
    mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm',
    symbol: 'WIF',
    name: 'dogwifhat',
    logoURI: 'https://bafkreibk3covs5ltyqxa272uodhculbr6kea6betiber7yzwedw7lnvr7u.ipfs.cf-ipfs.com/',
  },
  {
    mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
    symbol: 'RENDER',
    name: 'Render Token',
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof/logo.png',
  },
];

interface TokenSelectorProps {
  selectedMint: string;
  onSelect: (mint: string) => void;
  label?: string;
}

// Helper to get token display info
function getTokenDisplay(mint: string): { symbol: string; name: string; logoURI?: string } | null {
  // Check TOKEN_INFO first
  if (TOKEN_INFO[mint]) {
    return TOKEN_INFO[mint];
  }
  
  // Check POPULAR_TOKENS
  const popular = POPULAR_TOKENS.find(t => t.mint === mint);
  if (popular) {
    return popular;
  }
  
  // Check metadata cache
  const cached = getCachedMetadata(mint);
  if (cached) {
    return cached;
  }
  
  return null;
}

export const TokenSelector: React.FC<TokenSelectorProps> = ({ selectedMint, onSelect, label }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [customMint, setCustomMint] = useState('');
  const [loadingCustom, setLoadingCustom] = useState(false);
  const [customTokenPreview, setCustomTokenPreview] = useState<TokenMetadata | null>(null);
  const [selectedTokenMeta, setSelectedTokenMeta] = useState<TokenMetadata | null>(null);
  const { isMainnet } = useNetwork();

  // Fetch metadata for selected token if not in known lists
  useEffect(() => {
    const display = getTokenDisplay(selectedMint);
    if (!display && selectedMint) {
      fetchTokenMetadata(selectedMint).then(meta => {
        if (meta) setSelectedTokenMeta(meta);
      });
    } else {
      setSelectedTokenMeta(null);
    }
  }, [selectedMint]);

  const selectedToken = getTokenDisplay(selectedMint) || selectedTokenMeta;

  // Get recently used from localStorage
  const getRecentTokens = () => {
    try {
      const recent = localStorage.getItem('recentTokens');
      return recent ? JSON.parse(recent) : [];
    } catch {
      return [];
    }
  };

  const saveRecentToken = (mint: string) => {
    try {
      const recent = getRecentTokens();
      const updated = [mint, ...recent.filter((m: string) => m !== mint)].slice(0, 5);
      localStorage.setItem('recentTokens', JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleSelect = (mint: string) => {
    onSelect(mint);
    saveRecentToken(mint);
    setOpen(false);
    setSearch('');
    setCustomMint('');
    setCustomTokenPreview(null);
  };

  // Fetch preview when custom mint changes
  useEffect(() => {
    if (customMint && customMint.length >= 32) {
      setLoadingCustom(true);
      fetchTokenMetadata(customMint)
        .then(meta => {
          setCustomTokenPreview(meta);
        })
        .finally(() => {
          setLoadingCustom(false);
        });
    } else {
      setCustomTokenPreview(null);
    }
  }, [customMint]);

  const handleCustomMint = () => {
    if (customMint && customMint.length >= 32) {
      handleSelect(customMint);
    }
  };

  const filteredPopular = POPULAR_TOKENS.filter(
    t => t.symbol.toLowerCase().includes(search.toLowerCase()) ||
         t.name.toLowerCase().includes(search.toLowerCase())
  );

  const recentMints = getRecentTokens();
  const [recentTokens, setRecentTokens] = useState<Array<{ mint: string; symbol: string; name: string; logoURI?: string }>>([]);

  // Fetch metadata for recent tokens
  useEffect(() => {
    const loadRecentMetadata = async () => {
      const tokens = await Promise.all(
        recentMints.map(async (mint: string) => {
          const known = POPULAR_TOKENS.find(t => t.mint === mint);
          if (known) return known;
          
          const meta = await fetchTokenMetadata(mint);
          return meta || { mint, symbol: mint.slice(0, 4) + '...', name: 'Unknown Token' };
        })
      );
      setRecentTokens(tokens);
    };
    
    if (open && recentMints.length > 0) {
      loadRecentMetadata();
    }
  }, [open, recentMints.length]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-2 hover:bg-accent rounded-sm px-2 py-1 transition-colors min-w-[100px]"
        >
          {selectedToken?.logoURI ? (
            <img src={selectedToken.logoURI} alt="" className="w-6 h-6 rounded-full" />
          ) : selectedToken ? (
            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
              {selectedToken.symbol?.charAt(0)}
            </div>
          ) : null}
          <span className="font-mono font-medium">{selectedToken?.symbol || 'Select'}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-mono">{label || 'Select Token'}</DialogTitle>
        </DialogHeader>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tokens..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <Tabs defaultValue="popular" className="w-full">
          <TabsList className="w-full mb-4 bg-muted/30">
            <TabsTrigger value="popular" className="flex-1 font-mono text-xs">Popular</TabsTrigger>
            <TabsTrigger value="recent" className="flex-1 font-mono text-xs">Recently</TabsTrigger>
            <TabsTrigger value="custom" className="flex-1 font-mono text-xs">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="popular" className="mt-0 max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {filteredPopular.map((token) => (
                <button
                  key={token.mint}
                  onClick={() => handleSelect(token.mint)}
                  className="w-full flex items-center gap-3 p-3 rounded-sm hover:bg-accent transition-colors text-left"
                >
                  {token.logoURI ? (
                    <img src={token.logoURI} alt="" className="w-8 h-8 rounded-full" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                      {token.symbol.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-mono font-medium">{token.symbol}</div>
                    <div className="text-xs text-muted-foreground">{token.name}</div>
                  </div>
                </button>
              ))}
              {filteredPopular.length === 0 && (
                <div className="text-center py-4 text-muted-foreground text-sm">
                  No tokens found
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="recent" className="mt-0 max-h-64 overflow-y-auto">
            <div className="space-y-1">
              {recentTokens.length > 0 ? (
                recentTokens.map((token: any) => (
                  <button
                    key={token.mint}
                    onClick={() => handleSelect(token.mint)}
                    className="w-full flex items-center gap-3 p-3 rounded-sm hover:bg-accent transition-colors text-left"
                  >
                    {token.logoURI ? (
                      <img src={token.logoURI} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                        {token.symbol?.charAt(0) || '?'}
                      </div>
                    )}
                    <div>
                      <div className="font-mono font-medium">{token.symbol}</div>
                      <div className="text-xs text-muted-foreground">{token.name}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recent tokens yet
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-0">
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Enter a token mint address to add a custom token.
              </p>
              <Input
                placeholder="Token mint address..."
                value={customMint}
                onChange={(e) => setCustomMint(e.target.value)}
                className="font-mono text-sm"
              />
              
              {/* Token Preview */}
              {loadingCustom && (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">Fetching token info...</span>
                </div>
              )}
              
              {customTokenPreview && !loadingCustom && (
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-sm">
                  {customTokenPreview.logoURI ? (
                    <img 
                      src={customTokenPreview.logoURI} 
                      alt="" 
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
                      {customTokenPreview.symbol.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <div className="font-mono font-medium">{customTokenPreview.symbol}</div>
                    <div className="text-xs text-muted-foreground">{customTokenPreview.name}</div>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleCustomMint}
                disabled={!customMint || customMint.length < 32 || loadingCustom}
                className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-sm font-mono text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                {customTokenPreview ? `Add ${customTokenPreview.symbol}` : 'Add Token'}
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
