import { supabase } from '../lib/supabase';
import { Rating } from '../types';

class RatingService {
  /**
   * Crear una nueva calificación
   */
  async createRating(ratingData: {
    orderId: string;
    userId: string;
    ratingType: 'product' | 'service' | 'delivery';
    targetId?: string | null;
    rating: number;
    comment?: string;
  }): Promise<Rating> {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .insert({
          order_id: ratingData.orderId,
          user_id: ratingData.userId,
          rating_type: ratingData.ratingType,
          target_id: ratingData.targetId || null,
          rating: ratingData.rating,
          comment: ratingData.comment || null
        })
        .select()
        .single();

      if (error) throw error;
      return data as Rating;
    } catch (error: any) {
      console.error('Error creando calificación:', error);
      throw new Error(error.message || 'Error al crear la calificación');
    }
  }

  /**
   * Obtener todas las calificaciones de un pedido
   */
  async getRatingsByOrder(orderId: string): Promise<Rating[]> {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      return data as Rating[];
    } catch (error: any) {
      console.error('Error obteniendo calificaciones del pedido:', error);
      throw new Error(error.message || 'Error al obtener calificaciones');
    }
  }

  /**
   * Obtener calificaciones de un producto
   */
  async getProductRatings(productId: string): Promise<Rating[]> {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('rating_type', 'product')
        .eq('target_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Rating[];
    } catch (error: any) {
      console.error('Error obteniendo calificaciones del producto:', error);
      throw new Error(error.message || 'Error al obtener calificaciones del producto');
    }
  }

  /**
   * Obtener calificaciones de un repartidor
   */
  async getDeliveryUserRatings(deliveryUserId: string): Promise<any[]> {
    try {
      // Primero obtener las calificaciones
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('*')
        .eq('rating_type', 'delivery')
        .eq('target_id', deliveryUserId)
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;
      if (!ratings || ratings.length === 0) return [];

      // Obtener información de pedidos y usuarios
      const orderIds = [...new Set(ratings.map(r => r.order_id))];
      const userIds = [...new Set(ratings.map(r => r.user_id))];

      const [ordersData, usersData] = await Promise.all([
        supabase.from('orders').select('id, order_number, customer_name, customer_email').in('id', orderIds),
        supabase.from('users').select('id, full_name, email').in('id', userIds)
      ]);

      const ordersMap = new Map((ordersData.data || []).map(o => [o.id, o]));
      const usersMap = new Map((usersData.data || []).map(u => [u.id, u]));

      // Enriquecer calificaciones con datos
      return ratings.map(rating => ({
        ...rating,
        orders: ordersMap.get(rating.order_id) || null,
        users: usersMap.get(rating.user_id) || null
      }));
    } catch (error: any) {
      console.error('Error obteniendo calificaciones del repartidor:', error);
      throw new Error(error.message || 'Error al obtener calificaciones del repartidor');
    }
  }

  /**
   * Calcular promedio de calificaciones de un producto
   */
  async getProductAverageRating(productId: string): Promise<{ average: number; count: number }> {
    try {
      const ratings = await this.getProductRatings(productId);
      
      if (ratings.length === 0) {
        return { average: 0, count: 0 };
      }

      const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
      const average = parseFloat((total / ratings.length).toFixed(2));

      return { average, count: ratings.length };
    } catch (error: any) {
      console.error('Error calculando promedio de producto:', error);
      return { average: 0, count: 0 };
    }
  }

  /**
   * Calcular promedio de calificaciones de un repartidor
   */
  async getDeliveryUserAverageRating(deliveryUserId: string): Promise<{ average: number; count: number }> {
    try {
      const ratings = await this.getDeliveryUserRatings(deliveryUserId);
      
      if (ratings.length === 0) {
        return { average: 0, count: 0 };
      }

      const total = ratings.reduce((sum, rating) => sum + rating.rating, 0);
      const average = parseFloat((total / ratings.length).toFixed(2));

      return { average, count: ratings.length };
    } catch (error: any) {
      console.error('Error calculando promedio de repartidor:', error);
      return { average: 0, count: 0 };
    }
  }

  /**
   * Verificar si un usuario ya calificó un pedido
   */
  async hasUserRatedOrder(userId: string, orderId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('id')
        .eq('user_id', userId)
        .eq('order_id', orderId)
        .limit(1);

      if (error) throw error;
      return (data && data.length > 0);
    } catch (error: any) {
      console.error('Error verificando si usuario calificó:', error);
      return false;
    }
  }

  /**
   * Obtener calificaciones de un usuario
   */
  async getUserRatings(userId: string): Promise<Rating[]> {
    try {
      const { data, error } = await supabase
        .from('ratings')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Rating[];
    } catch (error: any) {
      console.error('Error obteniendo calificaciones del usuario:', error);
      throw new Error(error.message || 'Error al obtener calificaciones del usuario');
    }
  }

  /**
   * Obtener distribución de calificaciones (1-5 estrellas)
   */
  async getRatingDistribution(targetId: string, ratingType: 'product' | 'delivery'): Promise<{
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  }> {
    try {
      const ratings = ratingType === 'product' 
        ? await this.getProductRatings(targetId)
        : await this.getDeliveryUserRatings(targetId);

      const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

      ratings.forEach(rating => {
        distribution[rating.rating as keyof typeof distribution]++;
      });

      return distribution;
    } catch (error: any) {
      console.error('Error obteniendo distribución de calificaciones:', error);
      return { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    }
  }

  /**
   * Obtener todas las calificaciones de servicio
   */
  async getAllServiceRatings(): Promise<any[]> {
    try {
      // Primero obtener las calificaciones
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('*')
        .eq('rating_type', 'service')
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;
      if (!ratings || ratings.length === 0) return [];

      // Obtener información de pedidos y usuarios
      const orderIds = [...new Set(ratings.map(r => r.order_id))];
      const userIds = [...new Set(ratings.map(r => r.user_id))];

      const [ordersData, usersData] = await Promise.all([
        supabase.from('orders').select('id, order_number, customer_name, customer_email').in('id', orderIds),
        supabase.from('users').select('id, full_name, email').in('id', userIds)
      ]);

      const ordersMap = new Map((ordersData.data || []).map(o => [o.id, o]));
      const usersMap = new Map((usersData.data || []).map(u => [u.id, u]));

      // Enriquecer calificaciones con datos de pedidos y usuarios
      return ratings.map(rating => ({
        ...rating,
        orders: ordersMap.get(rating.order_id) || null,
        users: usersMap.get(rating.user_id) || null
      }));
    } catch (error: any) {
      console.error('Error obteniendo calificaciones de servicio:', error);
      throw new Error(error.message || 'Error al obtener calificaciones de servicio');
    }
  }

  /**
   * Obtener todas las calificaciones de delivery
   */
  async getAllDeliveryRatings(): Promise<any[]> {
    try {
      // Primero obtener las calificaciones
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('*')
        .eq('rating_type', 'delivery')
        .order('created_at', { ascending: false });

      if (ratingsError) throw ratingsError;
      if (!ratings || ratings.length === 0) return [];

      // Obtener información de pedidos, usuarios y repartidores
      const orderIds = [...new Set(ratings.map(r => r.order_id))];
      const userIds = [...new Set(ratings.map(r => r.user_id))];
      const deliveryUserIds = [...new Set(ratings.map(r => r.target_id).filter(Boolean))];

      const [ordersData, usersData, deliveryUsersData] = await Promise.all([
        supabase.from('orders').select('id, order_number, customer_name, customer_email, delivery_user_id').in('id', orderIds),
        supabase.from('users').select('id, full_name, email').in('id', userIds),
        deliveryUserIds.length > 0 
          ? supabase.from('users').select('id, full_name, email').in('id', deliveryUserIds)
          : { data: [], error: null }
      ]);

      const ordersMap = new Map((ordersData.data || []).map(o => [o.id, o]));
      const usersMap = new Map((usersData.data || []).map(u => [u.id, u]));
      const deliveryUsersMap = new Map((deliveryUsersData.data || []).map(u => [u.id, u]));

      // Enriquecer calificaciones con datos
      return ratings.map(rating => ({
        ...rating,
        orders: ordersMap.get(rating.order_id) || null,
        users: usersMap.get(rating.user_id) || null,
        delivery_user: rating.target_id ? deliveryUsersMap.get(rating.target_id) || null : null
      }));
    } catch (error: any) {
      console.error('Error obteniendo calificaciones de delivery:', error);
      throw new Error(error.message || 'Error al obtener calificaciones de delivery');
    }
  }
}

export const ratingService = new RatingService();

