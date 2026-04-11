import React, { useMemo, useState } from 'react';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

const DEFAULT_FALLBACK_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
    <rect width="120" height="120" fill="#f3f4f6"/>
    <path d="M24 84l20-24 14 16 10-12 28 20H24z" fill="#cbd5e1"/>
    <circle cx="44" cy="40" r="8" fill="#cbd5e1"/>
  </svg>`
)}`;

const ZoomableImage = ({ src, alt, thumbnailWidth = 50, thumbnailHeight = 50, fallbackSrc }) => {
  const resolvedFallbackSrc = useMemo(() => fallbackSrc || DEFAULT_FALLBACK_SVG, [fallbackSrc]);
  const [failedSrc, setFailedSrc] = useState(null);
  const isUsingFallback = !src || failedSrc === src;
  const currentSrc = isUsingFallback ? resolvedFallbackSrc : src;

  const handleImageError = () => {
    if (src) {
      setFailedSrc(src);
    }
  };

  const thumbnailStyle = {
    cursor: isUsingFallback ? 'default' : 'pointer',
    width: thumbnailWidth,
    height: thumbnailHeight,
    objectFit: 'cover',
    borderRadius: 6,
  };

  const imageElement = (
    <>
      {/* react-medium-image-zoom requiere un img real para manejar correctamente el overlay */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={currentSrc}
        alt={isUsingFallback ? '' : alt}
        style={thumbnailStyle}
        loading='lazy'
        onError={handleImageError}
      />
    </>
  );

  if (isUsingFallback) {
    return imageElement;
  }

  return (
    <Zoom
      zoomImg={{
        src: currentSrc,
        alt,
        style: {
          width: 'auto',
          height: 'auto',
          maxWidth: '92vw',
          maxHeight: '92vh',
          objectFit: 'contain',
        },
      }}
    >
      {imageElement}
    </Zoom>
  );
};

export default ZoomableImage;