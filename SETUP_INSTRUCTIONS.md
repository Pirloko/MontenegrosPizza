# 🚀 Instrucciones de Configuración - Montenegro's Pizza

## ✅ FASE 1 COMPLETADA: Sistema de Autenticación y Usuarios

Has completado exitosamente la **Fase 1** del proyecto. Ahora tienes:
- ✅ Sistema de autenticación con Supabase
- ✅ Login y Registro de usuarios
- ✅ 3 Roles: Admin, Empleado, Cliente
- ✅ Dashboards específicos por rol
- ✅ Protección de rutas
- ✅ Base de datos estructurada

---

## 📋 Pasos para Configurar Supabase

### 1. Crear Cuenta en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta gratuita
3. Haz clic en "New Project"
4. Completa los datos:
   - **Name**: Montenegro-Pizza (o el nombre que prefieras)
   - **Database Password**: Guarda esta contraseña en un lugar seguro
   - **Region**: Elige la más cercana a Chile (por ejemplo: South America - São Paulo)
5. Espera 2-3 minutos mientras se crea el proyecto

### 2. Configurar la Base de Datos

1. En el panel de Supabase, ve a **SQL Editor** (icono en el menú lateral)
2. Haz clic en "New Query"
3. Abre el archivo `schema_completo.sql` que está en la raíz de tu proyecto
4. **Copia TODO el contenido** del archivo
5. **Pega** el contenido en el editor SQL de Supabase
6. Haz clic en **"Run"** (o presiona Ctrl+Enter)
7. Deberías ver el mensaje "Success. No rows returned" (esto es correcto)

### 3. Obtener las Credenciales

1. En el panel de Supabase, ve a **Project Settings** (ícono de engranaje)
2. En el menú lateral, selecciona **API**
3. Busca y copia estos dos valores:
   - **Project URL** (algo como: `https://tuproyecto.supabase.co`)
   - **anon public** key (una clave larga que empieza con `eyJ...`)

### 4. Configurar Variables de Entorno

1. En tu proyecto, abre el archivo `` (está en la raíz)
2. Reemplaza los valores con tus credenciales:

```env
VITE_SUPABASE_URL=https://tuproyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```

⚠️ **IMPORTANTE**: Asegúrate de que no haya espacios extras al copiar las claves.

### 5. Crear Usuario Administrador

Como los usuarios admin se crean manualmente, necesitas crear tu cuenta de administrador:

1. Ve al panel de Supabase
2. Selecciona **Authentication** en el menú lateral
3. Haz clic en **"Add user"** > **"Create new user"**
4. Completa:
   - Email: tu email de admin
   - Password: tu contraseña segura
   - **Auto Confirm User**: ✅ (marca esta casilla)
5. Haz clic en "Create user"

6. Ahora ve a **Table Editor** > selecciona la tabla `users`
7. Haz clic en **"Insert"** > **"Insert row"**
8. Completa los datos:
   - **id**: Copia el UUID del usuario que acabas de crear (desde Authentication)
   - **email**: tu email de admin
   - **full_name**: Tu nombre completo
   - **phone**: Tu teléfono (opcional)
   - **role**: **admin** (muy importante)
   - **favorite_address**: null
   - **loyalty_points**: 0
9. Haz clic en "Save"

---

## 🏃 Ejecutar el Proyecto

1. Asegúrate de estar en la carpeta del proyecto:
```bash
cd C:\Montenegros\Montenegro1
```

2. Si el servidor no está corriendo, inícialo:
```bash
npm run dev
```

3. Abre tu navegador en: `http://localhost:3000`

---

## 🎮 Probar el Sistema

### Probar Login como Admin:
1. Ve a `http://localhost:3000/login`
2. Ingresa con el email y contraseña del admin que creaste
3. Deberías ser redirigido a `/admin` con el dashboard de administrador

### Registrar un Cliente:
1. Ve a `http://localhost:3000/register`
2. Completa el formulario de registro
3. Se creará automáticamente como **customer**
4. Podrás ver tus puntos de lealtad en el header

### Crear un Empleado:
1. Inicia sesión como admin
2. Ve a **Authentication** en Supabase
3. Crea un nuevo usuario
4. En la tabla `users`, agrega el registro con **role = 'employee'**
5. El empleado podrá acceder a `/employee`

---

## 🔗 Rutas Disponibles

### Públicas:
- `/` - Tienda principal (Home)
- `/login` - Iniciar sesión
- `/register` - Registro de clientes

### Admin:
- `/admin` - Dashboard de administrador
  - KPIs y reportes
  - Gestión de productos (Fase 2)
  - Gestión de categorías (Fase 2)
  - Gestión de ingredientes (Fase 2)
  - Gestión de promociones (Fase 4)
  - Gestión de pedidos (Fase 3)
  - Gestión de usuarios

### Empleado:
- `/employee` - Dashboard de empleado
  - Ver pedidos entrantes (Fase 3)
  - Cambiar estados de pedidos (Fase 3)
  - Ver inventario

### Cliente:
- `/` - Tienda (puede comprar sin login)
- `/profile` - Mi perfil (requiere login)
- `/orders` - Mis pedidos (requiere login) (Fase 3)
- `/points` - Mis puntos (requiere login)

---

## 🐛 Solución de Problemas

### Error: "Missing Supabase environment variables"
- Verifica que el archivo `` esté en la raíz del proyecto
- Asegúrate de que las variables empiecen con `VITE_`
- Reinicia el servidor después de modificar el ``

### Error al hacer login: "Invalid login credentials"
- Verifica que el usuario exista en Supabase Authentication
- Verifica que también exista en la tabla `users`
- Verifica que el email coincida en ambos lugares

### No veo el dashboard después de login
- Verifica que el campo `role` en la tabla `users` sea exactamente: `admin`, `employee`, o `customer`
- No debe tener espacios ni mayúsculas incorrectas

### Error: "Failed to fetch"
- Verifica que las credenciales de Supabase sean correctas
- Verifica tu conexión a internet
- Verifica que el proyecto de Supabase esté activo

---

## 📊 Estructura de la Base de Datos

Tu base de datos incluye las siguientes tablas:

1. **users** - Perfiles de usuarios (extiende auth.users)
2. **categories** - Categorías de productos (PIZZAS, EMPANADAS, etc.)
3. **products** - Productos con precios y costos
4. **extra_ingredients** - Ingredientes extra con precios
5. **promotions** - Promociones y cupones
6. **promotion_products** - Relación productos-promociones
7. **orders** - Pedidos de clientes
8. **order_items** - Items individuales de cada pedido
9. **loyalty_points_history** - Historial de puntos de lealtad

---

## 🎯 Próximos Pasos

Ya completaste la **FASE 1**. Los próximos pasos son:

### FASE 2: Gestión de Productos (Admin)
- CRUD completo de categorías
- CRUD completo de productos (con costos)
- CRUD de ingredientes extra con precios
- Upload de imágenes a Supabase Storage

### FASE 3: Sistema de Pedidos
- Guardar pedidos en base de datos
- Estados de pedidos
- Historial de pedidos por cliente
- Sistema de puntos de lealtad

### FASE 4: Promociones y Descuentos
- Sistema de cupones
- Descuentos por porcentaje
- Precios especiales por días
- Combos de productos

### FASE 5: Dashboard de KPIs
- Producto más vendido
- Delivery vs Retiro
- Ingresos/Costos/Ganancias
- Ventas por período
- Clientes frecuentes

---

## 📞 Información de Contacto

Si tienes preguntas o problemas, revisa:
1. La consola del navegador (F12) para ver errores
2. Los logs del servidor en la terminal
3. La documentación de Supabase: https://supabase.com/docs

---

## ✅ Checklist de Configuración

- [ ] Cuenta de Supabase creada
- [ ] Proyecto de Supabase creado
- [ ] Schema SQL ejecutado correctamente
- [ ] Credenciales copiadas al archivo ``
- [ ] Usuario administrador creado
- [ ] Servidor corriendo sin errores
- [ ] Login como admin funciona
- [ ] Registro de clientes funciona
- [ ] Dashboard de admin visible

¡Cuando completes todos estos pasos, estarás listo para continuar con la Fase 2! 🎉

