export async function getQuote(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number
) {
  const url =
    `https://quote-api.jup.ag/v6/quote` +
    `?inputMint=${inputMint}` +
    `&outputMint=${outputMint}` +
    `&amount=${amount}` +
    `&slippageBps=${slippageBps}`;

  const res = await fetch(url);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jupiter quote failed ${res.status}: ${text}`);
  }

  const json = await res.json();

  // v6 returns the quote directly
  return json;
}
