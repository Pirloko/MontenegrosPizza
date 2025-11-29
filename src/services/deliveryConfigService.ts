import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type DeliveryConfig = Database['public']['Tables']['delivery_config']['Row'];
type DeliveryConfigUpdate = Database['public']['Tables']['delivery_config']['Update'];

// Helper para agregar timeout a las promesas
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout: La operación tomó más de ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

export const deliveryConfigService = {
  // Obtener configuración actual
  async getConfig(): Promise<DeliveryConfig | null> {
    try {
      console.log('🔍 Obteniendo configuración de delivery...');
      const queryPromise = supabase
        .from('delivery_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      const { data, error } = await withTimeout(queryPromise, 15000);

      if (error) {
        console.error('❌ Error obteniendo configuración:', error);
        throw error;
      }

      console.log('✅ Configuración obtenida:', data);
      return data;
    } catch (error: any) {
      console.error('❌ Error fetching delivery config:', error);
      if (error.message?.includes('Timeout')) {
        throw new Error('La consulta está tomando demasiado tiempo. Verifica tu conexión a internet.');
      }
      throw error;
    }
  },

  // Actualizar configuración
  async updateConfig(updates: DeliveryConfigUpdate, userId: string): Promise<DeliveryConfig> {
    try {
      // Primero obtener el ID actual
      const current = await this.getConfig();
      if (!current) {
        throw new Error('No se encontró la configuración de delivery');
      }

      const { data, error } = await supabase
        .from('delivery_config')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
          updated_by: userId
        })
        .eq('id', current.id)
        .select()
        .single();

      if (error) throw error;
      
      console.log('✅ Configuración actualizada:', data);
      return data;
    } catch (error) {
      console.error('Error updating delivery config:', error);
      throw error;
    }
  },

  // Calcular costo de delivery basado en distancia
  calculateDeliveryFee(
    config: DeliveryConfig,
    customerLat: number,
    customerLng: number,
    orderTotal: number
  ): { fee: number; distance: number; isFree: boolean } {
    // Calcular distancia usando fórmula de Haversine
    const distance = this.haversineDistance(
      config.store_latitude,
      config.store_longitude,
      customerLat,
      customerLng
    );

    console.log(`📏 Distancia calculada: ${distance.toFixed(2)} km`);

    // Verificar si está fuera del rango de entrega
    if (distance > config.max_delivery_distance_km) {
      throw new Error(`Lo sentimos, no realizamos entregas a más de ${config.max_delivery_distance_km} km de distancia.`);
    }

    // Verificar si aplica delivery gratis
    if (config.free_delivery_enabled && orderTotal >= config.free_delivery_min_amount) {
      console.log('🎉 Delivery gratis aplicado!');
      return { fee: 0, distance, isFree: true };
    }

    // Calcular costo base
    let fee = config.base_fee + (distance * config.price_per_km);
    
    // Aplicar mínimo y máximo
    fee = Math.max(config.min_delivery_fee, Math.min(fee, config.max_delivery_fee));
    fee = Math.round(fee); // Redondear al peso más cercano

    console.log(`💰 Costo de delivery calculado: $${fee}`);
    
    return { fee, distance, isFree: false };
  },

  // Fórmula de Haversine para calcular distancia entre dos puntos geográficos
  haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radio de la Tierra en km
    const toRad = (degrees: number) => degrees * (Math.PI / 180);

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance; // Distancia en kilómetros
  }
};

