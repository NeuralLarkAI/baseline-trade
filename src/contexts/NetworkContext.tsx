import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface NetworkContextType {
  isMainnet: boolean;
  setMainnet: (confirmed: boolean) => void;
  showMainnetModal: boolean;
  setShowMainnetModal: (show: boolean) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isMainnet, setIsMainnet] = useState(false);
  const [showMainnetModal, setShowMainnetModal] = useState(false);

  const setMainnet = useCallback((confirmed: boolean) => {
    if (confirmed) {
      setIsMainnet(true);
    }
    setShowMainnetModal(false);
  }, []);

  return (
    <NetworkContext.Provider value={{ isMainnet, setMainnet, showMainnetModal, setShowMainnetModal }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
