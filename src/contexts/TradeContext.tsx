import React, { createContext, useContext, useState, ReactNode } from 'react';

interface TradeContextType {
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  slippage: number;
  setInputMint: (mint: string) => void;
  setOutputMint: (mint: string) => void;
  setInputAmount: (amount: string) => void;
  setSlippage: (slippage: number) => void;
  prefillTrade: (outputMint: string, amount: number, action: 'BUY' | 'SELL') => void;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export const TradeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [inputMint, setInputMint] = useState(SOL_MINT);
  const [outputMint, setOutputMint] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [slippage, setSlippage] = useState(1.0);

  const prefillTrade = (tokenMint: string, amount: number, action: 'BUY' | 'SELL') => {
    if (action === 'BUY') {
      setInputMint(SOL_MINT);
      setOutputMint(tokenMint);
      setInputAmount(amount.toString());
    } else {
      setInputMint(tokenMint);
      setOutputMint(SOL_MINT);
      setInputAmount(amount.toString());
    }
  };

  return (
    <TradeContext.Provider
      value={{
        inputMint,
        outputMint,
        inputAmount,
        slippage,
        setInputMint,
        setOutputMint,
        setInputAmount,
        setSlippage,
        prefillTrade,
      }}
    >
      {children}
    </TradeContext.Provider>
  );
};

export const useTrade = (): TradeContextType => {
  const context = useContext(TradeContext);
  if (!context) {
    throw new Error('useTrade must be used within a TradeProvider');
  }
  return context;
};
