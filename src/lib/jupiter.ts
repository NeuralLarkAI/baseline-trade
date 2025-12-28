// Jupiter API helpers - using CORS proxy for browser requests

const JUPITER_QUOTE_API = 'https://quote-api.jup.ag/v6/quote';
const JUPITER_SWAP_API = 'https://quote-api.jup.ag/v6/swap';

// Use CORS proxy for browser requests
const corsProxy = (url: string) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`;

export interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  priceImpactPct: string;
  routePlan: RoutePlan[];
  contextSlot: number;
  timeTaken: number;
}

export interface RoutePlan {
  swapInfo: {
    ammKey: string;
    label: string;
    inputMint: string;
    outputMint: string;
    inAmount: string;
    outAmount: string;
    feeAmount: string;
    feeMint: string;
  };
  percent: number;
}

export interface SwapResponse {
  swapTransaction: string;
  lastValidBlockHeight: number;
  prioritizationFeeLamports: number;
}

export const getQuote = async (
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 100 // 1% default
): Promise<QuoteResponse | null> => {
  try {
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amount.toString(),
      slippageBps: slippageBps.toString(),
    });

    const directUrl = `${JUPITER_QUOTE_API}?${params}`;
    const proxyUrl = corsProxy(directUrl);
    
    console.log('Fetching Jupiter quote via proxy');

    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jupiter quote error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    // Check if Jupiter returned an error
    if (data.error) {
      console.error('Jupiter API error:', data.error);
      return null;
    }

    console.log('Quote received:', data.outAmount);
    return data;
  } catch (error) {
    console.error('Error fetching Jupiter quote:', error);
    return null;
  }
};

export const getSwapTransaction = async (
  quoteResponse: QuoteResponse,
  userPublicKey: string
): Promise<SwapResponse | null> => {
  try {
    const proxyUrl = corsProxy(JUPITER_SWAP_API);
    
    const response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
        prioritizationFeeLamports: 'auto',
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Jupiter swap error:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    
    if (data.error) {
      console.error('Jupiter swap API error:', data.error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error fetching swap transaction:', error);
    return null;
  }
};

export const calculatePriceImpact = (priceImpactPct: string): { value: number; severity: 'low' | 'medium' | 'high' } => {
  const impact = parseFloat(priceImpactPct);
  
  if (impact < 1) {
    return { value: impact, severity: 'low' };
  } else if (impact < 5) {
    return { value: impact, severity: 'medium' };
  } else {
    return { value: impact, severity: 'high' };
  }
};

export const formatRouteLabel = (routePlan: RoutePlan[]): string => {
  if (!routePlan || routePlan.length === 0) return 'Direct';
  
  const labels = routePlan.map((r) => r.swapInfo.label).filter(Boolean);
  return labels.join(' → ') || 'Direct';
};
