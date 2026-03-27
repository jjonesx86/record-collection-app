import { useState, useCallback } from 'react';

export function useCamera() {
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [scanned, setScanned] = useState(false);

  const requestPermission = useCallback(async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setHasPermission(true);
    } catch {
      setHasPermission(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetScan = useCallback(() => setScanned(false), []);

  return {
    hasPermission,
    isLoading,
    requestPermission,
    scanned,
    setScanned,
    resetScan,
  };
}
