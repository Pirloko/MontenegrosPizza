# Montenegro's Pizza 🍕

Sistema de pedidos en línea completo para Montenegro's Pizza, desarrollado con React, TypeScript y Supabase.

## ✨ Características Principales

- 🛒 **Carrito de compras** con gestión completa de productos
- 🔄 **Personalización de productos** (ingredientes, extras, instrucciones especiales)
- 👥 **Sistema de roles múltiples**: Admin, Empleado, Cliente, Repartidor
- 🚚 **Delivery y retiro en tienda** con cálculo automático de tarifas
- 📍 **Seguimiento en tiempo real** de entregas
- 💰 **Sistema de puntos de lealtad** para clientes
- 📊 **Dashboard de analytics** con KPIs y métricas
- ⭐ **Sistema de calificaciones** para productos, servicio y repartidores
- 🎟️ **Promociones y cupones** con múltiples tipos
- 📱 **Responsive design** para móvil y desktop

## 🚀 Tecnologías Utilizadas

- **Frontend**: React 18 + TypeScript
- **UI**: Bootstrap React + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Routing**: React Router v7
- **Iconos**: Lucide React
- **Mapas**: React Leaflet
- **Gráficos**: Recharts

## 📋 Requisitos Previos

- Node.js 18+ 
- npm o yarn
- Cuenta de Supabase (gratuita)

## 🔧 Instalación

1. **Clonar el repositorio**:
```bash
git clone https://github.com/tuusuario/montenegro-pizza.git
cd montenegro-pizza
```

2. **Instalar dependencias**:
```bash
npm install
```

3. **Configurar variables de entorno**:
   - Crea un archivo `.env` en la raíz del proyecto
   - Agrega tus credenciales de Supabase:
```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui
```
   - Consulta `INSTRUCCIONES_ENV.md` para más detalles

4. **Configurar la base de datos**:
   - Ve a tu proyecto en Supabase Dashboard
   - Abre el SQL Editor
   - Ejecuta el contenido de `schema_completo.sql`
   - Consulta `SETUP_INSTRUCTIONS.md` para más detalles

5. **Iniciar el servidor de desarrollo**:
```bash
npm run build
npm run dev
```

6. **Abrir en el navegador**:
```
http://localhost:5173
```

## 📁 Estructura del Proyecto

```
src/
  ├── components/          # Componentes React
  │   ├── admin/          # Componentes de administración
  │   ├── analytics/      # Componentes de analytics
  │   ├── auth/           # Componentes de autenticación
  │   └── dashboards/     # Dashboards por rol
  ├── context/            # Contextos de React (Auth, Cart)
  ├── data/               # Datos estáticos (backup)
  ├── hooks/              # Custom hooks
  ├── lib/                # Configuración de Supabase
  ├── pages/              # Páginas principales
  ├── services/           # Servicios para API calls
  ├── types/              # Tipos TypeScript
  └── utils/              # Utilidades varias
```

## 🗄️ Base de Datos

El archivo `schema_completo.sql` contiene todo el esquema de la base de datos:

- **Tablas principales**: users, categories, products, orders, order_items
- **Sistema de delivery**: delivery_config, delivery_locations
- **Promociones**: promotions, promotion_products
- **Calificaciones**: ratings
- **Puntos de lealtad**: loyalty_points_history
- **Inventario**: product_ingredients

Ejecuta este archivo completo en Supabase SQL Editor para configurar todo.

## 👥 Roles de Usuario

- **Admin**: Gestión completa del sistema (productos, usuarios, promociones, analytics)
- **Empleado**: Gestión de pedidos y creación de pedidos presenciales
- **Cliente**: Realizar pedidos, ver historial, puntos de lealtad
- **Repartidor**: Ver asignaciones, tracking de entregas, estadísticas

## 📚 Documentación Adicional

- `SETUP_INSTRUCTIONS.md` - Guía detallada de configuración inicial
- `INSTRUCCIONES_ENV.md` - Configuración de variables de entorno
- `INSTRUCCIONES_NETLIFY.md` - Guía de despliegue en Netlify
- `DEPLOY_EDGE_FUNCTION.md` - Desplegar Edge Functions de Supabase

## 🚢 Despliegue

### Netlify (Recomendado)

1. Conecta tu repositorio a Netlify
2. Configura las variables de entorno en Netlify Dashboard
3. Build command: `npm run build`
4. Publish directory: `dist`

Ver `INSTRUCCIONES_NETLIFY.md` para más detalles.

## 🔐 Seguridad

- Row Level Security (RLS) habilitado en todas las tablas
- Autenticación segura con Supabase Auth
- Validación de roles en el frontend y backend
- Variables de entorno para credenciales sensibles

## 🛠️ Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Compila para producción
- `npm run preview` - Previsualiza build de producción
- `npm run lint` - Ejecuta ESLint

## 📝 Notas Importantes

- El archivo `.env` NO debe subirse a Git (ya está en .gitignore)
- Después de modificar `.env`, reinicia el servidor
- Los productos se gestionan desde el panel de administración
- Las imágenes de productos se almacenan en Supabase Storage

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Distribuido bajo la licencia MIT.

## 📞 Soporte

Para problemas o preguntas, abre un issue en GitHub.

---

**¡Disfruta construyendo con Montenegro's Pizza! 🍕✨**
