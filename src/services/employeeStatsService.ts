import { supabase } from '../lib/supabase';

export interface EmployeeStats {
  employee_id: string;
  employee_name: string;
  employee_email: string;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  orders_by_status: {
    received: number;
    preparing: number;
    ready: number;
    delivered: number;
    cancelled: number;
  };
  orders_by_type: {
    delivery: number;
    pickup: number;
  };
  last_order_date: string | null;
  first_order_date: string | null;
}

export interface DeliveryStats {
  delivery_id: string;
  delivery_name: string;
  delivery_email: string;
  total_deliveries: number;
  total_revenue: number;
  average_delivery_value: number;
  completed_deliveries: number;
  cancelled_deliveries: number;
  average_delivery_time_minutes: number | null;
  last_delivery_date: string | null;
  first_delivery_date: string | null;
}

export const employeeStatsService = {
  // Obtener estadísticas de todos los empleados
  async getEmployeeStats(startDate?: string, endDate?: string): Promise<EmployeeStats[]> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          total,
          status,
          delivery_type,
          created_at,
          created_by_user_id
        `)
        .not('created_by_user_id', 'is', null);

      // Filtrar por rango de fechas si se proporciona
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      // Obtener información de usuarios únicos
      const uniqueEmployeeIds = [...new Set(orders?.map((o: any) => o.created_by_user_id).filter(Boolean) || [])];
      
      // Obtener datos de usuarios
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', uniqueEmployeeIds);

      const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]));

      // Agrupar por empleado
      const statsMap = new Map<string, EmployeeStats>();

      orders?.forEach((order: any) => {
        const employeeId = order.created_by_user_id;
        if (!employeeId) return;

        const user = usersMap.get(employeeId);
        if (!user) return;

        if (!statsMap.has(employeeId)) {
          statsMap.set(employeeId, {
            employee_id: employeeId,
            employee_name: user.full_name || 'Sin nombre',
            employee_email: user.email || '',
            total_orders: 0,
            total_revenue: 0,
            average_order_value: 0,
            orders_by_status: {
              received: 0,
              preparing: 0,
              ready: 0,
              delivered: 0,
              cancelled: 0,
            },
            orders_by_type: {
              delivery: 0,
              pickup: 0,
            },
            last_order_date: null,
            first_order_date: null,
          });
        }

        const stats = statsMap.get(employeeId)!;
        stats.total_orders++;
        stats.total_revenue += order.total || 0;
        stats.orders_by_status[order.status as keyof typeof stats.orders_by_status]++;
        stats.orders_by_type[order.delivery_type as 'delivery' | 'pickup']++;

        const orderDate = order.created_at;
        if (!stats.first_order_date || orderDate < stats.first_order_date) {
          stats.first_order_date = orderDate;
        }
        if (!stats.last_order_date || orderDate > stats.last_order_date) {
          stats.last_order_date = orderDate;
        }
      });

      // Calcular promedios y convertir a array
      const statsArray = Array.from(statsMap.values()).map((stats) => ({
        ...stats,
        average_order_value: stats.total_orders > 0 ? stats.total_revenue / stats.total_orders : 0,
      }));

      // Ordenar por total de ventas descendente
      return statsArray.sort((a, b) => b.total_revenue - a.total_revenue);
    } catch (error) {
      console.error('Error fetching employee stats:', error);
      throw error;
    }
  },

  // Obtener estadísticas de todos los repartidores
  async getDeliveryStats(startDate?: string, endDate?: string): Promise<DeliveryStats[]> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          id,
          total,
          status,
          delivery_type,
          created_at,
          updated_at,
          started_delivery_at,
          delivery_user_id
        `)
        .not('delivery_user_id', 'is', null)
        .eq('delivery_type', 'delivery');

      // Filtrar por rango de fechas si se proporciona
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      const { data: orders, error } = await query;

      if (error) throw error;

      // Obtener información de usuarios únicos
      const uniqueDeliveryIds = [...new Set(orders?.map((o: any) => o.delivery_user_id).filter(Boolean) || [])];
      
      // Obtener datos de usuarios
      const { data: usersData } = await supabase
        .from('users')
        .select('id, full_name, email')
        .in('id', uniqueDeliveryIds);

      const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]));

      // Agrupar por repartidor
      const statsMap = new Map<string, DeliveryStats>();

      orders?.forEach((order: any) => {
        const deliveryId = order.delivery_user_id;
        if (!deliveryId) return;

        const user = usersMap.get(deliveryId);
        if (!user) return;

        if (!statsMap.has(deliveryId)) {
          statsMap.set(deliveryId, {
            delivery_id: deliveryId,
            delivery_name: user.full_name || 'Sin nombre',
            delivery_email: user.email || '',
            total_deliveries: 0,
            total_revenue: 0,
            average_delivery_value: 0,
            completed_deliveries: 0,
            cancelled_deliveries: 0,
            average_delivery_time_minutes: null,
            last_delivery_date: null,
            first_delivery_date: null,
          });
        }

        const stats = statsMap.get(deliveryId)!;
        stats.total_deliveries++;
        stats.total_revenue += order.total || 0;

        if (order.status === 'delivered') {
          stats.completed_deliveries++;
        } else if (order.status === 'cancelled') {
          stats.cancelled_deliveries++;
        }

        const orderDate = order.created_at;
        if (!stats.first_delivery_date || orderDate < stats.first_delivery_date) {
          stats.first_delivery_date = orderDate;
        }
        if (!stats.last_delivery_date || orderDate > stats.last_delivery_date) {
          stats.last_delivery_date = orderDate;
        }

        // Calcular tiempo de entrega si está disponible
        if (order.started_delivery_at && order.status === 'delivered') {
          const startTime = new Date(order.started_delivery_at).getTime();
          const endTime = new Date(order.updated_at || order.created_at).getTime();
          const minutes = Math.round((endTime - startTime) / (1000 * 60));
          
          if (stats.average_delivery_time_minutes === null) {
            stats.average_delivery_time_minutes = minutes;
          } else {
            // Promedio simple (podría mejorarse con un contador)
            stats.average_delivery_time_minutes = 
              (stats.average_delivery_time_minutes + minutes) / 2;
          }
        }
      });

      // Calcular promedios y convertir a array
      const statsArray = Array.from(statsMap.values()).map((stats) => ({
        ...stats,
        average_delivery_value: stats.total_deliveries > 0 ? stats.total_revenue / stats.total_deliveries : 0,
      }));

      // Ordenar por total de entregas descendente
      return statsArray.sort((a, b) => b.total_deliveries - a.total_deliveries);
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
      throw error;
    }
  },
};

