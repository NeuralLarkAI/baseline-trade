// Jupiter API helpers - using alternative endpoints with CORS proxy

// Try multiple Jupiter API endpoints
const JUPITER_ENDPOINTS = [
  'https://api.jup.ag/swap/v1/quote',     // New v1 API
  'https://price.jup.ag/v6/quote',         // Price API
];

const JUPITER_SWAP_API = 'https://api.jup.ag/swap/v1/swap';

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

// Fetch price from Jupiter Price API as fallback
const fetchPriceEstimate = async (
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number
): Promise<QuoteResponse | null> => {
  try {
    // Use Jupiter Price API to get token prices
    const priceUrl = `https://api.jup.ag/price/v2?ids=${inputMint},${outputMint}`;
    const proxyUrl = corsProxy(priceUrl);
    
    console.log('Fetching prices from Jupiter Price API');
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      console.error('Price API error:', response.status);
      return null;
    }
    
    const data = await response.json();
    console.log('Price data:', data);
    
    if (!data.data?.[inputMint]?.price || !data.data?.[outputMint]?.price) {
      console.error('Missing price data');
      return null;
    }
    
    const inputPrice = data.data[inputMint].price;
    const outputPrice = data.data[outputMint].price;
    
    // Calculate estimated output
    const inputValue = (amount / 1e9) * inputPrice; // Assuming 9 decimals for SOL
    const outputAmount = inputValue / outputPrice;
    const outputDecimals = outputMint === 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' ? 6 : 9; // USDC has 6 decimals
    
    // Create a mock quote response for display purposes
    return {
      inputMint,
      inAmount: amount.toString(),
      outputMint,
      outAmount: Math.floor(outputAmount * Math.pow(10, outputDecimals)).toString(),
      otherAmountThreshold: '0',
      swapMode: 'ExactIn',
      slippageBps,
      priceImpactPct: '0.1',
      routePlan: [],
      contextSlot: 0,
      timeTaken: 0,
    };
  } catch (error) {
    console.error('Error fetching price estimate:', error);
    return null;
  }
};

export const getQuote = async (
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number = 100 // 1% default
): Promise<QuoteResponse | null> => {
  // Try the main quote API first
  for (const baseUrl of JUPITER_ENDPOINTS) {
    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
        amount: amount.toString(),
        slippageBps: slippageBps.toString(),
      });

      const directUrl = `${baseUrl}?${params}`;
      const proxyUrl = corsProxy(directUrl);
      
      console.log('Trying Jupiter endpoint:', baseUrl);

      const response = await fetch(proxyUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });
      
      if (!response.ok) {
        console.log('Endpoint failed:', response.status);
        continue;
      }

      const data = await response.json();
      
      if (data.error) {
        console.log('API error:', data.error);
        continue;
      }

      console.log('Quote received:', data.outAmount);
      return data;
    } catch (error) {
      console.log('Error with endpoint:', baseUrl, error);
      continue;
    }
  }
  
  // Fallback to price-based estimate
  console.log('All quote endpoints failed, using price estimate');
  return await fetchPriceEstimate(inputMint, outputMint, amount, slippageBps);
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
  const impact = parseFloat(priceImpactPct || '0');
  
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
