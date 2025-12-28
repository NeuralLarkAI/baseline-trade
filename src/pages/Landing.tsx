import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Zap, Target, TrendingUp, Wallet, BarChart3 } from "lucide-react";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.02] bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,hsl(var(--foreground))_2px,hsl(var(--foreground))_4px)]" />
        
        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--muted)/0.03)_1px,transparent_1px),linear-gradient(90deg,hsl(var(--muted)/0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        
        <div className="relative z-10 max-w-4xl mx-auto text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-muted/30 mb-8">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-sm text-muted-foreground font-mono">DEVNET MODE</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 font-mono">
            Baseline Terminal
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Trade Solana with discipline. Non-custodial. Best routes.
          </p>
          
          <Link to="/terminal">
            <Button variant="hero" size="lg" className="group">
              Launch Terminal
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
        
        {/* Floating terminal preview */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-full max-w-3xl px-6 opacity-30 pointer-events-none">
          <div className="border border-border/30 rounded-lg bg-card/20 backdrop-blur-sm p-4 font-mono text-xs text-muted-foreground">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-destructive/50" />
              <div className="w-2 h-2 rounded-full bg-amber-500/50" />
              <div className="w-2 h-2 rounded-full bg-primary/50" />
            </div>
            <div className="space-y-1">
              <p>$ connecting wallet...</p>
              <p>$ fetching jupiter quote...</p>
              <p className="text-primary">$ ready to trade</p>
            </div>
          </div>
        </div>
      </section>

      {/* What Baseline Is */}
      <section className="py-24 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-mono text-center">
            What Baseline Is
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-16">
            Baseline is about discipline over prediction. We don't chase pumps or panic on dumps. 
            We execute with clear rules, manage risk first, and trade with intention.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border border-border/50 bg-card/30 hover:border-primary/30 transition-colors">
              <Target className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Discipline First</h3>
              <p className="text-muted-foreground">
                Set your rules. Follow your rules. No emotional trades, no FOMO entries.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-border/50 bg-card/30 hover:border-primary/30 transition-colors">
              <Shield className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Non-Custodial</h3>
              <p className="text-muted-foreground">
                Your keys, your crypto. We never store private keys. All swaps require your signature.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-border/50 bg-card/30 hover:border-primary/30 transition-colors">
              <Zap className="w-10 h-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Best Routes</h3>
              <p className="text-muted-foreground">
                Powered by Jupiter aggregator. Get the best prices across all Solana DEXs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-6 bg-muted/10 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-16 font-mono text-center">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { icon: Wallet, step: "01", title: "Connect Wallet", desc: "Phantom or Solflare" },
              { icon: TrendingUp, step: "02", title: "Get Quote", desc: "Best route via Jupiter" },
              { icon: Shield, step: "03", title: "Sign Transaction", desc: "Your wallet, your key" },
              { icon: BarChart3, step: "04", title: "Execute Swap", desc: "On-chain in seconds" },
            ].map((item, i) => (
              <div key={i} className="text-center p-6">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full border border-border bg-card mb-4">
                  <item.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-xs text-muted-foreground font-mono mb-2">{item.step}</div>
                <h3 className="text-lg font-semibold mb-1">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Risk First */}
      <section className="py-24 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-mono text-center">
            Risk First
          </h2>
          <p className="text-lg text-muted-foreground text-center max-w-3xl mx-auto mb-12">
            Before you think about profit, think about what you can afford to lose.
          </p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="p-6 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <h3 className="text-lg font-semibold mb-3 text-amber-400">Slippage Protection</h3>
              <p className="text-muted-foreground text-sm">
                Default 1% slippage tolerance. Adjust based on market conditions and token liquidity.
              </p>
            </div>
            
            <div className="p-6 rounded-lg border border-amber-500/30 bg-amber-500/5">
              <h3 className="text-lg font-semibold mb-3 text-amber-400">Size Presets</h3>
              <p className="text-muted-foreground text-sm">
                Pre-defined position sizes (0.1, 0.25, 0.5 SOL) to prevent overexposure.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6 border-t border-border/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 font-mono">
            Ready to Trade?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Connect your wallet and start trading with discipline.
          </p>
          <Link to="/terminal">
            <Button variant="hero" size="lg" className="group">
              Launch Terminal
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-border/30">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-mono text-sm text-muted-foreground">
            BASELINE TERMINAL
          </div>
          <div className="text-xs text-muted-foreground">
            Non-custodial trading. Your keys, your crypto.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
