// src/lib/jupiter.ts
// Jupiter helpers using edge function proxy

export type Severity = "low" | "medium" | "high";

export type RoutePlanStep = {
  swapInfo?: {
    label?: string;
    ammKey?: string;
    inputMint?: string;
    outputMint?: string;
  };
};

export type QuoteResponse = {
  inputMint: string;
  outputMint: string;
  inAmount: string;
  outAmount: string;
  priceImpactPct?: string | number;
  routePlan?: RoutePlanStep[];
};

export type SwapResponse = {
  swapTransaction: string;
};

function toNumber(x: unknown): number {
  if (typeof x === "number") return x;
  if (typeof x === "string") {
    const n = parseFloat(x);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

export function calculatePriceImpact(
  priceImpactPct?: string | number
): { value: number; severity: Severity } {
  const v = toNumber(priceImpactPct);

  let severity: Severity = "low";
  if (v >= 3) severity = "high";
  else if (v >= 1) severity = "medium";

  return { value: v, severity };
}

export function formatRouteLabel(routePlan?: RoutePlanStep[]): string {
  if (!routePlan || routePlan.length === 0) return "—";
  const labels = routePlan
    .map((s) => s.swapInfo?.label)
    .filter(Boolean) as string[];

  const unique: string[] = [];
  for (const l of labels) {
    if (!unique.includes(l)) unique.push(l);
  }

  return unique.length ? unique.join(" → ") : "Jupiter";
}

const getSupabaseUrl = () => import.meta.env.VITE_SUPABASE_URL;
const getAnonKey = () => import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number
): Promise<QuoteResponse> {
  const params = new URLSearchParams({
    inputMint,
    outputMint,
    amount: String(amount),
    slippageBps: String(slippageBps),
  });

  const res = await fetch(
    `${getSupabaseUrl()}/functions/v1/jupiter-quote?${params}`,
    {
      headers: {
        'apikey': getAnonKey(),
        'Content-Type': 'application/json',
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Jupiter quote failed:', res.status, text);
    throw new Error(`Jupiter quote failed ${res.status}: ${text}`);
  }

  return (await res.json()) as QuoteResponse;
}

export async function getSwapTransaction(
  quote: QuoteResponse,
  userPublicKey: string
): Promise<SwapResponse> {
  const res = await fetch(
    `${getSupabaseUrl()}/functions/v1/jupiter-swap`,
    {
      method: 'POST',
      headers: {
        'apikey': getAnonKey(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        quoteResponse: quote,
        userPublicKey,
        wrapAndUnwrapSol: true,
        dynamicComputeUnitLimit: true,
      }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error('Jupiter swap failed:', res.status, text);
    throw new Error(`Jupiter swap failed ${res.status}: ${text}`);
  }

  const json = (await res.json()) as SwapResponse;

  if (!json?.swapTransaction) {
    throw new Error("Jupiter swap: missing swapTransaction");
  }

  return json;
}
