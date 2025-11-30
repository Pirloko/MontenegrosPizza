import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Badge } from 'react-bootstrap';

interface FloatingCartButtonProps {
  cartCount: number;
  onClick: () => void;
  total: number;
}

export default function FloatingCartButton({ cartCount, onClick, total }: FloatingCartButtonProps) {
  // Solo mostrar si hay items en el carrito
  if (cartCount === 0) return null;

  return (
    <button
      onClick={onClick}
      className="position-fixed"
      style={{
        bottom: '24px',
        right: '24px',
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        backgroundColor: '#0B6E4F',
        border: 'none',
        color: 'white',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        zIndex: 1000,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        position: 'fixed'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.1)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
      }}
      title={`Ver carrito (${cartCount} items) - $${total.toLocaleString()}`}
    >
      <div className="position-relative d-flex flex-column align-items-center justify-content-center">
        <ShoppingCart size={28} />
        {cartCount > 0 && (
          <Badge
            bg="danger"
            className="position-absolute rounded-pill"
            style={{
              top: '-8px',
              right: '-8px',
              fontSize: '0.7rem',
              padding: '4px 8px',
              minWidth: '22px',
              textAlign: 'center',
              border: '2px solid white',
              fontWeight: 'bold'
            }}
          >
            {cartCount}
          </Badge>
        )}
      </div>
      {total > 0 && (
        <span
          style={{
            fontSize: '0.65rem',
            fontWeight: 'bold',
            marginTop: '4px',
            lineHeight: '1'
          }}
        >
          ${total.toLocaleString()}
        </span>
      )}
    </button>
  );
}

