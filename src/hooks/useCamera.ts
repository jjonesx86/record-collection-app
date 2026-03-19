import { useState, useCallback } from 'react';
import { useCameraPermissions } from 'expo-camera';

export function useCamera() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);

  const resetScan = useCallback(() => setScanned(false), []);

  return {
    hasPermission: permission?.granted ?? false,
    isLoading: permission === null,
    requestPermission,
    scanned,
    setScanned,
    resetScan,
  };
}
