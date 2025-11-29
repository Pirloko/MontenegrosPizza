// TypeScript types for Supabase Database
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'admin' | 'employee' | 'customer' | 'delivery';
export type OrderStatus = 'received' | 'preparing' | 'ready' | 'on_the_way' | 'delivered' | 'cancelled';
export type DeliveryType = 'delivery' | 'pickup';
export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'pending';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type PromotionType = 'percentage' | 'fixed_amount' | 'product_combo' | 'coupon';
export type PointsTransactionType = 'earned' | 'redeemed' | 'expired' | 'adjusted';

export interface Database {
  public: {
    Tables: {
      delivery_config: {
        Row: {
          id: string;
          store_name: string;
          store_address: string;
          store_latitude: number;
          store_longitude: number;
          base_fee: number;
          price_per_km: number;
          min_delivery_fee: number;
          max_delivery_fee: number;
          free_delivery_enabled: boolean;
          free_delivery_min_amount: number;
          max_delivery_distance_km: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: string;
          store_name?: string;
          store_address?: string;
          store_latitude?: number;
          store_longitude?: number;
          base_fee?: number;
          price_per_km?: number;
          min_delivery_fee?: number;
          max_delivery_fee?: number;
          free_delivery_enabled?: boolean;
          free_delivery_min_amount?: number;
          max_delivery_distance_km?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: string;
          store_name?: string;
          store_address?: string;
          store_latitude?: number;
          store_longitude?: number;
          base_fee?: number;
          price_per_km?: number;
          min_delivery_fee?: number;
          max_delivery_fee?: number;
          free_delivery_enabled?: boolean;
          free_delivery_min_amount?: number;
          max_delivery_distance_km?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          favorite_address: string | null;
          loyalty_points: number;
          fuel_price_per_liter?: number | null;
          km_per_liter?: number | null;
          is_active?: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          phone?: string | null;
          role: UserRole;
          favorite_address?: string | null;
          loyalty_points?: number;
          fuel_price_per_liter?: number | null;
          km_per_liter?: number | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          phone?: string | null;
          role?: UserRole;
          favorite_address?: string | null;
          loyalty_points?: number;
          fuel_price_per_liter?: number | null;
          km_per_liter?: number | null;
          is_active?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          display_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          display_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      products: {
        Row: {
          id: string;
          category_id: string | null;
          name: string;
          description: string | null;
          price: number;
          cost: number;
          image_url: string | null;
          is_vegetarian: boolean;
          is_active: boolean;
          available: boolean;
          stock_quantity: number;
          low_stock_alert: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id?: string | null;
          name: string;
          description?: string | null;
          price: number;
          cost?: number;
          image_url?: string | null;
          is_vegetarian?: boolean;
          is_active?: boolean;
          available?: boolean;
          stock_quantity?: number;
          low_stock_alert?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string | null;
          name?: string;
          description?: string | null;
          price?: number;
          cost?: number;
          image_url?: string | null;
          is_vegetarian?: boolean;
          is_active?: boolean;
          available?: boolean;
          stock_quantity?: number;
          low_stock_alert?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      extra_ingredients: {
        Row: {
          id: string;
          name: string;
          price: number;
          is_available: boolean;
          category: 'basic' | 'premium';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          is_available?: boolean;
          category?: 'basic' | 'premium';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          is_available?: boolean;
          category?: 'basic' | 'premium';
          created_at?: string;
          updated_at?: string;
        };
      };
      product_ingredients: {
        Row: {
          id: string;
          product_id: string;
          ingredient_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          ingredient_id: string;
          quantity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string;
          ingredient_id?: string;
          quantity?: number;
          created_at?: string;
        };
      };
      promotions: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          type: PromotionType;
          value: number;
          coupon_code: string | null;
          min_purchase: number;
          valid_days: Json | null;
          start_date: string | null;
          end_date: string | null;
          is_active: boolean;
          max_uses: number | null;
          current_uses: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          type: PromotionType;
          value: number;
          coupon_code?: string | null;
          min_purchase?: number;
          valid_days?: Json | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          max_uses?: number | null;
          current_uses?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          type?: PromotionType;
          value?: number;
          coupon_code?: string | null;
          min_purchase?: number;
          valid_days?: Json | null;
          start_date?: string | null;
          end_date?: string | null;
          is_active?: boolean;
          max_uses?: number | null;
          current_uses?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      promotion_products: {
        Row: {
          id: string;
          promotion_id: string;
          product_id: string;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          promotion_id: string;
          product_id: string;
          quantity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          promotion_id?: string;
          product_id?: string;
          quantity?: number;
          created_at?: string;
        };
      };
      orders: {
        Row: {
          id: string;
          customer_id: string | null;
          order_number: string;
          status: OrderStatus;
          delivery_type: DeliveryType;
          delivery_address: string | null;
          delivery_latitude?: number | null;
          delivery_longitude?: number | null;
          delivery_fee: number;
          customer_name: string;
          customer_phone: string;
          customer_email: string | null;
          subtotal: number;
          discount: number;
          total: number;
          payment_method: PaymentMethod | null;
          payment_status: PaymentStatus;
          points_earned: number;
          points_used: number;
          promotion_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          estimated_ready_time?: number | null;
          pickup_code?: number | null;
          delivery_user_id?: string | null;
          delivery_code?: number | null;
          started_delivery_at?: string | null;
          created_by_user_id?: string | null;
        };
        Insert: {
          id?: string;
          customer_id?: string | null;
          order_number?: string;
          status: OrderStatus;
          delivery_type: DeliveryType;
          delivery_address?: string | null;
          delivery_latitude?: number | null;
          delivery_longitude?: number | null;
          delivery_fee?: number;
          customer_name: string;
          customer_phone: string;
          customer_email?: string | null;
          subtotal: number;
          discount?: number;
          total: number;
          payment_method?: PaymentMethod | null;
          payment_status?: PaymentStatus;
          points_earned?: number;
          points_used?: number;
          promotion_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          estimated_ready_time?: number | null;
          pickup_code?: number | null;
          delivery_user_id?: string | null;
          delivery_code?: number | null;
          started_delivery_at?: string | null;
          created_by_user_id?: string | null;
        };
        Update: {
          id?: string;
          customer_id?: string | null;
          order_number?: string;
          status?: OrderStatus;
          delivery_type?: DeliveryType;
          delivery_address?: string | null;
          delivery_latitude?: number | null;
          delivery_longitude?: number | null;
          delivery_fee?: number;
          customer_name?: string;
          customer_phone?: string;
          customer_email?: string | null;
          subtotal?: number;
          discount?: number;
          total?: number;
          payment_method?: PaymentMethod | null;
          payment_status?: PaymentStatus;
          points_earned?: number;
          points_used?: number;
          promotion_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          estimated_ready_time?: number | null;
          pickup_code?: number | null;
          delivery_user_id?: string | null;
          delivery_code?: number | null;
          started_delivery_at?: string | null;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          product_price: number;
          quantity: number;
          removed_ingredients: Json;
          added_ingredients: Json;
          extra_ingredients_cost: number;
          special_instructions: string | null;
          subtotal: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          product_price: number;
          quantity: number;
          removed_ingredients?: Json;
          added_ingredients?: Json;
          extra_ingredients_cost?: number;
          special_instructions?: string | null;
          subtotal: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          product_price?: number;
          quantity?: number;
          removed_ingredients?: Json;
          added_ingredients?: Json;
          extra_ingredients_cost?: number;
          special_instructions?: string | null;
          subtotal?: number;
          created_at?: string;
        };
      };
      loyalty_points_history: {
        Row: {
          id: string;
          user_id: string;
          order_id: string | null;
          points: number;
          type: PointsTransactionType;
          description: string | null;
          balance_after: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          order_id?: string | null;
          points: number;
          type: PointsTransactionType;
          description?: string | null;
          balance_after: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          order_id?: string | null;
          points?: number;
          type?: PointsTransactionType;
          description?: string | null;
          balance_after?: number;
          created_at?: string;
        };
      };
      delivery_locations: {
        Row: {
          id: string;
          order_id: string;
          delivery_user_id: string;
          latitude: number;
          longitude: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          delivery_user_id: string;
          latitude: number;
          longitude: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          delivery_user_id?: string;
          latitude?: number;
          longitude?: number;
          updated_at?: string;
        };
      };
      ratings: {
        Row: {
          id: string;
          order_id: string;
          user_id: string;
          rating_type: 'product' | 'service' | 'delivery';
          target_id: string | null;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          user_id: string;
          rating_type: 'product' | 'service' | 'delivery';
          target_id?: string | null;
          rating: number;
          comment?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          user_id?: string;
          rating_type?: 'product' | 'service' | 'delivery';
          target_id?: string | null;
          rating?: number;
          comment?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      generate_order_number: {
        Args: Record<string, never>;
        Returns: string;
      };
      calculate_loyalty_points: {
        Args: { order_total: number };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

