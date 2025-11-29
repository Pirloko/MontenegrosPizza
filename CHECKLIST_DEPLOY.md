# ✅ Checklist Pre-Deploy - Netlify

## 🔍 Antes de Subir a Netlify

### 1. Variables de Entorno ✅
- [x] Archivo `.env` existe localmente (NO se sube a Git)
- [ ] Variables configuradas en Netlify Dashboard:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`

### 2. Supabase Configuration ✅
- [ ] Base de datos configurada (`schema_completo.sql` ejecutado)
- [ ] Bucket de Storage creado (`product-images`)
- [ ] URLs de redirect configuradas en Supabase Auth:
  - [ ] Site URL: `https://tu-sitio.netlify.app`
  - [ ] Redirect URLs: `https://tu-sitio.netlify.app/*`
  - [ ] Redirect URL login: `https://tu-sitio.netlify.app/login`

### 3. Build Local ✅
- [x] `npm run build` funciona correctamente
- [x] Carpeta `dist/` se genera sin errores
- [ ] Prueba local con `npm run preview`

### 4. Seguridad ✅
- [x] No hay credenciales hardcodeadas en el código
- [x] `.env` está en `.gitignore`
- [x] `.gitignore` está actualizado

### 5. Configuración de Netlify ✅
- [x] `netlify.toml` configurado correctamente
- [x] Build command: `npm run build`
- [x] Publish directory: `dist`
- [x] Redirects configurados para React Router

### 6. Contenido y Datos ✅
- [ ] Categorías creadas en la base de datos
- [ ] Productos creados (o se crearán desde admin panel)
- [ ] Usuario administrador creado
- [ ] Promociones de ejemplo (opcional)

### 7. Testing Local ✅
- [ ] Login funciona correctamente
- [ ] Registro de usuarios funciona
- [ ] Creación de pedidos funciona
- [ ] Dashboard de admin carga correctamente
- [ ] No hay errores en consola del navegador

## 🚀 Pasos para Deploy en Netlify

1. **Conectar con GitHub:**
   - Ve a [Netlify](https://www.netlify.com/)
   - Click en "Add new site" → "Import an existing project"
   - Conecta tu repositorio de GitHub

2. **Configurar Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Base directory: (vacío)

3. **Agregar Variables de Entorno:**
   - Ve a "Site settings" → "Environment variables"
   - Agrega `VITE_SUPABASE_URL`
   - Agrega `VITE_SUPABASE_ANON_KEY`

4. **Deploy:**
   - Click en "Deploy site"
   - Espera a que termine el build (2-3 minutos)

5. **Configurar Supabase:**
   - Ve a Supabase Dashboard → Authentication → URL Configuration
   - Agrega tu URL de Netlify a "Site URL"
   - Agrega redirect URLs

6. **Verificar:**
   - Abre tu sitio en Netlify
   - Prueba login, registro, creación de pedidos

## ⚠️ Problemas Comunes

### Build Falla
- Verifica que las variables de entorno estén configuradas
- Revisa los logs de build en Netlify
- Asegúrate de que `npm run build` funcione localmente

### Login No Funciona
- Verifica las variables de entorno en Netlify
- Configura las URLs de redirect en Supabase
- Verifica que RLS esté habilitado y configurado

### Página No Encuentra Rutas
- Verifica que `netlify.toml` tenga el redirect configurado
- Verifica que React Router esté configurado correctamente

## 📝 Notas Post-Deploy

- Después del primer deploy, verifica que todo funcione
- Si haces cambios, solo haz `git push` y Netlify desplegará automáticamente
- Monitorea los logs en Netlify Dashboard
- Configura un dominio personalizado si es necesario

---

**¡Listo para deploy! 🚀**

