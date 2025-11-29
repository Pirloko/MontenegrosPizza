import React, { useState, useEffect, useRef } from 'react';
import { Spinner } from 'react-bootstrap';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  className = '',
  style = {},
  placeholder = '/images/placeholder.jpg',
  onLoad,
  onError
}: LazyImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(placeholder);
  const [imageRef, setImageRef] = useState<HTMLImageElement | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (!imageRef) return;

    // Configurar Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Imagen visible, cargar
            loadImage();
            observerRef.current?.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Cargar 50px antes de que sea visible
        threshold: 0.01
      }
    );

    observerRef.current.observe(imageRef);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [imageRef, src]);

  const loadImage = () => {
    const img = new Image();
    
    img.onload = () => {
      setImageSrc(src);
      setIsLoading(false);
      setHasError(false);
      if (onLoad) onLoad();
    };

    img.onerror = () => {
      setIsLoading(false);
      setHasError(true);
      if (onError) onError();
    };

    img.src = src;
  };

  return (
    <div className="position-relative" style={{ ...style, overflow: 'hidden' }}>
      <img
        ref={setImageRef}
        src={imageSrc}
        alt={alt}
        className={`${className} ${isLoading ? 'opacity-50' : 'opacity-100'}`}
        style={{
          ...style,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      
      {isLoading && (
        <div 
          className="position-absolute top-50 start-50 translate-middle"
          style={{ zIndex: 1 }}
        >
          <Spinner animation="border" size="sm" variant="danger" />
        </div>
      )}

      {hasError && !isLoading && (
        <div
          className="position-absolute top-50 start-50 translate-middle text-center text-muted"
          style={{ zIndex: 1 }}
        >
          <small>Error al cargar imagen</small>
        </div>
      )}
    </div>
  );
}

