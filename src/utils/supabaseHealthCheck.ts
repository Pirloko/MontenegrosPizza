import { supabase } from '../lib/supabase';

export async function testSupabaseConnection(): Promise<{ connected: boolean; error?: string }> {
  try {
    // Prueba simple: intentar hacer una query muy básica con timeout corto
    const testPromise = supabase
      .from('users')
      .select('count')
      .limit(0);
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout')), 3000);
    });

    await Promise.race([testPromise, timeoutPromise]);
    return { connected: true };
  } catch (error: any) {
    console.error('Supabase connection test failed:', error);
    return { 
      connected: false, 
      error: error.message || 'No se pudo conectar con Supabase' 
    };
  }
}

