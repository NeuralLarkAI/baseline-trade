import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NetworkProvider } from "@/contexts/NetworkContext";
import { TradeProvider } from "@/contexts/TradeContext";
import { WalletProvider } from "@/components/WalletProvider";
import { Header } from "@/components/Header";
import { SwapCard } from "@/components/SwapCard";
import { BaselineFeed } from "@/components/BaselineFeed";
import { AlertsPanel } from "@/components/AlertsPanel";
import { WatchlistSidebar } from "@/components/WatchlistSidebar";
import { PortfolioPanel } from "@/components/PortfolioPanel";

const TerminalContent = () => {
  const [activeTab, setActiveTab] = useState("trade");

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Watchlist */}
        <aside className="hidden lg:block w-72 border-r border-border/50 overflow-y-auto">
          <WatchlistSidebar />
        </aside>

        {/* Center - Main Content */}
        <main className="flex-1 overflow-y-auto p-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
            <TabsList className="w-full justify-start bg-muted/30 border border-border/50 mb-4">
              <TabsTrigger 
                value="trade" 
                className="font-mono data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Trade
              </TabsTrigger>
              <TabsTrigger 
                value="feed" 
                className="font-mono data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Baseline Feed
              </TabsTrigger>
              <TabsTrigger 
                value="alerts" 
                className="font-mono data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                Alerts
              </TabsTrigger>
            </TabsList>

            <TabsContent value="trade" className="mt-0">
              <div className="max-w-xl mx-auto">
                <SwapCard />
              </div>
            </TabsContent>

            <TabsContent value="feed" className="mt-0">
              <BaselineFeed onTradeClick={() => setActiveTab("trade")} />
            </TabsContent>

            <TabsContent value="alerts" className="mt-0">
              <AlertsPanel />
            </TabsContent>
          </Tabs>
        </main>

        {/* Right Sidebar - Portfolio */}
        <aside className="hidden xl:block w-80 border-l border-border/50 overflow-y-auto">
          <PortfolioPanel />
        </aside>
      </div>
    </div>
  );
};

const Terminal = () => {
  return (
    <NetworkProvider>
      <WalletProvider>
        <TradeProvider>
          <TerminalContent />
        </TradeProvider>
      </WalletProvider>
    </NetworkProvider>
  );
};

export default Terminal;
