import React, { useState, useEffect } from 'react';
import { Spinner, Alert, Container } from 'react-bootstrap';
import ProductList from '../components/ProductList';
import ProductListBackup from '../components/ProductListBackup';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { Database } from '../types/database';
import { products as backupProducts } from '../data/products';
import { cache } from '../hooks/useProductCache';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface HomeProps {
  category: string;
  onAddToCart: (product: Product, customizations: any) => void;
}

const CACHE_TTL = 10 * 60 * 1000; // 10 minutos para productos
const CATEGORIES_CACHE_TTL = 30 * 60 * 1000; // 30 minutos para categorías (cambian menos)

export default function Home({ category, onAddToCart }: HomeProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [useBackup, setUseBackup] = useState(false); // Usar Supabase por defecto

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Intentar cargar desde caché primero
      const cachedProducts = cache.get<Product[]>('products');
      const cachedCategories = cache.get<Category[]>('categories');
      
      if (cachedProducts && cachedCategories) {
        console.log('✅ Cargando desde caché');
        setProducts(cachedProducts);
        setCategories(cachedCategories);
        setUseBackup(false);
        setLoading(false);
        
        // Cargar en background para actualizar caché
        loadDataFromServer();
        return;
      }
      
      // Si no hay caché, cargar desde servidor
      await loadDataFromServer();
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Error al cargar productos desde la base de datos');
      
      // Intentar usar caché expirado como fallback
      const cachedProducts = cache.get<Product[]>('products');
      const cachedCategories = cache.get<Category[]>('categories');
      
      if (cachedProducts && cachedCategories) {
        console.log('⚠️ Usando caché expirado como fallback');
        setProducts(cachedProducts);
        setCategories(cachedCategories);
        setUseBackup(false);
      } else {
        setUseBackup(true); // Fallback a datos locales si hay error
      }
    } finally {
      setLoading(false);
    }
  };

  const loadDataFromServer = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        productService.getActive(),
        categoryService.getActive()
      ]);
      
      // Guardar en caché
      cache.set('products', productsData, CACHE_TTL);
      cache.set('categories', categoriesData, CATEGORIES_CACHE_TTL);
      
      setProducts(productsData);
      setCategories(categoriesData);
      setUseBackup(false);
    } catch (err: any) {
      console.error('Error cargando desde servidor:', err);
      throw err; // Re-lanzar para que loadData lo maneje
    }
  };

  // Si está cargando, mostrar spinner
  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Cargando productos...</p>
        </div>
      </Container>
    );
  }

  // Si hay error y no hay datos de backup, mostrar error
  if (error && !useBackup) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <h4>Error al cargar productos</h4>
          <p>{error}</p>
          <p>Usando datos de respaldo...</p>
        </Alert>
        <ProductListBackup 
          products={backupProducts}
          categoryName={category}
          onAddToCart={onAddToCart}
        />
      </Container>
    );
  }

  // Si useBackup es true, mostrar los datos de respaldo
  if (useBackup) {
    return (
      <ProductListBackup 
        products={backupProducts}
        categoryName={category}
        onAddToCart={onAddToCart}
      />
    );
  }

  // Si llegamos aquí, usamos datos de Supabase
  const currentCategory = categories.find(c => c.name === category);
  const filteredProducts = currentCategory
    ? products.filter(p => p.category_id === currentCategory.id)
    : [];

  if (filteredProducts.length === 0 && products.length > 0) {
    // No hay productos en esta categoría específica
    return (
      <ProductListBackup 
        products={backupProducts}
        categoryName={category}
        onAddToCart={onAddToCart}
      />
    );
  }

  return (
    <ProductList 
      products={products}
      categories={categories}
      categoryName={category}
      onAddToCart={onAddToCart}
    />
  );
}

