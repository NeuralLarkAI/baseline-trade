import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Jupiter v6 API
const JUPITER_QUOTE_API = 'https://api.jup.ag/quote/v6';

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const inputMint = url.searchParams.get('inputMint');
    const outputMint = url.searchParams.get('outputMint');
    const amount = url.searchParams.get('amount');
    const slippageBps = url.searchParams.get('slippageBps') || '100';

    console.log(`Fetching quote: ${inputMint} -> ${outputMint}, amount: ${amount}`);

    if (!inputMint || !outputMint || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters: inputMint, outputMint, amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount,
      slippageBps,
    });

    const apiUrl = `${JUPITER_QUOTE_API}?${params}`;
    console.log('Calling Jupiter API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Lovable-Terminal/1.0',
      },
    });

    console.log('Jupiter API response status:', response.status);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      return new Response(
        JSON.stringify({ error: `Jupiter API returned non-JSON response: ${text.substring(0, 100)}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('Jupiter API response:', JSON.stringify(data).substring(0, 200));

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Jupiter quote proxy error:', error);
    return new Response(
      JSON.stringify({ error: `Failed to fetch quote: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
