import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const mint = url.searchParams.get("mint");

    if (!mint) {
      return new Response(
        JSON.stringify({ error: "Missing mint parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching metadata for mint: ${mint}`);

    // Try Jupiter's token API first
    const jupiterResponse = await fetch(`https://tokens.jup.ag/token/${mint}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "BaselineTerminal/1.0",
      },
    });

    if (jupiterResponse.ok) {
      const data = await jupiterResponse.json();
      console.log(`Found token via Jupiter: ${data.symbol}`);
      
      return new Response(JSON.stringify({
        mint: data.address || mint,
        symbol: data.symbol || mint.slice(0, 4).toUpperCase(),
        name: data.name || "Unknown Token",
        decimals: data.decimals ?? 9,
        logoURI: data.logoURI || null,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: Try DexScreener API
    console.log("Jupiter not found, trying DexScreener...");
    const dexResponse = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`, {
      headers: {
        "Accept": "application/json",
        "User-Agent": "BaselineTerminal/1.0",
      },
    });

    if (dexResponse.ok) {
      const dexData = await dexResponse.json();
      
      if (dexData.pairs && dexData.pairs.length > 0) {
        const pair = dexData.pairs[0];
        const tokenInfo = pair.baseToken.address === mint ? pair.baseToken : pair.quoteToken;
        
        console.log(`Found token via DexScreener: ${tokenInfo.symbol}`);
        
        return new Response(JSON.stringify({
          mint: tokenInfo.address,
          symbol: tokenInfo.symbol || mint.slice(0, 4).toUpperCase(),
          name: tokenInfo.name || "Unknown Token",
          decimals: 9, // DexScreener doesn't always provide decimals
          logoURI: pair.info?.imageUrl || null,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Return minimal data for unknown tokens
    console.log("Token not found in any API, returning minimal metadata");
    return new Response(JSON.stringify({
      mint,
      symbol: mint.slice(0, 4).toUpperCase() + "...",
      name: "Unknown Token",
      decimals: 9,
      logoURI: null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error fetching token metadata:", error);
    
    return new Response(
      JSON.stringify({ error: "Failed to fetch token metadata" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
