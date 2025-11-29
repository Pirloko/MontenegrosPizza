import React, { useState } from 'react';
import { Product } from '../types';
import ProductModal from './ProductModal';
import { formatPrice } from '../utils/formatters';
import { LazyImage } from './LazyImage';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isAvailable = product.available !== false && 
                       (product.stock_quantity === undefined || 
                        product.stock_quantity > 0 || 
                        product.stock_quantity === 999);

  return (
    <>
      <div
        className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer relative"
        onClick={() => setIsModalOpen(true)}
      >
        {!isAvailable && (
          <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-2 font-bold z-10">
            AGOTADO
          </div>
        )}
        <div className={`h-48 overflow-hidden ${!isAvailable ? 'mt-10 opacity-60' : ''}`}>
          <LazyImage
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-gray-800">{product.name}</h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2 h-10">{product.description}</p>
          <div className="flex items-center justify-between mt-2">
            <span className="text-red-600 font-bold">{formatPrice(product.price)}</span>
            <button
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isAvailable 
                  ? 'bg-red-600 text-white hover:bg-red-700' 
                  : 'bg-gray-400 text-white cursor-not-allowed'
              }`}
              disabled={!isAvailable}
            >
              {isAvailable ? 'Agregar' : 'No disponible'}
            </button>
          </div>
        </div>
      </div>
      
      {isModalOpen && (
        <ProductModal 
          product={product} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
};

export default ProductCard;