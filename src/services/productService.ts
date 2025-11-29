import { supabase } from '../lib/supabase';
import { Database } from '../types/database';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];
type ProductUpdate = Database['public']['Tables']['products']['Update'];

export const productService = {
  // Get all products with category info
  async getAll(): Promise<Product[]> {
    try {
      // Simplificar query para evitar problemas de RLS con JOIN
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error in productService.getAll:', err);
      throw err;
    }
  },

  // Get active products only
  async getActive(): Promise<Product[]> {
    try {
      // Consulta simplificada sin JOINs para evitar problemas de RLS
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching active products:', error);
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('ProductService.getActive error:', err);
      throw err;
    }
  },

  // Get products by category
  async getByCategory(categoryId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get product by ID
  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create product
  async create(product: ProductInsert): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update product
  async update(id: string, product: ProductUpdate): Promise<Product> {
    try {
      console.log('💾 update - Actualizando producto:', id);
      const { data, error } = await supabase
        .from('products')
        .update(product)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ update - Error:', error);
        throw error;
      }
      
      console.log('✅ update - Producto actualizado:', data);
      return data;
    } catch (error) {
      console.error('❌ update - Error completo:', error);
      throw error;
    }
  },

  // Delete product
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Toggle active status
  async toggleActive(id: string, isActive: boolean): Promise<Product> {
    return this.update(id, { is_active: isActive });
  },

  // Upload product image
  async uploadImage(file: File, productId: string): Promise<string> {
    // Timeout de 30 segundos para evitar que se quede colgado
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout: La subida de imagen tomó más de 30 segundos')), 30000);
    });

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${productId}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      // Subir con timeout
      const uploadPromise = supabase.storage
        .from('product-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      const { data: uploadData, error: uploadError } = await Promise.race([
        uploadPromise,
        timeoutPromise
      ]) as any;

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      if (error.message && error.message.includes('Timeout')) {
        throw new Error('La subida de imagen está tomando demasiado tiempo. Verifica tu conexión.');
      }
      throw error;
    }
  },

  // Delete product image
  async deleteImage(imageUrl: string): Promise<void> {
    // Extract path from URL
    const path = imageUrl.split('/product-images/')[1];
    if (!path) return;

    const { error } = await supabase.storage
      .from('product-images')
      .remove([path]);

    if (error) throw error;
  }
};

