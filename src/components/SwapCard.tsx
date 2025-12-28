import React, { useState, useEffect, useCallback } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { VersionedTransaction } from '@solana/web3.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTrade } from '@/contexts/TradeContext';
import { useNetwork } from '@/contexts/NetworkContext';
import { getQuote, getSwapTransaction, QuoteResponse, calculatePriceImpact, formatRouteLabel } from '@/lib/jupiter';
import { TOKEN_INFO, SOL_MINT, formatAmount, getExplorerUrl } from '@/lib/solana';
import { saveTrade } from '@/lib/db';
import { toast } from 'sonner';
import { ArrowDownUp, Loader2, ExternalLink, AlertTriangle } from 'lucide-react';

const SIZE_PRESETS = [0.1, 0.25, 0.5];
const SLIPPAGE_OPTIONS = [0.5, 1.0, 2.0];

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

  const inputToken = TOKEN_INFO[inputMint];
  const outputToken = TOKEN_INFO[outputMint];

  const fetchQuote = useCallback(async () => {
    if (!inputMint || !outputMint || !inputAmount || parseFloat(inputAmount) <= 0) {
      setQuote(null);
      return;
    }

    const decimals = inputToken?.decimals || 9;
    const amount = Math.floor(parseFloat(inputAmount) * Math.pow(10, decimals));

    setLoading(true);
    const quoteResponse = await getQuote(inputMint, outputMint, amount, Math.round(slippage * 100));
    setQuote(quoteResponse);
    setLoading(false);
  }, [inputMint, outputMint, inputAmount, slippage, inputToken]);

  useEffect(() => {
    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [fetchQuote]);

  const handleSwap = async () => {
    if (!publicKey || !signTransaction || !quote) {
      toast.error('Please connect your wallet first');
      return;
    }

    setSwapping(true);

    try {
      const swapResponse = await getSwapTransaction(quote, publicKey.toBase58());
      
      if (!swapResponse) {
        throw new Error('Failed to get swap transaction');
      }

      const swapTransactionBuf = Buffer.from(swapResponse.swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      const signedTransaction = await signTransaction(transaction);
      const rawTransaction = signedTransaction.serialize();
      
      const txid = await connection.sendRawTransaction(rawTransaction, {
        skipPreflight: true,
        maxRetries: 2,
      });

      await connection.confirmTransaction(txid, 'confirmed');

      // Save trade to database
      const outputDecimals = outputToken?.decimals || 9;
      const outputAmount = parseFloat(quote.outAmount) / Math.pow(10, outputDecimals);
      
      await saveTrade({
        wallet_address: publicKey.toBase58(),
        direction: inputMint === SOL_MINT ? 'BUY' : 'SELL',
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

      // Reset form
      setInputAmount('');
      setQuote(null);
    } catch (error: any) {
      console.error('Swap error:', error);
      if (error.message?.includes('User rejected')) {
        toast.error('Transaction cancelled by user');
      } else {
        toast.error(`Swap failed: ${error.message || 'Unknown error'}`);
      }
    } finally {
      setSwapping(false);
    }
  };

  const handleFlip = () => {
    const tempMint = inputMint;
    setInputMint(outputMint);
    setOutputMint(tempMint);
    setInputAmount('');
  };

  const priceImpact = quote ? calculatePriceImpact(quote.priceImpactPct) : null;
  const outputDecimals = outputToken?.decimals || 9;
  const estimatedOut = quote ? parseFloat(quote.outAmount) / Math.pow(10, outputDecimals) : 0;

  return (
    <div className="space-y-4">
      {/* From Token */}
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">From</span>
          <div className="flex gap-1">
            {SIZE_PRESETS.map((size) => (
              <Button
                key={size}
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
                onClick={() => setInputAmount(size.toString())}
              >
                {size} SOL
              </Button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-[100px]">
            {inputToken?.logoURI && (
              <img src={inputToken.logoURI} alt="" className="w-6 h-6 rounded-full" />
            )}
            <span className="font-mono font-medium">{inputToken?.symbol || 'Select'}</span>
          </div>
          <Input
            type="number"
            placeholder="0.00"
            value={inputAmount}
            onChange={(e) => setInputAmount(e.target.value)}
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
        >
          <ArrowDownUp className="h-4 w-4" />
        </Button>
      </div>

      {/* To Token */}
      <div className="bg-card border border-border rounded-sm p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">To</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 min-w-[100px]">
            {outputToken?.logoURI && (
              <img src={outputToken.logoURI} alt="" className="w-6 h-6 rounded-full" />
            )}
            <span className="font-mono font-medium">{outputToken?.symbol || 'Select'}</span>
          </div>
          <div className="flex-1 text-right">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin ml-auto text-muted-foreground" />
            ) : (
              <span className="text-lg font-mono">{estimatedOut > 0 ? formatAmount(estimatedOut) : '—'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Slippage */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Slippage</span>
        <div className="flex gap-1">
          {SLIPPAGE_OPTIONS.map((opt) => (
            <Button
              key={opt}
              variant={slippage === opt ? 'secondary' : 'ghost'}
              size="sm"
              className="text-xs h-6 px-2"
              onClick={() => setSlippage(opt)}
            >
              {opt}%
            </Button>
          ))}
        </div>
      </div>

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
                priceImpact?.severity === 'high'
                  ? 'text-terminal-red'
                  : priceImpact?.severity === 'medium'
                  ? 'text-terminal-yellow'
                  : 'text-terminal-green'
              }`}
            >
              {priceImpact?.value.toFixed(2)}%
            </span>
          </div>
          {priceImpact?.severity === 'high' && (
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
        disabled={!publicKey || !quote || swapping}
      >
        {swapping ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Swapping...
          </>
        ) : !publicKey ? (
          'Connect Wallet'
        ) : !quote ? (
          'Enter Amount'
        ) : (
          'Execute Swap'
        )}
      </Button>
    </div>
  );
};
