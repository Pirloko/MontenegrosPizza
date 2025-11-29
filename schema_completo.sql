-- =============================================
-- SCHEMA COMPLETO - Montenegro's Pizza
-- =============================================
-- Este archivo contiene TODO el SQL necesario para configurar la base de datos
-- Ejecuta este script completo en Supabase SQL Editor
-- =============================================

-- =============================================
-- 1. EXTENSIONES
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 2. TABLA USERS (extiende auth.users)
-- =============================================
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'employee', 'customer', 'delivery')),
  favorite_address TEXT,
  loyalty_points INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  fuel_price_per_liter DECIMAL(10, 2) DEFAULT 0,
  km_per_liter DECIMAL(5, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN public.users.role IS 'Rol del usuario: admin (administrador), employee (empleado), customer (cliente), delivery (repartidor)';
COMMENT ON COLUMN public.users.is_active IS 'Indica si el usuario está activo. Los usuarios pausados no pueden iniciar sesión.';
COMMENT ON COLUMN public.users.fuel_price_per_liter IS 'Precio de bencina por litro configurado por el repartidor (en pesos chilenos)';
COMMENT ON COLUMN public.users.km_per_liter IS 'Rendimiento del vehículo en kilómetros por litro configurado por el repartidor';

-- =============================================
-- 3. TABLA CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 4. TABLA PRODUCTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  cost DECIMAL(10, 2) DEFAULT 0,
  image_url TEXT,
  is_vegetarian BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  available BOOLEAN DEFAULT true,
  stock_quantity INTEGER DEFAULT 999,
  low_stock_alert INTEGER DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN public.products.available IS 'Indica si el producto está disponible para la venta';
COMMENT ON COLUMN public.products.stock_quantity IS 'Cantidad actual en inventario (999 = ilimitado)';
COMMENT ON COLUMN public.products.low_stock_alert IS 'Cantidad mínima para alertar de stock bajo';

-- =============================================
-- 5. TABLA EXTRA_INGREDIENTS
-- =============================================
CREATE TABLE IF NOT EXISTS public.extra_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  is_available BOOLEAN DEFAULT true,
  category VARCHAR(20) DEFAULT 'basic' CHECK (category IN ('basic', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN public.extra_ingredients.category IS 'Categoría del ingrediente: basic (básico) o premium';

-- =============================================
-- 6. TABLA PRODUCT_INGREDIENTS (relación muchos a muchos)
-- =============================================
CREATE TABLE IF NOT EXISTS public.product_ingredients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  ingredient_id UUID NOT NULL REFERENCES public.extra_ingredients(id) ON DELETE CASCADE,
  quantity DECIMAL(10, 2) DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, ingredient_id)
);

COMMENT ON TABLE public.product_ingredients IS 'Relación muchos a muchos entre productos e ingredientes para manejo de stock';
COMMENT ON COLUMN public.product_ingredients.quantity IS 'Cantidad del ingrediente que usa el producto (por defecto 1.0)';

-- =============================================
-- 7. TABLA PROMOTIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'product_combo', 'coupon')),
  value DECIMAL(10, 2) NOT NULL,
  coupon_code TEXT UNIQUE,
  min_purchase DECIMAL(10, 2) DEFAULT 0,
  valid_days JSONB,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 8. TABLA PROMOTION_PRODUCTS (para combos)
-- =============================================
CREATE TABLE IF NOT EXISTS public.promotion_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 9. TABLA DELIVERY_CONFIG (configuración de delivery)
-- =============================================
CREATE TABLE IF NOT EXISTS public.delivery_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  store_name TEXT NOT NULL DEFAULT 'Montenegro Pizza',
  store_address TEXT NOT NULL DEFAULT 'Diego de Almagro 1059, Rancagua, O''Higgins',
  store_latitude DOUBLE PRECISION NOT NULL DEFAULT -34.1704,
  store_longitude DOUBLE PRECISION NOT NULL DEFAULT -70.7408,
  base_fee INTEGER NOT NULL DEFAULT 800,
  price_per_km INTEGER NOT NULL DEFAULT 300,
  min_delivery_fee INTEGER NOT NULL DEFAULT 1500,
  max_delivery_fee INTEGER NOT NULL DEFAULT 5000,
  free_delivery_enabled BOOLEAN NOT NULL DEFAULT false,
  free_delivery_min_amount INTEGER NOT NULL DEFAULT 20000,
  max_delivery_distance_km INTEGER NOT NULL DEFAULT 15,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES public.users(id)
);

COMMENT ON TABLE public.delivery_config IS 'Configuración global de delivery: ubicación del local, tarifas y reglas de delivery gratis';

-- =============================================
-- 10. TABLA ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  customer_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  order_number TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('received', 'preparing', 'ready', 'on_the_way', 'delivered', 'cancelled')),
  delivery_type TEXT NOT NULL CHECK (delivery_type IN ('delivery', 'pickup')),
  delivery_address TEXT,
  delivery_latitude DOUBLE PRECISION,
  delivery_longitude DOUBLE PRECISION,
  delivery_fee INTEGER DEFAULT 0,
  delivery_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  delivery_code INTEGER,
  started_delivery_at TIMESTAMP WITH TIME ZONE,
  pickup_code INTEGER,
  estimated_ready_time INTEGER,
  created_by_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'transfer', 'pending')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  points_earned INTEGER DEFAULT 0,
  points_used INTEGER DEFAULT 0,
  promotion_id UUID REFERENCES public.promotions(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON COLUMN public.orders.delivery_fee IS 'Costo de delivery calculado automáticamente basado en la distancia (en pesos)';
COMMENT ON COLUMN public.orders.delivery_latitude IS 'Latitud de la ubicación de entrega (opcional, para mejorar precisión del delivery)';
COMMENT ON COLUMN public.orders.delivery_longitude IS 'Longitud de la ubicación de entrega (opcional, para mejorar precisión del delivery)';
COMMENT ON COLUMN public.orders.delivery_user_id IS 'ID del repartidor asignado para entregar este pedido (solo para delivery_type = delivery)';
COMMENT ON COLUMN public.orders.delivery_code IS 'Código de 3 dígitos generado para que el cliente confirme la entrega. Se genera cuando el pedido cambia a "ready" y es tipo delivery.';
COMMENT ON COLUMN public.orders.started_delivery_at IS 'Timestamp de cuando el repartidor comenzó la entrega (cambió a estado "on_the_way")';
COMMENT ON COLUMN public.orders.pickup_code IS 'Código de 3 dígitos para identificar pedidos listos para retirar en tienda. Se genera automáticamente cuando el pedido cambia a estado "ready" y es tipo "pickup".';
COMMENT ON COLUMN public.orders.estimated_ready_time IS 'Tiempo estimado en minutos hasta que el pedido esté listo. Se establece cuando cambia a estado "preparing".';
COMMENT ON COLUMN public.orders.created_by_user_id IS 'ID del empleado que creó este pedido (solo para pedidos presenciales creados por empleados)';

-- =============================================
-- 11. TABLA ORDER_ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_price DECIMAL(10, 2) NOT NULL,
  quantity INTEGER NOT NULL,
  removed_ingredients JSONB DEFAULT '[]',
  added_ingredients JSONB DEFAULT '[]',
  extra_ingredients_cost DECIMAL(10, 2) DEFAULT 0,
  special_instructions TEXT,
  subtotal DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 12. TABLA LOYALTY_POINTS_HISTORY
-- =============================================
CREATE TABLE IF NOT EXISTS public.loyalty_points_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  points INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'expired', 'adjusted')),
  description TEXT,
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- 13. TABLA DELIVERY_LOCATIONS (tracking de repartidores)
-- =============================================
CREATE TABLE IF NOT EXISTS public.delivery_locations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  delivery_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, delivery_user_id)
);

COMMENT ON TABLE public.delivery_locations IS 'Tabla para tracking en tiempo real de ubicaciones de repartidores durante entregas. Se actualiza cada 5 segundos mientras el pedido está "en camino".';

-- =============================================
-- 14. TABLA RATINGS (sistema de calificaciones)
-- =============================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  rating_type VARCHAR(20) NOT NULL CHECK (rating_type IN ('product', 'service', 'delivery')),
  target_id UUID,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(order_id, user_id, rating_type, target_id)
);

-- =============================================
-- 15. ÍNDICES PARA MEJOR RENDIMIENTO
-- =============================================
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_available ON public.products(available) WHERE available = TRUE;
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON public.orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_history_user ON public.loyalty_points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_product ON public.product_ingredients(product_id);
CREATE INDEX IF NOT EXISTS idx_product_ingredients_ingredient ON public.product_ingredients(ingredient_id);
CREATE INDEX IF NOT EXISTS idx_promotions_coupon_code ON public.promotions(coupon_code) WHERE coupon_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_promotions_active ON public.promotions(is_active, start_date, end_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_delivery_locations_order_id ON public.delivery_locations(order_id);
CREATE INDEX IF NOT EXISTS idx_delivery_locations_delivery_user_id ON public.delivery_locations(delivery_user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_locations_updated_at ON public.delivery_locations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_order ON public.ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_ratings_user ON public.ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_type_target ON public.ratings(rating_type, target_id);

-- =============================================
-- 16. FUNCIONES
-- =============================================

-- Función para actualizar timestamp updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Función para generar número de orden
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  new_number TEXT;
  count INTEGER;
BEGIN
  SELECT COUNT(*) INTO count FROM public.orders 
  WHERE DATE(created_at) = CURRENT_DATE;
  
  new_number := 'ORD-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD((count + 1)::TEXT, 4, '0');
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular puntos de lealtad
CREATE OR REPLACE FUNCTION calculate_loyalty_points(order_total DECIMAL)
RETURNS INTEGER AS $$
BEGIN
  -- 5 points per $1000
  RETURN FLOOR(order_total / 1000) * 5;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar disponibilidad de producto
CREATE OR REPLACE FUNCTION check_product_availability(product_id_param UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.products 
    WHERE id = product_id_param 
    AND available = TRUE 
    AND stock_quantity > 0
  );
END;
$$ LANGUAGE plpgsql;

-- Función para decrementar stock
CREATE OR REPLACE FUNCTION decrement_product_stock(product_id_param UUID, quantity_param INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(stock_quantity - quantity_param, 0)
  WHERE id = product_id_param
  AND stock_quantity != 999; -- No decrementar si es ilimitado
END;
$$ LANGUAGE plpgsql;

-- Función para incrementar uso de promociones
CREATE OR REPLACE FUNCTION increment_promotion_usage(promotion_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.promotions 
  SET current_uses = COALESCE(current_uses, 0) + 1
  WHERE id = promotion_id;
END;
$$ LANGUAGE plpgsql;

-- Función para verificar validez de promoción
CREATE OR REPLACE FUNCTION is_promotion_valid(
  p_coupon_code TEXT,
  p_order_total NUMERIC,
  p_current_date TIMESTAMP DEFAULT NOW()
)
RETURNS TABLE(
  is_valid BOOLEAN,
  discount_amount NUMERIC,
  error_message TEXT
) AS $$
DECLARE
  promotion_record RECORD;
  discount NUMERIC := 0;
  error_msg TEXT := '';
BEGIN
  -- Buscar la promoción
  SELECT * INTO promotion_record
  FROM public.promotions
  WHERE coupon_code = p_coupon_code
    AND is_active = true
    AND start_date <= p_current_date
    AND end_date >= p_current_date;

  -- Si no existe la promoción
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 'Código de cupón no válido'::TEXT;
    RETURN;
  END IF;

  -- Verificar compra mínima
  IF promotion_record.min_purchase IS NOT NULL AND p_order_total < promotion_record.min_purchase THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 
      ('Compra mínima de $' || promotion_record.min_purchase::TEXT)::TEXT;
    RETURN;
  END IF;

  -- Verificar límite de usos
  IF promotion_record.max_uses IS NOT NULL AND 
     COALESCE(promotion_record.current_uses, 0) >= promotion_record.max_uses THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 'Cupón agotado'::TEXT;
    RETURN;
  END IF;

  -- Verificar días válidos
  IF promotion_record.valid_days IS NOT NULL THEN
    IF NOT (promotion_record.valid_days ? EXTRACT(DOW FROM p_current_date)::TEXT) THEN
      RETURN QUERY SELECT false, 0::NUMERIC, 'Cupón no válido para este día'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Calcular descuento
  CASE promotion_record.type
    WHEN 'percentage' THEN
      discount := (p_order_total * promotion_record.value) / 100;
    WHEN 'fixed_amount' THEN
      discount := LEAST(promotion_record.value, p_order_total);
    WHEN 'special_price' THEN
      discount := p_order_total - promotion_record.value;
    WHEN 'combo' THEN
      discount := promotion_record.value;
  END CASE;

  -- Asegurar que el descuento no sea negativo
  discount := GREATEST(0, discount);

  RETURN QUERY SELECT true, discount, ''::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular promedio de calificaciones de producto
CREATE OR REPLACE FUNCTION get_product_average_rating(product_id_param UUID)
RETURNS NUMERIC(3,2) AS $$
DECLARE
  avg_rating NUMERIC(3,2);
BEGIN
  SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,2)
  INTO avg_rating
  FROM public.ratings
  WHERE rating_type = 'product'
  AND target_id = product_id_param;
  
  RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular promedio de calificaciones de repartidor
CREATE OR REPLACE FUNCTION get_delivery_user_average_rating(delivery_user_id_param UUID)
RETURNS NUMERIC(3,2) AS $$
DECLARE
  avg_rating NUMERIC(3,2);
BEGIN
  SELECT COALESCE(AVG(rating), 0)::NUMERIC(3,2)
  INTO avg_rating
  FROM public.ratings
  WHERE rating_type = 'delivery'
  AND target_id = delivery_user_id_param;
  
  RETURN avg_rating;
END;
$$ LANGUAGE plpgsql;

-- Vista materializada para estadísticas de calificaciones
CREATE MATERIALIZED VIEW IF NOT EXISTS public.rating_stats AS
SELECT 
  rating_type,
  target_id,
  COUNT(*) as total_ratings,
  AVG(rating)::NUMERIC(3,2) as average_rating,
  COUNT(CASE WHEN rating = 5 THEN 1 END) as five_stars,
  COUNT(CASE WHEN rating = 4 THEN 1 END) as four_stars,
  COUNT(CASE WHEN rating = 3 THEN 1 END) as three_stars,
  COUNT(CASE WHEN rating = 2 THEN 1 END) as two_stars,
  COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
FROM public.ratings
GROUP BY rating_type, target_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_rating_stats_type_target ON public.rating_stats(rating_type, target_id);

-- Función para refrescar estadísticas de calificaciones
CREATE OR REPLACE FUNCTION refresh_rating_stats()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.rating_stats;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 17. TRIGGERS
-- =============================================

-- Triggers para actualizar updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_extra_ingredients_updated_at BEFORE UPDATE ON public.extra_ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON public.promotions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para auto-generar número de orden
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := generate_order_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_order_number_trigger BEFORE INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION set_order_number();

-- =============================================
-- 18. ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extra_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loyalty_points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes (para evitar conflictos)
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Admin and employee can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users" ON public.users;

-- POLÍTICAS PARA USERS
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admin and employee can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

CREATE POLICY "Admin can manage all users" ON public.users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICAS PARA CATEGORIES
DROP POLICY IF EXISTS "Anyone can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Public can view active categories" ON public.categories;
DROP POLICY IF EXISTS "Admin can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;

CREATE POLICY "Anyone can view active categories" ON public.categories
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICAS PARA PRODUCTS
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Public can view active products" ON public.products;
DROP POLICY IF EXISTS "Admin can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;

CREATE POLICY "Anyone can view active products" ON public.products
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage products" ON public.products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICAS PARA EXTRA_INGREDIENTS
DROP POLICY IF EXISTS "Anyone can view available ingredients" ON public.extra_ingredients;
DROP POLICY IF EXISTS "Public can view active ingredients" ON public.extra_ingredients;
DROP POLICY IF EXISTS "Admin can manage ingredients" ON public.extra_ingredients;
DROP POLICY IF EXISTS "Admins can manage ingredients" ON public.extra_ingredients;

CREATE POLICY "Anyone can view available ingredients" ON public.extra_ingredients
  FOR SELECT USING (is_available = true);

CREATE POLICY "Admin can manage ingredients" ON public.extra_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICAS PARA PRODUCT_INGREDIENTS
DROP POLICY IF EXISTS "Anyone can view product ingredients" ON public.product_ingredients;
DROP POLICY IF EXISTS "Admin can manage product ingredients" ON public.product_ingredients;

CREATE POLICY "Anyone can view product ingredients" ON public.product_ingredients
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage product ingredients" ON public.product_ingredients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- POLÍTICAS PARA PROMOTIONS
DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.promotions;
DROP POLICY IF EXISTS "Admin can manage promotions" ON public.promotions;

CREATE POLICY "Anyone can view active promotions" ON public.promotions
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage promotions" ON public.promotions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICAS PARA DELIVERY_CONFIG
DROP POLICY IF EXISTS "Todos pueden leer configuración de delivery" ON public.delivery_config;
DROP POLICY IF EXISTS "Solo admin puede actualizar configuración" ON public.delivery_config;

CREATE POLICY "Todos pueden leer configuración de delivery" 
ON public.delivery_config
FOR SELECT
USING (true);

CREATE POLICY "Solo admin puede actualizar configuración" 
ON public.delivery_config
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- POLÍTICAS PARA ORDERS
DROP POLICY IF EXISTS "Customers can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can create orders" ON public.orders;
DROP POLICY IF EXISTS "Admin and employee can manage orders" ON public.orders;

CREATE POLICY "Customers can view their own orders" ON public.orders
  FOR SELECT USING (
    customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT WITH CHECK (customer_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

CREATE POLICY "Admin and employee can manage orders" ON public.orders
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- POLÍTICAS PARA ORDER_ITEMS
DROP POLICY IF EXISTS "Users can view order items of their orders" ON public.order_items;

CREATE POLICY "Users can view order items of their orders" ON public.order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_items.order_id 
      AND (orders.customer_id = auth.uid() OR
           EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('admin', 'employee')))
    )
  );

CREATE POLICY "Admin and employee can manage order items" ON public.order_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role IN ('admin', 'employee')
    )
  );

-- POLÍTICAS PARA LOYALTY_POINTS_HISTORY
DROP POLICY IF EXISTS "Users can view their own points history" ON public.loyalty_points_history;

CREATE POLICY "Users can view their own points history" ON public.loyalty_points_history
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- POLÍTICAS PARA DELIVERY_LOCATIONS
DROP POLICY IF EXISTS "Repartidores pueden ver sus ubicaciones" ON public.delivery_locations;
DROP POLICY IF EXISTS "Clientes pueden ver ubicaciones de sus pedidos" ON public.delivery_locations;
DROP POLICY IF EXISTS "Repartidores pueden actualizar sus ubicaciones" ON public.delivery_locations;

CREATE POLICY "Repartidores pueden ver sus ubicaciones" 
ON public.delivery_locations
FOR SELECT
USING (
  auth.uid() = delivery_user_id OR
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'employee')
  )
);

CREATE POLICY "Clientes pueden ver ubicaciones de sus pedidos" 
ON public.delivery_locations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.users u ON u.email = o.customer_email
    WHERE o.id = delivery_locations.order_id
    AND u.id = auth.uid()
  )
);

CREATE POLICY "Repartidores pueden actualizar sus ubicaciones" 
ON public.delivery_locations
FOR ALL
USING (
  auth.uid() = delivery_user_id AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'delivery'
  )
);

-- POLÍTICAS PARA RATINGS
DROP POLICY IF EXISTS "users_can_rate_own_orders" ON public.ratings;
DROP POLICY IF EXISTS "users_can_view_own_ratings" ON public.ratings;
DROP POLICY IF EXISTS "everyone_can_view_all_ratings" ON public.ratings;
DROP POLICY IF EXISTS "admin_employee_can_view_all_ratings" ON public.ratings;

CREATE POLICY "users_can_rate_own_orders" ON public.ratings
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_can_view_own_ratings" ON public.ratings
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "everyone_can_view_all_ratings" ON public.ratings
  FOR SELECT
  USING (TRUE);

CREATE POLICY "admin_employee_can_view_all_ratings" ON public.ratings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'employee')
    )
  );

-- =============================================
-- 19. DATOS INICIALES
-- =============================================

-- Insertar categorías
INSERT INTO public.categories (name, description, display_order) VALUES
  ('PIZZAS', 'Deliciosas pizzas artesanales', 1),
  ('EMPANADAS', 'Empanadas caseras con diferentes rellenos', 2),
  ('SANDWICH', 'Sandwiches y completos', 3),
  ('BEBESTIBLES', 'Bebidas y jugos', 4)
ON CONFLICT (name) DO NOTHING;

-- Insertar ingredientes extra
INSERT INTO public.extra_ingredients (name, price, category) VALUES
  ('Queso Extra', 1000, 'basic'),
  ('Jamón', 1500, 'basic'),
  ('Champiñones', 1200, 'basic'),
  ('Palta', 1500, 'basic'),
  ('Tocino', 1800, 'premium'),
  ('Cebolla Caramelizada', 800, 'basic'),
  ('Aceitunas', 600, 'basic'),
  ('Tomate', 500, 'basic'),
  ('Pepperoni', 2000, 'premium'),
  ('Pollo', 2500, 'premium')
ON CONFLICT (name) DO NOTHING;

-- Insertar configuración de delivery
INSERT INTO public.delivery_config (
  store_name,
  store_address,
  store_latitude,
  store_longitude,
  base_fee,
  price_per_km,
  min_delivery_fee,
  max_delivery_fee,
  free_delivery_enabled,
  free_delivery_min_amount,
  max_delivery_distance_km
) VALUES (
  'Montenegro Pizza',
  'Diego de Almagro 1059, Rancagua, O''Higgins',
  -34.1704,
  -70.7408,
  800,
  300,
  1500,
  5000,
  false,
  20000,
  15
)
ON CONFLICT (id) DO NOTHING;

-- Insertar promociones de ejemplo
INSERT INTO public.promotions (
  name, description, type, value, min_purchase, max_uses, current_uses,
  start_date, end_date, coupon_code, is_active
) VALUES
  ('Descuento Nuevos Clientes', '15% de descuento para nuevos clientes', 'percentage', 15, 10000, 100, 0, NOW(), NOW() + INTERVAL '30 days', 'NUEVO15', true),
  ('Descuento Compra Grande', '$2,000 de descuento en compras sobre $25,000', 'fixed_amount', 2000, 25000, 50, 0, NOW(), NOW() + INTERVAL '60 days', 'GRANDE2000', true),
  ('Martes de Pizza', 'Descuento fijo de $3,000 para pizzas los martes', 'fixed_amount', 3000, 0, 0, 0, NOW(), NOW() + INTERVAL '90 days', 'MARTES', true),
  ('Descuento Delivery', '20% de descuento en pedidos por delivery', 'percentage', 20, 15000, 200, 0, NOW(), NOW() + INTERVAL '45 days', 'DELIVERY20', true),
  ('Fin de Semana Especial', '10% de descuento los fines de semana', 'percentage', 10, 8000, 0, 0, NOW(), NOW() + INTERVAL '30 days', 'WEEKEND10', true)
ON CONFLICT (coupon_code) DO NOTHING;

-- Actualizar ingredientes existentes a 'basic' por defecto si no tienen categoría
UPDATE public.extra_ingredients 
SET category = 'basic' 
WHERE category IS NULL;

-- Actualizar productos existentes para que estén disponibles por defecto
UPDATE public.products 
SET available = TRUE, 
    stock_quantity = COALESCE(stock_quantity, 999),
    low_stock_alert = COALESCE(low_stock_alert, 10)
WHERE available IS NULL OR stock_quantity IS NULL;

-- =============================================
-- 20. STORAGE BUCKET PARA IMÁGENES
-- =============================================

-- Crear bucket para imágenes de productos
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
DROP POLICY IF EXISTS "Public Access to view images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete images" ON storage.objects;

CREATE POLICY "Public Access to view images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Admins can update images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

CREATE POLICY "Admins can delete images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'product-images' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'admin'
  )
);

-- =============================================
-- ¡COMPLETADO!
-- =============================================
-- Schema completo creado exitosamente
-- Todas las tablas, funciones, triggers, políticas RLS y datos iniciales están configurados
-- 
-- PRÓXIMOS PASOS:
-- 1. Verifica que todas las tablas se crearon correctamente
-- 2. Crea usuarios desde Supabase Auth y luego agrega sus perfiles en public.users
-- 3. Configura las imágenes de productos usando el bucket 'product-images'
-- =============================================

