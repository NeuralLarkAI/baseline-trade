import { supabase } from '@/integrations/supabase/client';

// Watchlist functions
export const getWatchlist = async (walletAddress: string) => {
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }
  return data || [];
};

export const addToWatchlist = async (walletAddress: string, tokenMint: string, symbol: string) => {
  const { error } = await supabase
    .from('watchlist')
    .upsert({ wallet_address: walletAddress, token_mint: tokenMint, symbol });

  if (error) {
    console.error('Error adding to watchlist:', error);
    throw error;
  }
};

export const removeFromWatchlist = async (walletAddress: string, tokenMint: string) => {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('wallet_address', walletAddress)
    .eq('token_mint', tokenMint);

  if (error) {
    console.error('Error removing from watchlist:', error);
    throw error;
  }
};

// Alerts functions
export const getAlerts = async (walletAddress: string) => {
  const { data, error } = await supabase
    .from('alerts')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching alerts:', error);
    return [];
  }
  return data || [];
};

export const createAlert = async (
  walletAddress: string,
  tokenMint: string,
  targetPrice: number,
  direction: 'above' | 'below',
  note?: string
) => {
  const { error } = await supabase.from('alerts').insert({
    wallet_address: walletAddress,
    token_mint: tokenMint,
    target_price: targetPrice,
    direction,
    note,
  });

  if (error) {
    console.error('Error creating alert:', error);
    throw error;
  }
};

export const updateAlert = async (id: string, updates: { is_active?: boolean; is_triggered?: boolean }) => {
  const { error } = await supabase.from('alerts').update(updates).eq('id', id);

  if (error) {
    console.error('Error updating alert:', error);
    throw error;
  }
};

export const deleteAlert = async (id: string) => {
  const { error } = await supabase.from('alerts').delete().eq('id', id);

  if (error) {
    console.error('Error deleting alert:', error);
    throw error;
  }
};

// Signals functions (Baseline Feed)
export const getSignals = async () => {
  const { data, error } = await supabase
    .from('signals')
    .select('*')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching signals:', error);
    return [];
  }
  return data || [];
};

export const createSignal = async (signal: {
  text: string;
  tags?: string[];
  token_mint?: string;
  action?: 'BUY' | 'SELL' | 'WATCH';
  prefill_size?: number;
  is_pinned?: boolean;
}) => {
  const { error } = await supabase.from('signals').insert(signal);

  if (error) {
    console.error('Error creating signal:', error);
    throw error;
  }
};

export const updateSignal = async (
  id: string,
  updates: Partial<{
    text: string;
    tags: string[];
    token_mint: string;
    action: 'BUY' | 'SELL' | 'WATCH';
    prefill_size: number;
    is_pinned: boolean;
  }>
) => {
  const { error } = await supabase.from('signals').update(updates).eq('id', id);

  if (error) {
    console.error('Error updating signal:', error);
    throw error;
  }
};

export const deleteSignal = async (id: string) => {
  const { error } = await supabase.from('signals').delete().eq('id', id);

  if (error) {
    console.error('Error deleting signal:', error);
    throw error;
  }
};

// Trades functions
export const saveTrade = async (trade: {
  wallet_address: string;
  direction: 'BUY' | 'SELL';
  input_mint: string;
  output_mint: string;
  input_amount: number;
  output_amount_est: number;
  tx_sig?: string;
}) => {
  const { error } = await supabase.from('trades').insert(trade);

  if (error) {
    console.error('Error saving trade:', error);
    throw error;
  }
};

export const getTrades = async (walletAddress: string) => {
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .eq('wallet_address', walletAddress)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching trades:', error);
    return [];
  }
  return data || [];
};

// Profile functions
export const ensureProfile = async (walletAddress: string) => {
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', walletAddress)
    .maybeSingle();

  if (!existing) {
    const { error } = await supabase.from('profiles').insert({ wallet_address: walletAddress });
    if (error && !error.message.includes('duplicate')) {
      console.error('Error creating profile:', error);
    }
  }
};
