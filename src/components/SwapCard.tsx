import React, { useState, useEffect, useCallback } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTrade } from "@/contexts/TradeContext";
import { useNetwork } from "@/contexts/NetworkContext";
import {
  getQuote,
  getSwapTransaction,
  QuoteResponse,
  calculatePriceImpact,
  formatRouteLabel,
} from "@/lib/jupiter";
import {
  TOKEN_INFO,
  SOL_MINT,
  formatAmount,
  getExplorerUrl,
} from "@/lib/solana";
import { saveTrade } from "@/lib/db";
import { toast } from "sonner";
import { ArrowDownUp, Loader2, ExternalLink, AlertTriangle } from "lucide-react";
import { TokenSelector } from "./TokenSelector";

const SIZE_PRESETS = [0.1, 0.25, 0.5];
const SLIPPAGE_OPTIONS = [0.5, 1.0, 2.0];

// Mainnet USDC mint (most common stable for Solana)
const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export const SwapCard: React.FC = () => {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const { isMainnet } = useNetwork();

  const {
    inputMint,
    outputMint,
    inputAmount,
    slippage,
    setInputMint,
    setOutputMint,
    setInputAmount,
    setSlippage,
  } = useTrade();

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [swapping, setSwapping] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const inputToken = TOKEN_INFO[inputMint];
  const outputToken = TOKEN_INFO[outputMint];

  const resolveDecimals = useCallback(
    (mint: string) => {
      if (!mint) return 9;
      if (mint === SOL_MINT) return 9;
      if (mint === USDC_MINT) return 6;
      return TOKEN_INFO[mint]?.decimals ?? 9;
    },
    []
  );

  const fetchQuote = useCallback(async () => {
    // Clear prior error
    setQuoteError(null);

    // Network guard: Jupiter quoting is mainnet-first; devnet commonly returns empty/errors.
    if (!isMainnet) {
      setQuote(null);
      setQuoteError("Quotes are available on Mainnet only.");
      return;
    }

    // Basic input validation
    const amtUi = parseFloat(inputAmount || "0");
    if (!inputMint || !outputMint || !inputAmount || !Number.isFinite(amtUi) || amtUi <= 0) {
      setQuote(null);
      return;
    }

    // Debug: confirm mints are real addresses, not symbols
    // Remove later if you want.
    // eslint-disable-next-line no-console
    console.log("QUOTE PARAMS", {
      inputMint,
      outputMint,
      inputAmount: amtUi,
      slippage,
      isMainnet,
    });

    // Convert UI amount -> base units
    const decimals = resolveDecimals(inputMint);
    const amount = Math.floor(amtUi * Math.pow(10, decimals));

    if (!Number.isFinite(amount) || amount <= 0) {
      setQuote(null);
      setQuoteError("Invalid amount.");
      return;
    }

    setLoading(true);
    try {
      // slippage is percent (e.g. 1.0%), Jupiter needs bps (e.g. 100)
      const slippageBps = Math.round(slippage * 100);

      const quoteResponse = await getQuote(inputMint, outputMint, amount, slippageBps);

      // Some implementations return undefined/null if no route
      if (!quoteResponse) {
        setQuote(null);
        setQuoteError("No route available for this pair/size.");
        return;
      }

      setQuote(quoteResponse);
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error("Quote error:", e);
      setQuote(null);

      const msg =
        typeof e?.message === "string"
          ? e.message
          : "Quote failed. Check token mints, amount, and network.";

      setQuoteError(msg);
    } finally {
      setLoading(false);
    }
  }, [inputMint, outputMint, inputAmount, slippage, isMainnet, resolveDecimals]);

  // Debounced quoting on changes
  useEffect(() => {
    const t = setTimeout(() => {
      void fetchQuote();
    }, 450);
    return () => clearTimeout(t);
  }, [fetchQuote]);

  const handleSwap = async () => {
    if (!isMainnet) {
      toast.error("Switch to Mainnet to execute swaps.");
      return;
    }

    if (!publicKey || !signTransaction) {
      toast.error("Please connect your wallet first.");
      return;
    }

    if (!quote) {
      toast.error("No quote available.");
      return;
    }

    setSwapping(true);

    try {
      const swapResponse = await getSwapTransaction(quote, publicKey.toBase58());
      if (!swapResponse?.swapTransaction) {
        throw new Error("Failed to get swap transaction.");
      }

      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, "base64");
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      const signedTransaction = await signTransaction(transaction);
      const rawTransaction = signedTransaction.serialize();

      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });

      await connection.confirmTransaction(txid, "confirmed");

      // Save trade
      const outputDecimals = resolveDecimals(outputMint);
      const outputAmount = parseFloat(quote.outAmount) / Math.pow(10, outputDecimals);

      await saveTrade({
        wallet_address: publicKey.toBase58(),
        direction: inputMint === SOL_MINT ? "BUY" : "SELL",
        input_mint: inputMint,
        output_mint: outputMint,
        input_amount: parseFloat(inputAmount),
        output_amount_est: outputAmount,
        tx_sig: txid,
      });

      const explorerUrl = getExplorerUrl(txid, isMainnet);

      toast.success(
        <div className="flex flex-col gap-2">
          <span>Swap successful!</span>
          <a
            href={explorerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-terminal-blue hover:underline text-sm"
          >
            View on Solscan <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      );

      // Reset
      setInputAmount("");
      setQuote(null);
      setQuoteError(null);
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.error("Swap error:", error);

      if (error?.message?.includes("User rejected")) {
        toast.error("Transaction cancelled by user.");
      } else {
        toast.error(`Swap failed: ${error?.message || "Unknown error"}`);
      }
    } finally {
      setSwapping(false);
    }
  };

  const handleFlip = () => {
    // Flip mints
    const tempMint = inputMint;
    setInputMint(outputMint);
    setOutputMint(tempMint);

    // Reset amount + quote
    setInputAmount("");
    setQuote(null);
    setQuoteError(null);
  };

  const priceImpact = quote ? calculatePriceImpact(quote.priceImpactPct) : null;

  const outputDecimals = resolveDecimals(outputMint);
  const estimatedOut = quote ? parseFloat(quote.outAmount) / Math.pow(10, outputDecimals) : 0;

  const showHighSlippageWarning = slippage > 2.0;

  return (
    <div className="space-y-4">
      {/* Devnet warning */}
      {!isMainnet && (
        <div className="bg-secondary/50 border border-border rounded-sm p-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-terminal-yellow" />
            <div className="space-y-1">
              <div className="font-mono">Mainnet required</div>
              <div className="text-muted-foreground text-xs">
                Quotes and swaps are available on Mainnet only. Switch networks to trade.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* From Token */}
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            From
          </span>
          {/* Only show SOL presets if SOL is selected */}
          <div className="flex gap-1">
            {SIZE_PRESETS.map((size) => (
              <Button
                key={size}
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
                onClick={() => setInputAmount(size.toString())}
                disabled={inputMint !== SOL_MINT}
                title={inputMint !== SOL_MINT ? "Presets are for SOL input" : undefined}
              >
                {size} SOL
              </Button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <TokenSelector
            selectedMint={inputMint}
            onSelect={(m) => {
              setInputMint(m);
              setQuote(null);
              setQuoteError(null);
            }}
            label="Select Input Token"
          />

          <Input
            type="number"
            placeholder="0.00"
            value={inputAmount}
            onChange={(e) => {
              setInputAmount(e.target.value);
              setQuoteError(null);
            }}
            className="text-right text-lg border-0 bg-transparent focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Flip Button */}
      <div className="flex justify-center -my-2 relative z-10">
        <Button
          variant="outline"
          size="icon"
          onClick={handleFlip}
          className="rounded-full h-8 w-8 bg-card"
          disabled={!outputMint}
          title={!outputMint ? "Select an output token first" : undefined}
        >
          <ArrowDownUp className="h-4 w-4" />
        </Button>
      </div>

      {/* To Token */}
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            To
          </span>
          <span className="text-xs text-muted-foreground">
            {outputMint ? "Search token or paste mint" : ""}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <TokenSelector
            selectedMint={outputMint}
            onSelect={(m) => {
              setOutputMint(m);
              setQuote(null);
              setQuoteError(null);
            }}
            label="Select Output Token"
          />

          <div className="flex-1 text-right">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin ml-auto text-muted-foreground" />
            ) : (
              <span className="text-lg font-mono">
                {estimatedOut > 0 ? formatAmount(estimatedOut) : "—"}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Slippage */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Slippage
        </span>

        <div className="flex items-center gap-2">
          {showHighSlippageWarning && (
            <span className="text-xs text-terminal-yellow font-mono">
              High slippage risk
            </span>
          )}
          <div className="flex gap-1">
            {SLIPPAGE_OPTIONS.map((opt) => (
              <Button
                key={opt}
                variant={slippage === opt ? "secondary" : "ghost"}
                size="sm"
                className="text-xs h-6 px-2"
                onClick={() => setSlippage(opt)}
              >
                {opt}%
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Quote Error */}
      {quoteError && (
        <div className="bg-secondary/50 border border-border rounded-sm p-3 text-sm">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 text-terminal-yellow" />
            <div className="space-y-1">
              <div className="font-mono">Quote unavailable</div>
              <div className="text-muted-foreground text-xs">{quoteError}</div>
            </div>
          </div>
        </div>
      )}

      {/* Quote Details */}
      {quote && (
        <div className="bg-secondary/50 border border-border rounded-sm p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Route</span>
            <span className="font-mono">{formatRouteLabel(quote.routePlan)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Price Impact</span>
            <span
              className={`font-mono ${
                priceImpact?.severity === "high"
                  ? "text-terminal-red"
                  : priceImpact?.severity === "medium"
                  ? "text-terminal-yellow"
                  : "text-terminal-green"
              }`}
            >
              {priceImpact?.value.toFixed(2)}%
            </span>
          </div>

          {priceImpact?.severity === "high" && (
            <div className="flex items-center gap-2 text-terminal-red text-xs">
              <AlertTriangle className="h-3 w-3" />
              High price impact. Consider smaller size.
            </div>
          )}
        </div>
      )}

      {/* Swap Button */}
      <Button
        variant="terminal"
        className="w-full"
        size="lg"
        onClick={handleSwap}
        disabled={!publicKey || !quote || swapping || !isMainnet}
      >
        {swapping ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Swapping...
          </>
        ) : !isMainnet ? (
          "Switch to Mainnet"
        ) : !publicKey ? (
          "Connect Wallet"
        ) : !outputMint ? (
          "Select Token"
        ) : !quote ? (
          "Enter Amount"
        ) : (
          "Execute Swap"
        )}
      </Button>

      {/* Footer context line (Baseline trust cue) */}
      <div className="text-xs text-muted-foreground font-mono text-center pt-1">
        Non-custodial · Routed via Jupiter · Signed locally
      </div>
    </div>
  );
};
