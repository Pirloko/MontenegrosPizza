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
    
    async function initialize() {
      try {
        console.log('🔄 Inicializando Auth...');
        
        // Limpiar tokens corruptos primero
        if (typeof window !== 'undefined') {
          try {
            // Verificar si hay tokens corruptos (keys que empiezan con supabase pero no tienen formato válido)
            const supabaseKeys = Object.keys(localStorage).filter(key => 
              key.startsWith('supabase.auth.') || key.startsWith('sb-')
            );
            
            // Intentar validar si hay una sesión válida
            let hasValidSession = false;
            for (const key of supabaseKeys) {
              try {
                const value = localStorage.getItem(key);
                if (value && value.length > 10) {
                  // Token parece válido, intentar usarlo
                  hasValidSession = true;
                  break;
                }
              } catch (e) {
                // Token corrupto, eliminar
                localStorage.removeItem(key);
              }
            }
            
            // Si no hay tokens válidos, limpiar todo
            if (!hasValidSession && supabaseKeys.length > 0) {
              console.log('🧹 Limpiando tokens corruptos...');
              supabaseKeys.forEach(key => {
                try {
                  localStorage.removeItem(key);
                } catch (e) {
                  // Ignorar errores
                }
              });
            }
          } catch (e) {
            console.warn('⚠️ Error limpiando tokens:', e);
          }
        }
        
        // Verificar sesión con timeout más largo para dar tiempo a Supabase
        const getSessionPromise = supabase.auth.getSession();
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000) // Aumentado a 5 segundos
        );
        
        let session = null;
        try {
          const result = await Promise.race([getSessionPromise, timeoutPromise]);
          session = result?.data?.session;
        } catch (timeoutError: any) {
          console.warn('⚠️ Timeout al obtener sesión, intentando recuperar...');
          
          // Intentar una vez más con un timeout más corto
          try {
            const retryPromise = supabase.auth.getSession();
            const retryTimeout = new Promise<never>((_, reject) => 
              setTimeout(() => reject(new Error('Retry timeout')), 2000)
            );
            const retryResult = await Promise.race([retryPromise, retryTimeout]);
            session = retryResult?.data?.session;
          } catch (retryError) {
            console.warn('⚠️ Segundo intento falló, continuando sin sesión');
            session = null;
          }
        }
        
        if (session?.user && mounted) {
          console.log('✅ Sesión encontrada para:', session.user.email);
          await fetchUserProfile(session.user.id);
        } else {
          console.log('ℹ️ No hay sesión activa');
        }
      } catch (error) {
        console.error('❌ Error en inicialización:', error);
        // No fallar, simplemente continuar sin sesión
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }
    
    // Timeout de seguridad: si no carga en 3 segundos, forzar fin de loading
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('⚠️ Timeout en carga inicial');
        setLoading(false);
      }
    }, 3000);
    
    initialize().finally(() => clearTimeout(safetyTimeout));
    
    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
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

      // Limpiar cualquier sesión corrupta PRIMERO (más agresivo)
      console.log('🧹 Limpiando sesiones anteriores...');
      try {
        // Limpiar estado local primero
        setUser(null);
        
        // Limpiar TODOS los tokens de Supabase de localStorage y sessionStorage
        if (typeof window !== 'undefined') {
          try {
            // Limpiar localStorage
            const localStorageKeys = Object.keys(localStorage).filter(key => 
              key.startsWith('supabase.auth.') || 
              key.startsWith('sb-') ||
              key.includes('supabase')
            );
            localStorageKeys.forEach(key => {
              try {
                localStorage.removeItem(key);
                console.log('🧹 Limpiado localStorage:', key);
              } catch (e) {
                // Ignorar errores
              }
            });
            
            // Limpiar sessionStorage
            const sessionStorageKeys = Object.keys(sessionStorage).filter(key => 
              key.startsWith('supabase.auth.') || 
              key.startsWith('sb-') ||
              key.includes('supabase')
            );
            sessionStorageKeys.forEach(key => {
              try {
                sessionStorage.removeItem(key);
                console.log('🧹 Limpiado sessionStorage:', key);
              } catch (e) {
                // Ignorar errores
              }
            });
            
            console.log('✅ Almacenamiento limpiado completamente');
          } catch (e) {
            console.warn('⚠️ Error limpiando almacenamiento:', e);
          }
        }
        
        // Intentar signOut con timeout corto (pero no bloquear si falla)
        try {
          const signOutPromise = supabase.auth.signOut();
          const timeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 1000) // Reducido a 1 segundo
          );
          
          await Promise.race([signOutPromise, timeoutPromise]);
        } catch (timeoutError: any) {
          // No importa si falla, ya limpiamos manualmente
          console.log('⚠️ signOut con timeout, pero ya limpiamos manualmente');
        }
      } catch (e) {
        console.log('⚠️ Error en limpieza, continuando de todas formas:', e);
      }

      // Login directo sin timeout - confiar en Supabase
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

      if (!data.user) {
        throw new Error('No se pudo autenticar el usuario');
      }

      console.log('✅ Login exitoso, obteniendo perfil...');
      
      // Fetch user profile - con timeout y mejor manejo de errores
      try {
        await fetchUserProfile(data.user.id);
        console.log('✅ Perfil obtenido');
      } catch (profileError: any) {
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
      }
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

