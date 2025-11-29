# Desplegar Edge Function para Crear Usuarios

Esta Edge Function permite crear usuarios (empleados y repartidores) **directamente desde el panel de administración** usando Supabase Admin API.

## 🎯 Objetivo

Permitir que el admin cree usuarios sin necesidad de ir a Supabase Auth manualmente. La creación se hace completamente desde el panel de administración.

## 📋 Requisitos Previos

1. Tener instalado Supabase CLI
2. Tener configurado el proyecto en Supabase
3. Tener acceso a las credenciales de tu proyecto

## 🚀 Pasos para Desplegar

### Opción 1: Usando Supabase CLI (Recomendado)

#### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

#### 2. Iniciar sesión en Supabase CLI

```bash
supabase login
```

#### 3. Vincular tu proyecto

```bash
supabase link --project-ref tu-project-ref
```

**Encontrar tu project-ref:**
- Ve a tu proyecto en Supabase Dashboard
- En la URL verás: `https://TU-PROJECT-REF.supabase.co`
- El `project-ref` es la parte antes de `.supabase.co`

#### 4. Desplegar la función

```bash
cd /Users/pirloko/Desktop/PROYECTOS/PIZZERIA/Montenegros_Pizza
supabase functions deploy create-user
```

### Opción 2: Desde Supabase Dashboard

1. Ve a tu proyecto en Supabase Dashboard
2. Ve a **Edge Functions** en el menú lateral
3. Haz clic en **"Create a new function"**
4. Nombre: `create-user`
5. Copia el contenido de `supabase/functions/create-user/index.ts`
6. Pega el código en el editor
7. Haz clic en **"Deploy"**

## ✅ Verificar que funciona

1. Ve al panel de administración → **Usuarios**
2. Haz clic en **"Nuevo Usuario"**
3. Completa el formulario (email, nombre, teléfono, tipo, contraseña)
4. Haz clic en **"Crear Usuario"**
5. El usuario debería crearse automáticamente ✅

## 🔄 Método Alternativo Automático

Si la Edge Function no está disponible o no se ha desplegado, el sistema **automáticamente** intentará crear usuarios usando `signUp` como método alternativo. Este método funciona pero:
- Requiere que el email no esté registrado previamente
- El usuario recibirá un email de confirmación (a menos que esté desactivado en Supabase)

## 📝 Notas Importantes

- ✅ La Edge Function verifica que solo los **administradores** puedan crear usuarios
- ✅ Los usuarios se crean con **email auto-confirmado** (no necesitan verificar email)
- ✅ Si la función no está disponible, se usa el método alternativo automáticamente
- ✅ El sistema intenta primero la Edge Function, y si falla, usa signUp

## 🛠️ Solución de Problemas

### Error: "Function not found"
- Verifica que la función esté desplegada: `supabase functions list`
- Verifica que el nombre sea exactamente `create-user`

### Error: "No autorizado"
- Verifica que estés logueado como admin
- Verifica que tu usuario tenga `role = 'admin'` en la tabla `users`

### Error: "SUPABASE_SERVICE_ROLE_KEY not found"
- La clave se configura automáticamente al desplegar
- Si hay problemas, verifica en: Supabase Dashboard → Project Settings → API → service_role key

