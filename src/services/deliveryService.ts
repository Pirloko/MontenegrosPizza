import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Order = Database['public']['Tables']['orders']['Row'];
type DeliveryLocation = Database['public']['Tables']['delivery_locations']['Row'];
type DeliveryLocationInsert = Database['public']['Tables']['delivery_locations']['Insert'];

// Helper para agregar timeout a las promesas
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout: La operación tomó más de ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

export const deliveryService = {
  // Obtener pedidos disponibles para entrega (ready + delivery, sin repartidor asignado)
  async getAvailableOrders(): Promise<Order[]> {
    try {
      console.log('🔍 Iniciando getAvailableOrders...');
      const queryPromise = supabase
        .from('orders')
        .select('*')
        .eq('status', 'ready')
        .eq('delivery_type', 'delivery')
        .is('delivery_user_id', null)
        .order('created_at', { ascending: true });

      const { data, error } = await withTimeout(queryPromise, 15000);

      if (error) {
        console.error('❌ Error en getAvailableOrders:', error);
        throw error;
      }
      
      console.log(`✅ getAvailableOrders completado: ${data?.length || 0} pedidos`);
      return data || [];
    } catch (error: any) {
      console.error('❌ Error fetching available orders:', error);
      if (error.message?.includes('Timeout')) {
        throw new Error('La consulta está tomando demasiado tiempo. Verifica tu conexión a internet.');
      }
      throw error;
    }
  },

  // Obtener pedidos activos asignados a un repartidor
  async getMyActiveDeliveries(deliveryUserId: string): Promise<Order[]> {
    try {
      console.log('🔍 Iniciando getMyActiveDeliveries para:', deliveryUserId);
      const queryPromise = supabase
        .from('orders')
        .select('*')
        .eq('delivery_user_id', deliveryUserId)
        .eq('status', 'on_the_way')
        .order('started_delivery_at', { ascending: true });

      const { data, error } = await withTimeout(queryPromise, 15000);

      if (error) {
        console.error('❌ Error en getMyActiveDeliveries:', error);
        throw error;
      }
      
      console.log(`✅ getMyActiveDeliveries completado: ${data?.length || 0} pedidos`);
      return data || [];
    } catch (error: any) {
      console.error('❌ Error fetching active deliveries:', error);
      if (error.message?.includes('Timeout')) {
        throw new Error('La consulta está tomando demasiado tiempo. Verifica tu conexión a internet.');
      }
      throw error;
    }
  },

  // Obtener historial de entregas completadas por un repartidor
  async getMyDeliveryHistory(deliveryUserId: string): Promise<Order[]> {
    try {
      console.log('🔍 Iniciando getMyDeliveryHistory para:', deliveryUserId);
      const queryPromise = supabase
        .from('orders')
        .select('*')
        .eq('delivery_user_id', deliveryUserId)
        .eq('status', 'delivered')
        .order('updated_at', { ascending: false })
        .limit(50); // Últimas 50 entregas

      const { data, error } = await withTimeout(queryPromise, 15000);

      if (error) {
        console.error('❌ Error en getMyDeliveryHistory:', error);
        throw error;
      }
      
      console.log(`✅ getMyDeliveryHistory completado: ${data?.length || 0} pedidos`);
      return data || [];
    } catch (error: any) {
      console.error('❌ Error fetching delivery history:', error);
      if (error.message?.includes('Timeout')) {
        throw new Error('La consulta está tomando demasiado tiempo. Verifica tu conexión a internet.');
      }
      throw error;
    }
  },

  // Tomar un pedido para entrega (cambiar estado a "on_the_way")
  async takeOrderForDelivery(orderId: string, deliveryUserId: string): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({
          status: 'on_the_way',
          delivery_user_id: deliveryUserId,
          started_delivery_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error taking order for delivery:', error);
      throw error;
    }
  },

  // Actualizar ubicación del repartidor (para tracking en tiempo real)
  async updateDeliveryLocation(
    orderId: string,
    deliveryUserId: string,
    latitude: number,
    longitude: number
  ): Promise<void> {
    try {
      // Usar upsert para insertar o actualizar
      const { error } = await supabase
        .from('delivery_locations')
        .upsert({
          order_id: orderId,
          delivery_user_id: deliveryUserId,
          latitude,
          longitude,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'order_id,delivery_user_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating delivery location:', error);
      throw error;
    }
  },

  // Obtener ubicación actual de un pedido (para cliente)
  async getDeliveryLocation(orderId: string): Promise<DeliveryLocation | null> {
    try {
      const { data, error } = await supabase
        .from('delivery_locations')
        .select('*')
        .eq('order_id', orderId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching delivery location:', error);
      throw error;
    }
  },

  // Verificar código de entrega
  async verifyDeliveryCode(orderId: string, code: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('delivery_code')
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data?.delivery_code === code;
    } catch (error) {
      console.error('Error verifying delivery code:', error);
      return false;
    }
  },

  // Obtener todos los repartidores disponibles
  async getAvailableDrivers(): Promise<Database['public']['Tables']['users']['Row'][]> {
    try {
      console.log('🔍 Iniciando getAvailableDrivers...');
      const queryPromise = supabase
        .from('users')
        .select('*')
        .eq('role', 'delivery')
        .order('full_name', { ascending: true });

      const { data, error } = await withTimeout(queryPromise, 15000);

      if (error) {
        console.error('❌ Error en getAvailableDrivers:', error);
        throw error;
      }
      
      console.log(`✅ getAvailableDrivers completado: ${data?.length || 0} repartidores`);
      return data || [];
    } catch (error: any) {
      console.error('❌ Error fetching available drivers:', error);
      if (error.message?.includes('Timeout')) {
        throw new Error('La consulta está tomando demasiado tiempo. Verifica tu conexión a internet.');
      }
      throw error;
    }
  },

  // Suscribirse a cambios de ubicación en tiempo real (para cliente)
  subscribeToDeliveryLocation(
    orderId: string,
    callback: (location: DeliveryLocation | null) => void
  ) {
    const subscription = supabase
      .channel(`delivery_location_${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_locations',
          filter: `order_id=eq.${orderId}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            callback(null);
          } else {
            callback(payload.new as DeliveryLocation);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  },

  // Detener tracking de ubicación (limpiar cuando se completa la entrega)
  async stopLocationTracking(orderId: string, deliveryUserId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('delivery_locations')
        .delete()
        .eq('order_id', orderId)
        .eq('delivery_user_id', deliveryUserId);

      if (error) throw error;
    } catch (error) {
      console.error('Error stopping location tracking:', error);
      // No lanzar error para no bloquear la entrega
    }
  }
};

