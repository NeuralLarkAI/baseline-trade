import React from 'react';
import { useNetwork } from '@/contexts/NetworkContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

export const NetworkToggle: React.FC = () => {
  const { isMainnet, setMainnet, showMainnetModal, setShowMainnetModal } = useNetwork();

  const handleToggle = () => {
    if (isMainnet) {
      setMainnet(false);
    } else {
      setShowMainnetModal(true);
    }
  };

  return (
    <>
      <Button
        variant={isMainnet ? 'warning' : 'outline'}
        size="sm"
        onClick={handleToggle}
        className="text-xs"
      >
        {isMainnet ? 'MAINNET' : 'DEVNET'}
      </Button>

      <AlertDialog open={showMainnetModal} onOpenChange={setShowMainnetModal}>
        <AlertDialogContent className="border-warning/50 bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              Switch to Mainnet
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground space-y-3">
              <p>
                You are about to switch to <strong className="text-foreground">Solana Mainnet</strong>.
              </p>
              <p>
                This means you will be trading with <strong className="text-warning">real funds</strong>.
                All transactions are final and irreversible.
              </p>
              <p className="text-sm border border-warning/30 bg-warning/5 p-3 rounded">
                By confirming, you acknowledge that you understand the risks involved in trading
                real assets and that Baseline Terminal is not responsible for any losses.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setMainnet(true)}
              className="bg-warning text-warning-foreground hover:bg-warning/90"
            >
              I understand I'm trading real funds
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
