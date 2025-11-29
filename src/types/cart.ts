import { Product } from '../data/products';

export interface CartItem {
  product: Product;
  quantity: number;
  customizations: {
    removedIngredients: string[];
    addedIngredients: string[];
    specialInstructions: string;
    extraPrice: number;
  };
} 