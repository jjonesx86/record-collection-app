import React, { useState, useEffect } from 'react';
import { View } from 'react-native';

interface Props {
  uri?: string;
  size?: number;
  style?: object;
}

export function AlbumArtImage({ uri, size = 60, style }: Props) {
  const [mounted, setMounted] = useState(false);
  const [failed, setFailed] = useState(false);

  // Only render the real image client-side to avoid SSR hydration mismatches.
  // During static rendering, we output a neutral placeholder box.
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  const containerStyle = [{ width: size, height: size, borderRadius: 4, overflow: 'hidden' as const, backgroundColor: '#E5E5EA' }, style as object];

  if (!mounted || !uri || failed) {
    return <View style={containerStyle} />;
  }

  return (
    <View style={containerStyle}>
      <img
        src={uri}
        onError={() => setFailed(true)}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    </View>
  );
}
