import { supabase } from '../lib/supabase';

export interface DashboardMetrics {
  // Métricas generales
  totalRevenue: number;
  totalOrders: number;
  totalCosts: number;
  totalProfit: number;
  
  // Métricas de hoy
  todayRevenue: number;
  todayOrders: number;
  todayProfit: number;
  
  // Productos más vendidos
  topProducts: Array<{
    productName: string;
    quantity: number;
    revenue: number;
  }>;
  
  // Delivery vs Retiro
  deliveryVsPickup: {
    delivery: number;
    pickup: number;
    deliveryRevenue: number;
    pickupRevenue: number;
  };
  
  // Clientes frecuentes
  frequentCustomers: Array<{
    customerName: string;
    customerEmail: string;
    orderCount: number;
    totalSpent: number;
  }>;
  
  // Ventas por período
  salesByPeriod: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  
  // Promociones más usadas
  topPromotions: Array<{
    name: string;
    uses: number;
    totalDiscount: number;
  }>;
}

export const metricsService = {
  // Obtener todas las métricas del dashboard
  async getDashboardMetrics(startDate?: string, endDate?: string): Promise<DashboardMetrics> {
    try {
      const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const end = endDate || new Date().toISOString();

      const [
        revenueData,
        todayData,
        topProductsData,
        deliveryStatsData,
        frequentCustomersData,
        salesByPeriodData,
        topPromotionsData
      ] = await Promise.all([
        this.getTotalRevenue(start, end),
        this.getTodayMetrics(),
        this.getTopProductsWithDates(start, end),
        this.getDeliveryStats(start, end),
        this.getFrequentCustomers(start, end),
        this.getSalesByPeriodWithDates(start, end),
        this.getTopPromotions(start, end)
      ]);

      return {
        ...revenueData,
        ...todayData,
        topProducts: topProductsData,
        deliveryVsPickup: deliveryStatsData,
        frequentCustomers: frequentCustomersData,
        salesByPeriod: salesByPeriodData,
        topPromotions: topPromotionsData
      };
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  },

  // Obtener ingresos totales
  async getTotalRevenue(startDate: string, endDate: string): Promise<{
    totalRevenue: number;
    totalOrders: number;
    totalCosts: number;
    totalProfit: number;
  }> {
    try {
      // Obtener pedidos del período
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, subtotal')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'delivered');

      if (ordersError) throw ordersError;

      const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0;
      const totalOrders = orders?.length || 0;

      // Obtener costos de los productos vendidos
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          quantity,
          product_id,
          products(cost)
        `)
        .in('order_id', orders?.map(o => o.id) || []);

      if (itemsError) throw itemsError;

      const totalCosts = orderItems?.reduce((sum, item: any) => {
        const cost = item.products?.cost || 0;
        return sum + (cost * item.quantity);
      }, 0) || 0;

      const totalProfit = totalRevenue - totalCosts;

      return {
        totalRevenue,
        totalOrders,
        totalCosts,
        totalProfit
      };
    } catch (error) {
      console.error('Error fetching total revenue:', error);
      return {
        totalRevenue: 0,
        totalOrders: 0,
        totalCosts: 0,
        totalProfit: 0
      };
    }
  },

  // Obtener métricas de hoy
  async getTodayMetrics(): Promise<{
    todayRevenue: number;
    todayOrders: number;
    todayProfit: number;
  }> {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStart = today.toISOString();
      const todayEnd = new Date().toISOString();

      const metrics = await this.getTotalRevenue(todayStart, todayEnd);

      return {
        todayRevenue: metrics.totalRevenue,
        todayOrders: metrics.totalOrders,
        todayProfit: metrics.totalProfit
      };
    } catch (error) {
      console.error('Error fetching today metrics:', error);
      return {
        todayRevenue: 0,
        todayOrders: 0,
        todayProfit: 0
      };
    }
  },

  // Obtener productos más vendidos (versión anterior con fechas)
  async getTopProductsWithDates(startDate: string, endDate: string, limit: number = 10): Promise<Array<{
    productName: string;
    quantity: number;
    revenue: number;
  }>> {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('id')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'delivered');

      if (ordersError) throw ordersError;

      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('product_name, quantity, subtotal')
        .in('order_id', orders?.map(o => o.id) || []);

      if (itemsError) throw itemsError;

      // Agrupar por producto
      const productMap = new Map<string, { quantity: number; revenue: number }>();
      
      orderItems?.forEach(item => {
        const existing = productMap.get(item.product_name) || { quantity: 0, revenue: 0 };
        productMap.set(item.product_name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.subtotal
        });
      });

      // Convertir a array y ordenar
      const topProducts = Array.from(productMap.entries())
        .map(([productName, data]) => ({
          productName,
          quantity: data.quantity,
          revenue: data.revenue
        }))
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, limit);

      return topProducts;
    } catch (error) {
      console.error('Error fetching top products:', error);
      return [];
    }
  },

  // Obtener estadísticas de delivery vs retiro
  async getDeliveryStats(startDate: string, endDate: string): Promise<{
    delivery: number;
    pickup: number;
    deliveryRevenue: number;
    pickupRevenue: number;
  }> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('delivery_type, total')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'delivered');

      if (error) throw error;

      const delivery = orders?.filter(o => o.delivery_type === 'delivery').length || 0;
      const pickup = orders?.filter(o => o.delivery_type === 'pickup').length || 0;
      const deliveryRevenue = orders?.filter(o => o.delivery_type === 'delivery').reduce((sum, o) => sum + o.total, 0) || 0;
      const pickupRevenue = orders?.filter(o => o.delivery_type === 'pickup').reduce((sum, o) => sum + o.total, 0) || 0;

      return {
        delivery,
        pickup,
        deliveryRevenue,
        pickupRevenue
      };
    } catch (error) {
      console.error('Error fetching delivery stats:', error);
      return {
        delivery: 0,
        pickup: 0,
        deliveryRevenue: 0,
        pickupRevenue: 0
      };
    }
  },

  // Obtener clientes frecuentes
  async getFrequentCustomers(startDate: string, endDate: string, limit: number = 10): Promise<Array<{
    customerName: string;
    customerEmail: string;
    orderCount: number;
    totalSpent: number;
  }>> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('customer_name, customer_email, total')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'delivered')
        .not('customer_email', 'is', null);

      if (error) throw error;

      // Agrupar por cliente
      const customerMap = new Map<string, { name: string; orderCount: number; totalSpent: number }>();
      
      orders?.forEach(order => {
        const email = order.customer_email || '';
        const existing = customerMap.get(email) || { name: order.customer_name, orderCount: 0, totalSpent: 0 };
        customerMap.set(email, {
          name: order.customer_name,
          orderCount: existing.orderCount + 1,
          totalSpent: existing.totalSpent + order.total
        });
      });

      // Convertir a array y ordenar
      const frequentCustomers = Array.from(customerMap.entries())
        .map(([email, data]) => ({
          customerName: data.name,
          customerEmail: email,
          orderCount: data.orderCount,
          totalSpent: data.totalSpent
        }))
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, limit);

      return frequentCustomers;
    } catch (error) {
      console.error('Error fetching frequent customers:', error);
      return [];
    }
  },

  // Obtener ventas por período (versión anterior con fechas)
  async getSalesByPeriodWithDates(startDate: string, endDate: string): Promise<Array<{
    date: string;
    revenue: number;
    orders: number;
  }>> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'delivered')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar por día
      const dateMap = new Map<string, { revenue: number; orders: number }>();
      
      orders?.forEach(order => {
        const date = new Date(order.created_at).toISOString().split('T')[0];
        const existing = dateMap.get(date) || { revenue: 0, orders: 0 };
        dateMap.set(date, {
          revenue: existing.revenue + order.total,
          orders: existing.orders + 1
        });
      });

      // Convertir a array
      const salesByPeriod = Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          orders: data.orders
        }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return salesByPeriod;
    } catch (error) {
      console.error('Error fetching sales by period:', error);
      return [];
    }
  },

  // Obtener promociones más usadas
  async getTopPromotions(startDate: string, endDate: string, limit: number = 5): Promise<Array<{
    name: string;
    uses: number;
    totalDiscount: number;
  }>> {
    try {
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('promotion_id, discount')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .eq('status', 'delivered')
        .not('promotion_id', 'is', null);

      if (ordersError) throw ordersError;

      // Obtener nombres de promociones
      const promotionIds = [...new Set(orders?.map(o => o.promotion_id))];
      const { data: promotions, error: promoError } = await supabase
        .from('promotions')
        .select('id, name')
        .in('id', promotionIds);

      if (promoError) throw promoError;

      // Crear mapa de nombres
      const promoNameMap = new Map(promotions?.map(p => [p.id, p.name]));

      // Agrupar por promoción
      const promoMap = new Map<string, { uses: number; totalDiscount: number }>();
      
      orders?.forEach(order => {
        const promoId = order.promotion_id!;
        const existing = promoMap.get(promoId) || { uses: 0, totalDiscount: 0 };
        promoMap.set(promoId, {
          uses: existing.uses + 1,
          totalDiscount: existing.totalDiscount + (order.discount || 0)
        });
      });

      // Convertir a array y ordenar
      const topPromotions = Array.from(promoMap.entries())
        .map(([promoId, data]) => ({
          name: promoNameMap.get(promoId) || 'Promoción Desconocida',
          uses: data.uses,
          totalDiscount: data.totalDiscount
        }))
        .sort((a, b) => b.uses - a.uses)
        .slice(0, limit);

      return topPromotions;
    } catch (error) {
      console.error('Error fetching top promotions:', error);
      return [];
    }
  },

  // NUEVOS MÉTODOS PARA FASE 3

  /**
   * Obtener ventas por período (día/semana/mes)
   */
  async getSalesByPeriod(period: 'day' | 'week' | 'month' = 'week'): Promise<Array<{
    date: string;
    total: number;
    orders: number;
  }>> {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'day':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
      }

      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total')
        .gte('created_at', startDate.toISOString())
        .eq('status', 'delivered')
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar según el período
      const groupedData = new Map<string, { total: number; orders: number }>();

      orders?.forEach(order => {
        let key: string;
        const orderDate = new Date(order.created_at);

        if (period === 'day') {
          // Agrupar por hora
          key = orderDate.toISOString().substring(0, 13) + ':00:00Z';
        } else {
          // Agrupar por día
          key = orderDate.toISOString().split('T')[0];
        }

        const existing = groupedData.get(key) || { total: 0, orders: 0 };
        groupedData.set(key, {
          total: existing.total + order.total,
          orders: existing.orders + 1
        });
      });

      return Array.from(groupedData.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => a.date.localeCompare(b.date));

    } catch (error) {
      console.error('Error fetching sales by period:', error);
      return [];
    }
  },

  /**
   * Obtener productos más vendidos (versión simplificada)
   */
  async getTopProducts(limit: number = 10): Promise<Array<{
    product_name: string;
    total_sold: number;
    revenue: number;
  }>> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          product_name,
          quantity,
          subtotal,
          order:orders!inner(status)
        `)
        .eq('order.status', 'delivered');

      if (error) throw error;

      // Agrupar por producto
      const productMap = new Map<string, { total_sold: number; revenue: number }>();
      
      data?.forEach((item: any) => {
        const existing = productMap.get(item.product_name) || { total_sold: 0, revenue: 0 };
        productMap.set(item.product_name, {
          total_sold: existing.total_sold + item.quantity,
          revenue: existing.revenue + item.subtotal
        });
      });

      return Array.from(productMap.entries())
        .map(([product_name, data]) => ({ product_name, ...data }))
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, limit);

    } catch (error) {
      console.error('Error fetching top products:', error);
      return [];
    }
  },

  /**
   * Obtener horarios peak
   */
  async getPeakHours(): Promise<Array<{
    hour: number;
    total_orders: number;
    total_revenue: number;
  }>> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('created_at, total')
        .eq('status', 'delivered');

      if (error) throw error;

      // Agrupar por hora
      const hourMap = new Map<number, { total_orders: number; total_revenue: number }>();

      // Inicializar todas las horas (0-23)
      for (let i = 0; i < 24; i++) {
        hourMap.set(i, { total_orders: 0, total_revenue: 0 });
      }

      orders?.forEach(order => {
        const hour = new Date(order.created_at).getHours();
        const existing = hourMap.get(hour)!;
        hourMap.set(hour, {
          total_orders: existing.total_orders + 1,
          total_revenue: existing.total_revenue + order.total
        });
      });

      return Array.from(hourMap.entries())
        .map(([hour, data]) => ({ hour, ...data }))
        .sort((a, b) => a.hour - b.hour);

    } catch (error) {
      console.error('Error fetching peak hours:', error);
      return [];
    }
  },

  /**
   * Obtener rendimiento de repartidores
   */
  async getDriversPerformance(): Promise<Array<{
    driver_id: string;
    driver_name: string;
    total_deliveries: number;
    avg_delivery_time: number;
    avg_rating: number;
    total_earnings: number;
  }>> {
    try {
      // Obtener entregas completadas
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          delivery_user_id,
          started_delivery_at,
          updated_at,
          delivery_fee,
          users!orders_delivery_user_id_fkey(full_name)
        `)
        .eq('status', 'delivered')
        .eq('delivery_type', 'delivery')
        .not('delivery_user_id', 'is', null);

      if (ordersError) throw ordersError;

      // Obtener calificaciones
      const { data: ratings, error: ratingsError } = await supabase
        .from('ratings')
        .select('target_id, rating')
        .eq('rating_type', 'delivery');

      if (ratingsError) throw ratingsError;

      // Agrupar por repartidor
      const driverMap = new Map<string, {
        name: string;
        deliveries: number;
        totalTime: number;
        ratings: number[];
        earnings: number;
      }>();

      orders?.forEach((order: any) => {
        const driverId = order.delivery_user_id;
        const driverName = order.users?.full_name || 'Repartidor';
        
        const existing = driverMap.get(driverId) || {
          name: driverName,
          deliveries: 0,
          totalTime: 0,
          ratings: [],
          earnings: 0
        };

        // Calcular tiempo de entrega
        let deliveryTime = 0;
        if (order.started_delivery_at && order.updated_at) {
          const start = new Date(order.started_delivery_at);
          const end = new Date(order.updated_at);
          deliveryTime = Math.round((end.getTime() - start.getTime()) / (1000 * 60)); // minutos
        }

        driverMap.set(driverId, {
          name: driverName,
          deliveries: existing.deliveries + 1,
          totalTime: existing.totalTime + deliveryTime,
          ratings: existing.ratings,
          earnings: existing.earnings + (order.delivery_fee || 0)
        });
      });

      // Agregar calificaciones
      ratings?.forEach((rating: any) => {
        if (driverMap.has(rating.target_id)) {
          const driver = driverMap.get(rating.target_id)!;
          driver.ratings.push(rating.rating);
        }
      });

      // Convertir a array y calcular promedios
      return Array.from(driverMap.entries())
        .map(([driver_id, data]) => ({
          driver_id,
          driver_name: data.name,
          total_deliveries: data.deliveries,
          avg_delivery_time: data.deliveries > 0 
            ? Math.round(data.totalTime / data.deliveries) 
            : 0,
          avg_rating: data.ratings.length > 0
            ? data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length
            : 0,
          total_earnings: data.earnings
        }))
        .sort((a, b) => b.total_deliveries - a.total_deliveries);

    } catch (error) {
      console.error('Error fetching drivers performance:', error);
      return [];
    }
  },

  /**
   * Obtener zonas de entrega más frecuentes
   */
  async getDeliveryZones(): Promise<Array<{
    zone: string;
    count: number;
    revenue: number;
    avg_lat: number;
    avg_lng: number;
  }>> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('delivery_address, delivery_latitude, delivery_longitude, total')
        .eq('delivery_type', 'delivery')
        .eq('status', 'delivered')
        .not('delivery_latitude', 'is', null)
        .not('delivery_longitude', 'is', null);

      if (error) throw error;

      // Agrupar por zona aproximada (redondear coordenadas)
      const zoneMap = new Map<string, {
        count: number;
        revenue: number;
        lats: number[];
        lngs: number[];
      }>();

      orders?.forEach(order => {
        // Redondear a 2 decimales para agrupar zonas cercanas
        const lat = Math.round(order.delivery_latitude! * 100) / 100;
        const lng = Math.round(order.delivery_longitude! * 100) / 100;
        const zoneKey = `${lat},${lng}`;

        const existing = zoneMap.get(zoneKey) || {
          count: 0,
          revenue: 0,
          lats: [],
          lngs: []
        };

        zoneMap.set(zoneKey, {
          count: existing.count + 1,
          revenue: existing.revenue + order.total,
          lats: [...existing.lats, order.delivery_latitude!],
          lngs: [...existing.lngs, order.delivery_longitude!]
        });
      });

      return Array.from(zoneMap.entries())
        .map(([zone, data]) => ({
          zone,
          count: data.count,
          revenue: data.revenue,
          avg_lat: data.lats.reduce((s, v) => s + v, 0) / data.lats.length,
          avg_lng: data.lngs.reduce((s, v) => s + v, 0) / data.lngs.length
        }))
        .sort((a, b) => b.count - a.count);

    } catch (error) {
      console.error('Error fetching delivery zones:', error);
      return [];
    }
  }
};
