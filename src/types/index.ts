import { UserRole, OrderStatus, DeliveryType, PaymentMethod } from './database';

export type ProductCategory = 'pizzas' | 'empanadas' | 'sandwich' | 'bebestibles';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  cost?: number;
  image: string;
  category: ProductCategory;
  ingredients?: string[];
  category_id?: string;
  is_vegetarian?: boolean;
  is_active?: boolean;
  available?: boolean;
  stock_quantity?: number;
  low_stock_alert?: number;
}

export interface ExtraIngredient {
  id: string;
  name: string;
  price: number;
  is_available: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customizations: {
    addedIngredients: ExtraIngredient[];
    removedIngredients: string[];
    specialInstructions: string;
  };
}

export interface OrderDetails {
  items: CartItem[];
  deliveryOption: 'delivery' | 'pickup';
  customerInfo: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  totalPrice: number;
  pointsUsed?: number;
  promotionCode?: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  favorite_address: string | null;
  loyalty_points: number;
  created_at: string;
  updated_at: string;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
}

export interface Rating {
  id: string;
  order_id: string;
  user_id: string;
  rating_type: 'product' | 'service' | 'delivery';
  target_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}