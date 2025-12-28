// src/lib/jupiter.ts
// Jupiter v6 helpers for Baseline Terminal
// NOTE: This version uses the Vite dev proxy (/jup/*) to avoid browser CORS issues in development.

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
  inAmount: string; // base units as string
  outAmount: string; // base units as string
  priceImpactPct?: string | number;
  routePlan?: RoutePlanStep[];
};

export type SwapResponse = {
  swapTransaction: string; // base64
};

function toNumber(x: unknown): number {
  if (typeof x === "number") return x;
  if (typeof x === "string") {
    const n = parseFloat(x);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/**
 * Convert Jupiter's priceImpactPct into a severity + numeric value.
 * Expectation: value in "percent" units (e.g. 0.42 = 0.42%).
 */
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

export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number
): Promise<QuoteResponse> {
  const url =
    `/jup/v6/quote` +
    `?inputMint=${encodeURIComponent(inputMint)}` +
    `&outputMint=${encodeURIComponent(outputMint)}` +
    `&amount=${encodeURIComponent(String(amount))}` +
    `&slippageBps=${encodeURIComponent(String(slippageBps))}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter quote failed ${res.status}: ${text}`);
  }

  return (await res.json()) as QuoteResponse;
}

export async function getSwapTransaction(
  quote: QuoteResponse,
  userPublicKey: string
): Promise<SwapResponse> {
  // Also proxy swap in DEV to avoid CORS on POST
  const res = await fetch("/jup/v6/swap", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      quoteResponse: quote,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter swap failed ${res.status}: ${text}`);
  }

  const json = (await res.json()) as SwapResponse;

  if (!json?.swapTransaction) {
    throw new Error("Jupiter swap: missing swapTransaction");
  }

  return json;
}
