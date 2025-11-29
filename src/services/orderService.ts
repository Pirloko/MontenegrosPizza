import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Order = Database['public']['Tables']['orders']['Row'];
type OrderInsert = Database['public']['Tables']['orders']['Insert'];
type OrderUpdate = Database['public']['Tables']['orders']['Update'];
type OrderItem = Database['public']['Tables']['order_items']['Row'];
type OrderItemInsert = Database['public']['Tables']['order_items']['Insert'];

// Helper para agregar timeout a las promesas
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = 15000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout: La operación tomó más de ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

export const orderService = {
  // Crear un nuevo pedido
  async createOrder(orderData: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    deliveryType: 'delivery' | 'pickup';
    deliveryAddress?: string;
    deliveryLatitude?: number;
    deliveryLongitude?: number;
    deliveryFee?: number;
    items: Array<{
      productId: string;
      productName: string;
      productPrice: number;
      quantity: number;
      subtotal: number;
      removedIngredients?: string[];
      addedIngredients?: any[];
      specialInstructions?: string;
      extraIngredientsCost?: number;
    }>;
    subtotal: number;
    discount?: number;
    total: number;
    notes?: string;
    pointsUsed?: number;
    promotionId?: string;
    createdByUserId?: string; // ID del empleado que crea el pedido
  }): Promise<Order> {
    try {
      // Crear el pedido principal
      const orderInsert: OrderInsert = {
        customer_name: orderData.customerName,
        customer_phone: orderData.customerPhone,
        customer_email: orderData.customerEmail,
        delivery_type: orderData.deliveryType,
        delivery_address: orderData.deliveryAddress,
        delivery_latitude: orderData.deliveryLatitude,
        delivery_longitude: orderData.deliveryLongitude,
        delivery_fee: orderData.deliveryFee || 0,
        subtotal: orderData.subtotal,
        discount: orderData.discount || 0,
        total: orderData.total,
        notes: orderData.notes,
        points_used: orderData.pointsUsed || 0,
        promotion_id: orderData.promotionId,
        status: 'received',
        payment_method: 'cash', // Por defecto efectivo
        payment_status: 'pending',
        created_by_user_id: orderData.createdByUserId || null
      } as any;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderInsert)
        .select()
        .single();

      if (orderError) throw orderError;

      // Crear los items del pedido
      const orderItems: OrderItemInsert[] = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.productId,
        product_name: item.productName,
        product_price: item.productPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
        removed_ingredients: item.removedIngredients ? JSON.stringify(item.removedIngredients) : null,
        added_ingredients: item.addedIngredients ? JSON.stringify(item.addedIngredients) : null,
        special_instructions: item.specialInstructions,
        extra_ingredients_cost: item.extraIngredientsCost || 0
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Calcular y asignar puntos de lealtad si hay customer_id
      if (orderData.customerEmail) {
        const pointsEarned = Math.floor(orderData.total / 1000) * 5; // 5 puntos por cada $1000
        if (pointsEarned > 0) {
          await this.addLoyaltyPoints(orderData.customerEmail, pointsEarned, order.id, 'purchase');
        }
      }

      return order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  // Obtener todos los pedidos
  async getAllOrders(): Promise<Order[]> {
    try {
      console.log('🔍 Iniciando getAllOrders...');
      const queryPromise = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await withTimeout(queryPromise, 15000);

      if (error) {
        console.error('❌ Error en getAllOrders:', error);
        throw error;
      }
      
      console.log(`✅ getAllOrders completado: ${data?.length || 0} pedidos`);
      return data || [];
    } catch (error: any) {
      console.error('❌ Error fetching orders:', error);
      if (error.message?.includes('Timeout')) {
        throw new Error('La consulta está tomando demasiado tiempo. Verifica tu conexión a internet.');
      }
      throw error;
    }
  },

  // Obtener pedidos por estado
  async getOrdersByStatus(status: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('status', status)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching orders by status:', error);
      throw error;
    }
  },

  // Obtener pedidos de un cliente
  async getCustomerOrders(customerEmail: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('customer_email', customerEmail)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching customer orders:', error);
      throw error;
    }
  },

  // Actualizar estado del pedido
  async updateOrderStatus(
    orderId: string, 
    status: string, 
    estimatedTime?: number,
    deliveryUserId?: string
  ): Promise<Order> {
    try {
      // Primero obtener el pedido para verificar tipo
      const { data: currentOrder } = await supabase
        .from('orders')
        .select('delivery_type, pickup_code, delivery_code')
        .eq('id', orderId)
        .single();

      const updateData: any = { status };
      
      // Si cambia a "preparing" y hay tiempo estimado, agregarlo
      if (status === 'preparing' && estimatedTime !== undefined) {
        updateData.estimated_ready_time = estimatedTime;
        
        // Si es delivery y se asigna un repartidor, guardarlo
        if (currentOrder?.delivery_type === 'delivery' && deliveryUserId) {
          updateData.delivery_user_id = deliveryUserId;
        }
        
        console.log('⏱️ Guardando tiempo estimado:', {
          orderId,
          estimatedTime,
          deliveryUserId,
          updateData
        });
      }
      
      // Si cambia a "ready", generar código según tipo
      if (status === 'ready') {
        // Generar código de 3 dígitos (100-999)
        const code = Math.floor(Math.random() * 900) + 100;
        
        if (currentOrder?.delivery_type === 'pickup') {
          updateData.pickup_code = code;
          console.log('🎫 Generando código de retiro:', { orderId, code });
        } else if (currentOrder?.delivery_type === 'delivery') {
          updateData.delivery_code = code;
          console.log('🎫 Generando código de entrega:', { orderId, code });
        }
      }
      
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)
        .select('*')
        .single();

      if (error) {
        console.error('❌ Error actualizando estado:', error);
        throw error;
      }
      
      console.log('✅ Estado actualizado:', {
        orderId,
        status: data.status,
        estimated_ready_time: (data as any).estimated_ready_time,
        pickup_code: (data as any).pickup_code,
        delivery_code: (data as any).delivery_code,
        delivery_user_id: (data as any).delivery_user_id
      });
      
      return data;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Obtener pedido por ID
  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*)
        `)
        .eq('id', orderId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching order by ID:', error);
      throw error;
    }
  },

  // Agregar puntos de lealtad
  async addLoyaltyPoints(customerEmail: string, points: number, orderId?: string, type: string = 'purchase'): Promise<void> {
    try {
      // Obtener usuario por email (sin .single() para manejar casos sin usuario)
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, loyalty_points')
        .eq('email', customerEmail);

      if (userError) throw userError;

      // Si no hay usuario, crear uno nuevo
      let user;
      if (!users || users.length === 0) {
        console.log(`Usuario ${customerEmail} no encontrado, creando nuevo usuario...`);
        
        // Generar UUID manualmente
        const userId = crypto.randomUUID();
        
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({
            id: userId,
            email: customerEmail,
            loyalty_points: 0
          })
          .select('id, loyalty_points')
          .single();

        if (createError) throw createError;
        user = newUser;
      } else {
        user = users[0];
      }

      const newBalance = (user.loyalty_points || 0) + points;

      // Actualizar puntos del usuario
      const { error: updateError } = await supabase
        .from('users')
        .update({ loyalty_points: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Crear registro en historial
      const { error: historyError } = await supabase
        .from('loyalty_points_history')
        .insert({
          user_id: user.id,
          points: points,
          balance_after: newBalance,
          type: type,
          order_id: orderId,
          description: type === 'purchase' ? `Compra realizada` : `Puntos ${type}`
        });

      if (historyError) throw historyError;
    } catch (error) {
      console.error('Error adding loyalty points:', error);
      // No lanzar el error para que no interrumpa la creación del pedido
      console.log('Continuando sin puntos de lealtad...');
    }
  },

  // Canjear puntos de lealtad
  async redeemLoyaltyPoints(customerEmail: string, points: number, orderId?: string): Promise<void> {
    try {
      // Obtener usuario por email (sin .single() para manejar casos sin usuario)
      const { data: users, error: userError } = await supabase
        .from('users')
        .select('id, loyalty_points')
        .eq('email', customerEmail);

      if (userError) throw userError;

      if (!users || users.length === 0) {
        throw new Error('Usuario no encontrado');
      }

      const user = users[0];

      if ((user.loyalty_points || 0) < points) {
        throw new Error('Puntos insuficientes');
      }

      const newBalance = (user.loyalty_points || 0) - points;

      // Actualizar puntos del usuario
      const { error: updateError } = await supabase
        .from('users')
        .update({ loyalty_points: newBalance })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Crear registro en historial
      const { error: historyError } = await supabase
        .from('loyalty_points_history')
        .insert({
          user_id: user.id,
          points: -points,
          balance_after: newBalance,
          type: 'redemption',
          order_id: orderId,
          description: `Canje de ${points} puntos`
        });

      if (historyError) throw historyError;
    } catch (error) {
      console.error('Error redeeming loyalty points:', error);
      throw error;
    }
  },

  // Obtener pedidos por email del cliente
  async getOrdersByCustomerEmail(customerEmail: string): Promise<Order[]> {
    try {
      console.log('🔍 Iniciando getOrdersByCustomerEmail para:', customerEmail);
      const queryPromise = supabase
        .from('orders')
        .select('*')
        .eq('customer_email', customerEmail)
        .order('created_at', { ascending: false });

      const { data, error } = await withTimeout(queryPromise, 15000);

      if (error) {
        console.error('❌ Error en getOrdersByCustomerEmail:', error);
        throw error;
      }
      
      console.log(`✅ getOrdersByCustomerEmail completado: ${data?.length || 0} pedidos`);
      return data || [];
    } catch (error: any) {
      console.error('❌ Error fetching orders by customer email:', error);
      if (error.message?.includes('Timeout')) {
        throw new Error('La consulta está tomando demasiado tiempo. Verifica tu conexión a internet.');
      }
      throw error;
    }
  },

  // Obtener items de un pedido específico
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching order items:', error);
      throw error;
    }
  }
};

