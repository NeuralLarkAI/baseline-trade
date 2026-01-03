// Token metadata fetching and caching

export interface TokenMetadata {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
}

const CACHE_KEY = 'tokenMetadataCache';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// In-memory cache for the session
const memoryCache: Map<string, TokenMetadata> = new Map();

// Load from localStorage on init
function loadCacheFromStorage(): void {
  try {
    const stored = localStorage.getItem(CACHE_KEY);
    if (stored) {
      const { data, timestamp } = JSON.parse(stored);
      if (Date.now() - timestamp < CACHE_EXPIRY) {
        Object.entries(data).forEach(([mint, meta]) => {
          memoryCache.set(mint, meta as TokenMetadata);
        });
      }
    }
  } catch {
    // Ignore storage errors
  }
}

// Save to localStorage
function saveCacheToStorage(): void {
  try {
    const data: Record<string, TokenMetadata> = {};
    memoryCache.forEach((meta, mint) => {
      data[mint] = meta;
    });
    localStorage.setItem(CACHE_KEY, JSON.stringify({ data, timestamp: Date.now() }));
  } catch {
    // Ignore storage errors
  }
}

// Initialize cache from storage
loadCacheFromStorage();

// Get cached metadata
export function getCachedMetadata(mint: string): TokenMetadata | null {
  return memoryCache.get(mint) || null;
}

// Save metadata to cache
export function cacheMetadata(metadata: TokenMetadata): void {
  memoryCache.set(metadata.mint, metadata);
  saveCacheToStorage();
}

// Fetch token metadata via our edge function proxy (avoids CORS issues)
export async function fetchTokenMetadata(mint: string): Promise<TokenMetadata | null> {
  // Check cache first
  const cached = getCachedMetadata(mint);
  if (cached) {
    return cached;
  }

  try {
    // Use our edge function to proxy the request (bypasses CORS)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    const response = await fetch(
      `${supabaseUrl}/functions/v1/token-metadata?mint=${mint}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Content-Type': 'application/json',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      const metadata: TokenMetadata = {
        mint: data.mint || mint,
        symbol: data.symbol || mint.slice(0, 4).toUpperCase(),
        name: data.name || 'Unknown Token',
        decimals: data.decimals ?? 9,
        logoURI: data.logoURI || undefined,
      };
      
      cacheMetadata(metadata);
      return metadata;
    }
    
    // Return minimal metadata for unknown tokens
    const minimalMetadata: TokenMetadata = {
      mint,
      symbol: mint.slice(0, 4).toUpperCase() + '...',
      name: 'Unknown Token',
      decimals: 9,
    };
    
    cacheMetadata(minimalMetadata);
    return minimalMetadata;
  } catch (error) {
    console.error('Failed to fetch token metadata:', error);
    
    // Return minimal metadata on error
    return {
      mint,
      symbol: mint.slice(0, 4).toUpperCase() + '...',
      name: 'Unknown Token',
      decimals: 9,
    };
  }
}

// Batch fetch multiple tokens
export async function fetchMultipleTokenMetadata(mints: string[]): Promise<Map<string, TokenMetadata>> {
  const results = new Map<string, TokenMetadata>();
  
  // Check cache first
  const uncached: string[] = [];
  for (const mint of mints) {
    const cached = getCachedMetadata(mint);
    if (cached) {
      results.set(mint, cached);
    } else {
      uncached.push(mint);
    }
  }
  
  // Fetch uncached tokens in parallel (limit concurrency)
  const batchSize = 5;
  for (let i = 0; i < uncached.length; i += batchSize) {
    const batch = uncached.slice(i, i + batchSize);
    const fetched = await Promise.all(batch.map(fetchTokenMetadata));
    
    fetched.forEach((meta, index) => {
      if (meta) {
        results.set(batch[index], meta);
      }
    });
  }
  
  return results;
}
