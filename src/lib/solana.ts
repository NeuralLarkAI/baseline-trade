import { Connection, PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';

// Endpoints
export const DEVNET_ENDPOINT = 'https://api.devnet.solana.com';
export const MAINNET_ENDPOINT = 'https://api.mainnet-beta.solana.com';

// Common token mints
export const SOL_MINT = 'So11111111111111111111111111111111111111112';
export const USDC_MINT_DEVNET = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
export const USDC_MINT_MAINNET = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

// Token info map for common tokens
export const TOKEN_INFO: Record<string, { symbol: string; name: string; decimals: number; logoURI?: string }> = {
  [SOL_MINT]: {
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
  },
  [USDC_MINT_DEVNET]: {
    symbol: 'USDC',
    name: 'USD Coin (Devnet)',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
  [USDC_MINT_MAINNET]: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoURI: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v/logo.png',
  },
};

export const createConnection = (isMainnet: boolean): Connection => {
  const endpoint = isMainnet ? MAINNET_ENDPOINT : DEVNET_ENDPOINT;
  return new Connection(endpoint, 'confirmed');
};

export const getSOLBalance = async (connection: Connection, publicKey: PublicKey): Promise<number> => {
  try {
    const balance = await connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error fetching SOL balance:', error);
    return 0;
  }
};

export const getSPLTokenBalances = async (
  connection: Connection,
  publicKey: PublicKey
): Promise<Array<{ mint: string; balance: number; decimals: number }>> => {
  try {
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
    });

    return tokenAccounts.value.map((account) => {
      const parsed = account.account.data.parsed.info;
      return {
        mint: parsed.mint,
        balance: parsed.tokenAmount.uiAmount || 0,
        decimals: parsed.tokenAmount.decimals,
      };
    });
  } catch (error) {
    console.error('Error fetching SPL token balances:', error);
    return [];
  }
};

export const formatAddress = (address: string, chars = 4): string => {
  if (!address) return '';
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
};

export const formatAmount = (amount: number, decimals = 4): string => {
  if (amount === 0) return '0';
  if (amount < 0.0001) return '<0.0001';
  return amount.toFixed(decimals);
};

export const getExplorerUrl = (txSignature: string, isMainnet: boolean): string => {
  const cluster = isMainnet ? '' : '?cluster=devnet';
  return `https://solscan.io/tx/${txSignature}${cluster}`;
};

export const getTokenExplorerUrl = (mint: string, isMainnet: boolean): string => {
  const cluster = isMainnet ? '' : '?cluster=devnet';
  return `https://solscan.io/token/${mint}${cluster}`;
};
