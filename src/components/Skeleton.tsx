import React from 'react';

/**
 * Bloque 5: Skeleton elegante para estados de carga.
 * Usa clases del sistema de diseño (index.css).
 */
interface SkeletonProps {
  variant?: 'text' | 'avatar' | 'card' | 'custom';
  className?: string;
  style?: React.CSSProperties;
  lines?: number;
}

export function Skeleton({ variant = 'text', className = '', style, lines = 1 }: SkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={className} style={style}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={`skeleton skeleton-text ${i === lines - 1 && lines > 1 ? 'skeleton-text-last' : ''}`}
          />
        ))}
      </div>
    );
  }

  const variantClass =
    variant === 'avatar' ? 'skeleton skeleton-avatar' :
    variant === 'card' ? 'skeleton skeleton-card' :
    'skeleton skeleton-text';

  return <div className={`${variantClass} ${className}`.trim()} style={style} />;
}

/**
 * Skeleton para una tarjeta de producto (ej. mientras carga el catálogo).
 */
export function SkeletonProductCard() {
  return (
    <div className="bg-white overflow-hidden border-0 shadow-sm" style={{ borderRadius: '1rem' }}>
      <div className="skeleton skeleton-card w-100" style={{ height: '200px' }} />
      <div className="p-4">
        <Skeleton variant="text" lines={2} />
        <div className="d-flex justify-content-between align-items-center mt-3">
          <div className="skeleton skeleton-text" style={{ width: '80px', height: '24px' }} />
          <div className="skeleton skeleton-text" style={{ width: '100px', height: '36px', borderRadius: '0.5rem' }} />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid de skeletons para la sección de productos.
 */
export function SkeletonProductGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="product-grid"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
        gap: '1.5rem',
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}
