import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    
    // TERMINAR LOADING INMEDIATAMENTE - no bloquear la app
    setLoading(false);
    
    // Inicializar Auth en background sin bloquear
    async function initialize() {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user && mounted) {
          fetchUserProfile(sessionData.session.user.id).catch(() => {
            // Ignorar errores, no bloquear
          });
        }
      } catch (error) {
        // Ignorar errores, no bloquear
      }
    }
    
    // Ejecutar en background sin esperar
    initialize();
    
    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          fetchUserProfile(session.user.id).catch(() => {
            // Ignorar errores
          });
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchUserProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      setUser(data);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
    }
  }

  async function signIn(email: string, password: string) {
    try {
      console.log('🔐 Intentando login con:', email);
      
      // Verificar primero si Supabase está configurado
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('📋 Configuración Supabase:', {
        url: supabaseUrl ? '✅ Configurada' : '❌ No configurada',
        key: supabaseKey ? '✅ Configurada' : '❌ No configurada',
        urlValue: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'none'
      });
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase no está configurado. Verifica el archivo .env');
      }

      // Verificar que la URL sea válida
      if (!supabaseUrl.includes('supabase.co')) {
        throw new Error('La URL de Supabase no parece válida. Debe contener "supabase.co"');
      }

      // Limpiar estado local primero
      setUser(null);
      
      // NO hacer limpieza antes del login - dejar que Supabase maneje su propia sesión
      // Login directo sin ninguna limpieza que pueda bloquear
      console.log('🔑 Autenticando...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      console.log('✅ Respuesta recibida');

      if (error) {
        console.error('❌ Error de Supabase Auth:', error);
        
        // Mensajes de error más claros
        if (error.message?.includes('Invalid login credentials')) {
          throw new Error('Credenciales incorrectas. Verifica tu email y contraseña.');
        } else if (error.message?.includes('Email not confirmed')) {
          throw new Error('Por favor confirma tu email antes de iniciar sesión.');
        } else if (error.message?.includes('Email logins are disabled')) {
          throw new Error('Los logins por email están deshabilitados. Ve a Supabase → Authentication → Providers → Email y habilita el proveedor.');
        }
        
        throw new Error(error.message || 'Error al iniciar sesión');
      }

      if (!data?.user) {
        throw new Error('No se pudo autenticar el usuario');
      }

      console.log('✅ Login exitoso, obteniendo perfil...');
      
      // Fetch user profile - no bloquear si tarda, intentar en background
      fetchUserProfile(data.user.id).catch((profileError: any) => {
        console.error('⚠️ Error obteniendo perfil, pero el login fue exitoso:', profileError);
        // No fallar el login si el perfil falla, crear perfil básico
        const basicProfile: User = {
          id: data.user.id,
          email: data.user.email || email,
          full_name: data.user.user_metadata?.full_name || 'Usuario',
          phone: data.user.user_metadata?.phone || null,
          role: 'customer',
          favorite_address: null,
          loyalty_points: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        setUser(basicProfile);
      });
      
      // No esperar a que termine fetchUserProfile - el login ya fue exitoso
      console.log('✅ Login completado');
    } catch (error: any) {
      console.error('❌ Error en signIn:', error);
      const errorMessage = error.message || 'Error al iniciar sesión';
      throw new Error(errorMessage);
    }
  }

  async function signUp(
    email: string,
    password: string,
    userData: Partial<User>
  ) {
    try {
      // Sign up with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (!data.user) {
        throw new Error('No se pudo crear el usuario');
      }

      // Create user profile in public.users table
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email: email,
        full_name: userData.full_name || '',
        phone: userData.phone || null,
        role: 'customer', // Default role
        favorite_address: userData.favorite_address || null,
        loyalty_points: 0,
      });

      if (profileError) throw profileError;

      // Fetch the complete user profile
      await fetchUserProfile(data.user.id);
    } catch (error: any) {
      console.error('Error signing up:', error);
      throw new Error(error.message || 'Error al registrarse');
    }
  }

  async function signOut() {
    try {
      console.log('🚪 Iniciando cierre de sesión...');
      
      // Limpiar estado local primero
      setUser(null);
      
      // Intentar signOut con timeout
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Timeout en signOut')), 2000)
      );
      
      try {
        const result = await Promise.race([signOutPromise, timeoutPromise]);
        if (result?.error) {
          console.warn('⚠️ Error en signOut de Supabase:', result.error);
        }
      } catch (timeoutError: any) {
        if (timeoutError?.message === 'Timeout en signOut') {
          console.warn('⚠️ Timeout en signOut, limpiando manualmente...');
        } else {
          console.warn('⚠️ Error en signOut:', timeoutError);
        }
      }
      
      // Limpiar manualmente localStorage de Supabase
      if (typeof window !== 'undefined') {
        const supabaseKeys = Object.keys(localStorage).filter(key => 
          key.startsWith('supabase.auth.') || key.startsWith('sb-')
        );
        supabaseKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
            console.log('🧹 Limpiado:', key);
          } catch (e) {
            console.warn('⚠️ No se pudo limpiar:', key);
          }
        });
        
        // También limpiar sessionStorage
        const sessionKeys = Object.keys(sessionStorage).filter(key => 
          key.startsWith('supabase.auth.') || key.startsWith('sb-')
        );
        sessionKeys.forEach(key => {
          try {
            sessionStorage.removeItem(key);
          } catch (e) {
            // Ignorar errores
          }
        });
      }
      
      console.log('✅ Sesión cerrada completamente');
    } catch (error: any) {
      console.error('❌ Error en signOut:', error);
      // Asegurar que el estado local esté limpio
      setUser(null);
      
      // Limpiar localStorage de todas formas
      if (typeof window !== 'undefined') {
        try {
          const supabaseKeys = Object.keys(localStorage).filter(key => 
            key.startsWith('supabase.auth.') || key.startsWith('sb-')
          );
          supabaseKeys.forEach(key => localStorage.removeItem(key));
        } catch (e) {
          // Ignorar errores
        }
      }
    }
  }

  async function updateProfile(userData: Partial<User>) {
    try {
      if (!user) throw new Error('No hay usuario autenticado');

      const { error } = await supabase
        .from('users')
        .update(userData)
        .eq('id', user.id);

      if (error) throw error;

      // Refresh user data
      await fetchUserProfile(user.id);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      throw new Error(error.message || 'Error al actualizar perfil');
    }
  }

  const value: AuthContextType = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

