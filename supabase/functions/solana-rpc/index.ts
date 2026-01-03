import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fallback public RPC endpoints
const MAINNET_FALLBACKS = [
  'https://api.mainnet-beta.solana.com',
  'https://rpc.ankr.com/solana',
];

const DEVNET_FALLBACKS = [
  'https://api.devnet.solana.com',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const isMainnet = url.searchParams.get('network') !== 'devnet';
    
    // Use Helius RPC as primary for mainnet
    const heliusRpc = Deno.env.get('HELIUS_RPC_URL');
    
    // Build RPC list: Helius first (if available and mainnet), then fallbacks
    const rpcs: string[] = [];
    if (isMainnet && heliusRpc) {
      rpcs.push(heliusRpc);
    }
    rpcs.push(...(isMainnet ? MAINNET_FALLBACKS : DEVNET_FALLBACKS));

    const body = await req.json();
    console.log('RPC request:', body.method, isMainnet ? 'mainnet' : 'devnet');

    // Try each RPC endpoint until one works
    let lastError: Error | null = null;
    for (const rpc of rpcs) {
      try {
        const rpcName = rpc.includes('helius') ? 'Helius' : rpc;
        console.log('Trying RPC:', rpcName);
        
        const response = await fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('RPC success from:', rpcName);
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const errorText = await response.text();
        console.log('RPC failed:', rpcName, response.status, errorText);
        lastError = new Error(`${rpcName}: ${response.status}`);
      } catch (e) {
        console.log('RPC error:', rpc, e);
        lastError = e as Error;
      }
    }

    throw lastError || new Error('All RPC endpoints failed');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Solana RPC proxy error:', error);
    return new Response(
      JSON.stringify({ error: `RPC failed: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
