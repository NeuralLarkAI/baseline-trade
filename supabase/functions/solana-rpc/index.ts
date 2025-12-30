import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Free public RPC endpoints that allow CORS
const MAINNET_RPCS = [
  'https://api.mainnet-beta.solana.com',
  'https://solana-mainnet.g.alchemy.com/v2/demo',
  'https://rpc.ankr.com/solana',
];

const DEVNET_RPCS = [
  'https://api.devnet.solana.com',
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const isMainnet = url.searchParams.get('network') !== 'devnet';
    const rpcs = isMainnet ? MAINNET_RPCS : DEVNET_RPCS;

    const body = await req.json();
    console.log('RPC request:', body.method, isMainnet ? 'mainnet' : 'devnet');

    // Try each RPC endpoint until one works
    let lastError: Error | null = null;
    for (const rpc of rpcs) {
      try {
        console.log('Trying RPC:', rpc);
        const response = await fetch(rpc, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (response.ok) {
          const data = await response.json();
          console.log('RPC success from:', rpc);
          return new Response(JSON.stringify(data), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        const errorText = await response.text();
        console.log('RPC failed:', rpc, response.status, errorText);
        lastError = new Error(`${rpc}: ${response.status}`);
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
