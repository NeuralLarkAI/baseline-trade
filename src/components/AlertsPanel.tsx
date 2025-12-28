import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getAlerts, createAlert, deleteAlert, updateAlert } from '@/lib/db';
import { TOKEN_INFO, formatAddress } from '@/lib/solana';
import { toast } from 'sonner';
import { Bell, Trash2, Plus, Loader2 } from 'lucide-react';

interface Alert {
  id: string;
  wallet_address: string;
  token_mint: string;
  target_price: number;
  direction: 'above' | 'below';
  note?: string;
  is_active: boolean;
  is_triggered: boolean;
  created_at: string;
}

export const AlertsPanel: React.FC = () => {
  const { publicKey } = useWallet();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  
  // Form state
  const [showForm, setShowForm] = useState(false);
  const [tokenMint, setTokenMint] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [direction, setDirection] = useState<'above' | 'below'>('above');
  const [note, setNote] = useState('');

  const fetchAlerts = async () => {
    if (!publicKey) return;
    setLoading(true);
    const data = await getAlerts(publicKey.toBase58());
    setAlerts(data as Alert[]);
    setLoading(false);
  };

  useEffect(() => {
    if (publicKey) {
      fetchAlerts();
    }
  }, [publicKey]);

  const handleCreate = async () => {
    if (!publicKey || !tokenMint || !targetPrice) return;

    setCreating(true);
    try {
      await createAlert(
        publicKey.toBase58(),
        tokenMint,
        parseFloat(targetPrice),
        direction,
        note || undefined
      );
      toast.success('Alert created');
      setShowForm(false);
      setTokenMint('');
      setTargetPrice('');
      setNote('');
      await fetchAlerts();
    } catch (error) {
      toast.error('Failed to create alert');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteAlert(id);
      toast.success('Alert deleted');
      await fetchAlerts();
    } catch (error) {
      toast.error('Failed to delete alert');
    }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await updateAlert(id, { is_active: !isActive });
      await fetchAlerts();
    } catch (error) {
      toast.error('Failed to update alert');
    }
  };

  if (!publicKey) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Bell className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm">Connect wallet to create alerts</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground">Price Alerts</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowForm(!showForm)}
          className="text-xs"
        >
          <Plus className="h-3 w-3 mr-1" />
          New Alert
        </Button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-sm p-4 space-y-3 animate-fade-in">
          <Input
            placeholder="Token mint address"
            value={tokenMint}
            onChange={(e) => setTokenMint(e.target.value)}
          />
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Target price"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              className="flex-1"
            />
            <div className="flex">
              <Button
                variant={direction === 'above' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDirection('above')}
                className="rounded-r-none"
              >
                Above
              </Button>
              <Button
                variant={direction === 'below' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setDirection('below')}
                className="rounded-l-none"
              >
                Below
              </Button>
            </div>
          </div>
          <Input
            placeholder="Note (optional)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button
            variant="terminal"
            size="sm"
            onClick={handleCreate}
            disabled={creating || !tokenMint || !targetPrice}
            className="w-full"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Alert'}
          </Button>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          No alerts yet. Create one to get notified.
        </div>
      ) : (
        <div className="space-y-2">
          {alerts.map((alert) => {
            const tokenInfo = TOKEN_INFO[alert.token_mint];
            return (
              <div
                key={alert.id}
                className={`bg-card border rounded-sm p-3 ${
                  alert.is_triggered
                    ? 'border-terminal-green/50'
                    : alert.is_active
                    ? 'border-border'
                    : 'border-border opacity-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">
                      {tokenInfo?.symbol || formatAddress(alert.token_mint)}
                    </span>
                    <Badge
                      variant="secondary"
                      className={`text-xs ${
                        alert.direction === 'above'
                          ? 'text-terminal-green'
                          : 'text-terminal-red'
                      }`}
                    >
                      {alert.direction} ${alert.target_price}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleToggle(alert.id, alert.is_active)}
                    >
                      <Bell
                        className={`h-3 w-3 ${
                          alert.is_active ? 'text-terminal-green' : 'text-muted-foreground'
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 hover:text-destructive"
                      onClick={() => handleDelete(alert.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                {alert.note && (
                  <p className="text-xs text-muted-foreground mt-1">{alert.note}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
