import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const JUPITER_API_URL = 'https://api.jup.ag/swap/v1/quote';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get('JUPITER_API_KEY');
    console.log('API Key present:', !!apiKey, 'Length:', apiKey?.length);
    
    if (!apiKey) {
      console.error('JUPITER_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'Jupiter API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = new URL(req.url);
    const inputMint = url.searchParams.get('inputMint');
    const outputMint = url.searchParams.get('outputMint');
    const amount = url.searchParams.get('amount');
    const slippageBps = url.searchParams.get('slippageBps') || '100';

    console.log(`Quote request: ${inputMint} -> ${outputMint}, amount: ${amount}`);

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
      restrictIntermediateTokens: 'true',
    });

    const apiUrl = `${JUPITER_API_URL}?${params}`;
    console.log('Calling Jupiter API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-api-key': apiKey,
      },
    });

    console.log('Jupiter response status:', response.status);
    const responseText = await response.text();
    console.log('Jupiter response:', responseText.substring(0, 500));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse Jupiter response');
      return new Response(
        JSON.stringify({ error: `Jupiter API error: ${responseText.substring(0, 200)}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Jupiter quote error:', error);
    return new Response(
      JSON.stringify({ error: `Failed to fetch quote: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});