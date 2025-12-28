-- Create profiles table for wallet addresses
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can read profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Anyone can insert their own profile
CREATE POLICY "Anyone can create profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (true);

-- Create watchlist table
CREATE TABLE public.watchlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_mint TEXT NOT NULL,
  symbol TEXT NOT NULL,
  added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wallet_address, token_mint)
);

-- Enable RLS
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Anyone can read watchlist
CREATE POLICY "Watchlist viewable by everyone" 
ON public.watchlist 
FOR SELECT 
USING (true);

-- Anyone can manage their watchlist
CREATE POLICY "Anyone can insert watchlist" 
ON public.watchlist 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete their watchlist" 
ON public.watchlist 
FOR DELETE 
USING (true);

-- Create alerts table
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_mint TEXT NOT NULL,
  target_price DECIMAL NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('above', 'below')),
  note TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_triggered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Anyone can read alerts
CREATE POLICY "Alerts viewable by everyone" 
ON public.alerts 
FOR SELECT 
USING (true);

-- Anyone can manage alerts
CREATE POLICY "Anyone can insert alerts" 
ON public.alerts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update alerts" 
ON public.alerts 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete alerts" 
ON public.alerts 
FOR DELETE 
USING (true);

-- Create signals table (for Baseline Feed)
CREATE TABLE public.signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL CHECK (char_length(text) <= 280),
  tags TEXT[] DEFAULT '{}',
  token_mint TEXT,
  action TEXT CHECK (action IS NULL OR action IN ('BUY', 'SELL', 'WATCH')),
  prefill_size DECIMAL CHECK (prefill_size IS NULL OR prefill_size IN (0.1, 0.25, 0.5)),
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.signals ENABLE ROW LEVEL SECURITY;

-- Anyone can read signals
CREATE POLICY "Signals viewable by everyone" 
ON public.signals 
FOR SELECT 
USING (true);

-- Only admin can manage signals (will check via app logic)
CREATE POLICY "Anyone can manage signals" 
ON public.signals 
FOR ALL 
USING (true);

-- Create trades table
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  input_mint TEXT NOT NULL,
  output_mint TEXT NOT NULL,
  input_amount DECIMAL NOT NULL,
  output_amount_est DECIMAL NOT NULL,
  tx_sig TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;

-- Anyone can read trades
CREATE POLICY "Trades viewable by everyone" 
ON public.trades 
FOR SELECT 
USING (true);

-- Anyone can insert trades
CREATE POLICY "Anyone can insert trades" 
ON public.trades 
FOR INSERT 
WITH CHECK (true);