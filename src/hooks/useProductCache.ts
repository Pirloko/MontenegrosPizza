import { useState, useEffect } from 'react';
import { productService } from '../services/productService';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

const CACHE_PREFIX = 'montenegro_cache_';
const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Sistema de caché simple usando localStorage
 */
class SimpleCache {
  set<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expiresIn: ttl
    };

    try {
      localStorage.setItem(
        CACHE_PREFIX + key,
        JSON.stringify(entry)
      );
    } catch (error) {
      console.warn('Error guardando en caché:', error);
      // Si localStorage está lleno, limpiar caché antiguo
      this.clearExpired();
    }
  }

  get<T>(key: string): T | null {
    try {
      const item = localStorage.getItem(CACHE_PREFIX + key);
      if (!item) return null;

      const entry: CacheEntry<T> = JSON.parse(item);
      const now = Date.now();

      // Verificar si expiró
      if (now - entry.timestamp > entry.expiresIn) {
        this.remove(key);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Error leyendo caché:', error);
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(CACHE_PREFIX + key);
  }

  clearExpired(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const entry = JSON.parse(item);
            const now = Date.now();
            if (now - entry.timestamp > entry.expiresIn) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Entrada corrupta, eliminar
          localStorage.removeItem(key);
        }
      }
    });
  }

  clearAll(): void {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}

export const cache = new SimpleCache();

/**
 * Hook para usar productos con caché
 */
export function useProductCache() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Intentar obtener del caché
      if (!forceRefresh) {
        const cached = cache.get<any[]>('products');
        if (cached) {
          console.log('✅ Productos cargados desde caché');
          setProducts(cached);
          setLoading(false);
          return;
        }
      }

      // Si no hay caché o se fuerza refresh, cargar desde servidor
      console.log('🔄 Cargando productos desde servidor...');
      const data = await productService.getAll();
      
      // Guardar en caché
      cache.set('products', data, DEFAULT_TTL);
      
      setProducts(data);
    } catch (err: any) {
      console.error('❌ Error cargando productos:', err);
      setError(err.message || 'Error al cargar productos');
      
      // Intentar usar caché expirado como fallback
      const cachedFallback = cache.get<any[]>('products');
      if (cachedFallback) {
        console.warn('⚠️ Usando caché expirado como fallback');
        setProducts(cachedFallback);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshProducts = () => {
    loadProducts(true);
  };

  const invalidateCache = () => {
    cache.remove('products');
  };

  return {
    products,
    loading,
    error,
    refreshProducts,
    invalidateCache
  };
}

/**
 * Hook genérico para caché
 */
export function useCache<T>(
  key: string,
  fetchFn: () => Promise<T>,
  ttl: number = DEFAULT_TTL
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [key]);

  const loadData = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);
      setError(null);

      // Intentar obtener del caché
      if (!forceRefresh) {
        const cached = cache.get<T>(key);
        if (cached) {
          console.log(`✅ ${key} cargado desde caché`);
          setData(cached);
          setLoading(false);
          return;
        }
      }

      // Cargar desde servidor
      console.log(`🔄 Cargando ${key} desde servidor...`);
      const result = await fetchFn();
      
      // Guardar en caché
      cache.set(key, result, ttl);
      
      setData(result);
    } catch (err: any) {
      console.error(`❌ Error cargando ${key}:`, err);
      setError(err.message || 'Error al cargar datos');
      
      // Intentar usar caché expirado como fallback
      const cachedFallback = cache.get<T>(key);
      if (cachedFallback) {
        console.warn(`⚠️ Usando caché expirado de ${key} como fallback`);
        setData(cachedFallback);
      }
    } finally {
      setLoading(false);
    }
  };

  const refresh = () => loadData(true);
  const invalidate = () => cache.remove(key);

  return { data, loading, error, refresh, invalidate };
}

