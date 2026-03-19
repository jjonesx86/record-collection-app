import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';

const PLACEHOLDER = require('../../assets/placeholder-album.png');

interface Props {
  uri?: string;
  size?: number;
  style?: object;
}

export function AlbumArtImage({ uri, size = 60, style }: Props) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [uri]);

  return (
    <Image
      source={uri && !failed ? { uri } : PLACEHOLDER}
      style={[{ width: size, height: size, borderRadius: 4 }, style]}
      contentFit="cover"
      transition={200}
      onError={() => setFailed(true)}
    />
  );
}
