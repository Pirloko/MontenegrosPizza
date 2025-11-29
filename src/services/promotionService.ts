import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Promotion = Database['public']['Tables']['promotions']['Row'];
type PromotionInsert = Database['public']['Tables']['promotions']['Insert'];
type PromotionUpdate = Database['public']['Tables']['promotions']['Update'];
type PromotionProduct = Database['public']['Tables']['promotion_products']['Row'];
type PromotionProductInsert = Database['public']['Tables']['promotion_products']['Insert'];

export const promotionService = {
  // Obtener todas las promociones
  async getAll(): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching promotions:', error);
      throw error;
    }
  },

  // Obtener promociones activas
  async getActive(): Promise<Promotion[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching active promotions:', error);
      throw error;
    }
  },

  // Obtener promociones por tipo
  async getByType(type: string): Promise<Promotion[]> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('type', type)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching promotions by type:', error);
      throw error;
    }
  },

  // Obtener promoción por código de cupón
  async getByCouponCode(couponCode: string): Promise<Promotion | null> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('coupon_code', couponCode)
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // No encontrado
        throw error;
      }
      return data;
    } catch (error) {
      console.error('Error fetching promotion by coupon code:', error);
      throw error;
    }
  },

  // Crear nueva promoción
  async create(promotionData: {
    name: string;
    description?: string;
    type: 'percentage' | 'fixed_amount' | 'product_combo' | 'coupon';
    value: number;
    minPurchase?: number;
    maxUses?: number;
    startDate?: string;
    endDate?: string;
    validDays?: number[]; // 0=domingo, 1=lunes, etc.
    couponCode?: string;
    products?: Array<{
      productId: string;
      quantity: number;
    }>;
  }): Promise<Promotion> {
    try {
      // Crear la promoción
      const promotionInsert: PromotionInsert = {
        name: promotionData.name,
        description: promotionData.description,
        type: promotionData.type,
        value: promotionData.value,
        min_purchase: promotionData.minPurchase,
        max_uses: promotionData.maxUses,
        current_uses: 0,
        start_date: promotionData.startDate || new Date().toISOString(),
        end_date: promotionData.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días por defecto
        valid_days: promotionData.validDays ? JSON.stringify(promotionData.validDays) : null,
        coupon_code: promotionData.couponCode,
        is_active: true
      };

      const { data: promotion, error: promotionError } = await supabase
        .from('promotions')
        .insert(promotionInsert)
        .select()
        .single();

      if (promotionError) throw promotionError;

      // Si hay productos asociados, crearlos
      if (promotionData.products && promotionData.products.length > 0) {
        const promotionProducts: PromotionProductInsert[] = promotionData.products.map(product => ({
          promotion_id: promotion.id,
          product_id: product.productId,
          quantity: product.quantity
        }));

        const { error: productsError } = await supabase
          .from('promotion_products')
          .insert(promotionProducts);

        if (productsError) throw productsError;
      }

      return promotion;
    } catch (error) {
      console.error('Error creating promotion:', error);
      throw error;
    }
  },

  // Actualizar promoción
  async update(id: string, promotionData: PromotionUpdate): Promise<Promotion> {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .update(promotionData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating promotion:', error);
      throw error;
    }
  },

  // Eliminar promoción
  async delete(id: string): Promise<void> {
    try {
      // Primero eliminar productos asociados
      const { error: productsError } = await supabase
        .from('promotion_products')
        .delete()
        .eq('promotion_id', id);

      if (productsError) throw productsError;

      // Luego eliminar la promoción
      const { error: promotionError } = await supabase
        .from('promotions')
        .delete()
        .eq('id', id);

      if (promotionError) throw promotionError;
    } catch (error) {
      console.error('Error deleting promotion:', error);
      throw error;
    }
  },

  // Aplicar promoción a un pedido
  async applyPromotion(couponCode: string, orderTotal: number, customerEmail?: string): Promise<{
    promotion: Promotion;
    discount: number;
    finalTotal: number;
  }> {
    try {
      const promotion = await this.getByCouponCode(couponCode);
      
      if (!promotion) {
        throw new Error('Código de cupón no válido');
      }

      // Verificar fecha de validez
      const now = new Date();
      const startDate = new Date(promotion.start_date!);
      const endDate = new Date(promotion.end_date!);

      if (now < startDate || now > endDate) {
        throw new Error('El cupón no está vigente');
      }

      // Verificar días válidos
      if (promotion.valid_days) {
        const validDays = JSON.parse(promotion.valid_days);
        const currentDay = now.getDay();
        if (!validDays.includes(currentDay)) {
          throw new Error('El cupón no es válido para este día');
        }
      }

      // Verificar compra mínima
      if (promotion.min_purchase && orderTotal < promotion.min_purchase) {
        throw new Error(`Compra mínima de $${promotion.min_purchase.toLocaleString()}`);
      }

      // Verificar límite de usos
      if (promotion.max_uses && promotion.current_uses! >= promotion.max_uses) {
        throw new Error('Cupón agotado');
      }

      // Calcular descuento
      let discount = 0;
      switch (promotion.type) {
        case 'percentage':
          discount = (orderTotal * promotion.value) / 100;
          break;
        case 'fixed_amount':
          discount = Math.min(promotion.value, orderTotal);
          break;
        case 'product_combo':
          // Para combos, el descuento se calcula diferente
          discount = promotion.value;
          break;
        case 'coupon':
          // Para cupones, usar el valor como descuento fijo
          discount = Math.min(promotion.value, orderTotal);
          break;
      }

      const finalTotal = Math.max(0, orderTotal - discount);

      return {
        promotion,
        discount,
        finalTotal
      };
    } catch (error) {
      console.error('Error applying promotion:', error);
      throw error;
    }
  },

  // Incrementar uso de promoción
  async incrementUsage(promotionId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('increment_promotion_usage', {
        promotion_id: promotionId
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error incrementing promotion usage:', error);
      throw error;
    }
  },

  // Obtener productos de una promoción
  async getPromotionProducts(promotionId: string): Promise<PromotionProduct[]> {
    try {
      const { data, error } = await supabase
        .from('promotion_products')
        .select(`
          *,
          products(name, price, image_url)
        `)
        .eq('promotion_id', promotionId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching promotion products:', error);
      throw error;
    }
  },

  // Verificar si una promoción es válida para un producto específico
  async isValidForProduct(promotionId: string, productId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('promotion_products')
        .select('id')
        .eq('promotion_id', promotionId)
        .eq('product_id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return false; // No encontrado
        throw error;
      }
      return !!data;
    } catch (error) {
      console.error('Error checking promotion validity for product:', error);
      return false;
    }
  },

  // Obtener promociones válidas para hoy
  async getValidForToday(): Promise<Promotion[]> {
    try {
      const now = new Date();
      const today = now.getDay();
      const todayString = now.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now.toISOString())
        .gte('end_date', now.toISOString())
        .or(`valid_days.is.null,valid_days.cs.[${today}]`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching promotions valid for today:', error);
      throw error;
    }
  }
};
