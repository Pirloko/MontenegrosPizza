import React, { useState, useEffect } from 'react';
import { Spinner, Alert, Container } from 'react-bootstrap';
import ProductList from '../components/ProductList';
import ProductListBackup from '../components/ProductListBackup';
import { productService } from '../services/productService';
import { categoryService } from '../services/categoryService';
import { Database } from '../types/database';
import { products as backupProducts } from '../data/products';

type Product = Database['public']['Tables']['products']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

interface HomeProps {
  category: string;
  onAddToCart: (product: Product, customizations: any) => void;
}

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
      
      const [productsData, categoriesData] = await Promise.all([
        productService.getActive(),
        categoryService.getActive()
      ]);
      
      setProducts(productsData);
      setCategories(categoriesData);
      setUseBackup(false);
    } catch (err: any) {
      console.error('Error loading data from Supabase:', err);
      setError('Error al cargar productos desde la base de datos');
      setUseBackup(true); // Fallback a datos locales si hay error
    } finally {
      setLoading(false);
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

